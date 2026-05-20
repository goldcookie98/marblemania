import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  increment, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

let firebaseApp = null;
let firestoreDb = null;
let isConnected = false;

// Default preloaded maps for instant play when offline
const PRELOADED_MAPS = [
  {
    id: 'sample-pachinko',
    name: 'Pachinko Cascade (Sample)',
    creator: 'System',
    likes: 42,
    createdAt: Date.now() - 86400000 * 2,
    isSample: true,
    elements: [
      // Spawner near the top
      { type: 'spawner', x: 400, y: 80, radius: 15 },
      // Finish zone at the bottom
      { type: 'goal', points: [{x: 100, y: 700}, {x: 700, y: 700}], width: 30 },
      // Hazards at the extreme bottom sides
      { type: 'hazard', points: [{x: 0, y: 750}, {x: 100, y: 700}], width: 10 },
      { type: 'hazard', points: [{x: 700, y: 700}, {x: 800, y: 750}], width: 10 },
      // Deflectors/Pegs (drawn walls)
      // Top funnels
      { type: 'wall', points: [{x: 250, y: 150}, {x: 350, y: 220}] },
      { type: 'wall', points: [{x: 550, y: 150}, {x: 450, y: 220}] },
      // Row 1 pegs
      { type: 'wall', points: [{x: 300, y: 300}, {x: 310, y: 300}] },
      { type: 'wall', points: [{x: 400, y: 300}, {x: 410, y: 300}] },
      { type: 'wall', points: [{x: 500, y: 300}, {x: 510, y: 300}] },
      // Row 2 pegs (offset)
      { type: 'wall', points: [{x: 250, y: 380}, {x: 260, y: 380}] },
      { type: 'wall', points: [{x: 350, y: 380}, {x: 360, y: 380}] },
      { type: 'wall', points: [{x: 450, y: 380}, {x: 460, y: 380}] },
      { type: 'wall', points: [{x: 550, y: 380}, {x: 560, y: 380}] },
      // Row 3 pegs
      { type: 'wall', points: [{x: 300, y: 460}, {x: 310, y: 460}] },
      { type: 'wall', points: [{x: 400, y: 460}, {x: 410, y: 460}] },
      { type: 'wall', points: [{x: 500, y: 460}, {x: 510, y: 460}] },
      // Funnel slants at bottom
      { type: 'wall', points: [{x: 150, y: 550}, {x: 320, y: 620}] },
      { type: 'wall', points: [{x: 650, y: 550}, {x: 480, y: 620}] }
    ]
  },
  {
    id: 'sample-hazard-run',
    name: 'Hazard Jumps (Sample)',
    creator: 'System',
    likes: 27,
    createdAt: Date.now() - 86400000,
    isSample: true,
    elements: [
      { type: 'spawner', x: 100, y: 100, radius: 15 },
      // Slopes
      { type: 'wall', points: [{x: 50, y: 150}, {x: 400, y: 220}] },
      // Gap with hazard below
      { type: 'hazard', points: [{x: 380, y: 300}, {x: 480, y: 300}], width: 12 },
      { type: 'wall', points: [{x: 450, y: 270}, {x: 750, y: 320}] },
      // Gap with hazard below
      { type: 'hazard', points: [{x: 700, y: 450}, {x: 800, y: 450}], width: 12 },
      // Bounce board below
      { type: 'wall', points: [{x: 700, y: 480}, {x: 300, y: 580}] },
      // Red zone along the left bottom
      { type: 'hazard', points: [{x: 0, y: 680}, {x: 400, y: 680}], width: 15 },
      // Finish goal on bottom right
      { type: 'goal', points: [{x: 420, y: 650}, {x: 780, y: 650}], width: 25 },
      // A small deflector to help guide into the goal if they drop off the bounce board correctly
      { type: 'wall', points: [{x: 330, y: 580}, {x: 350, y: 650}] }
    ]
  }
];

// Load Firebase configuration from localStorage if it exists
export function loadFirebaseConfig() {
  const configStr = localStorage.getItem('fb_config');
  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      const initialized = initFirebase(config);
      return { success: initialized, config };
    } catch (e) {
      console.error("Failed to auto-init Firebase", e);
      return { success: false, error: e.message };
    }
  }
  return { success: false, noConfig: true };
}

