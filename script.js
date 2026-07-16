// ============================================================
// Trade Marketing Portfolio — Main Script
// Handles navigation, scroll animations, counters, parallax,
// card tilt effects, typed text, and mobile menu.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ===== Constants =====
  const NAV_SCROLL_THRESHOLD = 100;
  const NAV_HEIGHT_OFFSET = 80;
  const COUNTER_DURATION = 2000;
  const TYPING_SPEED = 50;
  const TYPING_START_DELAY = 1000;
  const PARALLAX_FACTOR = 0.3;
  const CARD_TILT_MAX_DEG = 3;
  const REVEAL_THRESHOLD = 0.15;
  const SECTION_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1];
  const PROGRESS_BAR_TRANSITION = '1.5s ease-out';

  // ===== Utility Functions =====

  /**
   * Throttle function — limits execution to once per `limit` ms.
   */
  function throttle(fn, limit) {
    let lastCall = 0;
    let scheduledId = null;
    return function (...args) {
      const now = Date.now();
      const remaining = limit - (now - lastCall);
      if (remaining <= 0) {
        if (scheduledId) {
          cancelAnimationFrame(scheduledId);
          scheduledId = null;
        }
        lastCall = now;
        fn.apply(this, args);
      } else if (!scheduledId) {
        scheduledId = requestAnimationFrame(() => {
          lastCall = Date.now();
          scheduledId = null;
          fn.apply(this, args);
        });
      }
    };
  }

  /**
   * Format a number with commas for thousands separators.
   * Handles decimals correctly.
   */
  function formatNumber(num) {
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /**
   * EaseOutQuart easing — fast start, smooth deceleration.
   */
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  // ===== DOM Elements =====
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelector('.nav__links');
  const navToggle = document.querySelector('.nav__toggle');
  const navLinkItems = document.querySelectorAll('.nav__link');
  const heroParticles = document.querySelector('.hero__particles');
  const heroSection = document.querySelector('.hero') || document.querySelector('#hero');
  const heroTagline = document.querySelector('.hero__tagline');
  const revealElements = document.querySelectorAll('.reveal');
  const counterElements = document.querySelectorAll('.counter');
  const progressBars = document.querySelectorAll('.metric-card__bar-fill');
  const projectCards = document.querySelectorAll('.project-card');
  const campaignCards = document.querySelectorAll('.campaign-card');
  const sections = document.querySelectorAll('section[id]');

  // ===== Navigation — Scroll State =====

  /**
   * Toggle `.nav--scrolled` class based on scroll position.
   */
  function handleNavScroll() {
    if (!nav) return;
    if (window.scrollY > NAV_SCROLL_THRESHOLD) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  // ===== Navigation — Mobile Menu Toggle =====

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('nav__links--open');
      // Toggle aria-expanded for accessibility
      const isOpen = navLinks.classList.contains('nav__links--open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // ===== Navigation — Smooth Scroll & Close Mobile Menu =====

  navLinkItems.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      e.preventDefault();
      const targetId = href.substring(1);
      const targetSection = document.getElementById(targetId);
      if (!targetSection) return;

      const targetPosition =
        targetSection.getBoundingClientRect().top +
        window.pageYOffset -
        NAV_HEIGHT_OFFSET;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });

      // Close mobile menu if open
      if (navLinks) {
        navLinks.classList.remove('nav__links--open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // ===== Active Section Tracking =====

  /**
   * Uses Intersection Observer to track which section is most visible
   * and highlights the corresponding nav link.
   */
  const activeSectionMap = new Map();

  function updateActiveNavLink() {
    let maxRatio = 0;
    let activeId = '';

    activeSectionMap.forEach((ratio, id) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        activeId = id;
      }
    });

    navLinkItems.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${activeId}`) {
        link.classList.add('nav__link--active');
      } else {
        link.classList.remove('nav__link--active');
      }
    });
  }

  if (sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          activeSectionMap.set(entry.target.id, entry.intersectionRatio);
        });
        updateActiveNavLink();
      },
      { threshold: SECTION_THRESHOLDS }
    );

    sections.forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  // ===== Scroll Reveal Animations =====

  /**
   * Intersection Observer that adds `.reveal--visible` when an element
   * becomes 15% visible. Supports staggered delays via CSS classes
   * `.reveal--delay-1` through `.reveal--delay-4`.
   * Each element only reveals once (unobserve after trigger).
   */
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: REVEAL_THRESHOLD }
    );

    revealElements.forEach((el) => {
      revealObserver.observe(el);
    });
  }

  // ===== Animated Counters =====

  /**
   * Animates a counter element from 0 to its `data-target` value
   * using easeOutQuart easing over ~2000ms.
   * Handles decimal numbers and formats with commas.
   */
  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-target'));
    if (isNaN(target)) return;

    const isDecimal = target % 1 !== 0;
    const decimalPlaces = isDecimal
      ? (el.getAttribute('data-target').split('.')[1] || '').length
      : 0;

    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / COUNTER_DURATION, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = easedProgress * target;

      if (isDecimal) {
        el.textContent = formatNumber(currentValue.toFixed(decimalPlaces));
      } else {
        el.textContent = formatNumber(Math.floor(currentValue));
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Ensure final value is exact
        el.textContent = formatNumber(
          isDecimal ? target.toFixed(decimalPlaces) : target
        );
      }
    }

    requestAnimationFrame(step);
  }

  if (counterElements.length > 0) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    counterElements.forEach((el) => {
      counterObserver.observe(el);
    });
  }

  // ===== Progress Bar Animation =====

  /**
   * Animates `.metric-card__bar-fill` width from 0 to its
   * `data-width` value with a smooth 1.5s transition.
   */
  if (progressBars.length > 0) {
    // Set initial width to 0
    progressBars.forEach((bar) => {
      bar.style.width = '0%';
      bar.style.transition = `width ${PROGRESS_BAR_TRANSITION}`;
    });

    const progressObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targetWidth = entry.target.getAttribute('data-width') || '0%';
            // Small delay to ensure the transition fires
            requestAnimationFrame(() => {
              entry.target.style.width = targetWidth;
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    progressBars.forEach((bar) => {
      progressObserver.observe(bar);
    });
  }

  // ===== Parallax Effect on Hero =====

  /**
   * Applies a subtle translateY parallax to `.hero__particles`
   * based on scroll position, only while the hero section is in view.
   */
  let heroInView = true;
  let parallaxTicking = false;

  function updateParallax() {
    if (!heroParticles || !heroInView) return;
    const scrollY = window.scrollY;
    heroParticles.style.transform = `translateY(${scrollY * PARALLAX_FACTOR}px)`;
    parallaxTicking = false;
  }

  function onParallaxScroll() {
    if (!heroParticles) return;
    if (!parallaxTicking) {
      parallaxTicking = true;
      requestAnimationFrame(updateParallax);
    }
  }

  // Track hero visibility for parallax performance
  if (heroSection && heroParticles) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          heroInView = entry.isIntersecting;
        });
      },
      { threshold: 0 }
    );
    heroObserver.observe(heroSection);
  }

  // ===== Typed Text Effect =====

  /**
   * Types out `.hero__tagline` text character by character.
   * Shows a blinking cursor during and after typing.
   */
  function initTypedText() {
    if (!heroTagline) return;

    const fullText = heroTagline.textContent.trim();
    if (!fullText) return;

    heroTagline.textContent = '';
    heroTagline.classList.add('hero__tagline--typing');

    // Create cursor element
    const cursor = document.createElement('span');
    cursor.classList.add('typing-cursor');
    cursor.textContent = '|';
    heroTagline.appendChild(cursor);

    let charIndex = 0;

    function typeChar() {
      if (charIndex < fullText.length) {
        // Insert character before cursor
        const textNode = document.createTextNode(fullText.charAt(charIndex));
        heroTagline.insertBefore(textNode, cursor);
        charIndex++;
        setTimeout(typeChar, TYPING_SPEED);
      } else {
        // Typing complete — cursor continues blinking via CSS
        cursor.classList.add('typing-cursor--blink');
      }
    }

    setTimeout(typeChar, TYPING_START_DELAY);
  }

  // ===== Card Hover Tilt Effect =====

  /**
   * Applies a subtle 3D tilt effect to project & campaign cards
   * based on mouse position relative to card center.
   */
  function initCardTilt(cards) {
    if (!cards || cards.length === 0) return;

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate position relative to center (-1 to 1)
        const relX = (e.clientX - centerX) / (rect.width / 2);
        const relY = (e.clientY - centerY) / (rect.height / 2);

        // Apply tilt — rotateX is inverted for natural feel
        const tiltX = -relY * CARD_TILT_MAX_DEG;
        const tiltY = relX * CARD_TILT_MAX_DEG;

        card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform =
          'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });

      // Ensure smooth transition on reset
      card.style.transition = 'transform 0.4s ease-out';
    });
  }

  // ===== Smooth Scroll — Global Anchor Links =====

  /**
   * Intercepts all anchor links starting with # and
   * applies smooth scrolling with nav height offset.
   */
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;

    const targetId = href.substring(1);
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    e.preventDefault();

    const targetPosition =
      targetEl.getBoundingClientRect().top +
      window.pageYOffset -
      NAV_HEIGHT_OFFSET;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth',
    });
  });

  // ===== Scroll Event — Throttled =====

  const throttledScroll = throttle(() => {
    handleNavScroll();
    onParallaxScroll();
  }, 16); // ~60fps

  window.addEventListener('scroll', throttledScroll, { passive: true });

  // ===== Initialize =====

  function init() {
    // Set initial nav state
    handleNavScroll();

    // Typed text effect
    initTypedText();

    // Card tilt effects
    initCardTilt(projectCards);
    initCardTilt(campaignCards);

    // Initial parallax position
    if (heroParticles) {
      updateParallax();
    }
  }

  init();
});
