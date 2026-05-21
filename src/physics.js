import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Composite, Events } = Matter;

export class PhysicsSimulator {
  constructor() {
    this.engine = null;
    this.world = null;
    this.marbles = [];
    this.staticElements = []; // Store references to drawn elements and their Matter bodies
    this.spawner = { x: 400, y: 100, radius: 20 }; // Default spawner
    this.raceStartTime = null;
    this.finishedMarbles = [];
    this.onGoalReached = null; // Callback for UI/particles
    this.onHazardTriggered = null; // Callback for UI/particles
    this.physicsSpeed = 1.0;
    this.isPaused = true;
    this.arenaBounds = { x: 0, y: 0, width: 800, height: 600 };
    this.spawnGate = null;
    this.menuMode = false;
    this.remoteMarbles = new Map(); // id -> { name, color, marbleName, x, y, targetX, targetY, vx, vy }
    this.spawnerBody = null;
    this.rotatingBodies = [];
  }

  upsertRemoteMarble(id, data) {
    const existing = this.remoteMarbles.get(id);
    if (existing) {
      Object.assign(existing, data);
    } else {
      this.remoteMarbles.set(id, {
        name: 'Remote',
        marbleName: 'Red',
        color: '#888',
        x: data.x ?? 0,
        y: data.y ?? 0,
        targetX: data.x ?? 0,
        targetY: data.y ?? 0,
        vx: 0,
        vy: 0,
        ...data
      });
    }
  }

  setRemoteMarbleTarget(id, x, y, vx, vy) {
    const r = this.remoteMarbles.get(id);
    if (!r) return;
    r.targetX = x;
    r.targetY = y;
    r.vx = vx;
    r.vy = vy;
  }

  removeRemoteMarble(id) {
    this.remoteMarbles.delete(id);
  }

  clearRemoteMarbles() {
    this.remoteMarbles.clear();
  }

  // Spinning ring around spawner that opens a gap after a delay
  createSpawnGate(x, y, radius) {
    this.removeSpawnGate();

    const segments = 28;
    const thickness = 6;
    const segPaths = [];
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      const x1 = x + Math.cos(a1) * radius;
      const y1 = y + Math.sin(a1) * radius;
      const x2 = x + Math.cos(a2) * radius;
      const y2 = y + Math.sin(a2) * radius;

      const L = Math.hypot(x2 - x1, y2 - y1);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const angle = Math.atan2(y2 - y1, x2 - x1);

      const seg = Bodies.rectangle(cx, cy, L * 1.05, thickness, {
        isStatic: true,
        angle,
        restitution: 0.4,
        friction: 1.0,
        frictionStatic: 1.0,
        label: 'spawn_gate'
      });
      World.add(this.world, seg);
      segPaths.push({ body: seg, a1, a2 });
    }

