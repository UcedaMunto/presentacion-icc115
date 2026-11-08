const deck = Array.from(document.querySelectorAll('.slide'));
const stage = document.getElementById('stage');
const current = document.getElementById('slideNumber');
let slideIndex = 0;
const notesBox = document.getElementById('notes');
const notesText = document.getElementById('notesText');

function resizeStage() {
  document.documentElement.style.setProperty(
    '--scale',
    Math.min(innerWidth / 1600, innerHeight / 900).toFixed(5),
  );
}

function updateNotes() {
  notesText.textContent =
    deck[slideIndex].querySelector('.speaker-notes')?.textContent || 'Sin notas.';
}

function showSlide(n) {
  slideIndex = Math.min(deck.length - 1, Math.max(0, n));
  deck.forEach((slide, i) => slide.classList.toggle('active', i === slideIndex));
  current.textContent = `${slideIndex + 1} / ${deck.length}`;
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
    document.querySelector('#imageOverlay img').src = im.src;
    document.getElementById('imageOverlay').classList.add('open');
  }
}
addEventListener('resize', resizeStage);
resizeStage();
window.addEventListener('keydown', (e) => {
  if (document.getElementById('imageOverlay').classList.contains('open')) {
    if (e.key === 'Escape' || e.key === 'Enter')
      document.getElementById('imageOverlay').classList.remove('open');
    return;
  }
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
  } else if (e.key === 'Escape') {
    notesBox.classList.remove('open');
  }
});
stage.addEventListener('click', zoom);
document
  .getElementById('imageOverlay')
  .addEventListener('click', () =>
    document.getElementById('imageOverlay').classList.remove('open'),
  );
document.getElementById('btnPrevious').addEventListener('click', () => moveSlide(-1));
document.getElementById('btnNext').addEventListener('click', () => moveSlide(1));
document.getElementById('btnNotes').addEventListener('click', toggleNotes);
document.getElementById('btnFull').addEventListener('click', toggleFullscreen);
document.getElementById('btnPrint').addEventListener('click', () => window.print());
document
  .getElementById('closeNotes')
  .addEventListener('click', () => notesBox.classList.remove('open'));
const n = parseInt((location.hash.match(/diapositiva-(\d+)/) || [])[1] || '1', 10);
showSlide(n - 1);
