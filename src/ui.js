import { 
  initFirebase, 
  isFirebaseConnected, 
  clearFirebaseConfig, 
  saveMap, 
  fetchAllMaps, 
  likeMap 
} from './firebase-db';

// Marble Visual Presets Definition
export const MARBLE_PRESETS = {
  classic: Array.from({ length: 50 }, (_, i) => {
    // Generate a nice spectrum of neon/bright colors
    const hue = (i * 137.5) % 360; // Golden ratio scatter
    return {
      name: `Glow-${i + 1}`,
      color: `hsl(${hue}, 100%, 60%)`,
      emoji: ''
    };
  }),
  countries: [
    { name: 'USA', color: '#ff4d4d', emoji: '🇺🇸' },
    { name: 'UK', color: '#3366ff', emoji: '🇬🇧' },
    { name: 'Canada', color: '#ff3333', emoji: '🇨🇦' },
    { name: 'Japan', color: '#ffffff', emoji: '🇯🇵' },
    { name: 'Germany', color: '#ffcc00', emoji: '🇩🇪' },
    { name: 'France', color: '#3399ff', emoji: '🇫🇷' },
    { name: 'Australia', color: '#003399', emoji: '🇦🇺' },
    { name: 'Brazil', color: '#00cc66', emoji: '🇧🇷' },
    { name: 'India', color: '#ff9933', emoji: '🇮🇳' },
    { name: 'Spain', color: '#ffc107', emoji: '🇪🇸' },
    { name: 'Italy', color: '#4caf50', emoji: '🇮🇹' },
    { name: 'Mexico', color: '#2e7d32', emoji: '🇲🇽' },
    { name: 'South Korea', color: '#e0e0e0', emoji: '🇰🇷' },
    { name: 'Netherlands', color: '#ff6600', emoji: '🇳🇱' },
    { name: 'Sweden', color: '#0080ff', emoji: '🇸🇪' },
    { name: 'Switzerland', color: '#ff4d4d', emoji: '🇨🇭' },
    { name: 'Argentina', color: '#80d8ff', emoji: '🇦🇷' },
    { name: 'South Africa', color: '#43a047', emoji: '🇿🇦' },
    { name: 'Jamaica', color: '#ffd600', emoji: '🇯🇲' },
    { name: 'New Zealand', color: '#212121', emoji: '🇳🇿' }
  ].concat(Array.from({ length: 30 }, (_, i) => ({
    name: `Racer-${i + 21}`,
    color: '#00f2fe',
    emoji: '🏳️'
  }))),
  emoji: [
    { name: 'Fox', color: '#ff9800', emoji: '🦊' },
    { name: 'Lion', color: '#ffc107', emoji: '🦁' },
    { name: 'Tiger', color: '#ffb300', emoji: '🐯' },
    { name: 'Frog', color: '#8bc34a', emoji: '🐸' },
    { name: 'Octopus', color: '#e91e63', emoji: '🐙' },
    { name: 'Unicorn', color: '#e040fb', emoji: '🦄' },
    { name: 'Panda', color: '#ffffff', emoji: '🐼' },
    { name: 'Koala', color: '#b0bec5', emoji: '🐨' },
    { name: 'Pig', color: '#f8bbd0', emoji: '🐷' },
    { name: 'Monkey', color: '#8d6e63', emoji: '🐵' },
    { name: 'Alien', color: '#00e676', emoji: '👽' },
    { name: 'Ghost', color: '#e0e0e0', emoji: '👻' },
    { name: 'Robot', color: '#78909c', emoji: '🤖' },
    { name: 'Chicken', color: '#ffeb3b', emoji: '🐔' },
    { name: 'Penguin', color: '#90caf9', emoji: '🐧' },
    { name: 'Dolphin', color: '#29b6f6', emoji: '🐬' },
    { name: 'Dragon', color: '#4caf50', emoji: '🐲' },
    { name: 'Cat', color: '#ffcc80', emoji: '🐱' },
    { name: 'Dog', color: '#ffe082', emoji: '🐶' },
    { name: 'Devil', color: '#ef5350', emoji: '😈' }
  ].concat(Array.from({ length: 30 }, (_, i) => ({
    name: `Emoji-${i + 21}`,
    color: '#00f2fe',
    emoji: '🌀'
  }))),
  planets: [
    { name: 'Sun', color: '#ffea00', emoji: '🌞' },
    { name: 'Mercury', color: '#9e9e9e', emoji: '🌑' },
    { name: 'Venus', color: '#ffcc80', emoji: '🪐' },
    { name: 'Earth', color: '#29b6f6', emoji: '🌍' },
    { name: 'Mars', color: '#ef5350', emoji: '🔴' },
    { name: 'Jupiter', color: '#d7ccc8', emoji: '🪐' },
    { name: 'Saturn', color: '#ffe082', emoji: '🪐' },
    { name: 'Uranus', color: '#80deea', emoji: '🔵' },
    { name: 'Neptune', color: '#3f51b5', emoji: '🔵' },
    { name: 'Moon', color: '#eceff1', emoji: '🌙' }
  ].concat(Array.from({ length: 40 }, (_, i) => ({
    name: `Star-${i + 11}`,
    color: '#ffe600',
    emoji: '⭐'
  })))
};

