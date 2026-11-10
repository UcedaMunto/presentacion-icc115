const deck = Array.from(document.querySelectorAll('.slide'));
const stage = document.getElementById('stage');
const current = document.getElementById('slideNumber');
const slideTabs = Array.from(document.querySelectorAll('.toolbar .tab'));
let slideIndex = 0;
const firstAnnex = Math.min(...slideTabs.map((t) => Number(t.dataset.slide)).filter((n) => n > 0));
const notesBox = document.getElementById('notes');
const notesText = document.getElementById('notesText');
const imageOverlay = document.getElementById('imageOverlay');
const overlayImage = imageOverlay.querySelector('img');
const imageZoom = document.getElementById('imageZoom');
const closeImageButton = document.getElementById('closeImageOverlay');
let imageScale = 1;
let imageX = 0;
let imageY = 0;
let imageDrag = null;
let imageOpener = null;

function updateImageTransform() {
  overlayImage.style.setProperty('--image-scale', imageScale);
  overlayImage.style.setProperty('--image-x', `${imageX}px`);
  overlayImage.style.setProperty('--image-y', `${imageY}px`);
  imageOverlay.classList.toggle('zoomed', imageScale > 1);
  imageZoom.textContent = `${Math.round(imageScale * 100)} %`;
}

function resetImageZoom() {
  endImageDrag();
  imageScale = 1;
  imageX = 0;
  imageY = 0;
  updateImageTransform();
}

function endImageDrag() {
  if (imageDrag && overlayImage.hasPointerCapture(imageDrag.id)) {
    overlayImage.releasePointerCapture(imageDrag.id);
  }
  imageDrag = null;
  imageOverlay.classList.remove('dragging');
}

function closeImageOverlay() {
  endImageDrag();
  imageOverlay.classList.remove('open');
  resetImageZoom();
  imageOpener?.focus();
}

function resizeStage() {
  const toolbarHeight = document.querySelector('.toolbar').getBoundingClientRect().height;
  document.documentElement.style.setProperty(
    '--scale',
    Math.min(innerWidth / 1600, (innerHeight - toolbarHeight) / 900).toFixed(5),
  );
  document.documentElement.style.setProperty('--toolbar-height', `${toolbarHeight}px`);
  resetImageZoom();
}

function updateNotes() {
  const notes = deck[slideIndex].querySelector('.speaker-notes');
  notesText.textContent = notes?.content?.textContent || notes?.textContent || 'Sin notas.';
}

function showSlide(n) {
  slideIndex = Math.min(deck.length - 1, Math.max(0, n));
  deck.forEach((slide, i) => slide.classList.toggle('active', i === slideIndex));
  current.textContent = `${slideIndex + 1} / ${deck.length}`;
  slideTabs.forEach((tab) => {
    const target = Number(tab.dataset.slide);
    const active = target === 0 ? slideIndex < firstAnnex : slideIndex === target;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  location.hash = 'diapositiva-' + (slideIndex + 1);
  updateNotes();
}

function moveSlide(delta) {
  showSlide(slideIndex + delta);
}

function toggleNotes() {
  notesBox.classList.toggle('open');
  updateNotes();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else document.exitFullscreen?.();
}

function zoom(ev) {
  const z = ev.target.closest('.zoomable');
  const im = z && (z.tagName === 'IMG' ? z : z.querySelector('img'));
  if (im) {
    imageOpener = document.activeElement;
    overlayImage.src = im.src;
    overlayImage.alt = im.alt || 'Figura ampliada';
    resetImageZoom();
    imageOverlay.classList.add('open');
    closeImageButton.focus();
  }
}
addEventListener('resize', resizeStage);
document.addEventListener('fullscreenchange', resizeStage);
resizeStage();
window.addEventListener('keydown', (e) => {
  if (imageOverlay.classList.contains('open')) {
    if (e.key === 'Escape') closeImageOverlay();
    if (e.key === 'Tab') {
      const resetButton = document.getElementById('resetImageZoom');
      e.preventDefault();
      (document.activeElement === closeImageButton ? resetButton : closeImageButton).focus();
    }
    return;
  }
  if (e.target.closest('input, textarea, [contenteditable]')) return;
  if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
    e.preventDefault();
    moveSlide(1);
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    moveSlide(-1);
  } else if (e.key === 'Home') {
    e.preventDefault();
    showSlide(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    showSlide(deck.length - 1);
  } else if (e.key.toLowerCase() === 'n') {
    toggleNotes();
  } else if (e.key.toLowerCase() === 'f') {
    toggleFullscreen();
  } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    window.print();
  } else if (e.key === 'Escape') {
    notesBox.classList.remove('open');
  }
});
stage.addEventListener('click', zoom);
imageOverlay.addEventListener('click', (e) => {
  if (e.target === imageOverlay) closeImageOverlay();
});
closeImageButton.addEventListener('click', closeImageOverlay);
document.getElementById('resetImageZoom').addEventListener('click', resetImageZoom);
imageOverlay.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    const nextScale = Math.min(8, Math.max(1, imageScale * Math.exp(-delta * 0.002)));
    const bounds = imageOverlay.getBoundingClientRect();
    const pointerX = e.clientX - (bounds.left + bounds.width / 2);
    const pointerY = e.clientY - (bounds.top + bounds.height / 2);
    const ratio = nextScale / imageScale;
    imageX = pointerX - (pointerX - imageX) * ratio;
    imageY = pointerY - (pointerY - imageY) * ratio;
    imageScale = nextScale;
    if (imageScale === 1) resetImageZoom();
    else updateImageTransform();
  },
  { passive: false },
);
overlayImage.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || imageScale === 1) return;
  e.preventDefault();
  imageDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  overlayImage.setPointerCapture(e.pointerId);
  imageOverlay.classList.add('dragging');
});
overlayImage.addEventListener('pointermove', (e) => {
  if (!imageDrag || e.pointerId !== imageDrag.id) return;
  imageX += e.clientX - imageDrag.x;
  imageY += e.clientY - imageDrag.y;
  imageDrag.x = e.clientX;
  imageDrag.y = e.clientY;
  updateImageTransform();
});
overlayImage.addEventListener('pointerup', endImageDrag);
overlayImage.addEventListener('pointercancel', endImageDrag);
overlayImage.addEventListener('lostpointercapture', endImageDrag);
document.getElementById('btnPrevious').addEventListener('click', () => moveSlide(-1));
document.getElementById('btnNext').addEventListener('click', () => moveSlide(1));
document.getElementById('btnNotes').addEventListener('click', toggleNotes);
document.getElementById('btnFull').addEventListener('click', toggleFullscreen);
document.getElementById('btnPrint').addEventListener('click', () => window.print());
slideTabs.forEach((tab) => {
  tab.addEventListener('click', () => showSlide(Number(tab.dataset.slide)));
});
document
  .getElementById('closeNotes')
  .addEventListener('click', () => notesBox.classList.remove('open'));
const n = parseInt((location.hash.match(/diapositiva-(\d+)/) || [])[1] || '1', 10);
showSlide(n - 1);
