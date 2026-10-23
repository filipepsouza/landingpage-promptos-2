/**
 * PROMPTOS ESSENCIAL — LANDING PAGE DE APRESENTAÇÃO (LP 2)
 * Interatividade completa: Borda LED Vermelha (Hover no PC / Sequencial Automático no Mobile),
 * Scroll Reveal One-Way, Cronômetro (<10 min), Fogos de Confetes e Modal "Promoção Liberada!".
 */

(function () {
  'use strict';

  const PROMPTOS_CONFIG = {
    productName: 'PromptOS Essencial',
    priceBRL: 47.90,
    checkoutUrl: 'https://pay.cakto.com.br/amwkiea'
  };

  function buildCheckoutUrlWithUtms(baseUrl) {
    const cleanBase = (baseUrl || 'https://pay.cakto.com.br/amwkiea').trim();
    const search = window.location.search || '';
    if (!search || search === '?') return cleanBase;
    const separator = cleanBase.includes('?') ? '&' : '?';
    return cleanBase + separator + search.replace(/^\?/, '');
  }

  function redirectToCheckout() {
    const targetUrl = buildCheckoutUrlWithUtms(PROMPTOS_CONFIG.checkoutUrl);
    window.location.href = targetUrl;
  }

  /* ==========================================================================
     1. MODAIS E CHECKOUT
     ========================================================================== */
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach((m) => {
      m.hidden = true;
    });
    document.body.style.overflow = '';
  }

  let toastTimeout = null;
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    if (toastTimeout) window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function initModalsAndCTAs() {
    document.querySelectorAll('[data-modal-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-modal-target');
        openModal(targetId);
      });
    });

    document.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeAllModals();
      });
    });

    document.querySelectorAll('.js-checkout-trigger').forEach((btn) => {
      btn.setAttribute('href', buildCheckoutUrlWithUtms(PROMPTOS_CONFIG.checkoutUrl));
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        redirectToCheckout();
      });
    });

    // Botões de cópia interativa das folhas de Mega-Prompt
    document.querySelectorAll('.js-copy-mega').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const card = btn.closest('.mega-doc-card');
        const sheet = card && card.querySelector('.mega-doc-card__sheet');
        const title = btn.getAttribute('data-mega-title') || 'Mega-Prompt';
        const rawText = sheet
          ? sheet.textContent.replace('📋 Testar Cópia deste Mega-Prompt', '').replace(/\s+\n/g, '\n').trim()
          : title;

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(rawText);
          }
        } catch (_) {
          // fallback silencioso
        }

        const span = btn.querySelector('span');
        const originalLabel = span ? span.textContent : '';
        if (span) span.textContent = '✓ Mega-Prompt Copiado!';
        showToast(`✓ "${title}" copiado! Cole no ChatGPT, Gemini ou Claude.`);

        window.setTimeout(() => {
          if (span && originalLabel) span.textContent = originalLabel;
        }, 2200);
      });
    });

    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  /* ==========================================================================
     2. CARDS INTERATIVOS: BORDA LED VERMELHA (PC HOVER / MOBILE SEQUENCIAL)
     ========================================================================== */
  function initInteractiveCards() {
    const cards = document.querySelectorAll('.interactive-card, .promo-unlock-card');
    const svgNS = 'http://www.w3.org/2000/svg';

    function syncCardLedGeometry(card) {
      const rect = card.querySelector('.card-led-bar');
      if (!rect) return;
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      if (w <= 2 || h <= 2) return;

      const computed = window.getComputedStyle(card);
      const radius = parseFloat(computed.borderTopLeftRadius) || 12;

      rect.setAttribute('x', '0.5');
      rect.setAttribute('y', '0.5');
      rect.setAttribute('width', String(w - 1));
      rect.setAttribute('height', String(h - 1));
      rect.setAttribute('rx', String(radius));
      rect.setAttribute('ry', String(radius));

      let perimeter = 2 * (w + h);
      if (typeof rect.getTotalLength === 'function') {
        try {
          const measured = rect.getTotalLength();
          if (measured > 0) perimeter = Math.ceil(measured);
        } catch (_) {
          // fallback mantido
        }
      }
      rect.style.setProperty('--perimeter', `${perimeter}px`);
    }

    const resizeObserver =
      'ResizeObserver' in window
        ? new ResizeObserver((entries) => {
            entries.forEach((entry) => syncCardLedGeometry(entry.target));
          })
        : null;

    cards.forEach((card) => {
      if (!card.querySelector('.card-led-svg')) {
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'card-led-svg');
        svg.setAttribute('aria-hidden', 'true');

        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('class', 'card-led-bar');

        svg.appendChild(rect);
        card.appendChild(svg);
      }

      syncCardLedGeometry(card);
      if (resizeObserver) {
        resizeObserver.observe(card);
      }

      card.addEventListener('click', (e) => {
        if (window.innerWidth <= 767) return;
        const wasActive = card.classList.contains('is-card-active');
        cards.forEach((c) => c.classList.remove('is-card-active'));
        if (!wasActive) {
          card.classList.add('is-card-active');
        }
        e.stopPropagation();
      });
    });

    document.addEventListener('click', () => {
      if (window.innerWidth <= 767) return;
      cards.forEach((c) => c.classList.remove('is-card-active'));
    });

    /* ------------------------------------------------------------------------
       MOBILE ONLY (<= 767px): CARREGAMENTO AUTOMÁTICO E SEQUENCIAL NO SCROLL
       Mesma velocidade do PC (1.65s de preenchimento + retorno suave ao original)
       ------------------------------------------------------------------------ */
    const MOBILE_SWEEP_DURATION_MS = 1900;
    const MOBILE_NEXT_CARD_STEP_MS = 1750;
    const mqMobile = window.matchMedia('(max-width: 767px)');

    function isCardVisible(card) {
      if (!card || card.hidden) return false;
      const style = window.getComputedStyle(card);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return card.offsetWidth > 2 && card.offsetHeight > 2;
    }

    const sections = Array.from(document.querySelectorAll('main > section'));
    const sectionStates = new Map();

    sections.forEach((section) => {
      const sectionCards = Array.from(section.querySelectorAll('.interactive-card'));
      sectionStates.set(section, {
        allCards: sectionCards,
        timers: [],
        hasPlayedInCurrentView: false
      });
    });

    function clearSectionSequence(section) {
      const state = sectionStates.get(section);
      if (!state) return;
      state.timers.forEach((t) => window.clearTimeout(t));
      state.timers = [];
      state.allCards.forEach((card) => card.classList.remove('is-mobile-led-loading'));
    }

    function playCardSweep(card, state) {
      if (!isCardVisible(card) || !mqMobile.matches) return;

      syncCardLedGeometry(card);
      card.classList.remove('is-mobile-led-loading');
      void card.offsetWidth;
      card.classList.add('is-mobile-led-loading');

      const offTimer = window.setTimeout(() => {
        card.classList.remove('is-mobile-led-loading');
      }, MOBILE_SWEEP_DURATION_MS);

      state.timers.push(offTimer);
    }

    function startSectionSequence(section) {
      if (!mqMobile.matches) return;
      const state = sectionStates.get(section);
      if (!state || state.hasPlayedInCurrentView) return;

      const visibleCards = state.allCards.filter((card) => isCardVisible(card));
      if (visibleCards.length === 0) return;

      state.hasPlayedInCurrentView = true;
      clearSectionSequence(section);

      visibleCards.forEach((card, index) => {
        const startAtMs = 200 + index * MOBILE_NEXT_CARD_STEP_MS;
        const stepTimer = window.setTimeout(() => {
          playCardSweep(card, state);
        }, startAtMs);
        state.timers.push(stepTimer);
      });
    }

    function checkMobileSectionsInView() {
      if (!mqMobile.matches) return;
      const viewportH = window.innerHeight || document.documentElement.clientHeight;

      sections.forEach((section) => {
        const state = sectionStates.get(section);
        if (!state) return;

        const visibleCards = state.allCards.filter((card) => isCardVisible(card));
        if (visibleCards.length === 0) return;

        const firstRect = visibleCards[0].getBoundingClientRect();
        const lastRect = visibleCards[visibleCards.length - 1].getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();

        const cardsInView =
          firstRect.top < viewportH * 0.86 &&
          lastRect.bottom > viewportH * 0.14;

        if (cardsInView && !state.hasPlayedInCurrentView) {
          startSectionSequence(section);
        } else if (sectionRect.bottom < -40 || sectionRect.top > viewportH + 40) {
          if (state.hasPlayedInCurrentView) {
            state.hasPlayedInCurrentView = false;
            clearSectionSequence(section);
          }
        }
      });
    }

    let scrollTicking = false;
    function onMobileScrollOrResize() {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        scrollTicking = false;
        checkMobileSectionsInView();
      });
    }

    window.addEventListener('scroll', onMobileScrollOrResize, { passive: true });
    window.addEventListener('resize', onMobileScrollOrResize, { passive: true });
    checkMobileSectionsInView();
  }

  /* ==========================================================================
     3. FOGOS DE CONFETES + CARD "PROMOÇÃO LIBERADA!" + CRONÔMETRO (< 10 MIN)
     ========================================================================== */
  function initPromoOfferExperience() {
    const offerSection = document.getElementById('oferta-final');
    const offerPricingCard = document.getElementById('offer-pricing-card');
    const promoModal = document.getElementById('promo-unlock-modal');
    const btnClosePromo = document.getElementById('btn-close-promo');
    const btnClaimPromo = document.getElementById('btn-claim-promo');
    const minEl = document.getElementById('promo-min');
    const secEl = document.getElementById('promo-sec');
    const inlineTimers = document.querySelectorAll('[data-promo-timer]');
    const canvas = document.getElementById('promo-confetti-canvas');

    if (!offerSection || !promoModal) return;

    let remainingSeconds = 9 * 60 + 59;
    let hasTriggeredUnlock = false;

    function renderTimer() {
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      const mStr = String(mins).padStart(2, '0');
      const sStr = String(secs).padStart(2, '0');

      if (minEl) minEl.textContent = mStr;
      if (secEl) secEl.textContent = sStr;
      inlineTimers.forEach((el) => {
        el.textContent = `${mStr}:${sStr}`;
      });
    }

    renderTimer();
    window.setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds -= 1;
      } else {
        remainingSeconds = 2 * 60 + 59;
      }
      renderTimer();
    }, 1000);

    const particles = [];
    let animFrameId = null;

    function resizeCanvas() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    const COLORS = ['#FF3B53', '#C92F40', '#22C55E', '#FBBF24', '#38BDF8', '#FFFFFF'];

    function spawnBurst(originX, originY, count) {
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
        const speed = 6 + Math.random() * 11;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 0.22,
          drag: 0.982,
          size: 5 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.24,
          alpha: 1,
          decay: 0.008 + Math.random() * 0.007
        });
      }
      if (!animFrameId) {
        animFrameId = requestAnimationFrame(stepConfetti);
      }
    }

    function stepConfetti() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }

      if (particles.length > 0) {
        animFrameId = requestAnimationFrame(stepConfetti);
      } else {
        animFrameId = null;
      }
    }

    function fireCelebrationSequence() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      spawnBurst(w * 0.2, h * 0.55, 45);
      spawnBurst(w * 0.8, h * 0.55, 45);
      window.setTimeout(() => spawnBurst(w * 0.5, h * 0.35, 65), 220);
    }

    function openPromoModal() {
      promoModal.hidden = false;
      document.body.style.overflow = 'hidden';
      const card = promoModal.querySelector('.promo-unlock-card');
      const rect = card && card.querySelector('.card-led-bar');
      if (card && rect) {
        const p = 2 * (card.offsetWidth + card.offsetHeight);
        rect.setAttribute('x', '0.5');
        rect.setAttribute('y', '0.5');
        rect.setAttribute('width', String(card.offsetWidth - 1));
        rect.setAttribute('height', String(card.offsetHeight - 1));
        rect.setAttribute('rx', '18');
        rect.setAttribute('ry', '18');
        rect.style.setProperty('--perimeter', `${p}px`);
      }
    }

    function closePromoModal(focusOffer = false) {
      promoModal.hidden = true;
      document.body.style.overflow = '';
      if (focusOffer && offerPricingCard) {
        offerPricingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (btnClosePromo) btnClosePromo.addEventListener('click', () => closePromoModal(false));
    if (btnClaimPromo) {
      btnClaimPromo.addEventListener('click', (e) => {
        e.preventDefault();
        redirectToCheckout();
      });
    }
    promoModal.addEventListener('click', (e) => {
      if (e.target === promoModal) closePromoModal(false);
    });

    function triggerUnlockExperience() {
      if (hasTriggeredUnlock) return;
      hasTriggeredUnlock = true;
      fireCelebrationSequence();
      window.setTimeout(openPromoModal, 320);
    }

    // Ao clicar em qualquer botão de CTA ao longo da página (#oferta-final), rola até a oferta e já mostra a promoção
    document.querySelectorAll('a[href="#oferta-final"]').forEach((ctaBtn) => {
      ctaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (offerPricingCard) {
          offerPricingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          offerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        triggerUnlockExperience();
      });
    });

    const earlyTriggerSection =
      document.getElementById('resultados') ||
      offerSection;

    if ('IntersectionObserver' in window) {
      const offerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasTriggeredUnlock) {
              offerObserver.disconnect();
              triggerUnlockExperience();
            }
          });
        },
        { threshold: 0.15 }
      );
      offerObserver.observe(earlyTriggerSection);
      if (earlyTriggerSection !== offerSection) {
        offerObserver.observe(offerSection);
      }
    }
  }

  /* ==========================================================================
     4. SCROLL REVEAL ONE-WAY (SOMENTE AO DESCER A PÁGINA)
     ========================================================================== */
  function initScrollReveal() {
    const elements = Array.from(document.querySelectorAll('.scroll-reveal'));
    if (elements.length === 0) return;

    function markRevealed(el) {
      el.classList.add('is-revealed', 'is-reveal-done');
    }

    if (!('IntersectionObserver' in window)) {
      elements.forEach(markRevealed);
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            markRevealed(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -24px 0px' }
    );

    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportH * 0.92) {
        requestAnimationFrame(() => markRevealed(el));
      } else {
        revealObserver.observe(el);
      }
    });
  }

  /* ==========================================================================
     5. BARRA DE LED DE PROGRESSO DE ROLAGEM NO HEADER (PC E MOBILE)
     Carrega suavemente na base do header conforme o usuário rola a página.
     ========================================================================== */
  function initHeaderScrollLed() {
    const ledBar = document.getElementById('header-scroll-led-bar');
    if (!ledBar) return;

    let ticking = false;

    function updateScrollLed() {
      ticking = false;
      const docEl = document.documentElement;
      const scrollTop = window.scrollY || docEl.scrollTop || 0;
      const scrollableHeight = Math.max(docEl.scrollHeight - window.innerHeight, 1);
      const ratio = Math.min(Math.max(scrollTop / scrollableHeight, 0), 1);
      const pct = (ratio * 100).toFixed(2);

      ledBar.style.width = `${pct}%`;
      ledBar.style.opacity = scrollTop > 2 ? '1' : '0';
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateScrollLed);
      }
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    updateScrollLed();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initModalsAndCTAs();
    initInteractiveCards();
    initPromoOfferExperience();
    initScrollReveal();
    initHeaderScrollLed();
  });
})();
