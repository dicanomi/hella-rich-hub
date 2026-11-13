const screens = [...document.querySelectorAll('.screen')];
const pager = document.querySelector('.pager');
const arrowHint = pager.querySelector('.arrow-hint');
const arrows = [...pager.querySelectorAll('button')];
const position = document.querySelector('#position');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const status = document.querySelector('.status');
const pad = number => String(number).padStart(2, '0');
let active = 0;
let scheduled = false;
let readingOffset = 0;
let splitScreen = false;
let resizeTimer;
const fade = document.querySelector('.screen-fade');
let navigationFade;
function updatePosition() {
  scheduled = false;
  const midpoint = window.innerHeight / 2;
  const current = screens.findIndex(screen => {
    const rect = screen.getBoundingClientRect();
    return rect.top <= midpoint && rect.bottom > midpoint;
  });
  if (!resizeTimer && current >= 0) active = current;
  const rect = screens[active].getBoundingClientRect();
  if (!resizeTimer) {
    splitScreen = rect.top > 2 || rect.bottom < window.innerHeight - 2;
    readingOffset = splitScreen ? 0 : Math.max(0, -rect.top);
  }
  if (active !== 0) arrowHint.hidden = true;
  position.textContent = pad(active + 1) + ' / ' + pad(screens.length);
  arrows[0].setAttribute('aria-disabled', active === 0);
  arrows[1].setAttribute('aria-label', active === screens.length - 1 ? 'Return to cover' : 'Next screen');
}
function queuePosition() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(updatePosition);
  }
}
async function visit(screen) {
  if (navigationFade) return;
  const commit = () => {
    history.pushState(null, '', '#' + screen.id);
    screen.focus({ preventScroll: true });
    screen.scrollIntoView({ behavior: 'instant' });
    updatePosition();
  };
  if (reduced.matches) {
    commit();
    return;
  }
  try {
    navigationFade = fade.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 100, easing: 'ease-in', fill: 'forwards',
    });
    await navigationFade.finished;
    commit();
    const covered = navigationFade;
    navigationFade = fade.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 190, easing: 'ease-out',
    });
    covered.cancel();
    await navigationFade.finished;
  } finally {
    navigationFade = null;
  }
}
function step(direction) {
  updatePosition();
  const target = screens[active + direction] ?? (direction === 1 ? screens[0] : null);
  if (target) visit(target);
}
pager.hidden = false;
updatePosition();
addEventListener('scroll', queuePosition, { passive: true });
const desktopSnap = matchMedia('(min-width: 52rem) and (min-height: 40rem) and (hover: hover) and (pointer: fine)');
let lastScrollY = window.scrollY;
let scrollDirection = 0;
let settleTimer;
const hasScrollEnd = 'onscrollend' in document;

function settleScreen() {
  if (resizeTimer || !desktopSnap.matches || reduced.matches || navigationFade || document.querySelector('.opening').open) return;
  const direction = scrollDirection;
  scrollDirection = 0;
  if (!direction) return;

  const viewport = window.innerHeight;
  for (let i = 1; i < screens.length; i++) {
    const nextTop = screens[i].getBoundingClientRect().top;
    if (nextTop <= 1 || nextTop >= viewport - 1) continue;

    const previousTop = screens[i - 1].getBoundingClientRect().top;
    const distance = nextTop - previousTop;
    // Measure from the last full viewport of a long section when scrolling down.
    if (direction > 0 && nextTop <= Math.min(distance, viewport) * .25) {
      window.scrollBy({ top: nextTop, behavior: 'smooth' });
    } else if (direction < 0 && distance <= viewport + 1 && -previousTop <= distance * .25) {
      window.scrollBy({ top: previousTop, behavior: 'smooth' });
    }
    break;
  }
}

addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y !== lastScrollY) scrollDirection = Math.sign(y - lastScrollY);
  lastScrollY = y;
  if (!hasScrollEnd && desktopSnap.matches && !reduced.matches) {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settleScreen, 180);
  }
}, { passive: true });
if (hasScrollEnd) document.addEventListener('scrollend', settleScreen);

