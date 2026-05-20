export class CanvasRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Viewport transform (pan and zoom)
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;
    
    // Camera settings
    this.isTrackingLead = false;
    this.playerRacerId = null; // Stored body ID of the user's selected racer
    
    // Particle pool
    this.particles = [];
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.canvas.width / 2 - this.panX) / this.zoom + this.canvas.width / 2,
      y: (screenY - this.canvas.height / 2 - this.panY) / this.zoom + this.canvas.height / 2
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.canvas.width / 2) * this.zoom + this.canvas.width / 2 + this.panX,
      y: (worldY - this.canvas.height / 2) * this.zoom + this.canvas.height / 2 + this.panY
    };
  }

  spawnGoalExplosion(pos, color) {
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: color,
        radius: 2 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        gravity: 0.15,
        type: 'spark'
      });
    }
  }

  spawnHazardExplosion(pos) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ff3366',
        radius: 1.5 + Math.random() * 2.5,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        gravity: 0.05,
        type: 'hazard_spark'
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;
      
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  trackLeadMarble(marbles) {
    if (!this.isTrackingLead || marbles.length === 0) return;
    
    let targetMarble = null;
    
    // 1. If tracking player marble, find it
    if (this.playerRacerId) {
      targetMarble = marbles.find(m => m.id === this.playerRacerId);
    }
    
    // 2. Fall back to standard lead marble if player is not found/finished
    if (!targetMarble) {
      const activeMarbles = marbles.filter(m => !m.finished);
      if (activeMarbles.length === 0) return;
      
      targetMarble = activeMarbles[0];
      activeMarbles.forEach((m) => {
        if (m.position.y > targetMarble.position.y) {
          targetMarble = m;
        }
      });
    }

    if (targetMarble) {
      const targetPanX = -(targetMarble.position.x - this.canvas.width / 2) * this.zoom;
      const targetPanY = -(targetMarble.position.y - this.canvas.height / 2 - 50) * this.zoom;

      this.panX += (targetPanX - this.panX) * 0.08;
      this.panY += (targetPanY - this.panY) * 0.08;
    }
  }

  draw(simulator, activeDrawing) {
    const { ctx, canvas } = this;
    
    // Solid periwinkle background (exact Algodoo aesthetic)
    ctx.fillStyle = '#7b92ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (simulator.marbles.length > 0) {
      this.trackLeadMarble(simulator.marbles);
    }
    
    ctx.save();
    ctx.translate(canvas.width / 2 + this.panX, canvas.height / 2 + this.panY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // 1. Subtle Algodoo grid coordinate lines
    this.drawGrid();
    
    // 2. Draw walls, goals, and hazards
    this.drawStaticElements(simulator.staticElements);
    
    // 3. Draw active drawing path
    if (activeDrawing) {
      this.drawActivePath(activeDrawing);
    }
    
    // 4. Draw marbles, trails, and custom selected arrow
    this.drawMarbles(simulator.marbles);
    
    // 5. Draw explosions
    this.drawParticles();
    
    ctx.restore();
  }

  drawGrid() {
    const { ctx, canvas } = this;
    const gridSpacing = 50;
    
    const worldTopLeft = this.screenToWorld(0, 0);
    const worldBottomRight = this.screenToWorld(canvas.width, canvas.height);
    
    const startX = Math.floor(worldTopLeft.x / gridSpacing) * gridSpacing;
    const endX = Math.ceil(worldBottomRight.x / gridSpacing) * gridSpacing;
    const startY = Math.floor(worldTopLeft.y / gridSpacing) * gridSpacing;
    const endY = Math.ceil(worldBottomRight.y / gridSpacing) * gridSpacing;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    
    for (let x = startX; x <= endX; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    for (let y = startY; y <= endY; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  drawStaticElements(elements) {
    const { ctx } = this;
    
    elements.forEach((el) => {
      if (el.type === 'spawner') {
        this.drawSpawner(el);
        return;
      }
      
      const { points, thickness } = el;
      if (points.length < 2) return;
      
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = thickness;
      
      if (el.type === 'wall') {
        // Flat solid black lines matching Algodoo screenshots
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      } else if (el.type === 'goal') {
        // Flat bright green finish zone with center dashes
        ctx.strokeStyle = '#39ff14';
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 8]);
        ctx.stroke();
      } else if (el.type === 'hazard') {
        // Flat bright red reset line with center dashes
        ctx.strokeStyle = '#ff3366';
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  drawSpawner(spawner) {
    const { ctx } = this;
    const r = spawner.radius || 15;
    
    ctx.save();
    ctx.translate(spawner.x, spawner.y);
    
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 230, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPAWN', 0, 0.5);
    
    ctx.restore();
  }

  drawActivePath(activeDrawing) {
    const { ctx } = this;
    const { points, tool, thickness } = activeDrawing;
    if (points.length < 2) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = thickness;
    
    if (tool === 'wall') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    } else if (tool === 'goal') {
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.5)';
    } else if (tool === 'hazard') {
      ctx.strokeStyle = 'rgba(255, 51, 102, 0.5)';
    } else if (tool === 'eraser') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    }
    
    ctx.stroke();
    ctx.restore();
  }

  drawMarbles(marbles) {
    const { ctx } = this;
    
    marbles.forEach((m) => {
      // 1. Thin colorful vector trail matching Algodoo screenshots
      if (m.trail && m.trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(m.trail[0].x, m.trail[0].y);
        for (let i = 1; i < m.trail.length; i++) {
          ctx.lineTo(m.trail[i].x, m.trail[i].y);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = m.marbleColor || '#fff';
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.restore();
      }
      
      // 2. Draw Sphere Body based on chosen texture/effect
      ctx.save();
      ctx.translate(m.position.x, m.position.y);
      ctx.rotate(m.angle);
      
      const effect = m.marbleEffect || 'solid';
      
      if (effect === 'solid') {
        ctx.fillStyle = m.marbleColor;
        ctx.beginPath();
        ctx.arc(0, 0, m.circleRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect === 'translucent') {
        ctx.fillStyle = m.marbleColor;
        ctx.beginPath();
        ctx.arc(0, 0, m.circleRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect === 'rainbow') {
        const grad = ctx.createLinearGradient(-m.circleRadius, -m.circleRadius, m.circleRadius, m.circleRadius);
        grad.addColorStop(0, 'red');
        grad.addColorStop(0.2, 'orange');
        grad.addColorStop(0.4, 'yellow');
        grad.addColorStop(0.6, 'green');
        grad.addColorStop(0.8, 'blue');
        grad.addColorStop(1, 'violet');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, m.circleRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect === 't_rainbow') {
        const grad = ctx.createLinearGradient(-m.circleRadius, -m.circleRadius, m.circleRadius, m.circleRadius);
        grad.addColorStop(0, 'rgba(255,0,0,0.5)');
        grad.addColorStop(0.2, 'rgba(255,165,0,0.5)');
        grad.addColorStop(0.4, 'rgba(255,255,0,0.5)');
        grad.addColorStop(0.6, 'rgba(0,255,0,0.5)');
        grad.addColorStop(0.8, 'rgba(0,0,255,0.5)');
        grad.addColorStop(1, 'rgba(128,0,128,0.5)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, m.circleRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect === 'dull_rainbow') {
        const grad = ctx.createLinearGradient(-m.circleRadius, -m.circleRadius, m.circleRadius, m.circleRadius);
        grad.addColorStop(0, '#e8a7a1');
        grad.addColorStop(0.2, '#e2c29d');
        grad.addColorStop(0.4, '#e5e5a2');
        grad.addColorStop(0.6, '#a1dca2');
        grad.addColorStop(0.8, '#9ecce2');
        grad.addColorStop(1, '#ccaee5');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, m.circleRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect === 'rgb') {
        // Render 3 color slices inside wheel
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, m.circleRadius, 0, (Math.PI * 2) / 3);
        ctx.fill();
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, m.circleRadius, (Math.PI * 2) / 3, (Math.PI * 4) / 3);
        ctx.fill();
        
        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, m.circleRadius, (Math.PI * 4) / 3, Math.PI * 2);
        ctx.fill();
      } else if (effect === 'blurred') {
        ctx.shadowColor = m.marbleColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = m.marbleColor;
        ctx.beginPath();
        ctx.arc(0, 0, m.circleRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw crisp black outer border ring on the marble
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, m.circleRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw internal rotational indicator dot (so we see the physics rotation)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(m.circleRadius / 2, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // 3. Draw red floating bouncing indicator arrow above player's racer
      if (m.id === this.playerRacerId || m.isPlayer) {
        ctx.save();
        ctx.translate(m.position.x, m.position.y);
        
        const bounce = Math.sin(Date.now() / 150) * 5;
        const arrowY = -m.circleRadius - 20 + bounce;
        
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(0, arrowY); // Tip
        ctx.lineTo(-8, arrowY - 10);
        ctx.lineTo(-3, arrowY - 10);
        ctx.lineTo(-3, arrowY - 18);
        ctx.lineTo(3, arrowY - 18);
        ctx.lineTo(3, arrowY - 10);
        ctx.lineTo(8, arrowY - 10);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 4. Labeling
      if (this.zoom > 0.6 && !m.finished) {
        ctx.save();
        ctx.translate(m.position.x, m.position.y);
        ctx.font = 'bold 8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        const nameText = m.marbleName;
        const textWidth = ctx.measureText(nameText).width;
        
        // Draw flat black labeling card
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(-textWidth / 2 - 4, -m.circleRadius - 14, textWidth + 8, 10, 3);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(nameText, 0, -m.circleRadius - 5);
        ctx.restore();
      }
    });
  }

  drawParticles() {
    const { ctx } = this;
    this.updateParticles();
    
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      
      if (p.type === 'spark') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'hazard_spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x - p.radius, p.y);
        ctx.lineTo(p.x + p.radius, p.y);
        ctx.moveTo(p.x, p.y - p.radius);
        ctx.lineTo(p.x, p.y + p.radius);
        ctx.stroke();
      }
      ctx.restore();
    });
  }
}
