// --- Fluid Simulation Parameters ---
const N = 200; // number of points
const dx = 1.0;
const dt = 0.06; // smaller time step for smoother animation
const g = 1; // gravity (slower)
const damping = 0.9993; // more damping

// --- State arrays ---
let h = new Array(N).fill(0); // height
let v = new Array(N).fill(0); // velocity

// --- Gentle random wave state ---
let waveTime = 0;

// --- Canvas setup ---
let canvas, ctx;

// --- Mouse interaction ---
let mouseX = null, mouseY = null, mouseDown = false;

// --- Initialize fluid simulation ---
function initFluidSimulation() {
  canvas = document.getElementById('fluid-canvas');
  ctx = canvas.getContext('2d');
  
  // --- Initial perturbations: Gaussian bump, random bumps, and a sine wave ---
  for (let i = 0; i < N; i++) {
    const x = (i - N/2) / 10;
    h[i] = Math.exp(-x*x) * 18; // Gaussian bump
    h[i] += Math.sin(i * Math.PI * 2 / N * 3) * 6; // Sine wave
    h[i] += (Math.random() - 0.5) * 1.2; // Reduced random noise
  }
  
  // --- Mouse event listeners ---
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  
  canvas.addEventListener('mouseleave', () => {
    mouseX = null;
    mouseY = null;
  });
  
  canvas.addEventListener('mousedown', () => mouseDown = true);
  canvas.addEventListener('mouseup', () => mouseDown = false);
  
  // --- Resize handler ---
  function resize() {
    const hero = document.querySelector('.hero-section');
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);
}

// --- Simulation step ---
function stepFluid() {
  // Gentle random waves
  waveTime += 0.012;
  for (let i = 0; i < N; i++) {
    // Sum of 3 smooth sine waves with different frequencies and slow phase drift
    const t = waveTime;
    const x = i / N;
    const wave =
      2.5 * Math.sin(2 * Math.PI * (x * 0.7 + t * 0.18)) +
      1.5 * Math.sin(2 * Math.PI * (x * 1.3 - t * 0.11)) +
      1.0 * Math.sin(2 * Math.PI * (x * 2.1 + t * 0.07));
    h[i] += wave * 0.012; // Small amplitude
  }
  
  // Mouse gravity well: smoothly pull fluid toward mouse if near surface
  const waterVolume = 0.12; // match draw()
  const y0 = canvas.height * (1 - waterVolume);
  if (mouseX !== null && mouseY !== null) {
    const i = Math.floor((mouseX / canvas.width) * N);
    if (i > 2 && i < N-2) {
      const surfaceY = y0 + h[i];
      if (Math.abs(mouseY - surfaceY) < 100) {
        const strength = 0.07 * (1 - Math.abs(mouseY - surfaceY) / 60);
        v[i] += (mouseY - surfaceY) * strength * (mouseDown ? 2.5 : 1.0);
      }
    }
  }
  
  // Update velocity (finite difference Laplacian)
  for (let i = 1; i < N-1; i++) {
    v[i] += g * (h[i-1] + h[i+1] - 2*h[i]) / (dx*dx) * dt;
    v[i] *= damping;
  }
  
  // Update height
  for (let i = 1; i < N-1; i++) {
    h[i] += v[i] * dt;
  }
  
  // Conserve water volume: subtract mean from all h[i]
  const mean = h.reduce((a, b) => a + b, 0) / N;
  for (let i = 0; i < N; i++) {
    h[i] -= mean;
  }
  
  // Smooth the surface (gentler weighted average, 1 pass)
  let hSmooth = h.slice();
  for (let i = 1; i < N-1; i++) {
    h[i] = 0.25 * hSmooth[i-1] + 0.5 * hSmooth[i] + 0.25 * hSmooth[i+1];
  }
  // Dampen the corners so they oscillate but stay near zero
  h[0] *= 0.7;
  h[N-1] *= 0.7;
  // Clamp the water surface so it never goes below the bottom of the canvas
  const minMargin = 2;
  const maxH = canvas.height - minMargin - y0;
  for (let i = 0; i < N; i++) {
    if (h[i] > maxH) h[i] = maxH;
  }
}

