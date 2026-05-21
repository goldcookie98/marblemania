import Matter from 'matter-js';
import {
  saveMap,
  fetchAllMaps
} from './firebase-db';
import { MultiplayerClient } from './multiplayer';

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
  { name: 'Red', color: '#E53935', effect: 'solid' },
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
    this.selectedRacer = CUSTOM_MARBLES.find(m => m.name === 'Red') || CUSTOM_MARBLES[0];
    this.autoTrackRacer = true;

    // Editor State variables
    this.currentTool = 'wall';
    this.currentShape = 'line';
    this.brushSize = 12;
    this.activeDrawingPath = null;
    this.isDrawing = false;
    this.isPanning = false;

    this.canvas = renderer.canvas;
    
    this.initEventListeners();
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
    
    // Auto-fit camera to canonical arena on every screen change
    this.renderer.isTrackingLead = false;
    this.renderer.fitArena();
    this.simulator.menuMode = (screenName === 'menu' || screenName === 'browser');

    // 4. Configure physics & rendering state depending on target screen
    if (screenName === 'menu') {
      // Load sample-pachinko in background and spawn automated background marbles
      this.loadBackgroundDemo();
    } else if (screenName === 'browser') {
      // Keep menu physics running softly behind list
    } else if (screenName === 'editor') {
      // Sandbox: clear marbles and pause physics so drawing is static
      this.simulator.setPaused(true);
      this.simulator.marbles.forEach(m => Matter.World.remove(this.simulator.world, m));
      this.simulator.marbles = [];
      this.simulator.finishedMarbles = [];
      this.renderer.isTrackingLead = false;
      this.renderer.playerRacerId = null;
      
      // Load empty custom layout or preserve drawings
      if (this.simulator.staticElements.filter(e => e.type !== 'spawner' && e.type !== 'arena_boundary').length === 0) {
        this.simulator.clearAll();
      }
    } else if (screenName === 'arena') {
      // Ready to race
      this.simulator.setPaused(true);

      // Reset play button state
      const playBtn = document.getElementById('btn-play');
      playBtn.innerHTML = '<span class="play-icon"></span> Play Race';
      playBtn.classList.add('pulse-border');
      
      this.updateRacerHudDisplay();
      this.triggerSpawn();
    }
  }

  // Build a procedurally centered menu backdrop sized to the canonical arena
  buildMenuBackgroundMap() {
    const w = this.renderer.worldWidth;
    const h = this.renderer.worldHeight;
    const cx = w / 2;

    const elements = [
      { type: 'spawner', x: cx, y: 70, radius: 18 },
      // Funnel slants near top
      { type: 'wall', points: [{ x: cx - 220, y: 180 }, { x: cx - 60, y: 260 }], thickness: 12 },
      { type: 'wall', points: [{ x: cx + 220, y: 180 }, { x: cx + 60, y: 260 }], thickness: 12 },
      // Three rows of pegs around vertical center
      ...[0, 1, 2].flatMap((row) => {
        const y = h * 0.42 + row * 70;
        const xs = row % 2 === 0
          ? [cx - 180, cx - 60, cx + 60, cx + 180]
          : [cx - 240, cx - 120, cx, cx + 120, cx + 240];
        return xs.map((x) => ({
          type: 'shape', category: 'wall', shape: 'circle', geom: { cx: x, cy: y, r: 10 }
        }));
      }),
      // Bottom funnels into goal
      { type: 'wall', points: [{ x: cx - 320, y: h - 200 }, { x: cx - 80, y: h - 120 }], thickness: 12 },
      { type: 'wall', points: [{ x: cx + 320, y: h - 200 }, { x: cx + 80, y: h - 120 }], thickness: 12 },
      // Goal strip centered
      { type: 'shape', category: 'goal', shape: 'rect', geom: { x: cx - 80, y: h - 80, w: 160, h: 30 } },
      // Side hazards at very bottom edges
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 0, y: h - 40, w: cx - 80, h: 40 } },
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: cx + 80, y: h - 40, w: w - (cx + 80), h: 40 } }
    ];

    return { elements };
  }

  // Spawns low count marbles to create animated backdrop in main menu
  async loadBackgroundDemo() {
    this.simulator.setPaused(false);
    this.simulator.physicsSpeed = 1.0;
    this.renderer.playerRacerId = null;
    this.simulator.menuMode = true;

    this.simulator.loadMap(this.buildMenuBackgroundMap());

    const menuPreset = CUSTOM_MARBLES.filter(m => m.effect === 'solid').slice(0, 15);
    this.simulator.spawnMarbles(15, menuPreset);

    if (this.bgCheckInterval) clearInterval(this.bgCheckInterval);
    this.bgCheckInterval = setInterval(() => {
      if (this.currentScreen !== 'menu' && this.currentScreen !== 'browser') {
        clearInterval(this.bgCheckInterval);
        this.simulator.menuMode = false;
        return;
      }

      const activeCount = this.simulator.marbles.filter(m => !m.finished).length;
      if (activeCount === 0 || this.simulator.finishedMarbles.length >= 10) {
        this.simulator.spawnMarbles(15, menuPreset);
      }
    }, 5000);
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
      const isUnlocked = (marble.name === 'Red') || !!this.mp;
      const card = document.createElement('button');
      card.className = isUnlocked ? 'racer-card' : 'racer-card locked';
      card.type = 'button';
      card.title = isUnlocked ? `Select ${marble.name}` : `${marble.name} (Locked)`;
      if (!isUnlocked) {
        card.style.opacity = '0.35';
        card.style.filter = 'grayscale(0.85)';
        card.style.cursor = 'not-allowed';
      }

      const circle = document.createElement('div');
      circle.className = 'racer-circle';
      circle.style.background = this.getCssBackground(marble);
      if (marble.effect === 'blurred') {
        circle.style.filter = 'blur(2px)';
      }

      const label = document.createElement('span');
      label.className = 'racer-name-label';
      label.textContent = isUnlocked ? marble.name : `🔒 ${marble.name}`;

      card.appendChild(circle);
      card.appendChild(label);

      card.addEventListener('click', () => {
        if (!isUnlocked) {
          this.showToast(`${marble.name} is locked. Only Red is available right now.`);
          return;
        }
        this.selectedRacer = marble;
        document.getElementById('screen-racer-picker').classList.add('hidden');
        if (this.currentScreen === 'menu') {
          this.updateRacerHudDisplay();
        } else {
          this.changeScreen('arena');
        }
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
    document.getElementById('menu-btn-garage').addEventListener('click', () => {
      // Show racer picker modal
      document.getElementById('screen-racer-picker').classList.remove('hidden');
    });

    document.getElementById('menu-btn-play').addEventListener('click', () => {
      this.changeScreen('browser');
      this.refreshMapsList();
    });
    
    document.getElementById('menu-btn-build').addEventListener('click', () => {
      this.changeScreen('editor');
    });
    
    document.getElementById('menu-btn-cloud').addEventListener('click', () => {
      this.showToast("Settings menu coming soon.");
    });

    document.getElementById('menu-btn-multiplayer').addEventListener('click', () => {
      document.getElementById('mp-modal').classList.remove('hidden');
      const stored = localStorage.getItem('mp_name') || '';
      document.getElementById('mp-name').value = stored;
    });

    document.getElementById('mp-modal-close').addEventListener('click', () => {
      document.getElementById('mp-modal').classList.add('hidden');
    });

    document.getElementById('mp-btn-host').addEventListener('click', () => {
      const name = document.getElementById('mp-name').value.trim() || 'Host';
      let room = document.getElementById('mp-room').value.trim().toUpperCase();
      if (!room) {
        room = Math.random().toString(36).slice(2, 8).toUpperCase();
        document.getElementById('mp-room').value = room;
      }
      this.connectMultiplayer(name, room);
    });

    document.getElementById('mp-btn-join').addEventListener('click', () => {
      const name = document.getElementById('mp-name').value.trim() || 'Player';
      const room = document.getElementById('mp-room').value.trim().toUpperCase();
      if (!room) {
        document.getElementById('mp-status').textContent = 'Enter a room code to join.';
        return;
      }
      this.connectMultiplayer(name, room);
    });

    document.getElementById('mp-btn-pickmap').addEventListener('click', () => {
      this.mpPickingMap = true;
      document.getElementById('mp-modal').classList.add('hidden');
      this.changeScreen('browser');
    });

    document.getElementById('mp-btn-start').addEventListener('click', () => {
      if (this.mp && this.mp.isHost) {
        this.mp.startRace();
      }
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

    document.getElementById('editor-btn-test').addEventListener('click', () => {
      this.testMarble();
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

    // --- Editor Shape selection (line / rect / circle) ---
    const shapeButtons = document.querySelectorAll('.shape-btn');
    shapeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        shapeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentShape = btn.dataset.shape;
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
      this.simulator.setPaused(!this.simulator.isPaused);
      if (this.simulator.isPaused) {
        playBtn.innerHTML = '<span class="play-icon"></span> Play Race';
        playBtn.classList.add('pulse-border');
      } else {
        playBtn.innerHTML = '<span class="play-icon"></span> Pause';
        playBtn.classList.remove('pulse-border');

        if (this.simulator.marbles.length === 0) {
          this.triggerSpawn();
        }
        // Reset gate countdown to start at unpause moment
        if (this.simulator.spawnGate && !this.simulator.spawnGate.isOpen) {
          this.simulator.scheduleGateOpen(3000);
        }
      }
    });

    document.getElementById('btn-reset-marbles').addEventListener('click', () => {
      // Pop the chooser screen
      document.getElementById('screen-racer-picker').classList.remove('hidden');
    });

    // Racer selector close button
    document.getElementById('racer-picker-close').addEventListener('click', () => {
      document.getElementById('screen-racer-picker').classList.add('hidden');
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

  }

  // Trigger Spawning of Marbles
  triggerSpawn() {
    let racerConfigs;

    if (this.mp) {
      // Multiplayer: only spawn the local player's marble; opponents are remote
      racerConfigs = [{ ...this.selectedRacer, isPlayer: true }];
    } else {
      const opponentCount = parseInt(document.getElementById('marble-count').value);
      const filteredList = CUSTOM_MARBLES.filter(m => m.name !== this.selectedRacer.name);
      const shuffled = [...filteredList].sort(() => 0.5 - Math.random());
      const selectedOpponents = shuffled.slice(0, opponentCount);
      racerConfigs = [
        { ...this.selectedRacer, isPlayer: true }
      ].concat(selectedOpponents.map(o => ({ ...o, isPlayer: false })));
    }

    this.simulator.spawnMarbles(racerConfigs.length, racerConfigs);
    
    // Link player body ID back to renderer for arrow highlighting and camera track
    const playerBody = this.simulator.marbles.find(m => m.isPlayer);
    if (playerBody) {
      this.renderer.playerRacerId = playerBody.id;
    }
    
    this.updateLeaderboard(true);
  }

  testMarble() {
    this.simulator.marbles.forEach(m => Matter.World.remove(this.simulator.world, m));
    this.simulator.marbles = [];
    this.simulator.finishedMarbles = [];
    
    const racerConfigs = [{ ...this.selectedRacer, isPlayer: true }];
    this.simulator.spawnMarbles(1, racerConfigs);

    const playerBody = this.simulator.marbles.find(m => m.isPlayer);
    if (playerBody) {
      this.renderer.playerRacerId = playerBody.id;
    }

    this.simulator.setPaused(false);
    this.renderer.isTrackingLead = true;
    this.showToast("Testing track with 1 marble!");
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

    // Right-click (or middle) anywhere on canvas → pan camera
    if (e.button === 2 || e.button === 1) {
      this.isPanning = true;
      this.lastPanMouseX = e.clientX;
      this.lastPanMouseY = e.clientY;
      return;
    }

    // In arena: left-drag also pans (no drawing in arena)
    if (this.currentScreen === 'arena' && e.button === 0) {
      this.isPanning = true;
      this.lastPanMouseX = e.clientX;
      this.lastPanMouseY = e.clientY;
      return;
    }

    if (e.button === 0 && this.currentScreen === 'editor') {
      const worldPos = this.renderer.screenToWorld(mousePos.x, mousePos.y);

      if (this.currentTool === 'spawner') {
        this.simulator.setSpawner(worldPos.x, worldPos.y);
        this.showToast("Spawner repositioned");
        return;
      }

      if (this.currentTool === 'cog') {
        const existingCog = this.simulator.staticElements.find(
          el => el.type === 'cog' && Math.hypot(worldPos.x - el.x, worldPos.y - el.y) <= 15
        );
        if (existingCog) {
          existingCog.direction = (existingCog.direction || 1) * -1;
          this.showToast("Cog rotation direction toggled");
        } else {
          this.simulator.staticElements.push({
            type: 'cog',
            x: worldPos.x,
            y: worldPos.y,
            radius: 15,
            direction: 1,
            angle: 0
          });
          this.showToast("Cog placed");
        }
        return;
      }

      this.isDrawing = true;
      const isShapeTool = ['wall', 'goal', 'hazard'].includes(this.currentTool)
        && (this.currentShape === 'rect' || this.currentShape === 'circle');

      if (isShapeTool) {
        this.activeDrawingPath = {
          tool: this.currentTool,
          shape: this.currentShape,
          thickness: this.brushSize,
          start: worldPos,
          end: worldPos
        };
      } else {
        this.activeDrawingPath = {
          tool: this.currentTool,
          shape: 'line',
          thickness: this.brushSize,
          points: [worldPos]
        };
      }

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
      this.renderer.clampPan();
      return;
    }

    if (this.isDrawing && this.activeDrawingPath) {
      const path = this.activeDrawingPath;
      if (path.shape === 'rect' || path.shape === 'circle') {
        path.end = worldPos;
        return;
      }

      const points = path.points;
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
      const path = this.activeDrawingPath;

      if (path.shape === 'rect' && path.start && path.end) {
        const w = path.end.x - path.start.x;
        const h = path.end.y - path.start.y;
        if (Math.abs(w) >= 4 && Math.abs(h) >= 4) {
          this.simulator.addShape(path.tool, 'rect', {
            x: path.start.x,
            y: path.start.y,
            w,
            h
          });
        }
      } else if (path.shape === 'circle' && path.start && path.end) {
        const r = Math.hypot(path.end.x - path.start.x, path.end.y - path.start.y);
        if (r >= 4) {
          this.simulator.addShape(path.tool, 'circle', {
            cx: path.start.x,
            cy: path.start.y,
            r
          });
        }
      } else if (path.points && path.points.length >= 2) {
        const { tool, points, thickness } = path;
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

    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const mousePos = this.getMousePosition(e);
    const worldBefore = this.renderer.screenToWorld(mousePos.x, mousePos.y);

    const oldZoom = this.renderer.zoom;
    this.renderer.zoom = Math.max(0.2, Math.min(4, oldZoom * factor));

    const worldAfter = this.renderer.screenToWorld(mousePos.x, mousePos.y);
    this.renderer.panX += (worldAfter.x - worldBefore.x) * this.renderer.zoom;
    this.renderer.panY += (worldAfter.y - worldBefore.y) * this.renderer.zoom;
    this.renderer.clampPan();
  }

  eraseAtPosition(worldPos) {
    const elements = this.simulator.staticElements;
    const eraseRadius = this.brushSize + 10;

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'spawner' || el.type === 'arena_boundary') continue;

      let hits = false;

      if (el.type === 'cog') {
        const d = Math.hypot(worldPos.x - el.x, worldPos.y - el.y);
        if (d < (el.radius || 15) + eraseRadius) {
          hits = true;
        }
      } else if (el.type === 'shape') {
        if (el.shape === 'rect') {
          const x = Math.min(el.geom.x, el.geom.x + el.geom.w);
          const y = Math.min(el.geom.y, el.geom.y + el.geom.h);
          const w = Math.abs(el.geom.w);
          const h = Math.abs(el.geom.h);
          const px = Math.max(x, Math.min(worldPos.x, x + w));
          const py = Math.max(y, Math.min(worldPos.y, y + h));
          if (Math.hypot(worldPos.x - px, worldPos.y - py) < eraseRadius) {
            hits = true;
          }
        } else if (el.shape === 'circle') {
          const d = Math.hypot(worldPos.x - el.geom.cx, worldPos.y - el.geom.cy);
          if (d < el.geom.r + eraseRadius) {
            hits = true;
          }
        }
      } else if (el.points) {
        for (const p of el.points) {
          if (Math.hypot(p.x - worldPos.x, p.y - worldPos.y) < eraseRadius) {
            hits = true;
            break;
          }
        }
        if (!hits) {
          for (let j = 0; j < el.points.length - 1; j++) {
            const p1 = el.points[j];
            const p2 = el.points[j + 1];
            if (this.distToSegment(worldPos, p1, p2) < eraseRadius) {
              hits = true;
              break;
            }
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
      const dbTag = map.isSample ? '[Sample]' : '[Local]';

      html += `
        <div class="map-card" data-id="${map.id}">
          <canvas class="map-thumb" data-id="${map.id}" width="180" height="110"></canvas>
          <div class="map-info">
            <span class="map-card-name">${map.name} <small style="color: var(--text-muted); font-size: 10px;">${dbTag}</small></span>
            <span class="map-card-creator">By ${map.creator} | ${dateStr}</span>
          </div>
          <div class="map-card-actions">
            <button class="action-btn primary-btn btn-load-map" data-id="${map.id}">
              Load &amp; Race
            </button>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;

    // Render thumbnails
    listEl.querySelectorAll('.map-thumb').forEach((canvas) => {
      const id = canvas.dataset.id;
      const map = this.loadedMaps.find(m => m.id === id);
      if (map) this.drawMapPreview(canvas, map);
    });

    // Bind click load & play actions
    listEl.querySelectorAll('.btn-load-map').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const targetMap = this.loadedMaps.find(m => m.id === id);
        if (!targetMap) return;

        // Multiplayer map-picking flow (host selects map for room)
        if (this.mpPickingMap && this.mp && this.mp.isHost) {
          this.mp.setMap(id);
          this.mpCurrentMap = targetMap;
          this.mpPickingMap = false;
          this.changeScreen('menu');
          document.getElementById('mp-modal').classList.remove('hidden');
          document.getElementById('mp-status').textContent = `Map locked: ${targetMap.name}`;
          this.refreshMpLobby();
          return;
        }

        if (this.bgCheckInterval) clearInterval(this.bgCheckInterval);
        this.simulator.loadMap(targetMap);
        document.getElementById('arena-track-title').textContent = targetMap.name;
        document.getElementById('screen-racer-picker').classList.remove('hidden');
        this.showToast(`Track Loaded: "${targetMap.name}"`);
      });
    });
  }

  // Render a scaled-down preview of a map onto a small canvas
  drawMapPreview(canvas, map) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#7b92ff';
    ctx.fillRect(0, 0, w, h);

    // Compute element bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    map.elements.forEach((el) => {
      if (el.type === 'spawner') {
        minX = Math.min(minX, el.x - 20); minY = Math.min(minY, el.y - 20);
        maxX = Math.max(maxX, el.x + 20); maxY = Math.max(maxY, el.y + 20);
      } else if (el.type === 'shape') {
        if (el.shape === 'rect') {
          const x = Math.min(el.geom.x, el.geom.x + el.geom.w);
          const y = Math.min(el.geom.y, el.geom.y + el.geom.h);
          const ww = Math.abs(el.geom.w);
          const hh = Math.abs(el.geom.h);
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + ww); maxY = Math.max(maxY, y + hh);
        } else if (el.shape === 'circle') {
          minX = Math.min(minX, el.geom.cx - el.geom.r);
          minY = Math.min(minY, el.geom.cy - el.geom.r);
          maxX = Math.max(maxX, el.geom.cx + el.geom.r);
          maxY = Math.max(maxY, el.geom.cy + el.geom.r);
        }
      } else if (el.points) {
        el.points.forEach((p) => {
          minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
        });
      }
    });

    if (!isFinite(minX)) return;

    const pad = 20;
    const srcW = (maxX - minX) + pad * 2;
    const srcH = (maxY - minY) + pad * 2;
    const scale = Math.min(w / srcW, h / srcH);
    const offX = (w - srcW * scale) / 2 - (minX - pad) * scale;
    const offY = (h - srcH * scale) / 2 - (minY - pad) * scale;

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);

    map.elements.forEach((el) => {
      if (el.type === 'spawner') {
        ctx.fillStyle = '#ffe600';
        ctx.beginPath();
        ctx.arc(el.x, el.y, (el.radius || 15), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (el.type === 'shape') {
        let fill = '#000';
        if (el.category === 'goal') fill = '#39ff14';
        else if (el.category === 'hazard') fill = '#ff3366';
        ctx.fillStyle = fill;
        if (el.shape === 'rect') {
          const x = Math.min(el.geom.x, el.geom.x + el.geom.w);
          const y = Math.min(el.geom.y, el.geom.y + el.geom.h);
          ctx.fillRect(x, y, Math.abs(el.geom.w), Math.abs(el.geom.h));
        } else if (el.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(el.geom.cx, el.geom.cy, el.geom.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (el.points && el.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = (el.thickness || 12);
        if (el.type === 'wall') ctx.strokeStyle = '#000';
        else if (el.type === 'goal') ctx.strokeStyle = '#39ff14';
        else if (el.type === 'hazard') ctx.strokeStyle = '#ff3366';
        else ctx.strokeStyle = '#000';
        ctx.stroke();
      }
    });

    ctx.restore();

    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }

  filterMapsList(query) {
    if (!this.loadedMaps) return;
    const filtered = this.loadedMaps.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.creator.toLowerCase().includes(query)
    );
    this.renderMapsList(filtered);
  }

  // --- Multiplayer ---
  connectMultiplayer(name, room) {
    if (this.mp) this.mp.close();
    localStorage.setItem('mp_name', name);

    const status = document.getElementById('mp-status');
    status.textContent = `Connecting to room "${room}" ...`;

    this.mp = new MultiplayerClient({
      room,
      name,
      marbleName: this.selectedRacer.name,
      color: this.selectedRacer.color,
      onWelcome: (m) => this.onMpWelcome(m),
      onPlayerJoined: (m) => this.onMpPlayerJoined(m),
      onPlayerLeft: (id) => this.onMpPlayerLeft(id),
      onPos: (m) => this.onMpPos(m),
      onMapSet: (mapId) => this.onMpMapSet(mapId),
      onStart: (at) => this.onMpStart(at),
      onReset: () => this.onMpReset(),
      onHostChanged: () => this.refreshMpLobby(),
      onError: (e) => { status.textContent = 'Connection error. Check console.'; console.error(e); }
    });

    this.renderer.localPlayerName = name;
  }

  onMpWelcome(msg) {
    document.getElementById('mp-status').textContent =
      `Connected as ${this.mp.isHost ? 'HOST' : 'guest'}. Room code: ${this.mp.room}`;
    document.getElementById('mp-lobby').classList.remove('hidden');
    document.getElementById('mp-btn-start').disabled = !this.mp.isHost;
    document.getElementById('mp-btn-pickmap').disabled = !this.mp.isHost;
    // Unlock full marble palette for MP so both players can pick different colors
    this.buildRacerPickerList();

    // Hydrate remote marbles from existing players
    this.simulator.clearRemoteMarbles();
    msg.players.forEach((p) => {
      if (p.id !== this.mp.myId) {
        this.simulator.upsertRemoteMarble(p.id, {
          id: p.id, name: p.name, marbleName: p.marbleName, color: p.color,
          x: p.x || 0, y: p.y || 0, targetX: p.x || 0, targetY: p.y || 0
        });
      }
    });

    if (msg.mapId) this.mpLoadMapById(msg.mapId);
    this.refreshMpLobby();
  }

  onMpPlayerJoined(p) {
    this.simulator.upsertRemoteMarble(p.id, {
      id: p.id, name: p.name, marbleName: p.marbleName, color: p.color,
      x: 0, y: 0, targetX: 0, targetY: 0
    });
    this.refreshMpLobby();
    this.showToast(`${p.name} joined`);
  }

  onMpPlayerLeft(id) {
    this.simulator.removeRemoteMarble(id);
    this.refreshMpLobby();
  }

  onMpPos(msg) {
    this.simulator.setRemoteMarbleTarget(msg.id, msg.x, msg.y, msg.vx, msg.vy);
  }

  async mpLoadMapById(mapId) {
    const maps = await fetchAllMaps();
    const target = maps.find(m => m.id === mapId);
    if (!target) return;
    this.mpCurrentMap = target;
    document.getElementById('mp-status').textContent = `Map: ${target.name}. Waiting for host to start...`;
  }

  onMpMapSet(mapId) {
    this.mpLoadMapById(mapId);
  }

  onMpStart(at) {
    document.getElementById('mp-modal').classList.add('hidden');
    if (!this.mpCurrentMap) return;

    if (this.bgCheckInterval) clearInterval(this.bgCheckInterval);
    this.simulator.loadMap(this.mpCurrentMap);
    document.getElementById('arena-track-title').textContent = this.mpCurrentMap.name + ' [MP]';
    this.changeScreen('arena');

    // Wait until startAt then unpause
    const wait = Math.max(0, at - Date.now());
    setTimeout(() => {
      this.simulator.setPaused(false);
      if (this.simulator.spawnGate && !this.simulator.spawnGate.isOpen) {
        this.simulator.scheduleGateOpen(3000);
      }
      this.startMpBroadcast();
    }, wait);
  }

  onMpReset() {
    if (this.mpBroadcastInterval) clearInterval(this.mpBroadcastInterval);
    this.simulator.setPaused(true);
    this.changeScreen('menu');
  }

  refreshMpLobby() {
    if (!this.mp) return;
    const listEl = document.getElementById('mp-player-list');
    listEl.innerHTML = '';
    const me = document.createElement('li');
    me.textContent = `${document.getElementById('mp-name').value || 'You'} (you${this.mp.isHost ? ', host' : ''})`;
    listEl.appendChild(me);
    this.simulator.remoteMarbles.forEach((r) => {
      const li = document.createElement('li');
      li.textContent = r.name;
      listEl.appendChild(li);
    });
    document.getElementById('mp-btn-start').disabled = !this.mp.isHost || !this.mpCurrentMap;
    document.getElementById('mp-btn-pickmap').disabled = !this.mp.isHost;
  }

  startMpBroadcast() {
    if (this.mpBroadcastInterval) clearInterval(this.mpBroadcastInterval);
    this.mpBroadcastInterval = setInterval(() => {
      if (!this.mp) { clearInterval(this.mpBroadcastInterval); return; }
      const own = this.simulator.marbles.find(m => m.isPlayer);
      if (own) {
        this.mp.sendPos(
          own.position.x,
          own.position.y,
          own.velocity.x,
          own.velocity.y
        );
      }
    }, 50);
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
