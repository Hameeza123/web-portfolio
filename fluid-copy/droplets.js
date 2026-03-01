// --- Water droplets system ---
let droplets = [];

class Droplet {
  constructor(x, y, velocityX, velocityY) {
    this.x = x;
    this.y = y;
    this.vx = velocityX;
    this.vy = velocityY;
    this.size = Math.random() * 2; // Smaller droplets
    this.life = 1.0;
    this.decay = 0.02 + Math.random() * 0.035; // Faster decay
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // reduced gravity - gives more time to go up
    this.vx *= 0.98; // slight air resistance
    this.life -= this.decay;
  }
  
  draw(ctx) {
    if (this.life <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}

function createSplash(x, y, intensity) {
  const dropletCount = Math.floor(intensity * 4);
  for (let i = 0; i < dropletCount; i++) {
    // Angle between -45 and +45 degrees from vertical (upward and outward)
    const angle = (Math.PI / 2) + ((Math.random() - 0.5) * (Math.PI / 4));
    const speed = 2 + Math.random() * 4; // Stronger initial speed
    const vx = Math.cos(angle) * speed;
    const vy = -Math.sin(angle) * speed - 1; // Negative for upward movement
    droplets.push(new Droplet(x, y, vx, vy));
  }
}

function updateDroplets() {
  droplets = droplets.filter(droplet => {
    droplet.update();
    return droplet.life > 0;
  });
}

function drawDroplets(ctx) {
  droplets.forEach(droplet => droplet.draw(ctx));
}

// --- Export functions ---
window.Droplets = {
  createSplash: createSplash,
  update: updateDroplets,
  draw: drawDroplets
}; 