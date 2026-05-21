// Local map store. No external database. All persistence via localStorage.
// File retains "firebase-db" name + exports for backward compatibility with importers.

const PRELOADED_MAPS = [
  {
    id: 'sample-pachinko',
    name: 'Pachinko Cascade',
    creator: 'System',
    createdAt: Date.now() - 86400000 * 2,
    isSample: true,
    elements: [
      { type: 'spawner', x: 400, y: 80, radius: 15 },
      { type: 'goal', points: [{x: 100, y: 700}, {x: 700, y: 700}], width: 30 },
      { type: 'hazard', points: [{x: 0, y: 750}, {x: 100, y: 700}], width: 10 },
      { type: 'hazard', points: [{x: 700, y: 700}, {x: 800, y: 750}], width: 10 },
      { type: 'wall', points: [{x: 250, y: 150}, {x: 350, y: 220}] },
      { type: 'wall', points: [{x: 550, y: 150}, {x: 450, y: 220}] },
      { type: 'wall', points: [{x: 300, y: 300}, {x: 310, y: 300}] },
      { type: 'wall', points: [{x: 400, y: 300}, {x: 410, y: 300}] },
      { type: 'wall', points: [{x: 500, y: 300}, {x: 510, y: 300}] },
      { type: 'wall', points: [{x: 250, y: 380}, {x: 260, y: 380}] },
      { type: 'wall', points: [{x: 350, y: 380}, {x: 360, y: 380}] },
      { type: 'wall', points: [{x: 450, y: 380}, {x: 460, y: 380}] },
      { type: 'wall', points: [{x: 550, y: 380}, {x: 560, y: 380}] },
      { type: 'wall', points: [{x: 300, y: 460}, {x: 310, y: 460}] },
      { type: 'wall', points: [{x: 400, y: 460}, {x: 410, y: 460}] },
      { type: 'wall', points: [{x: 500, y: 460}, {x: 510, y: 460}] },
      { type: 'wall', points: [{x: 150, y: 550}, {x: 320, y: 620}] },
      { type: 'wall', points: [{x: 650, y: 550}, {x: 480, y: 620}] }
    ]
  },
  {
    id: 'sample-hazard-run',
    name: 'Hazard Jumps',
    creator: 'System',
    createdAt: Date.now() - 86400000,
    isSample: true,
    elements: [
      { type: 'spawner', x: 100, y: 100, radius: 15 },
      { type: 'wall', points: [{x: 50, y: 150}, {x: 400, y: 220}] },
      { type: 'hazard', points: [{x: 380, y: 300}, {x: 480, y: 300}], width: 12 },
      { type: 'wall', points: [{x: 450, y: 270}, {x: 750, y: 320}] },
      { type: 'hazard', points: [{x: 700, y: 450}, {x: 800, y: 450}], width: 12 },
      { type: 'wall', points: [{x: 700, y: 480}, {x: 300, y: 580}] },
      { type: 'hazard', points: [{x: 0, y: 680}, {x: 400, y: 680}], width: 15 },
      { type: 'goal', points: [{x: 420, y: 650}, {x: 780, y: 650}], width: 25 },
      { type: 'wall', points: [{x: 330, y: 580}, {x: 350, y: 650}] }
    ]
  },
  {
    id: 'sample-survival-arena',
    name: 'Survival Arena',
    creator: 'System',
    createdAt: Date.now(),
    isSample: true,
    elements: [
      { type: 'spawner', x: 120, y: 90, radius: 18 },

      // Diagonal ramp from top-left leading right-down
      { type: 'wall', points: [{ x: 0, y: 200 }, { x: 580, y: 380 }], thickness: 16 },

      // Two ceiling drips (black stalactite + red drip tip)
      { type: 'shape', category: 'wall', shape: 'rect', geom: { x: 540, y: 0, w: 160, h: 80 } },
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 555, y: 80, w: 130, h: 150 } },
      { type: 'shape', category: 'wall', shape: 'rect', geom: { x: 880, y: 0, w: 160, h: 80 } },
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 895, y: 80, w: 130, h: 150 } },

      // Floating mid stalactite (no drip)
      { type: 'shape', category: 'wall', shape: 'rect', geom: { x: 1080, y: 450, w: 160, h: 80 } },
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 1080, y: 530, w: 160, h: 22 } },

      // Center mid platform: red spike cap on top + black body underneath
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 380, y: 560, w: 460, h: 28 } },
      { type: 'shape', category: 'wall', shape: 'rect', geom: { x: 380, y: 588, w: 460, h: 80 } },

      // Right-of-center mid platform
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 900, y: 560, w: 240, h: 28 } },
      { type: 'shape', category: 'wall', shape: 'rect', geom: { x: 900, y: 588, w: 240, h: 80 } },

      // Far-right ledge near goal
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 1240, y: 660, w: 200, h: 28 } },
      { type: 'shape', category: 'wall', shape: 'rect', geom: { x: 1240, y: 688, w: 200, h: 80 } },

      // Lower-mid floating platforms
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 660, y: 760, w: 200, h: 24 } },
      { type: 'shape', category: 'wall', shape: 'rect', geom: { x: 660, y: 784, w: 200, h: 60 } },

      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 240, y: 780, w: 220, h: 24 } },
      { type: 'shape', category: 'wall', shape: 'rect', geom: { x: 240, y: 804, w: 220, h: 56 } },

      // Right column: GREEN goal (Advance) on top, RED elimination beneath
      { type: 'shape', category: 'goal', shape: 'rect', geom: { x: 1540, y: 400, w: 60, h: 200 } },
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 1540, y: 600, w: 60, h: 260 } },

      // Bottom red lava floor (instant elimination if you fall)
      { type: 'shape', category: 'hazard', shape: 'rect', geom: { x: 0, y: 860, w: 1600, h: 40 } }
    ]
  }
];

const LOCAL_MAPS_KEY = 'local_maps';

function getLocalMaps() {
  const raw = localStorage.getItem(LOCAL_MAPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeLocalMaps(maps) {
  localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(maps));
}

export async function saveMap(mapName, creatorName, elements) {
  const localMaps = getLocalMaps();
  const mapId = 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const completeMap = {
    id: mapId,
    name: mapName,
    creator: creatorName,
    createdAt: Date.now(),
    elements,
    synced: false
  };
  localMaps.push(completeMap);
  writeLocalMaps(localMaps);
  return completeMap;
}

export async function fetchAllMaps() {
  const localMaps = getLocalMaps();
  return [...localMaps, ...PRELOADED_MAPS];
}
