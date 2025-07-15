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
  var typed = new Typed('#type-animation', {
    strings: [
      "Mathematician",
      "Physicist", 
      "Musician",
      "Baller"
    ],
    typeSpeed: 50,
    backSpeed: 30,
    backDelay: 1500,
    startDelay: 500,
    loop: true
  });
}

// --- Export functions ---
window.Animations = {
  initScrollAnimations: initScrollAnimations,
  initTypedAnimation: initTypedAnimation
}; 