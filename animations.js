// --- Scroll-triggered animations ---
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, observerOptions);

  // Observe all animated elements
  document.querySelectorAll('.section-title, .about-text p, .stat-item, .experience-card, .project-card, .skill-category').forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
}

// --- Typed.js animation for tagline ---
function initTypedAnimation() {
  var options = {
    strings: [
      'Hamza',
      'حمزة',
      'Хамза',
      'হামজা',
      // '哈姆扎', // Chinese
      '함자',   // Korean
      'Sa Lâm'
    ],
    typeSpeed: 70,
    backSpeed: 40,
    backDelay: 1400,
    loop: true,
    showCursor: true,
    cursorChar: '|',
    smartBackspace: false
  };
  var typed = new Typed('#type-animation', options);
}

// --- Export functions ---
window.Animations = {
  initScrollAnimations: initScrollAnimations,
  initTypedAnimation: initTypedAnimation
}; 