// Initialize Firebase with client configuration
export function initFirebase(config) {
  try {
    if (!config || !config.apiKey || !config.projectId) {
      throw new Error("Invalid config object. API Key and Project ID are required.");
    }
    
    firebaseApp = initializeApp(config);
    firestoreDb = getFirestore(firebaseApp);
    isConnected = true;
    
    // Save working config to localStorage
    localStorage.setItem('fb_config', JSON.stringify(config));
    console.log("Firebase Database Initialized successfully.");
    return true;
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    isConnected = false;
    firebaseApp = null;
    firestoreDb = null;
    throw error;
  }
}

// Disconnect Firebase and clear credentials
export function clearFirebaseConfig() {
  localStorage.removeItem('fb_config');
  firebaseApp = null;
  firestoreDb = null;
  isConnected = false;
}

// Check database connection state
export function isFirebaseConnected() {
  return isConnected;
}

// Save map helper
export async function saveMap(mapName, creatorName, elements) {
  const newMap = {
    name: mapName,
    creator: creatorName,
    likes: 0,
    createdAt: Date.now(),
    elements: elements // Elements is an array of shapes (walls, goals, hazards, spawners)
  };

  if (isConnected && firestoreDb) {
    try {
      const docRef = await addDoc(collection(firestoreDb, 'maps'), newMap);
      return { id: docRef.id, ...newMap, synced: true };
    } catch (error) {
      console.warn("Failed to save to Firebase, falling back to LocalStorage:", error);
      return saveMapLocally(newMap);
    }
  } else {
    return saveMapLocally(newMap);
  }
}

// Local save implementation
function saveMapLocally(mapData) {
  const localMaps = getLocalMaps();
  const mapId = 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const completeMap = { id: mapId, ...mapData, synced: false };
  localMaps.push(completeMap);
  localStorage.setItem('local_maps', JSON.stringify(localMaps));
  return completeMap;
}

// Get local maps
function getLocalMaps() {
  const localMapsStr = localStorage.getItem('local_maps');
  if (localMapsStr) {
    try {
      return JSON.parse(localMapsStr);
    } catch (e) {
      return [];
    }
  }
  return [];
}

// Load all maps (preloaded, local, and firebase cloud)
export async function fetchAllMaps() {
  let cloudMaps = [];
  
  if (isConnected && firestoreDb) {
    try {
      const q = query(collection(firestoreDb, 'maps'), orderBy('createdAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        cloudMaps.push({ id: doc.id, ...doc.data(), synced: true });
      });
    } catch (error) {
      console.error("Error reading maps from Firestore, loading offline list instead:", error);
    }
  }

  const localMaps = getLocalMaps();
  
  // Combine all maps (Firebase cloud first, then local client creations, then preloaded samples)
  return [...cloudMaps, ...localMaps, ...PRELOADED_MAPS];
}

// Like a map
export async function likeMap(mapId) {
  // If it's a sample map
  if (mapId.startsWith('sample-')) {
    const likedKey = `liked_${mapId}`;
    if (localStorage.getItem(likedKey)) return false; // Already liked
    
    const idx = PRELOADED_MAPS.findIndex(m => m.id === mapId);
    if (idx !== -1) {
      PRELOADED_MAPS[idx].likes += 1;
      localStorage.setItem(likedKey, 'true');
      return true;
    }
    return false;
  }

  // If it's a local map
  if (mapId.startsWith('local-')) {
    const likedKey = `liked_${mapId}`;
    if (localStorage.getItem(likedKey)) return false;
    
    const localMaps = getLocalMaps();
    const mapIdx = localMaps.findIndex(m => m.id === mapId);
    if (mapIdx !== -1) {
      localMaps[mapIdx].likes = (localMaps[mapIdx].likes || 0) + 1;
      localStorage.setItem('local_maps', JSON.stringify(localMaps));
      localStorage.setItem(likedKey, 'true');
      return true;
    }
    return false;
  }

  // If it's a Firestore cloud map
  if (isConnected && firestoreDb) {
    const likedKey = `liked_${mapId}`;
    if (localStorage.getItem(likedKey)) return false;

    try {
      const mapDocRef = doc(firestoreDb, 'maps', mapId);
      await updateDoc(mapDocRef, {
        likes: increment(1)
      });
      localStorage.setItem(likedKey, 'true');
      return true;
    } catch (error) {
      console.error("Failed to like cloud map:", error);
      return false;
    }
  }
  
  return false;
}
