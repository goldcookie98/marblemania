import { 
  initFirebase, 
  isFirebaseConnected, 
  clearFirebaseConfig, 
  saveMap, 
  fetchAllMaps, 
  likeMap 
} from './firebase-db';

// The 78 custom marbles list from reference sheet
export const CUSTOM_MARBLES = [
  // Row 1
  { name: 'Amber', color: '#FF9F00', effect: 'solid' },
  { name: 'Aqua', color: '#00E5FF', effect: 'solid' },
  { name: 'Aquamarine', color: '#76FF03', effect: 'solid' },
  { name: 'Azure', color: '#2979FF', effect: 'solid' },
  { name: 'Beige', color: '#FFD180', effect: 'solid' },
  { name: 'Black', color: '#000000', effect: 'solid' },
  { name: 'Blossom', color: '#FF80AB', effect: 'solid' },
  { name: 'Blue', color: '#2962FF', effect: 'solid' },
  { name: 'Brick', color: '#D84315', effect: 'solid' },
  { name: 'Bronze', color: '#A1887F', effect: 'solid' },
  { name: 'Brown', color: '#6D4C41', effect: 'solid' },
  { name: 'Burgundy', color: '#880E4F', effect: 'solid' },
  { name: 'Cerulean', color: '#0091EA', effect: 'solid' },
  { name: 'Charcoal', color: '#37474F', effect: 'solid' },
  { name: 'Chartreuse', color: '#AEEA00', effect: 'solid' },
  { name: 'Clover', color: '#00E676', effect: 'solid' },
  
  // Row 2
  { name: 'Cobalt', color: '#1A237E', effect: 'solid' },
  { name: 'Cornflower', color: '#82B1FF', effect: 'solid' },
  { name: 'Cream', color: '#FFF8E1', effect: 'solid' },
  { name: 'Crimson', color: '#D50000', effect: 'solid' },
  { name: 'Cyprus', color: '#004D40', effect: 'solid' },
  { name: 'Ebony', color: '#212121', effect: 'solid' },
  { name: 'Fern', color: '#4CAF50', effect: 'solid' },
  { name: 'Forest', color: '#1B5E20', effect: 'solid' },
  { name: 'Fuchsia', color: '#FF00FF', effect: 'solid' },
  { name: 'Gold', color: '#FFD700', effect: 'solid' },
  { name: 'Goldenrod', color: '#FFA000', effect: 'solid' },
  { name: 'Green', color: '#008000', effect: 'solid' },
  { name: 'Ice', color: '#E0F7FA', effect: 'solid' },
  { name: 'Indigo', color: '#303F9F', effect: 'solid' },
  { name: 'Ivory', color: '#FFFFF0', effect: 'solid' },
  { name: 'Jade', color: '#00C853', effect: 'solid' },

  // Row 3
  { name: 'Khaki', color: '#C0CA33', effect: 'solid' },
  { name: 'Lemon', color: '#FFEA00', effect: 'solid' },
  { name: 'Lime', color: '#00FF00', effect: 'solid' },
  { name: 'Magenta', color: '#E91E63', effect: 'solid' },
  { name: 'Mahogany', color: '#5D4037', effect: 'solid' },
  { name: 'Maroon', color: '#800000', effect: 'solid' },
  { name: 'Mauve', color: '#E040FB', effect: 'solid' },
  { name: 'Midnight', color: '#0A192F', effect: 'solid' },
  { name: 'Mint', color: '#B2DFDB', effect: 'solid' },
  { name: 'Moss', color: '#558B2F', effect: 'solid' },
  { name: 'Navy', color: '#000080', effect: 'solid' },
  { name: 'Obsidian', color: '#121212', effect: 'solid' },
  { name: 'Olive', color: '#808000', effect: 'solid' },
  { name: 'Orchid', color: '#BA68C8', effect: 'solid' },
  { name: 'Peach', color: '#FFCC80', effect: 'solid' },
  { name: 'Periwinkle', color: '#B39DDB', effect: 'solid' },

  // Row 4
  { name: 'Pink', color: '#F48FB1', effect: 'solid' },
  { name: 'Platinum', color: '#CFD8DC', effect: 'solid' },
  { name: 'Purple', color: '#800080', effect: 'solid' },
  { name: 'Royal Blue', color: '#2962FF', effect: 'solid' },
  { name: 'Royal Purple', color: '#6200EA', effect: 'solid' },
  { name: 'Salmon', color: '#FF8A80', effect: 'solid' },
  { name: 'Silver', color: '#C0C0C0', effect: 'solid' },
  { name: 'Sky', color: '#80DEEA', effect: 'solid' },
  { name: 'Skyan', color: '#00B0FF', effect: 'solid' },
  { name: 'Strawberry', color: '#FF5252', effect: 'solid' },
  { name: 'Tan', color: '#BCAAA4', effect: 'solid' },
  { name: 'Tangerine', color: '#FF6D00', effect: 'solid' },
  { name: 'Teal', color: '#008080', effect: 'solid' },
  { name: 'Tundra', color: '#90A4AE', effect: 'solid' },
  { name: 'Turquoise', color: '#40E0D0', effect: 'solid' },
  { name: 'Violet', color: '#EE82EE', effect: 'solid' },

  // Row 5 (Textures/Effects)
  { name: 'Wheat', color: '#F5DEB3', effect: 'solid' },
  { name: 'T. Orange', color: 'rgba(255, 109, 0, 0.45)', effect: 'translucent' },
  { name: 'T. Yellow', color: 'rgba(255, 234, 0, 0.45)', effect: 'translucent' },
  { name: 'T. Lime', color: 'rgba(0, 255, 0, 0.45)', effect: 'translucent' },
  { name: 'T. Purple', color: 'rgba(128, 0, 128, 0.45)', effect: 'translucent' },
  { name: 'T. Magenta', color: 'rgba(233, 30, 99, 0.45)', effect: 'translucent' },
  { name: 'T. Black', color: 'rgba(0, 0, 0, 0.5)', effect: 'translucent' },
  { name: 'T. Gray', color: 'rgba(128, 128, 128, 0.45)', effect: 'translucent' },
  { name: 'T. White', color: 'rgba(255, 255, 255, 0.55)', effect: 'translucent' },
  { name: 'Light Rainbow', color: '', effect: 'rainbow' },
  { name: 'T. Rainbow', color: '', effect: 't_rainbow' },
  { name: 'Dull Rainbow', color: '', effect: 'dull_rainbow' },
  { name: 'Blurred', color: '#00F2FE', effect: 'blurred' },
  { name: 'RGB', color: '', effect: 'rgb' }
];

