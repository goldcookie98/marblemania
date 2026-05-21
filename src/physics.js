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
        restitution: 0.7,
        friction: 0.05,
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
    
    // Set marble category/group to not collide with anything anymore, or just slow it down
    // Let's make it a sensor or floaty so it stops racing but stays visible
    Body.setVelocity(marbleBody, { x: 0, y: -0.5 });
    marbleBody.isSensor = true;
    
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

  // Build 4 static walls along the arena rectangle perimeter
  setupArenaBoundary(width, height) {
    // Remove prior boundary bodies
    this.staticElements = this.staticElements.filter((el) => {
      if (el.type === 'arena_boundary') {
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
        restitution: 0.6,
        friction: 0.05,
        label: labelName
      });
      normGeom = { x: geom.x, y: geom.y, w: geom.w, h: geom.h };
    } else if (shape === 'circle') {
      const r = Math.max(2, geom.r);
      body = Bodies.circle(geom.cx, geom.cy, r, {
        isStatic: true,
        isSensor,
        restitution: 0.6,
        friction: 0.05,
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
        friction: 0.05,
        restitution: 0.8, // Bouncy walls
        label: 'wall'
      });
      
      // Joint circle at endpoint to prevent snagging on gaps
      const joint = Bodies.circle(p2.x, p2.y, thickness / 2, {
        isStatic: true,
        friction: 0.05,
        restitution: 0.8,
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
    const useGate = false; // Disable starting box gate completely
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
        const row = Math.floor(i / 5);
        const col = i % 5;
        spawnX = this.spawner.x + (col - 2) * 16 + (Math.random() - 0.5) * 4;
        spawnY = this.spawner.y - 30 - (row * 22) + (Math.random() - 0.5) * 4;
      }

      const marble = Bodies.circle(spawnX, spawnY, radius, {
        restitution: 0.65,
        friction: 0.005,
        frictionAir: 0.002,
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

    // Find the last drawn path/spawner that is not the default spawner or arena boundary
    let lastIdx = -1;
    for (let i = this.staticElements.length - 1; i >= 0; i--) {
      const el = this.staticElements[i];
      if (el.type === 'arena_boundary') continue;
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
      if (el.type === 'arena_boundary') {
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
      if (el.type === 'arena_boundary') return;
      if (el.type === 'spawner') {
        out.push({ type: 'spawner', x: el.x, y: el.y, radius: el.radius });
      } else if (el.type === 'shape') {
        out.push({ type: 'shape', category: el.category, shape: el.shape, geom: el.geom });
      } else {
        out.push({ type: el.type, points: el.points, thickness: el.thickness });
      }
    });
    return out;
  }

  // Tick step called by the canvas requestAnimationFrame loop
  tick(fpsDeltaTime = 16.666) {
    if (this.isPaused) return;

    const steps = Math.ceil(this.physicsSpeed);
    const stepTime = (fpsDeltaTime * this.physicsSpeed) / steps;

    for (let i = 0; i < steps; i++) {
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
