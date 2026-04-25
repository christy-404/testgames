/**
 * Main Shared JavaScript
 * Emmanuel's First Holy Communion Website
 */

(function() {
  'use strict';

  // ---- Scroll Reveal ----
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  }

  // ---- Page Transition ----
  function initPageTransitions() {
    const transition = document.getElementById('pageTransition');
    const links = document.querySelectorAll('a[data-navigate]');

    if (!transition || !links.length) return;

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http')) return;

        e.preventDefault();
        transition.classList.add('active');

        setTimeout(() => {
          window.location.href = href;
        }, 500);
      });
    });

    // Fade in on load
    window.addEventListener('pageshow', () => {
      transition.classList.remove('active');
    });
  }

  // ---- Smooth Scroll for Anchors ----
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ---- Nav Background on Scroll ----
  function initNavScroll() {
    const nav = document.querySelector('.top-nav');
    if (!nav) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 50) {
        nav.style.background = 'rgba(2, 6, 23, 0.9)';
        nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
      } else {
        nav.style.background = 'rgba(2, 6, 23, 0.7)';
        nav.style.boxShadow = 'none';
      }
      lastScroll = currentScroll;
    });
  }

  // ---- Utility: Debounce ----
  window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // ---- Utility: Random Integer ----
  window.randomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // ---- Utility: Shuffle Array ----
  window.shuffleArray = function(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // ---- Initialize ----
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initPageTransitions();
    initSmoothScroll();
    initNavScroll();
  });
})();