export class UIManager {
  constructor(simulator, renderer) {
    this.simulator = simulator;
    this.renderer = renderer;
    
    // Editor State
    this.currentTool = 'wall'; // wall, goal, hazard, spawner, eraser, pan
    this.brushSize = 12;
    this.activeDrawingPath = null;
    this.isDrawing = false;
    
    // UI Panels References
    this.canvas = renderer.canvas;
    
    // Binding functions
    this.initEventListeners();
    this.updateCloudStatus();
    this.refreshMapsList();
  }

  // Set up mouse and UI elements bindings
  initEventListeners() {
    const { canvas } = this;
    
    // --- Canvas Mouse & Scroll Event handlers ---
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right click menu
    canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    
    // Support Touch Screen drawing
    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', () => this.handleMouseUp());

    // --- Toolbar Buttons ---
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
      });
    });

    // Brush slider
    const brushSlider = document.getElementById('brush-size');
    const brushSizeVal = document.getElementById('brush-size-val');
    brushSlider.addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
      brushSizeVal.textContent = `${this.brushSize}px`;
    });

    // Action buttons
    document.getElementById('btn-undo').addEventListener('click', () => {
      this.simulator.undo();
    });
    
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (confirm("Are you sure you want to clear the entire map?")) {
        this.simulator.clearAll();
        this.renderer.panX = 0;
        this.renderer.panY = 0;
        this.renderer.zoom = 1.0;
        this.updateLeaderboard(true);
      }
    });

    // --- Playback Controls ---
    const playBtn = document.getElementById('btn-play');
    playBtn.addEventListener('click', () => {
      this.simulator.isPaused = !this.simulator.isPaused;
      if (this.simulator.isPaused) {
        document.body.classList.remove('pause-mode');
        playBtn.innerHTML = '<span class="play-icon"></span> Play Race';
        playBtn.classList.add('pulse-border');
      } else {
        document.body.classList.add('pause-mode');
        playBtn.innerHTML = '<span class="play-icon"></span> Pause';
        playBtn.classList.remove('pulse-border');
        
        // Spawn marbles if none exist
        if (this.simulator.marbles.length === 0) {
          this.triggerSpawn();
        }
      }
    });

    document.getElementById('btn-reset-marbles').addEventListener('click', () => {
      this.triggerSpawn();
      // Auto-play on reset
      if (this.simulator.isPaused) {
        playBtn.click();
      }
    });

    // Spawner Config Sliders
    const marbleCountSlider = document.getElementById('marble-count');
    const marbleCountVal = document.getElementById('marble-count-val');
    marbleCountSlider.addEventListener('input', (e) => {
      marbleCountVal.textContent = e.target.value;
    });

    const speedSlider = document.getElementById('physics-speed');
    const speedVal = document.getElementById('physics-speed-val');
    speedSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.simulator.physicsSpeed = val;
      speedVal.textContent = `${val}x`;
    });

    // Track Lead Camera Auto Toggle
    // We toggle tracking lead if double clicking pan, or let's create a double click canvas shortcut to track
    canvas.addEventListener('dblclick', () => {
      this.renderer.isTrackingLead = !this.renderer.isTrackingLead;
      if (this.renderer.isTrackingLead) {
        this.showToast("Camera: Auto-tracking Leader");
      } else {
        this.showToast("Camera: Free Pan Mode");
      }
    });

    // --- Right Tab Switching ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    // --- Save Map Form ---
    document.getElementById('save-map-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const mapName = document.getElementById('map-name').value.trim();
      const creatorName = document.getElementById('map-creator').value.trim();
      
      const elements = this.simulator.exportMap();
      if (elements.filter(el => el.type !== 'spawner').length === 0) {
        alert("Cannot save an empty map. Draw some walls first!");
        return;
      }

      this.showToast("Saving map...");
      try {
        await saveMap(mapName, creatorName, elements);
        this.showToast("Map saved successfully!");
        document.getElementById('map-name').value = '';
        this.refreshMapsList();
      } catch (err) {
        this.showToast("Failed to save map.");
      }
    });

    document.getElementById('btn-refresh-maps').addEventListener('click', () => {
      this.refreshMapsList();
    });

    // Search query input
    document.getElementById('map-search').addEventListener('input', (e) => {
      this.filterMapsList(e.target.value.toLowerCase());
    });

    // --- Firebase configuration modal setup ---
    const configModal = document.getElementById('firebase-modal');
    document.getElementById('btn-open-firebase-config').addEventListener('click', () => {
      // Prefill config from local storage if available
      const localConfig = localStorage.getItem('fb_config');
      if (localConfig) {
        const config = JSON.parse(localConfig);
        document.getElementById('fb-apiKey').value = config.apiKey || '';
        document.getElementById('fb-authDomain').value = config.authDomain || '';
        document.getElementById('fb-projectId').value = config.projectId || '';
        document.getElementById('fb-storageBucket').value = config.storageBucket || '';
        document.getElementById('fb-messagingSenderId').value = config.messagingSenderId || '';
        document.getElementById('fb-appId').value = config.appId || '';
      }
      configModal.classList.remove('hidden');
    });

    document.getElementById('modal-close').addEventListener('click', () => {
      configModal.classList.add('hidden');
    });

    document.getElementById('firebase-config-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const config = {
        apiKey: document.getElementById('fb-apiKey').value.trim(),
        authDomain: document.getElementById('fb-authDomain').value.trim(),
        projectId: document.getElementById('fb-projectId').value.trim(),
        storageBucket: document.getElementById('fb-storageBucket').value.trim(),
        messagingSenderId: document.getElementById('fb-messagingSenderId').value.trim(),
        appId: document.getElementById('fb-appId').value.trim()
      };

      try {
        initFirebase(config);
        this.updateCloudStatus();
        this.refreshMapsList();
        configModal.classList.add('hidden');
        this.showToast("Connected to Firebase Cloud Firestore!");
      } catch (error) {
        alert("Failed to initialize Firebase: " + error.message);
      }
    });

    document.getElementById('btn-fb-clear').addEventListener('click', () => {
      if (confirm("Disconnect from Cloud Sync? This will revert back to browser offline storage.")) {
        clearFirebaseConfig();
        this.updateCloudStatus();
        this.refreshMapsList();
        
        // Clear form values
        document.getElementById('firebase-config-form').reset();
        configModal.classList.add('hidden');
        this.showToast("Cloud disconnected. Offline mode enabled.");
      }
    });
  }

  // Trigger Spawning of Marbles
  triggerSpawn() {
    const count = parseInt(document.getElementById('marble-count').value);
    const presetName = document.getElementById('marble-preset').value;
    const preset = MARBLE_PRESETS[presetName] || MARBLE_PRESETS.classic;
    
    this.simulator.spawnMarbles(count, preset);
    this.updateLeaderboard(true);
    
    // Show quick race toast
    this.showToast(`Race Spawner activated! Spawning ${count} marbles.`);
  }

  // --- Mouse coordinates and Drawing events ---
  getMousePosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handleMouseDown(e) {
    const mousePos = this.getMousePosition(e);
    
    // Right click triggers viewport pan directly
    if (e.button === 2 || this.currentTool === 'pan') {
      this.isPanning = true;
      this.lastPanMouseX = e.clientX;
      this.lastPanMouseY = e.clientY;
      this.renderer.isTrackingLead = false; // Override lead tracking on manual pan
      return;
    }

    if (e.button === 0) { // Left click
      const worldPos = this.renderer.screenToWorld(mousePos.x, mousePos.y);
      
      if (this.currentTool === 'spawner') {
        this.simulator.setSpawner(worldPos.x, worldPos.y);
        this.showToast("Spawner point moved.");
        return;
      }
      
      this.isDrawing = true;
      this.activeDrawingPath = {
        tool: this.currentTool,
        thickness: this.brushSize,
        points: [worldPos]
      };
      
      if (this.currentTool === 'eraser') {
        this.eraseAtPosition(worldPos);
      }
    }
  }

  handleMouseMove(e) {
    const mousePos = this.getMousePosition(e);
    const worldPos = this.renderer.screenToWorld(mousePos.x, mousePos.y);
    
    if (this.isPanning) {
      const dx = e.clientX - this.lastPanMouseX;
      const dy = e.clientY - this.lastPanMouseY;
      this.renderer.panX += dx;
      this.renderer.panY += dy;
      this.lastPanMouseX = e.clientX;
      this.lastPanMouseY = e.clientY;
      return;
    }

    if (this.isDrawing && this.activeDrawingPath) {
      const points = this.activeDrawingPath.points;
      const lastPoint = points[points.length - 1];
      
      // Calculate travel distance to prevent duplicate overlapping coordinates
      const dist = Math.hypot(worldPos.x - lastPoint.x, worldPos.y - lastPoint.y);
      
      if (this.currentTool === 'eraser') {
        this.eraseAtPosition(worldPos);
        points.push(worldPos); // Record eraser brush paths visually
      } else if (dist > 6) { // Draw points at reasonable spacing
        points.push(worldPos);
      }
    }
  }

  handleMouseUp() {
    this.isPanning = false;
    
    if (this.isDrawing && this.activeDrawingPath) {
      const { tool, points, thickness } = this.activeDrawingPath;
      
      if (points.length >= 2) {
        if (tool === 'wall') {
          this.simulator.addWall(points, thickness);
        } else if (tool === 'goal') {
          this.simulator.addGoal(points, thickness + 8);
        } else if (tool === 'hazard') {
          this.simulator.addHazard(points, thickness + 8);
        }
      }
      
      this.activeDrawingPath = null;
      this.isDrawing = false;
    }
  }

  // Touch Screen events handler mapping
  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      });
      this.canvas.dispatchEvent(mouseEvent);
    } else if (e.touches.length === 2) {
      // Two fingers triggers drag panning
      this.isPanning = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.lastPanMouseX = (t1.clientX + t2.clientX) / 2;
      this.lastPanMouseY = (t1.clientY + t2.clientY) / 2;
      this.renderer.isTrackingLead = false;
    }
    e.preventDefault();
  }

  handleTouchMove(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    } else if (e.touches.length === 2 && this.isPanning) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      
      const dx = cx - this.lastPanMouseX;
      const dy = cy - this.lastPanMouseY;
      this.renderer.panX += dx;
      this.renderer.panY += dy;
      this.lastPanMouseX = cx;
      this.lastPanMouseY = cy;
    }
    e.preventDefault();
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    
    // Zoom toward the current mouse position
    const mousePos = this.getMousePosition(e);
    const mouseWorld = this.renderer.screenToWorld(mousePos.x, mousePos.y);
    
    const oldZoom = this.renderer.zoom;
    this.renderer.zoom = Math.min(Math.max(this.renderer.zoom * zoomFactor, 0.2), 3.5);
    
    // Adjust pan coordinates so mouse focus doesn't jump
    const zoomDiff = this.renderer.zoom - oldZoom;
    this.renderer.panX -= (mouseWorld.x - this.canvas.width / 2) * zoomDiff;
    this.renderer.panY -= (mouseWorld.y - this.canvas.height / 2) * zoomDiff;
  }

  // Eraser collision checks
  eraseAtPosition(worldPos) {
    const elements = this.simulator.staticElements;
    const eraseRadius = this.brushSize + 10;
    
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      
      if (el.type === 'spawner') continue; // Don't delete spawners via eraser
      
      // Check if mouse point lies close to any vertices
      let hits = false;
      for (const p of el.points) {
        if (Math.hypot(p.x - worldPos.x, p.y - worldPos.y) < eraseRadius) {
          hits = true;
          break;
        }
      }
      
      // Check segment intersections
      if (!hits) {
        for (let j = 0; j < el.points.length - 1; j++) {
          const p1 = el.points[j];
          const p2 = el.points[j+1];
          const distToSeg = this.distToSegment(worldPos, p1, p2);
          if (distToSeg < eraseRadius) {
            hits = true;
            break;
          }
        }
      }

      if (hits) {
        // Remove from simulator
        if (el.bodies) {
          el.bodies.forEach(b => Matter.World.remove(this.simulator.world, b));
        }
        elements.splice(i, 1);
      }
    }
  }

  // Help math for distance of point to line segment
  distToSegment(p, v, w) {
    const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(
      p.x - (v.x + t * (w.x - v.x)),
      p.y - (v.y + t * (w.y - v.y))
    );
  }

  // --- UI Leaderboard update loop ---
  updateLeaderboard(forceReset = false) {
    const listEl = document.getElementById('leaderboard-list');
    
    if (forceReset || (this.simulator.marbles.length === 0)) {
      listEl.innerHTML = '<div class="no-data-msg">Race not started. Click "Play Race" to spawn marbles!</div>';
      return;
    }

    // Leaderboard rankings rules:
    // 1. Finished marbles sorted by time (ascending)
    // 2. Unfinished marbles sorted by Y position (descending - largest Y is further down)
    const finished = [...this.simulator.finishedMarbles];
    
    const unfinished = this.simulator.marbles
      .filter(m => !m.finished)
      .sort((a, b) => b.position.y - a.position.y); // Largest Y (furthest down) comes first
    
    let html = '';
    
    // Render Finished
    finished.forEach((record, index) => {
      const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
      const displayTime = record.time.toFixed(2) + 's';
      
      html += `
        <div class="leaderboard-row finished">
          <span class="rank-col rank-number ${medalClass}">${index + 1}</span>
          <span class="name-col">
            <span class="marble-badge" style="background-color: ${record.color}"></span>
            ${record.emoji} ${record.name}
          </span>
          <span class="status-col">${displayTime}</span>
        </div>
      `;
    });
    
    // Render Active Racers
    unfinished.forEach((m, index) => {
      const rank = finished.length + index + 1;
      const medalClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
      
      html += `
        <div class="leaderboard-row">
          <span class="rank-col rank-number ${medalClass}">${rank}</span>
          <span class="name-col">
            <span class="marble-badge" style="background-color: ${m.marbleColor}"></span>
            ${m.marbleEmoji} ${m.marbleName}
          </span>
          <span class="status-col">Racing...</span>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  // --- Sharing and explore maps loading ---
  updateCloudStatus() {
    const badge = document.getElementById('firebase-status-badge');
    const cloudBtn = document.getElementById('btn-open-firebase-config');
    
    if (isFirebaseConnected()) {
      badge.className = 'badge badge-online';
      badge.textContent = 'Cloud Connected';
      cloudBtn.textContent = 'Change DB Sync';
    } else {
      badge.className = 'badge badge-offline';
      badge.textContent = 'Offline Storage';
      cloudBtn.textContent = 'Setup Cloud Sync';
    }
  }

  async refreshMapsList() {
    const listEl = document.getElementById('shared-maps-list');
    listEl.innerHTML = '<div class="no-data-msg">Loading tracks...</div>';
    
    try {
      this.loadedMaps = await fetchAllMaps();
      this.renderMapsList(this.loadedMaps);
    } catch (e) {
      listEl.innerHTML = '<div class="no-data-msg">Error loading map library.</div>';
    }
  }

  renderMapsList(maps) {
    const listEl = document.getElementById('shared-maps-list');
    if (maps.length === 0) {
      listEl.innerHTML = '<div class="no-data-msg">No maps found. Be the first to build a map!</div>';
      return;
    }
    
    let html = '';
    maps.forEach((map) => {
      const dateStr = new Date(map.createdAt).toLocaleDateString();
      const dbTag = map.isSample ? '[Sample]' : (map.synced ? '[Cloud]' : '[Local]');
      
      html += `
        <div class="map-card" data-id="${map.id}">
          <div class="map-info">
            <span class="map-card-name">${map.name} <small style="color: var(--text-muted); font-size: 10px;">${dbTag}</small></span>
            <span class="map-card-creator">By ${map.creator} | ${dateStr}</span>
          </div>
          <div class="map-card-actions">
            <button class="like-btn" data-id="${map.id}" title="Like this track">
              ❤️ <span class="like-count">${map.likes || 0}</span>
            </button>
            <button class="action-btn primary-btn btn-load-map" data-id="${map.id}">
              Play Track
            </button>
          </div>
        </div>
      `;
    });
    
    listEl.innerHTML = html;
    
    // Bind buttons in list
    listEl.querySelectorAll('.btn-load-map').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const targetMap = this.loadedMaps.find(m => m.id === id);
        if (targetMap) {
          this.simulator.loadMap(targetMap);
          // Pause and reset UI elements
          this.simulator.isPaused = true;
          document.body.classList.remove('pause-mode');
          
          const playBtn = document.getElementById('btn-play');
          playBtn.innerHTML = '<span class="play-icon"></span> Play Race';
          playBtn.classList.add('pulse-border');
          
          this.updateLeaderboard(true);
          this.renderer.panX = 0;
          this.renderer.panY = 0;
          this.renderer.zoom = 1.0;
          
          this.showToast(`Track Loaded: "${targetMap.name}"`);
        }
      });
    });

    listEl.querySelectorAll('.like-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const success = await likeMap(id);
        if (success) {
          btn.classList.add('liked');
          const countEl = btn.querySelector('.like-count');
          countEl.textContent = parseInt(countEl.textContent) + 1;
        } else {
          this.showToast("You've already liked this track!");
        }
      });
    });
  }

  filterMapsList(query) {
    if (!this.loadedMaps) return;
    const filtered = this.loadedMaps.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.creator.toLowerCase().includes(query)
    );
    this.renderMapsList(filtered);
  }

  // --- Dynamic visual indicators (Toasts) ---
  showToast(message) {
    // Remove existing Toast
    const oldToast = document.querySelector('.toast-hud');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-hud glass-panel';
    toast.style.position = 'absolute';
    toast.style.top = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '200';
    toast.style.padding = '10px 24px';
    toast.style.borderRadius = '30px';
    toast.style.border = '1px solid rgba(0, 242, 254, 0.3)';
    toast.style.boxShadow = '0 0 15px rgba(0, 242, 254, 0.2)';
    toast.style.pointerEvents = 'none';
    toast.style.fontSize = '13px';
    toast.style.color = '#fff';
    toast.style.fontWeight = '600';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Fade out after 2.5s
    setTimeout(() => {
      toast.style.transition = 'opacity 0.5s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  }
}