addEventListener('resize', () => {
  const previous = screens[active];
  const offset = readingOffset;
  const chooseMajority = splitScreen;
  clearTimeout(resizeTimer);
  clearTimeout(settleTimer);
  resizeTimer = setTimeout(() => {
    resizeTimer = undefined;
    if (navigationFade || document.querySelector('.opening').open) return;
    let target = previous;
    if (chooseMajority) {
      let largest = 0;
      for (const screen of screens) {
        const rect = screen.getBoundingClientRect();
        const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        if (visible > largest || (visible === largest && screen === previous)) {
          largest = visible;
          target = screen;
        }
      }
    }
    const rect = target.getBoundingClientRect();
    const inset = chooseMajority ? 0 : Math.min(offset, Math.max(0, rect.height - window.innerHeight));
    window.scrollBy({ top: rect.top + inset, behavior: 'instant' });
    lastScrollY = window.scrollY;
    scrollDirection = 0;
    updatePosition();
  }, 110);
});
addEventListener('pageshow', queuePosition);
arrows.forEach(arrow => arrow.addEventListener('click', () => step(Number(arrow.dataset.step))));
document.querySelectorAll('.hero a[href^="#"]').forEach(link => {
  const target = screens.find(screen => '#' + screen.id === link.hash);
  if (!target) return;
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    visit(target);
  });
});
addEventListener('keydown', event => {
  if (document.querySelector('.opening').open || !['ArrowLeft', 'ArrowRight'].includes(event.key) || event.defaultPrevented ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat ||
      event.target.closest?.('input,select,textarea,video,[contenteditable],[role="slider"]')) return;
  event.preventDefault();
  step(event.key === 'ArrowRight' ? 1 : -1);
});

const reveal = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    target.classList.add('seen');
    reveal.unobserve(target);
  }
}, { threshold: .22 });
screens.filter(screen => screen.querySelector('[data-reveal]')).forEach(screen => reveal.observe(screen));

const mode = document.querySelector('.color-mode');
const swatches = [...document.querySelectorAll('.swatch')];
let format = mode.querySelector(':checked').value;
let statusTimer;
mode.hidden = false;
function updateFormat() {
  format = mode.querySelector(':checked').value;
  for (const swatch of swatches) {
    swatch.querySelector('.value-hex').setAttribute('aria-hidden', format !== 'hex');
    swatch.querySelector('.value-cmyk').setAttribute('aria-hidden', format !== 'cmyk');
    swatch.querySelector('button').setAttribute('aria-label', 'Copy ' + swatch.querySelector('h3').textContent + ' ' + format.toUpperCase());
  }
}
mode.addEventListener('change', updateFormat);
updateFormat();
for (const swatch of swatches) {
  const button = swatch.querySelector('button');
  const value = swatch.querySelector('[data-hex]');
  button.hidden = false;
  button.addEventListener('click', async () => {
    const text = format === 'hex' ? value.dataset.hex : value.dataset.cmyk;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copied ' + text;
      button.dataset.copied = '';
      setTimeout(() => delete button.dataset.copied, 900);
    } catch {
      status.textContent = 'Copy unavailable. Check your browser’s clipboard permission and try again.';
    }
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 2400);
  });
}

