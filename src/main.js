import { PhysicsSimulator } from './physics';
import { CanvasRenderer } from './canvas';
import { UIManager } from './ui';
import { loadFirebaseConfig } from './firebase-db';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Try to auto-connect Firebase from local storage credentials
  const fbStatus = loadFirebaseConfig();
  console.log("Firebase connection check:", fbStatus);

  // 2. Initialize Physics Engine wrapper
  const simulator = new PhysicsSimulator();
  simulator.init();

  // 3. Initialize Canvas Renderer Module
  const renderer = new CanvasRenderer('gameCanvas');

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
