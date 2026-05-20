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
    // Remove existing marbles from world
    this.marbles.forEach(m => World.remove(this.world, m));
    this.marbles = [];
    
    this.finishedMarbles = [];
    this.raceStartTime = Date.now();

    const radius = 10;
    
    for (let i = 0; i < count; i++) {
      const preset = presetData[i % presetData.length];
      
      // Arrange marble spawn positions in a staggered layout
      const row = Math.floor(i / 5);
      const col = i % 5;
      const spawnX = this.spawner.x + (col - 2) * 16 + (Math.random() - 0.5) * 4;
      const spawnY = this.spawner.y - 30 - (row * 22) + (Math.random() - 0.5) * 4;
      
      const marble = Bodies.circle(spawnX, spawnY, radius, {
        restitution: 0.65, // Bounciness
        friction: 0.005,  // Roll smoothly
        frictionAir: 0.002,
        density: 0.001,
        label: 'marble'
      });

      // Attach custom properties
      marble.marbleId = `marble-${i}`;
      marble.marbleName = preset.name;
      marble.marbleColor = preset.color;
      marble.marbleEmoji = preset.emoji;
      marble.marbleEffect = preset.effect;
      marble.isPlayer = preset.isPlayer || false;
      marble.finished = false;
      marble.trail = []; // Cache for trailing track positions
      
      // Give them a tiny initial impulse so they don't block each other
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
    
    // Find the last drawn path/spawner that is not the default spawner
    let lastIdx = -1;
    for (let i = this.staticElements.length - 1; i >= 0; i--) {
      if (this.staticElements[i].type !== 'spawner' || this.staticElements.filter(e => e.type === 'spawner').length > 1) {
        lastIdx = i;
        break;
      }
    }

    if (lastIdx === -1) return;

    const lastElement = this.staticElements[lastIdx];
    
    // Remove Matter bodies from world
    if (lastElement.bodies) {
      lastElement.bodies.forEach(b => World.remove(this.world, b));
    }
    
    this.staticElements.splice(lastIdx, 1);
  }

  // Clear all editor bodies
  clearAll() {
    this.staticElements.forEach((el) => {
      if (el.bodies) {
        el.bodies.forEach(b => World.remove(this.world, b));
      }
    });
    this.staticElements = [];
    
    // Keep a spawner in the world
    this.setSpawner(400, 100);
    
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
      }
    });
  }

  // Export current map setup
  exportMap() {
    // Return serializeable elements
    return this.staticElements.map((el) => {
      if (el.type === 'spawner') {
        return { type: 'spawner', x: el.x, y: el.y, radius: el.radius };
      }
      return {
        type: el.type,
        points: el.points,
        thickness: el.thickness
      };
    });
  }

  // Tick step called by the canvas requestAnimationFrame loop
  tick(fpsDeltaTime = 16.666) {
    if (this.isPaused) return;

    // Use multiple steps if running at high speeds (e.g. 2x, 3x) to keep simulation stable
    const steps = Math.ceil(this.physicsSpeed);
    const stepTime = (fpsDeltaTime * this.physicsSpeed) / steps;
    
    for (let i = 0; i < steps; i++) {
      Engine.update(this.engine, Math.min(stepTime, 30)); // Cap physics step duration
    }

    // Record marble trails
    this.marbles.forEach((m) => {
      if (!m.finished) {
        m.trail.push({ x: m.position.x, y: m.position.y });
        if (m.trail.length > 15) m.trail.shift(); // Keep only last 15 ticks
      } else {
        m.trail = []; // Clear trail once crossed goal line
      }
    });
  }
}