// --- Draw the fluid surface ---
function drawFluid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.beginPath();
  const waterVolume = 0.16;
  const y0 = canvas.height * (1 - waterVolume);
  ctx.moveTo(0, y0 + h[0]);
  for (let i = 1; i < N; i++) {
    const x = (i / (N-1)) * canvas.width;
    ctx.lineTo(x, y0 + h[i]);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  // Water fill: use CSS custom properties for gradient stops
  const styles = getComputedStyle(document.documentElement);
  const stop1 = styles.getPropertyValue('--water-gradient-stop1').trim();
  const stop2 = styles.getPropertyValue('--water-gradient-stop2').trim();
  const stop3 = styles.getPropertyValue('--water-gradient-stop3').trim();
  const stop4 = styles.getPropertyValue('--water-gradient-stop4').trim();
  const stop5 = styles.getPropertyValue('--water-gradient-stop5').trim();
  const stop6 = styles.getPropertyValue('--water-gradient-stop6').trim();
  const grad = ctx.createLinearGradient(0, y0, 0, canvas.height);
  grad.addColorStop(0, stop1);
  grad.addColorStop(0.2, stop2);
  grad.addColorStop(0.45, stop3);
  grad.addColorStop(0.7, stop4);
  grad.addColorStop(0.85, stop5);
  grad.addColorStop(1, stop6);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
  // Draw the surface line (less contrast)
  ctx.beginPath();
  ctx.moveTo(0, y0 + h[0]);
  for (let i = 1; i < N; i++) {
    const x = (i / (N-1)) * canvas.width;
    ctx.lineTo(x, y0 + h[i]);
  }
  ctx.strokeStyle = 'rgba(200,220,230,0.32)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Draw highlight along the surface (very subtle)
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < N; i += 2) {
    const x = (i / (N-1)) * canvas.width;
    const y = y0 + h[i] - 6;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(220,220,255,0.08)';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
  // Optional: faint reflection below the surface (even more subtle)
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < N; i += 2) {
    const x = (i / (N-1)) * canvas.width;
    const y = y0 + h[i] + 12;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(200,220,255,0.03)';
  ctx.lineWidth = 7;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
  // Draw mouse gravity well indicator (less contrast)
  if (mouseX !== null && mouseY !== null) {
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = mouseDown ? 'rgba(200,220,255,0.18)' : 'rgba(200,220,255,0.09)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,220,255,0.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // --- Draw the Thousand Sunny image as the boat ---
  if (!window._thousSunnyImg) {
    window._thousSunnyImg = new Image();
    window._thousSunnyImg.src = 'thous_sunny.png';
  }
  const img = window._thousSunnyImg;
  if (img.complete && img.naturalWidth > 0) {
    // Reasonable display size for the boat
    const boatWidth = 180;
    const boatHeight = 165;
    const boatX = canvas.width * 0.75;
    const i = Math.floor((boatX / canvas.width) * (N - 1));
    // Place the boat so its bottom touches the water
    const boatY = y0 + h[i] - boatHeight / 2 + 18;
    const t = performance.now() * 0.001;
    const rock = Math.sin(t * 1.2) * 8; // pixels
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(boatX, boatY + rock);
    ctx.rotate(Math.sin(t * 1.2) * 0.07);
    ctx.drawImage(
      img,
      0, 0, img.naturalWidth, img.naturalHeight, // source rect
      -boatWidth/2, -boatHeight/2, boatWidth, boatHeight // dest rect
    );
    ctx.restore();
  }
}

// --- Add disturbance to water surface ---
function addDisturbance(x, y) {
  const i = Math.floor((x / canvas.width) * N);
  
  if (i > 2 && i < N-2) {
    h[i-2] += 10;
    h[i-1] += 18;
    h[i]   += 28;
    h[i+1] += 18;
    h[i+2] += 10;
  }
}

// --- Get water surface position for splash creation ---
function getWaterSurfaceY(x) {
  const waterVolume = 0.16;
  const y0 = canvas.height * (1 - waterVolume);
  const i = Math.floor((x / canvas.width) * N);
  return y0 + h[i] - 15;
}

// --- Export functions ---
window.FluidSimulation = {
  init: initFluidSimulation,
  step: stepFluid,
  draw: drawFluid,
  addDisturbance: addDisturbance,
  getWaterSurfaceY: getWaterSurfaceY,
  getCanvas: () => canvas,
  getContext: () => ctx
}; 