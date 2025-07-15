// --- Bubble trail for non-hero sections ---
// === BUBBLE CONFIGURATION ===
const BUBBLE_CONFIG = {
  size: {
    min: 5,
    max: 12
  },
  frequency: 0.25, // 0-1, higher = more bubbles
  opacity: {
    min: 0.15,
    max: 0.4
  },
  animation: {
    duration: 1200, // ms
    fadeDelay: 10,  // ms
    driftDistance: {
      min: 30,
      max: 60
    },
    scaleRange: {
      min: 0.6,
      max: 1.2
    }
  },
  colors: {
    primary: 'rgba(200, 230, 255, 0.8)',
    secondary: 'rgba(120, 180, 220, 0.27)',
    glow: 'rgba(180, 220, 255, 0.33)'
  }
};

let bubbleActive = false;
let bubbles = [];

function createBubble(x, y) {
  // Random frequency check
  if (Math.random() > BUBBLE_CONFIG.frequency) return;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  const size = BUBBLE_CONFIG.size.min + Math.random() * (BUBBLE_CONFIG.size.max - BUBBLE_CONFIG.size.min);
  bubble.style.width = bubble.style.height = size + 'px';
  bubble.style.left = (x - size/2) + 'px';
  bubble.style.top = (y - size/2) + 'px';
  bubble.style.opacity = BUBBLE_CONFIG.opacity.min + Math.random() * (BUBBLE_CONFIG.opacity.max - BUBBLE_CONFIG.opacity.min);
  document.body.appendChild(bubble);
  bubbles.push(bubble);
  
  setTimeout(() => {
    bubble.style.opacity = 0;
    const driftY = BUBBLE_CONFIG.animation.driftDistance.min + Math.random() * (BUBBLE_CONFIG.animation.driftDistance.max - BUBBLE_CONFIG.animation.driftDistance.min);
    const scale = BUBBLE_CONFIG.animation.scaleRange.min + Math.random() * (BUBBLE_CONFIG.animation.scaleRange.max - BUBBLE_CONFIG.animation.scaleRange.min);
    bubble.style.transform = `translateY(-${driftY}px) scale(${scale})`;
    setTimeout(() => {
      bubble.remove();
      bubbles = bubbles.filter(b => b !== bubble);
    }, BUBBLE_CONFIG.animation.duration);
  }, BUBBLE_CONFIG.animation.fadeDelay);
}

function onBubbleMouseMove(e) {
  if (!bubbleActive) return;
  createBubble(e.clientX, e.clientY);
}

function initBubbles() {
  // Activate bubble effect only on .fullpage-section
  document.querySelectorAll('.fullpage-section').forEach(section => {
    section.addEventListener('mouseenter', () => { bubbleActive = true; });
    section.addEventListener('mouseleave', () => { bubbleActive = false; });
    section.addEventListener('mousemove', onBubbleMouseMove);
  });
}

// --- Export functions ---
window.Bubbles = {
  init: initBubbles,
  create: createBubble,
  onMouseMove: onBubbleMouseMove
}; 