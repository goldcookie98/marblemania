import { PhysicsSimulator } from './physics';
import { CanvasRenderer } from './canvas';
import { UIManager } from './ui';

document.addEventListener('DOMContentLoaded', () => {
  // Version badge
  const vb = document.getElementById('version-badge');
  if (vb) vb.textContent = `v${__APP_VERSION__}`;

  // 1. Initialize Physics Engine wrapper
  const simulator = new PhysicsSimulator();
  simulator.init();

  // 3. Initialize Canvas Renderer Module
  const renderer = new CanvasRenderer('gameCanvas');

  // 3b. Fixed canonical world. Camera auto-fits this into the viewport.
  const WORLD_W = 1600;
  const WORLD_H = 900;
  simulator.setupArenaBoundary(WORLD_W, WORLD_H);
  renderer.worldWidth = WORLD_W;
  renderer.worldHeight = WORLD_H;
  renderer.fitArena();
  window.addEventListener('resize', () => {
    renderer.fitArena();
  });

  // 4. Initialize User Interface Controls (triggers initial 'menu' screen)
  const ui = new UIManager(simulator, renderer);

  // 5. Connect collision callbacks from physics to rendering/UI layers
  simulator.onGoalReached = (record, pos) => {
    // Spawn confetti colors at finish line
    renderer.spawnGoalExplosion(pos, record.color);
    ui.updateLeaderboard();
    ui.showToast(`🏁 ${record.emoji} ${record.name} finished in ${record.time.toFixed(2)}s!`);
  };

  simulator.onHazardTriggered = (name, pos) => {
    // Spawn digital red sparks on reset
    renderer.spawnHazardExplosion(pos);
  };

  // 6. Game loop orchestrator
  let lastTime = performance.now();
  let frameCount = 0;

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    // Step physics engine (internally respects pause state and speed multiplier)
    simulator.tick(dt);

    // Update particle states
    renderer.updateParticles();

    // Limit Leaderboard DOM updates to every 10 frames for rendering efficiency
    if (ui.currentScreen === 'arena' && !simulator.isPaused) {
      frameCount++;
      if (frameCount % 10 === 0) {
        ui.updateLeaderboard();
      }
    }

    // Render elements
    renderer.draw(simulator, ui.activeDrawingPath);

    requestAnimationFrame(loop);
  }

  // Trigger game loop
  requestAnimationFrame(loop);
});
