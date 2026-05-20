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
    
    // Particle pool
    this.particles = [];
    
    // Resize bindings
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  // Convert screen coordinates to world coordinates (taking pan/zoom into account)
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.canvas.width / 2 - this.panX) / this.zoom + this.canvas.width / 2,
      y: (screenY - this.canvas.height / 2 - this.panY) / this.zoom + this.canvas.height / 2
    };
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.canvas.width / 2) * this.zoom + this.canvas.width / 2 + this.panX,
      y: (worldY - this.canvas.height / 2) * this.zoom + this.canvas.height / 2 + this.panY
    };
  }

  // Add celebratory particles when goal reached
  spawnGoalExplosion(pos, color) {
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // Slight upward bias
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

  // Add spark particles when hazard reset triggered
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

  // Focus camera tracking on the lead marble
  trackLeadMarble(marbles) {
    if (!this.isTrackingLead || marbles.length === 0) return;
    
    // Find lead marble: dynamic Y coord (highest value means lowest on screen, meaning further down the race)
    const activeMarbles = marbles.filter(m => !m.finished);
    if (activeMarbles.length === 0) return;
    
    let lead = activeMarbles[0];
    activeMarbles.forEach((m) => {
      if (m.position.y > lead.position.y) {
        lead = m;
      }
    });

    // Smoothly pan camera to center lead marble
    const targetPanX = -(lead.position.x - this.canvas.width / 2) * this.zoom;
    const targetPanY = -(lead.position.y - this.canvas.height / 2 - 100) * this.zoom; // Offset slightly down

    this.panX += (targetPanX - this.panX) * 0.08;
    this.panY += (targetPanY - this.panY) * 0.08;
  }

  // Central Draw method called every frame
  draw(simulator, activeDrawing) {
    const { ctx, canvas } = this;
    
    // Clear canvas
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update camera tracking
    if (simulator.marbles.length > 0) {
      this.trackLeadMarble(simulator.marbles);
    }
    
    // Save state and apply translations
    ctx.save();
    ctx.translate(canvas.width / 2 + this.panX, canvas.height / 2 + this.panY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // 1. Draw Grid
    this.drawGrid();
    
    // 2. Draw static elements (walls, goals, hazards, spawner)
    this.drawStaticElements(simulator.staticElements);
    
    // 3. Draw active drawing path
    if (activeDrawing) {
      this.drawActivePath(activeDrawing);
    }
    
    // 4. Draw marbles and trails
    this.drawMarbles(simulator.marbles);
    
    // 5. Draw particles
    this.drawParticles();
    
    // Restore state
    ctx.restore();
  }

  drawGrid() {
    const { ctx, canvas } = this;
    const gridSpacing = 40;
    
    // Find boundaries of canvas under transform
    const worldTopLeft = this.screenToWorld(0, 0);
    const worldBottomRight = this.screenToWorld(canvas.width, canvas.height);
    
    const startX = Math.floor(worldTopLeft.x / gridSpacing) * gridSpacing;
    const endX = Math.ceil(worldBottomRight.x / gridSpacing) * gridSpacing;
    const startY = Math.floor(worldTopLeft.y / gridSpacing) * gridSpacing;
    const endY = Math.ceil(worldBottomRight.y / gridSpacing) * gridSpacing;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    
    // Draw outer boundary warning lines (soft)
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.07)';
    ctx.strokeRect(0, 0, 1200, 2000);
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
        // Drop shadow styling for 3D appearance
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 4;
        ctx.strokeStyle = '#181b24';
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#05070a';
        ctx.lineWidth = thickness - 4;
        ctx.stroke();
      } else if (el.type === 'goal') {
        // Glowing Neon Green Zone
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.8)';
        ctx.stroke();
        
        // Dynamic dashed center core
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 12]);
        ctx.lineDashOffset = (Date.now() / 150) % 20;
        ctx.stroke();
      } else if (el.type === 'hazard') {
        // Pulsing Neon Red Hazard Zone
        const pulse = 6 + Math.sin(Date.now() / 120) * 4;
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = pulse;
        ctx.strokeStyle = 'rgba(255, 51, 102, 0.7)';
        ctx.stroke();
        
        // Hazard hatch stripes
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = thickness - 4;
        ctx.setLineDash([4, 10]);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  drawSpawner(spawner) {
    const { ctx } = this;
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.08;
    const r = spawner.radius || 15;
    
    ctx.save();
    ctx.translate(spawner.x, spawner.y);
    ctx.scale(pulse, pulse);
    
    // Outer glow ring
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = (Date.now() / 300) % 12;
    ctx.beginPath();
    ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner core
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255, 230, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw an 'S' symbol
    ctx.fillStyle = '#ffe600';
    ctx.font = 'bold 11px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPAWN', 0, 0);
    
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    } else if (tool === 'goal') {
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.4)';
    } else if (tool === 'hazard') {
      ctx.strokeStyle = 'rgba(255, 51, 102, 0.4)';
    } else if (tool === 'eraser') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    }
    
    ctx.stroke();
    ctx.restore();
  }

  drawMarbles(marbles) {
    const { ctx } = this;
    
    marbles.forEach((m) => {
      // 1. Draw Motion Trail
      if (m.trail && m.trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(m.trail[0].x, m.trail[0].y);
        for (let i = 1; i < m.trail.length; i++) {
          ctx.lineTo(m.trail[i].x, m.trail[i].y);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = m.circleRadius * 1.2;
        
        // Gradient fading trail
        const gradient = ctx.createLinearGradient(
          m.trail[0].x, m.trail[0].y, 
          m.position.x, m.position.y
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `${m.marbleColor}33`); // add hex alpha
        
        ctx.strokeStyle = gradient;
        ctx.stroke();
        ctx.restore();
      }
      
      // 2. Draw Sphere Body
      ctx.save();
      ctx.translate(m.position.x, m.position.y);
      ctx.rotate(m.angle);
      
      // Radial glow gradient for premium sphere shading
      const glowGrad = ctx.createRadialGradient(
        -m.circleRadius / 3, -m.circleRadius / 3, 1,
        0, 0, m.circleRadius
      );
      
      if (m.finished) {
        // Ghost/transparent glow after crossing goal line
        glowGrad.addColorStop(0, '#ffffff');
        glowGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
        glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      } else {
        glowGrad.addColorStop(0, '#ffffff');
        glowGrad.addColorStop(0.2, m.marbleColor);
        glowGrad.addColorStop(0.8, darkenColor(m.marbleColor, 40));
        glowGrad.addColorStop(1, '#000000');
      }
      
      ctx.shadowColor = m.finished ? '#ffffff' : m.marbleColor;
      ctx.shadowBlur = m.finished ? 4 : 8;
      
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, m.circleRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Fine border ring
      ctx.shadowBlur = 0;
      ctx.strokeStyle = m.finished ? 'rgba(255,255,255,0.4)' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, m.circleRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw internal flag/emoji details (un-rotated text overlay so text remains upright)
      ctx.restore();
      
      ctx.save();
      ctx.translate(m.position.x, m.position.y);
      
      if (m.marbleEmoji) {
        // Draw emoji overlay
        ctx.font = `${m.circleRadius * 1.3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.marbleEmoji, 0, 0.5); // Tiny vertical adjustment
      } else {
        // Standard neon center dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-m.circleRadius / 4, -m.circleRadius / 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Display small name pill above lead/racing marbles if camera is zoomed enough
      if (this.zoom > 0.6 && !m.finished) {
        ctx.font = 'bold 8px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        
        // Text background pill
        const nameText = m.marbleName;
        const textWidth = ctx.measureText(nameText).width;
        ctx.fillStyle = 'rgba(11, 15, 25, 0.75)';
        ctx.beginPath();
        ctx.roundRect(-textWidth / 2 - 4, -m.circleRadius - 14, textWidth + 8, 10, 4);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.fillText(nameText, 0, -m.circleRadius - 5);
      }
      ctx.restore();
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
        // Drawing tiny cross sparks
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

// Utility to darken a hex color (for spherical shades)
function darkenColor(hex, percent) {
  // Simple check
  if (!hex || hex.charAt(0) !== '#') return hex;
  
  let num = parseInt(hex.slice(1), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      G = (num >> 8 & 0x00FF) - amt,
      B = (num & 0x0000FF) - amt;
      
  return '#' + (0x1000000 + 
    (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 + 
    (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 + 
    (B < 0 ? 0 : B > 255 ? 255 : B)
  ).toString(16).slice(1);
}