for (const video of document.querySelectorAll('.screen video')) {
  const screen = video.closest('.screen');
  const control = screen.querySelector('.play');
  let manualPause = false;
  let visible = false;
  let explicitPlay = false;
  function syncPlayback() {
    if (!document.hidden && visible && !manualPause && (!reduced.matches || explicitPlay)) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }
  function updateControl() {
    const action = video.paused ? 'Play' : 'Pause';
    control.textContent = action;
    control.setAttribute('aria-label', action + ' ' + control.dataset.label);
  }
  control.addEventListener('click', () => {
    manualPause = !video.paused;
    explicitPlay = !manualPause;
    if (manualPause) video.pause();
    else video.play().catch(() => {});
  });
  video.addEventListener('play', updateControl);
  video.addEventListener('pause', updateControl);
  video.addEventListener('playing', () => {
    screen.classList.add('has-frame');

  });
  video.addEventListener('error', () => {
    control.textContent = 'Video unavailable';
    control.setAttribute('aria-label', control.textContent);
    control.disabled = true;
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= .55;
    syncPlayback();
  }, { threshold: [.55] }).observe(screen);
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', () => {
    explicitPlay = false;
    syncPlayback();
  });
}


const splash = document.querySelector('.opening');
if (['', '#cover', '#wordmark'].includes(location.hash) && !reduced.matches && splash.showModal) {
  const clip = splash.querySelector('video');
  const cover = screens[0];
  let closing = false;
  const timer = setTimeout(dismissSplash, 3500);

  async function dismissSplash() {
    if (closing) return;
    closing = true;
    clearTimeout(timer);
    cover.scrollIntoView({ behavior: 'instant' });
    if (!reduced.matches) {
      await splash.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 210, easing: 'ease-out', fill: 'forwards',
      }).finished;
    }
    clip.pause();
    splash.close();
    cover.focus({ preventScroll: true });
    updatePosition();
  }
  const input = new AbortController();
  const options = { signal: input.signal };
  let touchY;
  splash.addEventListener('wheel', event => {
    if (!event.deltaY || event.ctrlKey) return;
    event.preventDefault();
    dismissSplash();
  }, { ...options, passive: false });
  splash.addEventListener('touchstart', event => {
    touchY = event.touches.length === 1 ? event.touches[0].clientY : undefined;
  }, { ...options, passive: true });
  splash.addEventListener('touchmove', event => {
    if (touchY !== undefined && event.touches.length === 1 &&
        Math.abs(event.touches[0].clientY - touchY) >= 12) dismissSplash();
  }, { ...options, passive: true });
  window.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    dismissSplash();
  }, options);
  splash.addEventListener('cancel', event => {
    event.preventDefault();
    dismissSplash();
  }, options);
  splash.addEventListener('close', () => input.abort(), { once: true });
  splash.showModal();
  clip.src = clip.dataset.src;
  clip.play().catch(() => {});
}

if (desktopSnap.matches && ['', '#cover', '#wordmark'].includes(location.hash)) {
  const showArrowHint = () => {
    if (active !== 0 || window.scrollY > 4) return;
    arrowHint.hidden = false;
    setTimeout(() => { arrowHint.hidden = true; }, 3650);
  };
  if (splash.open) splash.addEventListener('close', showArrowHint, { once: true });
  else showArrowHint();
}

const wordmark = document.querySelector('.cover-wordmark');
const logoLetters = [...wordmark.querySelectorAll('.logo-letter')];
let coverVisible = false;
let logoMotion = [];

function rippleWordmark() {
  if (!coverVisible || splash.open || reduced.matches) return;
  if (logoMotion.some(animation => animation.playState === 'running')) return;
  const lift = 5 * 370 / wordmark.clientWidth;
  logoMotion = logoLetters.map((letter, index) => letter.animate([
    { transform: 'translateY(0)', easing: 'ease-out' },
    { transform: 'translateY(-' + lift + 'px)', offset: .42, easing: 'ease-in-out' },
    { transform: 'translateY(0)' },
  ], { duration: 180, delay: index * 24 }));
}

new IntersectionObserver(([entry]) => {
  coverVisible = entry.intersectionRatio >= .5;
  if (coverVisible) rippleWordmark();
}, { threshold: .5 }).observe(screens[0]);
splash.addEventListener('close', rippleWordmark);
wordmark.addEventListener('pointerenter', event => {
  if (event.pointerType === 'mouse') rippleWordmark();
});
reduced.addEventListener('change', () => logoMotion.forEach(animation => animation.cancel()));

