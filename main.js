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
    Droplets.createSplash(x, surfaceY,1.5);
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
  // Animations.initHeroTitleFallAway(); // Removed, no hero animation
  
  // Initialize mouse click handler
  initMouseClickHandler();
  
  // Start animation loop
  animate();
}

// --- Three.js Star animation for hero section ---
function createCircleTexture() {
  const size = 512; // Ultra-high resolution for sharp, smooth stars
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Draw a huge, soft, glowing circle
  const gradient = ctx.createRadialGradient(
    size/2, size/2, size*0.05, // tiny bright center
    size/2, size/2, size/2     // huge soft edge
  );
  gradient.addColorStop(0, 'rgba(255,255,255,1)');      // super bright center
  gradient.addColorStop(0.15, 'rgba(255,255,255,0.8)'); // strong white
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.25)'); // soft white
  gradient.addColorStop(1, 'rgba(255,255,255,0)');      // transparent edge

  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
  ctx.fillStyle = gradient;
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function initThreeStars() {
  const container = document.getElementById('star-canvas');
  if (!container) {
    return;
  }

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Create stars with size variation using multiple materials
  const STAR_COUNT = 1200;
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const twinkles = new Float32Array(STAR_COUNT);
  const opacities = new Float32Array(STAR_COUNT);
  const starSizes = new Float32Array(STAR_COUNT); // Track which size group each star belongs to

  // Create stars with size variation
  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3;
  
    // x, z: uniform in [-16, 16]
    positions[i3    ] = (Math.random() - 0.5) * 64;
    positions[i3 + 2] = 0 
  
    // y: uniform in the top 30% of [-16,16]
    let yFrac = Math.abs(gaussianRandom(0, 0.6));     
    positions[i3 + 1] = 7.6 - 4*yFrac
    
    // white colour
    colors[i3    ] = 1;
    colors[i3 + 1] = 1;
    colors[i3 + 2] = 1;
  
    // Assign random size group (0=small, 1=medium)
    starSizes[i] = Math.floor(Math.random() * 2);
  
    // twinkle phase
    twinkles[i] = Math.random() * Math.PI * 2;
  }

  // Create materials for different star sizes - only small and medium
  const smallMaterials = [];
  const mediumMaterials = [];

  // Create individual materials for each star
  for (let i = 0; i < STAR_COUNT; i++) {
    const sizeGroup = starSizes[i];
    
    if (sizeGroup === 0) {
      smallMaterials.push(new THREE.PointsMaterial({
        size: 0.2, // HEREEEEEEEEEE HERO STAR SMALL SIZE
        vertexColors: true,
        transparent: true,
        map: createCircleTexture(),
        alphaTest: 0.01,
        sizeAttenuation: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
      }));
    } else {
      mediumMaterials.push(new THREE.PointsMaterial({
        size: 0.8, // HEREEEEEEEEEE HERO STAR MEDIUM SIZE
        vertexColors: true,
        transparent: true,
        map: createCircleTexture(),
        alphaTest: 0.01,
        sizeAttenuation: false,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
      }));
    }
  }

  // Create separate geometries for each size group
  const smallPositions = [];
  const smallColors = [];
  const smallTwinkles = [];

  const mediumPositions = [];
  const mediumColors = [];
  const mediumTwinkles = [];

  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3;
    const sizeGroup = starSizes[i];
    
    if (sizeGroup === 0) {
      // Small stars
      smallPositions.push(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      smallColors.push(colors[i3], colors[i3 + 1], colors[i3 + 2]);
      smallTwinkles.push(twinkles[i]);
    } else {
      // Medium stars
      mediumPositions.push(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      mediumColors.push(colors[i3], colors[i3 + 1], colors[i3 + 2]);
      mediumTwinkles.push(twinkles[i]);
    }
  }

  // Create individual star objects
  const smallStars = [];
  const mediumStars = [];

  // Create small stars
  for (let i = 0; i < smallPositions.length / 3; i++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      smallPositions[i * 3], smallPositions[i * 3 + 1], smallPositions[i * 3 + 2]
    ]), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1]), 3));
    
    const star = new THREE.Points(geometry, smallMaterials[i]);
    scene.add(star);
    smallStars.push(star);
  }

  // Create medium stars
  for (let i = 0; i < mediumPositions.length / 3; i++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      mediumPositions[i * 3], mediumPositions[i * 3 + 1], mediumPositions[i * 3 + 2]
    ]), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1]), 3));
    
    const star = new THREE.Points(geometry, mediumMaterials[i]);
    scene.add(star);
    mediumStars.push(star);
  }



  // Debug output
  console.log('Hero stars created:', STAR_COUNT);

  camera.position.z = 10; // Initial render
  renderer.render(scene, camera);

  // Animation
  function animateStars() {
    requestAnimationFrame(animateStars);
    
    // Debug: log animation frame
    if (Math.random() < 0.01) { // Log ~1% of frames
      console.log('Hero animation running');
    }
    
    // Animate small stars
    for (let i = 0; i < smallStars.length; i++) {
      smallTwinkles[i] += 0.02; // Same speed as top page
      const alpha = 0.5 + 0.5 * Math.sin(smallTwinkles[i]); // Smooth fade (0.0 to 1.0)
      const fade = 1 - (smallPositions[i * 3 + 1] / 8);
      const finalAlpha = Math.max(0.0, alpha * fade); // Can go completely transparent
      
      smallMaterials[i].opacity = finalAlpha;
    }
    
    // Animate medium stars
    for (let i = 0; i < mediumStars.length; i++) {
      mediumTwinkles[i] += 0.02; // Same speed as top page
      const alpha = 0.5 + 0.5 * Math.sin(mediumTwinkles[i]); // Smooth fade (0.0 to 1.0)
      const fade = 1 - (mediumPositions[i * 3 + 1] / 8);
      const finalAlpha = Math.max(0.0, alpha * fade); // Can go completely transparent
      
      mediumMaterials[i].opacity = finalAlpha;
    }
    

    
    renderer.render(scene, camera);
  }

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animateStars();
}

