/**
 * TechSfera AGM 2026 Presentation Engine — 099 Supply Museum Architecture
 * Product & Experience Designer: Shimul
 * Interactive horizontal presentation controller (No sound, pure keyboard/touch/click)
 */

(function () {
  'use strict';

  const TOTAL_SLIDES = 10;
  let currentSlide = 0;
  let isOverviewOpen = false;
  let isWheelLocked = false;
  let touchStartX = 0;
  let touchStartY = 0;

  // DOM Elements
  const track = document.getElementById('presentationTrack');
  const slides = document.querySelectorAll('.slide');
  const currentNumEl = document.getElementById('navCurrentNum');
  const totalNumEl = document.getElementById('navTotalNum');
  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');
  const progressBar = document.getElementById('progressBar');
  const overviewModal = document.getElementById('overviewModal');
  const overviewCloseBtn = document.getElementById('overviewCloseBtn');
  const overviewCards = document.querySelectorAll('.overview-card');
  const timerBtn = document.getElementById('hudTimerBtn');
  const timerDisplay = document.getElementById('hudTimerDisplay');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  // Presenter Pacing Timer (Discreet 2-3 minute assistant)
  let timerSeconds = 0;
  let timerInterval = null;
  let isTimerRunning = false;

  function formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateTimerUI() {
    if (timerDisplay) {
      timerDisplay.textContent = `${formatTime(timerSeconds)} / 03:00`;
    }
  }

  function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerUI();
    }, 1000);
  }

  function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
  }

  function toggleTimer() {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  // Slide Navigation Engine
  function updateSlide(newIndex) {
    if (newIndex < 0 || newIndex >= TOTAL_SLIDES) return;

    currentSlide = newIndex;

    // Transform horizontal track
    if (track) {
      track.style.transform = `translateX(-${currentSlide * 100}vw)`;
    }

    // Toggle active class on slides for subtle stagger
    slides.forEach((slide, idx) => {
      if (idx === currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // Update Counter UI (e.g. "01 / 08")
    const slideNumberStr = (currentSlide + 1).toString().padStart(2, '0');
    if (currentNumEl) currentNumEl.textContent = slideNumberStr;
    if (totalNumEl) totalNumEl.textContent = TOTAL_SLIDES.toString().padStart(2, '0');

    // Update Hairline Progress Bar
    if (progressBar) {
      const progressPercent = ((currentSlide + 1) / TOTAL_SLIDES) * 100;
      progressBar.style.width = `${progressPercent}%`;
    }

    // Update Button Disabled States
    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) nextBtn.disabled = currentSlide === TOTAL_SLIDES - 1;

    // Update Active Card in Overview
    overviewCards.forEach((card, idx) => {
      if (idx === currentSlide) {
        card.classList.add('active-card');
      } else {
        card.classList.remove('active-card');
      }
    });

    // Sync URL Hash (e.g. #01 or #10)
    window.location.hash = (currentSlide + 1).toString().padStart(2, '0');

    // Auto-start timer on first advance
    if (currentSlide > 0 && !isTimerRunning && timerSeconds === 0) {
      startTimer();
    }
  }

  function nextSlide() {
    if (currentSlide < TOTAL_SLIDES - 1) {
      updateSlide(currentSlide + 1);
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      updateSlide(currentSlide - 1);
    }
  }

  // Overview Modal
  function toggleOverview(open) {
    if (open === undefined) {
      isOverviewOpen = !isOverviewOpen;
    } else {
      isOverviewOpen = open;
    }

    if (isOverviewOpen) {
      overviewModal.classList.add('open');
    } else {
      overviewModal.classList.remove('open');
    }
  }

  // Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    // Esc key: Toggle Overview
    if (e.key === 'Escape') {
      e.preventDefault();
      toggleOverview();
      return;
    }

    // If overview is open, Enter closes it
    if (isOverviewOpen) {
      if (e.key === 'Enter') {
        toggleOverview(false);
      }
      return;
    }

    // Direct numeric keys 1 to 9, and 0 for slide 10
    if (e.key === '0') {
      e.preventDefault();
      updateSlide(9);
      return;
    }

    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= TOTAL_SLIDES) {
      e.preventDefault();
      updateSlide(num - 1);
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ': // Spacebar
        e.preventDefault();
        nextSlide();
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
      case 'Backspace':
        e.preventDefault();
        prevSlide();
        break;

      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;

      case 't':
      case 'T':
      case 'p':
      case 'P':
        e.preventDefault();
        toggleTimer();
        break;
    }
  });

  // Trackpad / Wheel Navigation (Debounced)
  window.addEventListener('wheel', (e) => {
    if (isOverviewOpen) return;
    if (isWheelLocked) return;

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 30) {
      isWheelLocked = true;
      if (delta > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      setTimeout(() => {
        isWheelLocked = false;
      }, 600);
    }
  }, { passive: true });

  // Touch Swipe
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (isOverviewOpen) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 45) {
      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }, { passive: true });

  // Fullscreen Toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      if (fullscreenBtn) fullscreenBtn.textContent = 'WINDOW';
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if (fullscreenBtn) fullscreenBtn.textContent = 'FULL';
    }
  }

  // Setup Button Listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', prevSlide);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', nextSlide);
  }

  if (overviewCloseBtn) {
    overviewCloseBtn.addEventListener('click', () => toggleOverview(false));
  }

  if (timerBtn) {
    timerBtn.addEventListener('click', toggleTimer);
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  // Overview Cards Direct Jump
  overviewCards.forEach((card) => {
    card.addEventListener('click', () => {
      const targetIndex = parseInt(card.getAttribute('data-slide-index'), 10);
      if (!isNaN(targetIndex)) {
        updateSlide(targetIndex);
        toggleOverview(false);
      }
    });
  });

  // Check URL Hash for initial slide (e.g. #04)
  function initFromHash() {
    const hash = window.location.hash.replace('#', '');
    const num = parseInt(hash, 10);
    if (!isNaN(num) && num >= 1 && num <= TOTAL_SLIDES) {
      updateSlide(num - 1);
    } else {
      updateSlide(0);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initFromHash();
    updateTimerUI();
  });

  const overviewTrigger = document.getElementById('navOverviewTrigger');
  if (overviewTrigger) {
    overviewTrigger.addEventListener('click', () => toggleOverview(true));
  }

})();