    this.spawnGate = {
      x, y, radius,
      segments: segPaths,
      opensAt: null,
      isOpen: false,
      createdAt: Date.now(),
      gapCount: 4
    };
  }

  scheduleGateOpen(delayMs = 3000) {
    if (!this.spawnGate) return;
    this.spawnGate.opensAt = Date.now() + delayMs;
  }

  openSpawnGate() {
    if (!this.spawnGate || this.spawnGate.isOpen) return;
    const targetAngle = Math.PI / 2; // bottom of circle (canvas y+ is down)

    const angleDiff = (a, b) => {
      let d = (a - b) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      return d;
    };

    const sorted = [...this.spawnGate.segments].sort((a, b) => {
      const ma = (a.a1 + a.a2) / 2;
      const mb = (b.a1 + b.a2) / 2;
      return Math.abs(angleDiff(ma, targetAngle)) - Math.abs(angleDiff(mb, targetAngle));
    });
    const toRemove = sorted.slice(0, this.spawnGate.gapCount);
    toRemove.forEach((s) => {
      World.remove(this.world, s.body);
    });
    this.spawnGate.segments = this.spawnGate.segments.filter(s => !toRemove.includes(s));
    this.spawnGate.isOpen = true;
  }

  removeSpawnGate() {
    if (!this.spawnGate) return;
    this.spawnGate.segments.forEach(s => World.remove(this.world, s.body));
    this.spawnGate = null;
  }

  init() {
    this.engine = Engine.create({
      gravity: { x: 0, y: 1.2, scale: 0.001 } // Slightly higher gravity for arcade pacing
    });
    this.world = this.engine.world;
    this.setupCollisionHandler();

    // Create a rotating physical body under the spawner to throw marbles
    this.spawnerBody = Bodies.circle(this.spawner.x, this.spawner.y, this.spawner.radius || 15, {
      isStatic: true,
      friction: 1.0,
      frictionStatic: 1.0,
      restitution: 0.2,
      label: 'spawner_body'
    });
    World.add(this.world, this.spawnerBody);
  }

  // Hook up event listeners for goals and hazards
  setupCollisionHandler() {
    Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        let marbleBody = null;
        let sensorBody = null;
        
        if (bodyA.label === 'marble') {
          marbleBody = bodyA;
          sensorBody = bodyB;
        } else if (bodyB.label === 'marble') {
          marbleBody = bodyB;
          sensorBody = bodyA;
        }

        if (marbleBody && sensorBody) {
          if (sensorBody.label === 'goal' && !marbleBody.finished) {
            this.handleGoalFinish(marbleBody);
          } else if (sensorBody.label === 'hazard') {
            this.handleHazardReset(marbleBody);
          }
        }
      });
    });
  }

  handleGoalFinish(marbleBody) {
    marbleBody.finished = true;
    const timeElapsed = (Date.now() - this.raceStartTime) / 1000;
    
    const record = {
      id: marbleBody.marbleId,
      name: marbleBody.marbleName,
      color: marbleBody.marbleColor,
      emoji: marbleBody.marbleEmoji,
      time: timeElapsed,
      rank: this.finishedMarbles.length + 1
    };
    
    this.finishedMarbles.push(record);
    
    const rank = record.rank;
    const totalMarbles = this.marbles.length;

    let targetX, targetY;
    
    // If only 1 marble is racing (e.g. Test Marble in editor), it goes to slot 1
    if (totalMarbles === 1) {
      targetX = 1220 + 16;
      targetY = 380;
    } else {
      // If it is the last marble, or rank is > 10, it is eliminated
      const isEliminated = (rank === totalMarbles) || (rank > 10);
      if (isEliminated) {
        targetX = 1220 + 20 + Math.random() * 280;
        targetY = 660 + Math.random() * 20;
      } else {
        // Go to its standing slot
        targetX = 1220 + (rank - 1) * 32 + 16;
        targetY = 380;
      }
    }

    // Teleport and reset velocities
    Body.setPosition(marbleBody, { x: targetX, y: targetY });
    Body.setVelocity(marbleBody, { x: 0, y: 1 });
    Body.setAngularVelocity(marbleBody, 0);

    // Keep it physical but change label to avoid duplicate goal/hazard triggers
    marbleBody.label = 'finished_marble';
    
    if (this.onGoalReached) {
      this.onGoalReached(record, marbleBody.position);
    }
  }

  handleHazardReset(marbleBody) {
    // Reset velocities and teleport back to spawner
    Body.setVelocity(marbleBody, { x: 0, y: 0 });
    Body.setAngularVelocity(marbleBody, 0);
    
    // Add minor random scatter at spawn to prevent marbles clipping inside each other
    const scatterX = (Math.random() - 0.5) * 15;
    const scatterY = (Math.random() - 0.5) * 10;
    
    const originalPos = { x: marbleBody.position.x, y: marbleBody.position.y };
    
    Body.setPosition(marbleBody, { 
      x: this.spawner.x + scatterX, 
      y: this.spawner.y + scatterY 
    });

    if (this.onHazardTriggered) {
      this.onHazardTriggered(marbleBody.marbleName, originalPos);
    }
  }

  // Build 4 static walls along the arena rectangle perimeter and the standings structure
  setupArenaBoundary(width, height) {
    // Remove prior boundary and standings structure bodies
    this.staticElements = this.staticElements.filter((el) => {
      if (el.type === 'arena_boundary' || el.type === 'standings_structure') {
        if (el.bodies) el.bodies.forEach(b => World.remove(this.world, b));
        return false;
      }
      return true;
    });

    this.arenaBounds = { x: 0, y: 0, width, height };

    const t = 40;
    const bodies = [
      Bodies.rectangle(width / 2, -t / 2, width + 2 * t, t,
        { isStatic: true, restitution: 0.6, friction: 0.05, label: 'arena_wall' }),
      Bodies.rectangle(width / 2, height + t / 2, width + 2 * t, t,
        { isStatic: true, restitution: 0.6, friction: 0.05, label: 'arena_wall' }),
      Bodies.rectangle(-t / 2, height / 2, t, height + 2 * t,
        { isStatic: true, restitution: 0.6, friction: 0.05, label: 'arena_wall' }),
      Bodies.rectangle(width + t / 2, height / 2, t, height + 2 * t,
        { isStatic: true, restitution: 0.6, friction: 0.05, label: 'arena_wall' })
    ];
    bodies.forEach(b => World.add(this.world, b));

    this.staticElements.push({
      type: 'arena_boundary',
      x: 0,
      y: 0,
      width,
      height,
      bodies
    });

    // Standings & Eliminated Area structure on the right side
    const sx = 1220;
    const sy = 420;
    const standingsBodies = [];

    // Bottom shelf of standings slots
    const bottomShelf = Bodies.rectangle(sx + 160, sy + 200, 324, 8, {
      isStatic: true,
      friction: 0.1,
      restitution: 0.3,
      label: 'standings_wall'
    });
    standingsBodies.push(bottomShelf);

    // 11 vertical dividers for 10 slots
    for (let i = 0; i <= 10; i++) {
      const divider = Bodies.rectangle(sx + i * 32, sy + 100, 4, 200, {
        isStatic: true,
        friction: 0.1,
        restitution: 0.3,
        label: 'standings_wall'
      });
      standingsBodies.push(divider);
    }

    // Eliminated Area container below standings
    const elimBottom = Bodies.rectangle(sx + 160, sy + 430, 324, 8, {
      isStatic: true,
      friction: 0.1,
      restitution: 0.3,
      label: 'standings_wall'
    });
    const elimLeft = Bodies.rectangle(sx, sy + 350, 4, 160, {
      isStatic: true,
      friction: 0.1,
      restitution: 0.3,
      label: 'standings_wall'
    });
    const elimRight = Bodies.rectangle(sx + 320, sy + 350, 4, 160, {
      isStatic: true,
      friction: 0.1,
      restitution: 0.3,
      label: 'standings_wall'
    });
    standingsBodies.push(elimBottom, elimLeft, elimRight);

    // Add all to world
    standingsBodies.forEach(b => World.add(this.world, b));

    this.staticElements.push({
      type: 'standings_structure',
      x: sx,
      y: sy,
      width: 320,
      height: 430,
      bodies: standingsBodies
    });
  }

  // Filled solid shape (rect or circle) used as wall / goal / hazard
  addShape(category, shape, geom) {
    const isSensor = category !== 'wall';
    let labelName = 'wall';
    if (category === 'goal') labelName = 'goal';
    else if (category === 'hazard') labelName = 'hazard';

    let body;
    let normGeom;

    if (shape === 'rect') {
      const w = Math.max(4, Math.abs(geom.w));
      const h = Math.max(4, Math.abs(geom.h));
      const cx = geom.x + geom.w / 2;
      const cy = geom.y + geom.h / 2;
      body = Bodies.rectangle(cx, cy, w, h, {
        isStatic: true,
        isSensor,
        restitution: 0.4,
        friction: 0.15,
        label: labelName
      });
      normGeom = { x: geom.x, y: geom.y, w: geom.w, h: geom.h };
    } else if (shape === 'circle') {
      const r = Math.max(2, geom.r);
      body = Bodies.circle(geom.cx, geom.cy, r, {
        isStatic: true,
        isSensor,
        restitution: 0.4,
        friction: 0.15,
        label: labelName
      });
      normGeom = { cx: geom.cx, cy: geom.cy, r };
    } else {
      return null;
    }

    World.add(this.world, body);

    const elementRecord = {
      type: 'shape',
      category,
      shape,
      geom: normGeom,
      bodies: [body]
    };
    this.staticElements.push(elementRecord);
    return elementRecord;
  }

  // Create physical walls from drawn paths
  addWall(points, thickness = 12) {
    const bodies = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      const L = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (L < 1) continue;
      
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      // Static line segment
      const segment = Bodies.rectangle(cx, cy, L, thickness, {
        isStatic: true,
        angle: angle,
        friction: 0.15,
        restitution: 0.45,
        label: 'wall'
      });
      
      // Joint circle at endpoint to prevent snagging on gaps
      const joint = Bodies.circle(p2.x, p2.y, thickness / 2, {
        isStatic: true,
        friction: 0.15,
        restitution: 0.45,
        label: 'wall_joint'
      });
      
      bodies.push(segment, joint);
      World.add(this.world, [segment, joint]);
    }

    const elementRecord = { type: 'wall', points, thickness, bodies };
    this.staticElements.push(elementRecord);
    return elementRecord;
  }

  // Create Goal sensor path
  addGoal(points, thickness = 20) {
    const bodies = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      const L = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (L < 1) continue;
      
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      const sensor = Bodies.rectangle(cx, cy, L, thickness, {
        isStatic: true,
        isSensor: true,
        angle: angle,
        label: 'goal'
      });
      
      bodies.push(sensor);
      World.add(this.world, sensor);
    }
    
    const elementRecord = { type: 'goal', points, thickness, bodies };
    this.staticElements.push(elementRecord);
    return elementRecord;
  }

  // Create Hazard sensor path
  addHazard(points, thickness = 20) {
    const bodies = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      const L = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (L < 1) continue;
      
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      const sensor = Bodies.rectangle(cx, cy, L, thickness, {
        isStatic: true,
        isSensor: true,
        angle: angle,
        label: 'hazard'
      });
      
      bodies.push(sensor);
      World.add(this.world, sensor);
    }
    
    const elementRecord = { type: 'hazard', points, thickness, bodies };
    this.staticElements.push(elementRecord);
    return elementRecord;
  }

  // Update spawner coordinates
  setSpawner(x, y) {
    this.spawner.x = x;
    this.spawner.y = y;
    
    if (this.spawnerBody) {
      Body.setPosition(this.spawnerBody, { x, y });
    }
    
    // Update spawner record in static elements
    const idx = this.staticElements.findIndex(e => e.type === 'spawner');
    if (idx !== -1) {
      this.staticElements[idx].x = x;
      this.staticElements[idx].y = y;
    } else {
      this.staticElements.push({ type: 'spawner', x, y, radius: 15 });
    }
  }

  // Setup marbles for the race
  spawnMarbles(count, presetData) {
    this.marbles.forEach(m => World.remove(this.world, m));
    this.marbles = [];

    this.finishedMarbles = [];
    this.raceStartTime = Date.now();

    const radius = 10;
    const useGate = !this.menuMode; // Enable starting box gate in race mode
    const gateRadius = Math.max(45, 14 + Math.ceil(Math.sqrt(count)) * 16);

    if (useGate) {
      this.createSpawnGate(this.spawner.x, this.spawner.y, gateRadius);
      this.scheduleGateOpen(3000);
    } else {
      this.removeSpawnGate();
    }

    for (let i = 0; i < count; i++) {
      const preset = presetData[i % presetData.length];

      let spawnX, spawnY;
      if (useGate) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * (gateRadius - radius - 4);
        spawnX = this.spawner.x + Math.cos(angle) * r;
        spawnY = this.spawner.y + Math.sin(angle) * r;
      } else {
        if (count === 1) {
          spawnX = this.spawner.x;
          spawnY = this.spawner.y - 18;
        } else {
          const row = Math.floor(i / 5);
          const col = i % 5;
          spawnX = this.spawner.x + (col - 2) * 12 + (Math.random() - 0.5) * 2;
          spawnY = this.spawner.y - 15 - (row * 20) + (Math.random() - 0.5) * 2;
        }
      }

       const marble = Bodies.circle(spawnX, spawnY, radius, {
        restitution: 0.4,
        friction: 0.08,
        frictionStatic: 0.1,
        frictionAir: 0.015,
        density: 0.001,
        label: 'marble'
      });

      marble.marbleId = `marble-${i}`;
      marble.marbleName = preset.name;
      marble.marbleColor = preset.color;
      marble.marbleEmoji = preset.emoji;
      marble.marbleEffect = preset.effect;
      marble.isPlayer = preset.isPlayer || false;
      marble.finished = false;
      marble.trail = [];

      Body.setVelocity(marble, {
        x: (Math.random() - 0.5) * 1.5,
        y: Math.random() * -1
      });

      this.marbles.push(marble);
      World.add(this.world, marble);
    }
  }

  // Undo the last drawn element
  undo() {
    if (this.staticElements.length === 0) return;

    // Find the last drawn path/spawner that is not the default spawner, arena boundary, or standings structure
    let lastIdx = -1;
    for (let i = this.staticElements.length - 1; i >= 0; i--) {
      const el = this.staticElements[i];
      if (el.type === 'arena_boundary' || el.type === 'standings_structure') continue;
      if (el.type === 'spawner' && this.staticElements.filter(e => e.type === 'spawner').length <= 1) continue;
      lastIdx = i;
      break;
    }

    if (lastIdx === -1) return;

    const lastElement = this.staticElements[lastIdx];
    
    // Remove Matter bodies from world
    if (lastElement.bodies) {
      lastElement.bodies.forEach(b => World.remove(this.world, b));
    }
    
    this.staticElements.splice(lastIdx, 1);
  }

  // Clear all editor bodies (preserve arena boundary)
  clearAll() {
    const preserved = [];
    this.staticElements.forEach((el) => {
      if (el.type === 'arena_boundary' || el.type === 'standings_structure') {
        preserved.push(el);
        return;
      }
      if (el.bodies) {
        el.bodies.forEach(b => World.remove(this.world, b));
      }
    });
    this.staticElements = preserved;

    this.removeSpawnGate();

    const sx = this.arenaBounds.width / 2;
    const sy = Math.max(40, this.arenaBounds.height * 0.1);
    this.setSpawner(sx, sy);

    this.marbles.forEach(m => World.remove(this.world, m));
    this.marbles = [];
    this.finishedMarbles = [];
  }

  // Load a map object completely
  loadMap(mapData) {
    this.clearAll();

    mapData.elements.forEach((el) => {
      if (el.type === 'spawner') {
        this.setSpawner(el.x, el.y);
      } else if (el.type === 'cog') {
        this.staticElements.push({
          type: 'cog',
          x: el.x,
          y: el.y,
          radius: el.radius || 15,
          direction: el.direction || 1,
          angle: 0
        });
      } else if (el.type === 'wall') {
        this.addWall(el.points, el.thickness || 12);
      } else if (el.type === 'goal') {
        this.addGoal(el.points, el.thickness || 20);
      } else if (el.type === 'hazard') {
        this.addHazard(el.points, el.thickness || 20);
      } else if (el.type === 'shape') {
        this.addShape(el.category, el.shape, el.geom);
      }
    });
  }

  // Export current map setup
  exportMap() {
    const out = [];
    this.staticElements.forEach((el) => {
      if (el.type === 'arena_boundary' || el.type === 'standings_structure') return;
      if (el.type === 'spawner') {
        out.push({ type: 'spawner', x: el.x, y: el.y, radius: el.radius });
      } else if (el.type === 'cog') {
        out.push({ type: 'cog', x: el.x, y: el.y, radius: el.radius, direction: el.direction || 1 });
      } else if (el.type === 'shape') {
        out.push({ type: 'shape', category: el.category, shape: el.shape, geom: el.geom });
      } else {
        out.push({ type: el.type, points: el.points, thickness: el.thickness });
      }
    });
    return out;
  }

  setPaused(paused) {
    if (this.isPaused === paused) return;
    this.isPaused = paused;
    if (paused) {
      this.restoreRotatingBodies();
      if (this.spawnerBody) {
        Body.setStatic(this.spawnerBody, true);
        Body.setVelocity(this.spawnerBody, { x: 0, y: 0 });
        Body.setAngularVelocity(this.spawnerBody, 0);
      }
    } else {
      this.compileRotatingBodies();
      if (this.spawnerBody) {
        Body.setStatic(this.spawnerBody, false);
      }
    }
  }

  compileRotatingBodies() {
    this.rotatingBodies = [];
    const cogs = this.staticElements.filter(el => el.type === 'cog');
    if (cogs.length === 0) return;

    this.staticElements.forEach((el) => {
      if (el.type !== 'shape' && el.type !== 'wall') return;
      if (!el.bodies || el.bodies.length === 0) return;

      const associatedCog = cogs.find(cog => this.isCogOnElement(cog, el));
      if (associatedCog) {
        el.bodies.forEach((body) => {
          Body.setStatic(body, false);
          this.rotatingBodies.push({
            body,
            cog: associatedCog,
            offsetAngle: body.angle,
            dx: body.position.x - associatedCog.x,
            dy: body.position.y - associatedCog.y,
            currentAngle: body.angle
          });
        });
      }
    });
  }

  restoreRotatingBodies() {
    if (!this.rotatingBodies) return;
    this.rotatingBodies.forEach((rb) => {
      Body.setStatic(rb.body, true);
      const originalX = rb.cog.x + rb.dx;
      const originalY = rb.cog.y + rb.dy;
      Body.setPosition(rb.body, { x: originalX, y: originalY });
      Body.setAngle(rb.body, rb.offsetAngle);
      Body.setVelocity(rb.body, { x: 0, y: 0 });
      Body.setAngularVelocity(rb.body, 0);
    });
    this.rotatingBodies = [];
  }

  isCogOnElement(cog, el) {
    if (el.type === 'shape') {
      if (el.shape === 'rect') {
        const x = Math.min(el.geom.x, el.geom.x + el.geom.w);
        const y = Math.min(el.geom.y, el.geom.y + el.geom.h);
        const w = Math.abs(el.geom.w);
        const h = Math.abs(el.geom.h);
        return cog.x >= x && cog.x <= x + w && cog.y >= y && cog.y <= y + h;
      } else if (el.shape === 'circle') {
        const dist = Math.hypot(cog.x - el.geom.cx, cog.y - el.geom.cy);
        return dist <= el.geom.r;
      }
    } else if (el.type === 'wall') {
      const points = el.points;
      const thickness = el.thickness || 12;
      const threshold = thickness / 2 + 10;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (this.distanceToSegment(cog, p1, p2) <= threshold) {
          return true;
        }
      }
    }
    return false;
  }

  distanceToSegment(p, a, b) {
    const l2 = Math.hypot(b.x - a.x, b.y - a.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
  }

  updateRotatingBodies(dt) {
    // Rotate cogs visually
    const cogs = this.staticElements.filter(el => el.type === 'cog');
    const omegaBase = 1.2;
    cogs.forEach((cog) => {
      if (!cog.angle) cog.angle = 0;
      cog.angle += omegaBase * (cog.direction || 1) * dt;
    });

    if (!this.rotatingBodies || this.rotatingBodies.length === 0) return;

    this.rotatingBodies.forEach((rb) => {
      const omega = omegaBase * (rb.cog.direction || 1);
      rb.currentAngle += omega * dt;
      
      const cos = Math.cos(rb.currentAngle - rb.offsetAngle);
      const sin = Math.sin(rb.currentAngle - rb.offsetAngle);
      
      const rx = rb.dx * cos - rb.dy * sin;
      const ry = rb.dx * sin + rb.dy * cos;
      
      const newX = rb.cog.x + rx;
      const newY = rb.cog.y + ry;
      
      const vx = -omega * ry;
      const vy = omega * rx;

      Body.setPosition(rb.body, { x: newX, y: newY });
      Body.setAngle(rb.body, rb.currentAngle);
      Body.setVelocity(rb.body, { x: vx, y: vy });
      Body.setAngularVelocity(rb.body, omega);
    });
  }

  updateSpawnerBody(dt) {
    if (!this.spawnerBody) return;
    const omega = 8.0;
    
    // Force set position to match spawner anchor
    Body.setPosition(this.spawnerBody, { x: this.spawner.x, y: this.spawner.y });
    Body.setVelocity(this.spawnerBody, { x: 0, y: 0 });
    
    const newAngle = this.spawnerBody.angle + omega * dt;
    Body.setAngle(this.spawnerBody, newAngle);
    Body.setAngularVelocity(this.spawnerBody, omega);

    // Apply manual tangential friction/traction transfer to the marbles.
    // This simulates high-friction rolling grip and flings marbles correctly.
    const spawnerRadius = this.spawner.radius || 15;
    const marbleRadius = 10;
    const contactThreshold = spawnerRadius + marbleRadius + 3.0; // slight buffer for overlap
    
    this.marbles.forEach((marble) => {
      if (marble.finished) return;
      const dx = marble.position.x - this.spawner.x;
      const dy = marble.position.y - this.spawner.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist > 0.1 && dist <= contactThreshold) {
        // Normal direction from spawner center to marble center
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Tangent direction (clockwise)
        const tx = -ny;
        const ty = nx;
        
        // Linear velocity of the spawner surface
        const surfaceSpeed = omega * spawnerRadius;
        
        // Get marble's current tangent velocity component
        const currentTangentSpeed = marble.velocity.x * tx + marble.velocity.y * ty;
        const speedDifference = surfaceSpeed - currentTangentSpeed;
        
        // Adjust velocity to match the spawner's surface speed
        const speedCorrection = speedDifference * 0.35;
        
        Body.setVelocity(marble, {
          x: marble.velocity.x + tx * speedCorrection,
          y: marble.velocity.y + ty * speedCorrection
        });
        
        // Prevent marble from clipping into the spawner body under high gravity
        const overlap = (spawnerRadius + marbleRadius) - dist;
        if (overlap > 0) {
          Body.setPosition(marble, {
            x: marble.position.x + nx * overlap * 0.2,
            y: marble.position.y + ny * overlap * 0.2
          });
        }
      }
    });
  }

  updateSpawnGatePhysics(dt) {
    if (!this.spawnGate || this.spawnGate.isOpen) return;

    // Spin speed: 1.6 rad/s.
    const omega = 1.6;
    const sx = this.spawnGate.x;
    const sy = this.spawnGate.y;
    const radius = this.spawnGate.radius;
    const marbleRadius = 10;

    // 1. Physical segment positioning and rotation
    this.spawnGate.segments.forEach((seg) => {
      seg.a1 += omega * dt;
      seg.a2 += omega * dt;

      const midAngle = (seg.a1 + seg.a2) / 2;
      const newX = sx + Math.cos(midAngle) * radius;
      const newY = sy + Math.sin(midAngle) * radius;

      const vx = -omega * radius * Math.sin(midAngle);
      const vy = omega * radius * Math.cos(midAngle);

      Body.setPosition(seg.body, { x: newX, y: newY });
      Body.setAngle(seg.body, midAngle + Math.PI / 2);
      Body.setVelocity(seg.body, { x: vx, y: vy });
      Body.setAngularVelocity(seg.body, omega);
    });

    // 2. Manual friction/traction transfer from the outer rotating gate wall to inner marbles
    const contactThreshold = radius - marbleRadius - 3.0; // marbles touching/near the outer wall
    this.marbles.forEach((marble) => {
      if (marble.finished) return;
      const dx = marble.position.x - sx;
      const dy = marble.position.y - sy;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.1 && dist >= contactThreshold) {
        const nx = dx / dist;
        const ny = dy / dist;

        // Tangent vector pointing clockwise along outer wall
        const tx = -ny;
        const ty = nx;

        // Linear velocity at the outer wall
        const surfaceSpeed = omega * radius;

        // Correct velocity to match the gate's spinning motion
        const currentTangentSpeed = marble.velocity.x * tx + marble.velocity.y * ty;
        const speedDifference = surfaceSpeed - currentTangentSpeed;
        const speedCorrection = speedDifference * 0.35;

        Body.setVelocity(marble, {
          x: marble.velocity.x + tx * speedCorrection,
          y: marble.velocity.y + ty * speedCorrection
        });

        // Anti-clipping push to keep marbles inside the spawn gate
        const overlap = dist - contactThreshold;
        if (overlap > 0) {
          Body.setPosition(marble, {
            x: marble.position.x - nx * overlap * 0.2,
            y: marble.position.y - ny * overlap * 0.2
          });
        }
      }
    });
  }

  // Tick step called by the canvas requestAnimationFrame loop
  tick(fpsDeltaTime = 16.666) {
    if (this.isPaused) return;

    // Use 4x substepping for physics precision and stability
    const baseSubsteps = 4;
    const steps = Math.ceil(this.physicsSpeed * baseSubsteps);
    const stepTime = (fpsDeltaTime * this.physicsSpeed) / steps;

    for (let i = 0; i < steps; i++) {
      const dtSec = Math.min(stepTime, 30) / 1000;
      this.updateRotatingBodies(dtSec);
      this.updateSpawnerBody(dtSec);
      this.updateSpawnGatePhysics(dtSec);
      Engine.update(this.engine, Math.min(stepTime, 30));
    }

    // Gate scheduler
    if (this.spawnGate && this.spawnGate.opensAt && !this.spawnGate.isOpen) {
      if (Date.now() >= this.spawnGate.opensAt) {
        this.openSpawnGate();
      }
    }

    // Interpolate remote marbles toward last broadcast target
    const lerp = 0.35;
    this.remoteMarbles.forEach((r) => {
      r.x += (r.targetX - r.x) * lerp;
      r.y += (r.targetY - r.y) * lerp;
      if (!r.trail) r.trail = [];
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > 40) r.trail.shift();
    });

    // Record marble trails (longer for smoother render)
    this.marbles.forEach((m) => {
      if (!m.finished) {
        m.trail.push({ x: m.position.x, y: m.position.y });
        if (m.trail.length > 40) m.trail.shift();
      } else {
        m.trail = [];
      }
    });
  }
}