// --- Three.js Star animation for top page ---
function initThreeTopStars() {
  const container = document.getElementById('star-canvas-top');
  if (!container) {
    return;
  }

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Create stars
  const STAR_COUNT = 5000;
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const alphas = new Float32Array(STAR_COUNT);
  const twinkles = new Float32Array(STAR_COUNT);
  const sizes = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 48; // x
    positions[i3 + 1] = (Math.random() - 0.5) * 32; // y (full height)
    positions[i3 + 2] = 1 + Math.random() * 6; // z (random between 1 and 8)
    
    // Size based on Y position - smaller stars at bottom, larger at top
    const yPos = positions[i3 + 1];
    const normalizedY = (yPos + 16) / 32; // Convert from -16 to 16 range to 0-1
    let starSize;
    
    if (normalizedY < 0.3) {
      // Bottom 30% - only small stars
      starSize = 0.1 + Math.random() * 0.1; // 0.1 to 0.2
    } else if (normalizedY < 0.7) {
      // Middle 40% - small and medium stars
      starSize = Math.random() < 0.7 ? 
        (0.1 + Math.random() * 0.1) : // 70% small (0.1 to 0.2)
        (0.3 + Math.random() * 0.2);  // 30% medium (0.3 to 0.5)
    } else if (normalizedY < 0.95) {
      // Top 25% (excluding top 5%) - only small and medium stars
      const rand = Math.random();
      if (rand < 0.7) {
        starSize = 0.1 + Math.random() * 0.1; // 70% small (0.1 to 0.2)
      } else {
        starSize = 0.3 + Math.random() * 0.2; // 30% medium (0.3 to 0.5)
      }
    } else {
      // Top 5% - only small and medium stars
      const rand = Math.random();
      if (rand < 0.7) {
        starSize = 0.1 + Math.random() * 0.1; // 70% small (0.1 to 0.2)
      } else {
        starSize = 0.3 + Math.random() * 0.2; // 30% medium (0.3 to 0.5)
      }
    }
    
    sizes[i] = starSize;
    colors[i3] = 1; // r
    colors[i3 + 1] = 1; // g
    colors[i3 + 2] = 1; // b
    alphas[i] = 1.0;
    twinkles[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Custom shader material for per-star alpha
  const material = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: createCircleTexture() }
    },
    vertexShader: `
      attribute float alpha;
      attribute float size;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vAlpha = alpha;
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 0.4 * 100.0 / -mvPosition.z; // Use individual star sizes
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D pointTexture;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        vec4 texColor = texture2D(pointTexture, gl_PointCoord);
        gl_FragColor = vec4(min(vColor * 2.5, 1.0), vAlpha) * texColor;
        if (gl_FragColor.a < 0.01) discard;
      }
    `,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);

  camera.position.z = 10; // Initial render
  renderer.render(scene, camera);

  // Animation
  function animateStars() {
    requestAnimationFrame(animateStars);
    const alphas = geometry.attributes.alpha.array;
    for (let i = 0; i < STAR_COUNT; i++) {
      twinkles[i] += 0.02;
      const alpha = 0.5 + 0.5 * Math.sin(twinkles[i]);
      alphas[i] = Math.max(0.0, alpha); // Fade in/out smoothly
    }
    geometry.attributes.alpha.needsUpdate = true;
    renderer.render(scene, camera);
  }

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animateStars();
}

// --- Gaussian random helper ---
function gaussianRandom(mean = 0, stddev = 1) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// --- Start when DOM is loaded ---
document.addEventListener('DOMContentLoaded', () => {
  // Random background selection
  const backgrounds = [
    'linear-gradient(180deg, #1d232b 0%,#2a2339 70%, #5a3f19 100%)',
    'linear-gradient(180deg, #bccadc 0%,#8ab5d4 70%, #315f86 100%)',
    'linear-gradient(180deg, #e7d49b 0%,#95400e 70%, #3b290f 100%)'
  ];
  
  const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  const fluidCanvas = document.getElementById('fluid-canvas');
  if (fluidCanvas) {
    fluidCanvas.style.background = randomBackground;
  }
  
  // Update top page background to match the first color of the selected gradient
  const topPage = document.querySelector('.page-top');
  if (topPage) {
    // Extract the first color from the gradient
    let firstColor;
    if (randomBackground.includes('#1d232b')) {
      firstColor = '#1d232b';
    } else if (randomBackground.includes('#bccadc')) {
      firstColor = '#bccadc';
    } else if (randomBackground.includes('#e7d49b')) {
      firstColor = '#e7d49b';
    }
    
    if (firstColor) {
      topPage.style.background = `linear-gradient(180deg, ${firstColor} 100%, #000 0%)`;
    }
  }
  
  init();
  initThreeStars();
  initThreeTopStars();
  
  // Hamburger menu functionality
  const hamburger = document.querySelector('.hamburger-menu');
  const navMenu = document.querySelector('.nav-menu');
  
  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
  
  // Auto-scroll to hero section on page load
  setTimeout(() => {
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
}); 