const imagery = document.querySelector('.imagery');
const swapControl = imagery.querySelector('button');
let mosaic;
let swapTimer;
let imageryVisible = false;
let swapsPaused = false;

function syncSwaps() {
  clearInterval(swapTimer);
  if (mosaic && imageryVisible && !document.hidden && !reduced.matches && !swapsPaused) {
    swapTimer = setInterval(shuffleGrid, 2000);
  }
}

function shuffleGrid() {
  const tiles = [...mosaic.children];
  const originals = tiles.map(tile => tile.firstElementChild);
  const order = [...originals];
  // Sattolo's shuffle moves every image to a different tile.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (const [index, tile] of tiles.entries()) {
    const old = originals[index];
    const incoming = order[index].cloneNode();
    tile.append(incoming);
    incoming.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 750, easing: 'ease-in-out',
    }).finished.then(() => old.remove());
  }
}

new IntersectionObserver(async ([entry], observer) => {
  imageryVisible = entry.intersectionRatio >= .5;
  if (imageryVisible && !mosaic && !reduced.matches && !imagery.dataset.loading) {
    imagery.dataset.loading = '';
    const grid = document.createElement('div');
    grid.className = 'nature-grid';
    grid.setAttribute('aria-hidden', 'true');
    const images = Array.from({ length: 16 }, (_, index) => {
      const tile = document.createElement('div');
      const img = new Image();
      img.alt = '';
      img.src = 'assets/media/nature/' + pad(index + 1) + '.jpg';
      tile.append(img);
      grid.append(tile);
      return img;
    });
    try {
      await Promise.all(images.map(img => img.decode()));
      mosaic = grid;
      imagery.append(grid);
      swapControl.hidden = reduced.matches;
    } catch {
      observer.disconnect();
    }
  }
  syncSwaps();
}, { threshold: .5 }).observe(imagery);
swapControl.addEventListener('click', () => {
  swapsPaused = !swapsPaused;
  swapControl.textContent = swapsPaused ? 'Resume image swaps' : 'Pause image swaps';
  syncSwaps();
});
document.addEventListener('visibilitychange', syncSwaps);
reduced.addEventListener('change', () => {
  swapControl.hidden = !mosaic || reduced.matches;
  syncSwaps();
});

const glyphPairs = [
  ...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', letter => letter + letter.toLowerCase()),
  '01', '23', '45', '67', '89',
  '!@', '#$', '%^', '&{', '}|', '":', '?<', '>ß', '∂ƒ', '©®',
];
for (const specimen of document.querySelectorAll('.specimen')) {
  const glyph = specimen.firstElementChild;
  let timer;
  let frame = 0;

  function stop() {
    clearInterval(timer);
    frame = 0;
    glyph.textContent = glyphPairs[0];
    glyph.style.removeProperty('--glyph-fit');
  }

  specimen.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || reduced.matches || document.hidden) return;
    stop();
    timer = setInterval(() => {
      frame = (frame + 1) % glyphPairs.length;
      glyph.textContent = glyphPairs[frame];
      glyph.style.setProperty('--glyph-fit', Math.min(1, specimen.clientWidth / glyph.offsetWidth));
    }, 90);
  });
  specimen.addEventListener('pointerleave', stop);
  reduced.addEventListener('change', stop);
  document.addEventListener('visibilitychange', stop);
}

// iOS Safari can still pull to refresh despite overscroll-behavior.
let touchStart;
document.addEventListener('touchstart', event => {
  touchStart = event.touches.length === 1 && window.scrollY <= 0
    ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
    : null;
}, { passive: true });
document.addEventListener('touchmove', event => {
  if (!touchStart || event.touches.length !== 1 || window.scrollY > 0) return;
  const { clientX, clientY } = event.touches[0];
  if (clientY - touchStart.y > Math.abs(clientX - touchStart.x) && event.cancelable) {
    event.preventDefault();
  }
}, { passive: false });
