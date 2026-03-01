// --- Wind Lines System ---
let windLines = [];
let windDirection = 1;

class WindLine {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = windDirection > 0 ? -50 : window.innerWidth + 50;
    this.y = Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.1;
    this.speed = 1.0 + Math.random() * 2.0;
    this.length = 25 + Math.random() * 35;
    this.opacity = 0.15 + Math.random() * 0.25;
  }
  
  update() {
    this.x += this.speed * windDirection;
    
    if ((windDirection > 0 && this.x > window.innerWidth + 50) || 
        (windDirection < 0 && this.x < -50)) {
      this.reset();
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.length * windDirection, this.y);
    ctx.stroke();
    ctx.restore();
  }
}

function initWindLines() {
  // Initialize wind lines
  for (let i = 0; i < 12; i++) {
    windLines.push(new WindLine());
  }
  
  // Update wind direction periodically
  setInterval(() => {
    windDirection = Math.random() > 0.5 ? 1 : -1;
    windLines.forEach(line => line.reset());
  }, 4000);
}

function updateWindLines() {
  windLines.forEach(line => line.update());
}

function drawWindLines(ctx) {
  windLines.forEach(line => line.draw(ctx));
}

// --- Export functions ---
window.WindLines = {
  init: initWindLines,
  update: updateWindLines,
  draw: drawWindLines
}; 