export class UIManager {
  constructor(simulator, renderer) {
    this.simulator = simulator;
    this.renderer = renderer;
    
    // Screens routing state: menu, browser, arena, editor
    this.currentScreen = 'menu';
    
    // Selected Player racer configs
    this.selectedRacer = CUSTOM_MARBLES[1]; // Default to 'Aqua'
    this.autoTrackRacer = true;

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
    this.buildRacerPickerList();
    
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

    // Hide overlays by default
    document.getElementById('screen-racer-picker').classList.add('hidden');

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
      this.renderer.playerRacerId = null;
      
      // Load empty custom layout or preserve drawings
      if (this.simulator.staticElements.filter(e => e.type !== 'spawner').length === 0) {
        this.simulator.clearAll();
      }
    } else if (screenName === 'arena') {
      // Ready to race
      this.simulator.isPaused = true;
      this.renderer.isTrackingLead = this.autoTrackRacer; 
      
      // Reset play button state
      const playBtn = document.getElementById('btn-play');
      playBtn.innerHTML = '<span class="play-icon"></span> Play Race';
      playBtn.classList.add('pulse-border');
      
      this.updateRacerHudDisplay();
      this.triggerSpawn();
    }
  }

  // Spawns low count marbles to create animated backdrop in main menu
  async loadBackgroundDemo() {
    this.simulator.isPaused = false;
    this.simulator.physicsSpeed = 1.0;
    this.renderer.playerRacerId = null; // Clear arrow highlights in main menu
    
    // Fetch and load Pachinko track silently
    const maps = await fetchAllMaps();
    const pachinko = maps.find(m => m.id === 'sample-pachinko');
    if (pachinko) {
      this.simulator.loadMap(pachinko);
      
      // Just pick random solids for menu backdrop
      const menuPreset = CUSTOM_MARBLES.filter(m => m.effect === 'solid').slice(0, 15);
      this.simulator.spawnMarbles(15, menuPreset);
      
      // Periodically loop them automatically in menu screen
      if (this.bgCheckInterval) clearInterval(this.bgCheckInterval);
      this.bgCheckInterval = setInterval(() => {
        if (this.currentScreen !== 'menu' && this.currentScreen !== 'browser') {
          clearInterval(this.bgCheckInterval);
          return;
        }
        
        const activeCount = this.simulator.marbles.filter(m => !m.finished).length;
        if (activeCount === 0 || this.simulator.finishedMarbles.length >= 10) {
          this.simulator.spawnMarbles(15, menuPreset);
        }
      }, 5000);
    }
  }

  // Generate CSS backgrounds for the 78 marble cards
  getCssBackground(marble) {
    if (marble.effect === 'solid' || marble.effect === 'translucent') {
      return marble.color;
    }
    if (marble.effect === 'rainbow') {
      return 'linear-gradient(to right, red, orange, yellow, green, blue, violet)';
    }
    if (marble.effect === 't_rainbow') {
      return 'linear-gradient(to right, rgba(255,0,0,0.5), rgba(0,255,0,0.5), rgba(0,0,255,0.5))';
    }
    if (marble.effect === 'dull_rainbow') {
      return 'linear-gradient(to right, #e8a7a1, #e2c29d, #e5e5a2, #a1dca2, #9ecce2, #ccaee5)';
    }
    if (marble.effect === 'rgb') {
      return 'conic-gradient(red 120deg, green 120deg 240deg, blue 240deg)';
    }
    if (marble.effect === 'blurred') {
      return 'radial-gradient(circle, #00f2fe 30%, transparent 80%)';
    }
    return '#fff';
  }

  // Build Grid items for the 78 marbles picker
  buildRacerPickerList() {
    const gridEl = document.getElementById('racer-grid-list');
    if (!gridEl) return;
    
    gridEl.innerHTML = '';
    
    CUSTOM_MARBLES.forEach((marble) => {
      const card = document.createElement('button');
      card.className = 'racer-card';
      card.type = 'button';
      card.title = `Select ${marble.name}`;
      
      const circle = document.createElement('div');
      circle.className = 'racer-circle';
      circle.style.background = this.getCssBackground(marble);
      if (marble.effect === 'blurred') {
        circle.style.filter = 'blur(2px)';
      }
      
      const label = document.createElement('span');
      label.className = 'racer-name-label';
      label.textContent = marble.name;
      
      card.appendChild(circle);
      card.appendChild(label);
      
      card.addEventListener('click', () => {
        this.selectedRacer = marble;
        document.getElementById('screen-racer-picker').classList.add('hidden');
        this.changeScreen('arena');
        this.showToast(`Selected Ball: ${marble.name}`);
      });
      
      gridEl.appendChild(card);
    });
  }

  updateRacerHudDisplay() {
    const nameEl = document.getElementById('chosen-ball-name');
    const previewEl = document.getElementById('chosen-ball-preview');
    
    if (nameEl && previewEl) {
      nameEl.textContent = this.selectedRacer.name;
      previewEl.style.background = this.getCssBackground(this.selectedRacer);
      if (this.selectedRacer.effect === 'blurred') {
        previewEl.style.filter = 'blur(1.5px)';
      } else {
        previewEl.style.filter = '';
      }
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

    // --- Lead/Racer track toggle ---
    document.getElementById('chk-track-racer').addEventListener('change', (e) => {
      this.autoTrackRacer = e.target.checked;
      this.renderer.isTrackingLead = this.autoTrackRacer;
    });

    // Double click to toggle free/tracking
    canvas.addEventListener('dblclick', () => {
      if (this.currentScreen === 'arena') {
        this.autoTrackRacer = !this.autoTrackRacer;
        document.getElementById('chk-track-racer').checked = this.autoTrackRacer;
        this.renderer.isTrackingLead = this.autoTrackRacer;
        
        const indicator = document.getElementById('camera-track-indicator');
        if (this.renderer.isTrackingLead) {
          indicator.textContent = '🎥 Tracking My Ball';
          indicator.style.opacity = '1';
          this.showToast("Tracking active");
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

    // --- Screen: Editor Navigation ---
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
        
        if (this.simulator.marbles.length === 0) {
          this.triggerSpawn();
        }
      }
    });

    document.getElementById('btn-reset-marbles').addEventListener('click', () => {
      // Pop the chooser screen
      document.getElementById('screen-racer-picker').classList.remove('hidden');
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
    const opponentCount = parseInt(document.getElementById('marble-count').value);
    
    // Choose random unique opponents from the custom list
    const filteredList = CUSTOM_MARBLES.filter(m => m.name !== this.selectedRacer.name);
    
    // Shuffle and slice opponents
    const shuffled = [...filteredList].sort(() => 0.5 - Math.random());
    const selectedOpponents = shuffled.slice(0, opponentCount);
    
    // Put user racer at index 0 (with isPlayer tag)
    const racerConfigs = [
      { ...this.selectedRacer, isPlayer: true }
    ].concat(selectedOpponents.map(o => ({ ...o, isPlayer: false })));
    
    this.simulator.spawnMarbles(racerConfigs.length, racerConfigs);
    
    // Link player body ID back to renderer for arrow highlighting and camera track
    const playerBody = this.simulator.marbles.find(m => m.isPlayer);
    if (playerBody) {
      this.renderer.playerRacerId = playerBody.id;
    }
    
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
    if (this.currentScreen === 'menu' || this.currentScreen === 'browser' || !document.getElementById('screen-racer-picker').classList.contains('hidden')) return;
    
    const mousePos = this.getMousePosition(e);
    
    if (e.button === 2 || this.currentTool === 'pan' || this.currentScreen === 'arena') {
      this.isPanning = true;
      this.lastPanMouseX = e.clientX;
      this.lastPanMouseY = e.clientY;
      this.renderer.isTrackingLead = false; 
      
      if (this.currentScreen === 'arena') {
        this.autoTrackRacer = false;
        document.getElementById('chk-track-racer').checked = false;
        
        const ind = document.getElementById('camera-track-indicator');
        ind.textContent = '🎥 Free Camera';
        ind.style.opacity = '0.6';
      }
      return;
    }

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
      const isMyBall = record.name === this.selectedRacer.name;
      
      html += `
        <div class="leaderboard-row finished ${isMyBall ? 'my-racer' : ''}">
          <span class="rank-col rank-number ${medalClass}">${index + 1}</span>
          <span class="name-col">
            <span class="marble-badge" style="background-color: ${record.color}"></span>
            ${record.name} ${isMyBall ? '(You)' : ''}
          </span>
          <span class="status-col">${displayTime}</span>
        </div>
      `;
    });
    
    unfinished.forEach((m, index) => {
      const rank = finished.length + index + 1;
      const medalClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
      const isMyBall = m.marbleName === this.selectedRacer.name;
      
      html += `
        <div class="leaderboard-row ${isMyBall ? 'my-racer' : ''}">
          <span class="rank-col rank-number ${medalClass}">${rank}</span>
          <span class="name-col">
            <span class="marble-badge" style="background-color: ${m.marbleColor}"></span>
            ${m.marbleName} ${isMyBall ? '(You)' : ''}
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
          if (this.bgCheckInterval) clearInterval(this.bgCheckInterval);
          
          this.simulator.loadMap(targetMap);
          document.getElementById('arena-track-title').textContent = targetMap.name;
          
          // Pop the Racer selector modal overlay
          document.getElementById('screen-racer-picker').classList.remove('hidden');
          
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
