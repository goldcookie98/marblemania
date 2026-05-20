import { 
  initFirebase, 
  isFirebaseConnected, 
  clearFirebaseConfig, 
  saveMap, 
  fetchAllMaps, 
  likeMap 
} from './firebase-db';

export const MARBLE_PRESETS = {
  classic: Array.from({ length: 50 }, (_, i) => {
    const hue = (i * 137.5) % 360;
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
    
    // Screens routing state: menu, browser, arena, editor
    this.currentScreen = 'menu';
    
    // Editor State variables
    this.currentTool = 'wall'; 
    this.brushSize = 12;
    this.activeDrawingPath = null;
    this.isDrawing = false;
    this.isPanning = false;

    this.canvas = renderer.canvas;
    
    this.initEventListeners();
    this.updateCloudStatus();
    this.refreshMapsList();
    
    // Set initial screen state
    this.changeScreen('menu');
  }

  // Handle routing flow
  changeScreen(screenName) {
    this.currentScreen = screenName;
    
    // 1. Manage visibility classes
    const screens = ['menu', 'browser', 'arena', 'editor'];
    screens.forEach((s) => {
      const el = document.getElementById(`screen-${s}`);
      if (s === screenName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // 2. Manage instruction HUD overlay
    const hudInst = document.getElementById('canvas-hud-instructions');
    if (screenName === 'editor') {
      hudInst.classList.remove('hidden');
      hudInst.querySelector('.edit-hud-only').classList.remove('hidden');
      hudInst.querySelector('.pan-hud-only').classList.add('hidden');
    } else if (screenName === 'arena') {
      hudInst.classList.remove('hidden');
      hudInst.querySelector('.edit-hud-only').classList.add('hidden');
      hudInst.querySelector('.pan-hud-only').classList.remove('hidden');
    } else {
      hudInst.classList.add('hidden');
    }

    // 3. Clear drawing states
    this.activeDrawingPath = null;
    this.isDrawing = false;
    this.isPanning = false;
    
    // 4. Configure physics & rendering state depending on target screen
    if (screenName === 'menu') {
      this.renderer.isTrackingLead = false;
      this.renderer.zoom = 1.0;
      this.renderer.panX = 0;
      this.renderer.panY = 0;
      
      // Load sample-pachinko in background and spawn automated background marbles
      this.loadBackgroundDemo();
    } else if (screenName === 'browser') {
      // Keep menu physics running softly behind list
      this.renderer.isTrackingLead = false;
    } else if (screenName === 'editor') {
      // Sandbox: clear marbles and pause physics so drawing is static
      this.simulator.isPaused = true;
      this.simulator.marbles.forEach(m => Matter.World.remove(this.simulator.world, m));
      this.simulator.marbles = [];
      this.simulator.finishedMarbles = [];
      this.renderer.isTrackingLead = false;
      
      // Load empty custom layout or preserve current drawings if any
      if (this.simulator.staticElements.filter(e => e.type !== 'spawner').length === 0) {
        this.simulator.clearAll();
      }
    } else if (screenName === 'arena') {
      // Ready to race
      this.simulator.isPaused = true;
      this.renderer.isTrackingLead = true; // Auto camera on
      
      // Reset play button state
      const playBtn = document.getElementById('btn-play');
      playBtn.innerHTML = '<span class="play-icon"></span> Play Race';
      playBtn.classList.add('pulse-border');
      
      this.triggerSpawn();
    }
  }

  // Spawns low count marbles to create animated backdrop in main menu
  async loadBackgroundDemo() {
    this.simulator.isPaused = false;
    this.simulator.physicsSpeed = 1.0;
    
    // Fetch and load Pachinko track silently
    const maps = await fetchAllMaps();
    const pachinko = maps.find(m => m.id === 'sample-pachinko');
    if (pachinko) {
      this.simulator.loadMap(pachinko);
      // Spawn 12 demo marbles
      this.simulator.spawnMarbles(12, MARBLE_PRESETS.classic);
      
      // Periodically loop them automatically in menu screen
      if (this.bgCheckInterval) clearInterval(this.bgCheckInterval);
      this.bgCheckInterval = setInterval(() => {
        if (this.currentScreen !== 'menu' && this.currentScreen !== 'browser') {
          clearInterval(this.bgCheckInterval);
          return;
        }
        
        // If all marbles finished or fell past screen, respawn them
        const activeCount = this.simulator.marbles.filter(m => !m.finished).length;
        if (activeCount === 0 || this.simulator.finishedMarbles.length >= 10) {
          this.simulator.spawnMarbles(12, MARBLE_PRESETS.classic);
        }
      }, 5000);
    }
  }

  initEventListeners() {
    const { canvas } = this;
    
    // --- Canvas Controls ---
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    
    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', () => this.handleMouseUp());

    // --- Double-Click Lead Track Toggle ---
    canvas.addEventListener('dblclick', () => {
      if (this.currentScreen === 'arena') {
        this.renderer.isTrackingLead = !this.renderer.isTrackingLead;
        const indicator = document.getElementById('camera-track-indicator');
        if (this.renderer.isTrackingLead) {
          indicator.textContent = '🎥 Tracking Lead';
          indicator.style.opacity = '1';
          this.showToast("Camera tracking enabled");
        } else {
          indicator.textContent = '🎥 Free Camera';
          indicator.style.opacity = '0.6';
          this.showToast("Free camera mode");
        }
      }
    });

    // --- Screen: Main Menu Navigation ---
    document.getElementById('menu-btn-play').addEventListener('click', () => {
      this.changeScreen('browser');
      this.refreshMapsList();
    });
    
    document.getElementById('menu-btn-build').addEventListener('click', () => {
      this.changeScreen('editor');
    });
    
    document.getElementById('menu-btn-cloud').addEventListener('click', () => {
      // Trigger modal open
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
      document.getElementById('firebase-modal').classList.remove('hidden');
    });

    // --- Screen: Play Browser Navigation ---
    document.getElementById('browser-btn-back').addEventListener('click', () => {
      this.changeScreen('menu');
    });
    
    document.getElementById('btn-refresh-maps').addEventListener('click', () => {
      this.refreshMapsList();
    });

    document.getElementById('map-search').addEventListener('input', (e) => {
      this.filterMapsList(e.target.value.toLowerCase());
    });

    // --- Screen: Race Arena Navigation ---
    document.getElementById('arena-btn-back').addEventListener('click', () => {
      this.changeScreen('menu');
    });

    // --- Screen: Editor Navigation & Modals ---
    document.getElementById('editor-btn-back').addEventListener('click', () => {
      if (confirm("Any unsaved drawing paths will be lost. Return to Main Menu?")) {
        this.changeScreen('menu');
      }
    });

    const saveModal = document.getElementById('save-map-modal');
    document.getElementById('editor-btn-save-trigger').addEventListener('click', () => {
      const elements = this.simulator.exportMap();
      if (elements.filter(el => el.type !== 'spawner').length === 0) {
        alert("Cannot save an empty map. Draw some walls first!");
        return;
      }
      saveModal.classList.remove('hidden');
    });

    document.getElementById('save-modal-close').addEventListener('click', () => {
      saveModal.classList.add('hidden');
    });
    
    document.getElementById('btn-save-cancel').addEventListener('click', () => {
      saveModal.classList.add('hidden');
    });

    document.getElementById('save-map-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const mapName = document.getElementById('map-name').value.trim();
      const creatorName = document.getElementById('map-creator').value.trim();
      const elements = this.simulator.exportMap();

      this.showToast("Saving track...");
      try {
        await saveMap(mapName, creatorName, elements);
        this.showToast("Track saved successfully!");
        
        saveModal.classList.add('hidden');
        document.getElementById('map-name').value = '';
        
        // Take them back to maps browser to see it
        this.changeScreen('browser');
        this.refreshMapsList();
      } catch (err) {
        this.showToast("Failed to save track.");
      }
    });

    // --- Editor Drawing Brush selection ---
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
      });
    });

    const brushSlider = document.getElementById('brush-size');
    const brushSizeVal = document.getElementById('brush-size-val');
    brushSlider.addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
      brushSizeVal.textContent = `${this.brushSize}px`;
    });

    document.getElementById('btn-undo').addEventListener('click', () => {
      this.simulator.undo();
    });
    
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (confirm("Clear all elements on this custom layout?")) {
        this.simulator.clearAll();
        this.renderer.panX = 0;
        this.renderer.panY = 0;
        this.renderer.zoom = 1.0;
      }
    });

    // --- Simulation Controls ---
    const playBtn = document.getElementById('btn-play');
    playBtn.addEventListener('click', () => {
      this.simulator.isPaused = !this.simulator.isPaused;
      if (this.simulator.isPaused) {
        playBtn.innerHTML = '<span class="play-icon"></span> Play Race';
        playBtn.classList.add('pulse-border');
      } else {
        playBtn.innerHTML = '<span class="play-icon"></span> Pause';
        playBtn.classList.remove('pulse-border');
        
        // Reset and spawn if all finished
        if (this.simulator.marbles.length === 0) {
          this.triggerSpawn();
        }
      }
    });

    document.getElementById('btn-reset-marbles').addEventListener('click', () => {
      this.triggerSpawn();
      if (this.simulator.isPaused) {
        playBtn.click();
      }
    });

    // Sliders
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

    // --- Firebase configuration modal ---
    const fbModal = document.getElementById('firebase-modal');
    document.getElementById('modal-close').addEventListener('click', () => {
      fbModal.classList.add('hidden');
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
        fbModal.classList.add('hidden');
        this.showToast("Database linked successfully!");
      } catch (error) {
        alert("Failed to link Firebase config: " + error.message);
      }
    });

    document.getElementById('btn-fb-clear').addEventListener('click', () => {
      if (confirm("Clear Firebase configuration? Local storage will be activated instead.")) {
        clearFirebaseConfig();
        this.updateCloudStatus();
        this.refreshMapsList();
        document.getElementById('firebase-config-form').reset();
        fbModal.classList.add('hidden');
        this.showToast("Config cleared.");
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
  }

  // --- Drag, Panning, and Zoom coordinates ---
  getMousePosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handleMouseDown(e) {
    // Blocking clicks on Main Menu and Browser
    if (this.currentScreen === 'menu' || this.currentScreen === 'browser') return;
    
    const mousePos = this.getMousePosition(e);
    
    // Right click OR Pan Tool activates manual scroll
    if (e.button === 2 || this.currentTool === 'pan' || this.currentScreen === 'arena') {
      this.isPanning = true;
      this.lastPanMouseX = e.clientX;
      this.lastPanMouseY = e.clientY;
      this.renderer.isTrackingLead = false; // Disable camera tracking during manual drag
      
      // Update camera indicator in HUD
      if (this.currentScreen === 'arena') {
        const ind = document.getElementById('camera-track-indicator');
        ind.textContent = '🎥 Free Camera';
        ind.style.opacity = '0.6';
      }
      return;
    }

    // Left click on Build Editor Mode
    if (e.button === 0 && this.currentScreen === 'editor') {
      const worldPos = this.renderer.screenToWorld(mousePos.x, mousePos.y);
      
      if (this.currentTool === 'spawner') {
        this.simulator.setSpawner(worldPos.x, worldPos.y);
        this.showToast("Spawner repositioned");
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
    if (this.currentScreen === 'menu' || this.currentScreen === 'browser') return;
    
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
      const dist = Math.hypot(worldPos.x - lastPoint.x, worldPos.y - lastPoint.y);
      
      if (this.currentTool === 'eraser') {
        this.eraseAtPosition(worldPos);
        points.push(worldPos);
      } else if (dist > 6) {
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

  handleTouchStart(e) {
    if (this.currentScreen === 'menu' || this.currentScreen === 'browser') return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      });
      this.canvas.dispatchEvent(mouseEvent);
    } else if (e.touches.length === 2) {
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
    if (this.currentScreen === 'menu' || this.currentScreen === 'browser') return;
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
    if (this.currentScreen === 'menu' || this.currentScreen === 'browser') return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const mousePos = this.getMousePosition(e);
    const mouseWorld = this.renderer.screenToWorld(mousePos.x, mousePos.y);
    
    const oldZoom = this.renderer.zoom;
    this.renderer.zoom = Math.min(Math.max(this.renderer.zoom * zoomFactor, 0.2), 3.5);
    
    const zoomDiff = this.renderer.zoom - oldZoom;
    this.renderer.panX -= (mouseWorld.x - this.canvas.width / 2) * zoomDiff;
    this.renderer.panY -= (mouseWorld.y - this.canvas.height / 2) * zoomDiff;
  }

  eraseAtPosition(worldPos) {
    const elements = this.simulator.staticElements;
    const eraseRadius = this.brushSize + 10;
    
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'spawner') continue;
      
      let hits = false;
      for (const p of el.points) {
        if (Math.hypot(p.x - worldPos.x, p.y - worldPos.y) < eraseRadius) {
          hits = true;
          break;
        }
      }
      
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
        if (el.bodies) {
          el.bodies.forEach(b => Matter.World.remove(this.simulator.world, b));
        }
        elements.splice(i, 1);
      }
    }
  }

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

  // --- Leaderboards Renders ---
  updateLeaderboard(forceReset = false) {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;
    
    if (forceReset || (this.simulator.marbles.length === 0)) {
      listEl.innerHTML = '<div class="no-data-msg">Race not started. Click "Play Race" to spawn marbles!</div>';
      return;
    }

    const finished = [...this.simulator.finishedMarbles];
    const unfinished = this.simulator.marbles
      .filter(m => !m.finished)
      .sort((a, b) => b.position.y - a.position.y);
    
    let html = '';
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

  // --- Cloud Badging ---
  updateCloudStatus() {
    const menuBadge = document.getElementById('menu-firebase-badge');
    const syncBtn = document.getElementById('menu-btn-cloud');
    
    if (isFirebaseConnected()) {
      if (menuBadge) {
        menuBadge.className = 'badge badge-online';
        menuBadge.textContent = 'Cloud Sync On';
      }
      if (syncBtn) {
        syncBtn.innerHTML = '<span class="btn-icon">⚙️</span> Cloud Connected';
      }
    } else {
      if (menuBadge) {
        menuBadge.className = 'badge badge-offline';
        menuBadge.textContent = 'Offline';
      }
      if (syncBtn) {
        syncBtn.innerHTML = '<span class="btn-icon">⚙️</span> Connect Cloud DB';
      }
    }
  }

  async refreshMapsList() {
    const listEl = document.getElementById('shared-maps-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="no-data-msg">Loading tracks from database...</div>';
    
    try {
      this.loadedMaps = await fetchAllMaps();
      this.renderMapsList(this.loadedMaps);
    } catch (e) {
      listEl.innerHTML = '<div class="no-data-msg">Error loading track library.</div>';
    }
  }

  renderMapsList(maps) {
    const listEl = document.getElementById('shared-maps-list');
    if (!listEl) return;
    if (maps.length === 0) {
      listEl.innerHTML = '<div class="no-data-msg">No tracks found. Clear the sandbox and draw your own!</div>';
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
            <button class="like-btn" data-id="${map.id}">
              ❤️ <span class="like-count">${map.likes || 0}</span>
            </button>
            <button class="action-btn primary-btn btn-load-map" data-id="${map.id}">
              Load & Race
            </button>
          </div>
        </div>
      `;
    });
    
    listEl.innerHTML = html;
    
    // Bind click load & play actions
    listEl.querySelectorAll('.btn-load-map').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const targetMap = this.loadedMaps.find(m => m.id === id);
        if (targetMap) {
          // Clear background intervals
          if (this.bgCheckInterval) clearInterval(this.bgCheckInterval);
          
          this.simulator.loadMap(targetMap);
          document.getElementById('arena-track-title').textContent = targetMap.name;
          
          // Switch to Race Simulator HUD
          this.changeScreen('arena');
          
          this.showToast(`Track Loaded: "${targetMap.name}"`);
        }
      });
    });

    listEl.querySelectorAll('.like-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
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

  showToast(message) {
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
    
    setTimeout(() => {
      toast.style.transition = 'opacity 0.5s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  }
}
