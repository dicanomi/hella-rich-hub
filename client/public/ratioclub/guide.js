const screens = [...document.querySelectorAll('.screen')];
const pager = document.querySelector('.pager');
const arrows = [...pager.querySelectorAll('button')];
const position = document.querySelector('#position');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const status = document.querySelector('.status');
const pad = number => String(number).padStart(2, '0');
let active = 0;
let scheduled = false;
const fade = document.querySelector('.screen-fade');
let navigationFade;
function updatePosition() {
  scheduled = false;
  const midpoint = window.innerHeight / 2;
  const current = screens.findIndex(screen => {
    const rect = screen.getBoundingClientRect();
    return rect.top <= midpoint && rect.bottom > midpoint;
  });
  if (current >= 0) active = current;
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
addEventListener('resize', queuePosition);
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
  const timer = setTimeout(dismissSplash, 4000);

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
  splash.querySelector('.intro-skip').addEventListener('click', event => {
    event.preventDefault();
    dismissSplash();
  });
  splash.addEventListener('cancel', event => {
    event.preventDefault();
    dismissSplash();
  });
  splash.showModal();
  clip.src = clip.dataset.src;
  clip.play().catch(() => {});
}
