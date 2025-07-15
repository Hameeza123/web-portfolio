// --- Main application coordination ---

// --- Animation loop ---
function animate() {
  // Update fluid simulation
  FluidSimulation.step();
  
  // Update droplets
  Droplets.update();
  
  // Draw everything
  FluidSimulation.draw();
  Droplets.draw(FluidSimulation.getContext());
  
  requestAnimationFrame(animate);
}

// --- Mouse click handler for splashes ---
function initMouseClickHandler() {
  const canvas = FluidSimulation.getCanvas();
  
  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add disturbance to water surface
    FluidSimulation.addDisturbance(x, y);
    
    // Create water droplet splash
    const surfaceY = FluidSimulation.getWaterSurfaceY(x);
    Droplets.createSplash(x, surfaceY, 1.5);
  });
}

// --- Initialize everything ---
function init() {
  // Initialize all modules
  FluidSimulation.init();
  Droplets.update(); // Initialize droplets array
  Bubbles.init();
  Animations.initScrollAnimations();
  Animations.initTypedAnimation();
  
  // Initialize mouse click handler
  initMouseClickHandler();
  
  // Start animation loop
  animate();
}

// --- Start when DOM is loaded ---
document.addEventListener('DOMContentLoaded', init); 