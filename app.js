const themeButtons = document.querySelectorAll('[data-control="theme"] .chip');
const livePreview = document.getElementById('livePreview');
const fontSizeControl = document.getElementById('fontSize');
const letterSpacingControl = document.getElementById('letterSpacing');
const soundCards = document.querySelectorAll('.sound-card');
const previewProgress = document.querySelector('.preview-progress');
const progressBar = document.getElementById('progressBar');
const collectionTrack = document.getElementById('collectionTrack');
const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');
const saveRitualBtn = document.getElementById('saveRitual');
const shareExperienceBtn = document.getElementById('shareExperience');

const themeMeta = {
  lumina: {
    label: '晨光 Lumina',
    progress: 0.72,
    accent: 'linear-gradient(120deg, #ffd166, #ff9a8b)'
  },
  noir: {
    label: '暮夜 Noir',
    progress: 0.54,
    accent: 'linear-gradient(120deg, #8ec5fc, #e0c3fc)'
  },
  aurum: {
    label: '琥珀 Aurum',
    progress: 0.88,
    accent: 'linear-gradient(120deg, #f6d365, #fda085)'
  }
};

function updateTheme(theme) {
  if (!livePreview) return;
  livePreview.dataset.theme = theme;
  const meta = themeMeta[theme];
  if (!meta || !previewProgress || !progressBar) return;
  previewProgress.textContent = `當前節奏：${meta.label} ${(meta.progress * 100).toFixed(0)}%`;
  progressBar.style.width = `${meta.progress * 100}%`;
  progressBar.style.backgroundImage = meta.accent;
}

themeButtons.forEach((chip) => {
  chip.addEventListener('click', () => {
    themeButtons.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    updateTheme(chip.dataset.value);
  });
});

function updateTypography() {
  const scale = parseFloat(fontSizeControl.value);
  const spacing = parseFloat(letterSpacingControl.value);
  if (!livePreview) return;
  livePreview.style.setProperty('--preview-scale', scale);
  livePreview.style.fontSize = `${scale}rem`;
  livePreview.style.letterSpacing = `${spacing}em`;
}

if (fontSizeControl) {
  fontSizeControl.addEventListener('input', updateTypography);
}

if (letterSpacingControl) {
  letterSpacingControl.addEventListener('input', updateTypography);
}

updateTypography();

soundCards.forEach((card) => {
  card.addEventListener('click', () => {
    soundCards.forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    const track = card.dataset.sound;
    if (previewProgress) {
      previewProgress.textContent = `當前節奏：${card.dataset.label}`;
    }
    if (livePreview) {
      livePreview.animate(
        [
          { transform: 'translateY(0px)' },
          { transform: 'translateY(-8px)' },
          { transform: 'translateY(0px)' }
        ],
        {
          duration: 800,
          easing: 'ease-out'
        }
      );
      livePreview.dataset.soundscape = track;
    }
    if (progressBar) {
      progressBar.animate(
        [
          { transform: 'scaleX(0.96)', opacity: 0.6 },
          { transform: 'scaleX(1)', opacity: 1 }
        ],
        {
          duration: 600,
          easing: 'ease-out'
        }
      );
    }
  });
});

function scrollCollection(offset) {
  if (!collectionTrack) return;
  collectionTrack.scrollBy({ left: offset, behavior: 'smooth' });
}

if (scrollLeftBtn && scrollRightBtn) {
  scrollLeftBtn.addEventListener('click', () => scrollCollection(-260));
  scrollRightBtn.addEventListener('click', () => scrollCollection(260));
}

function createPulse(button, message) {
  const pulse = document.createElement('span');
  pulse.className = 'pulse';
  pulse.textContent = message;
  button.appendChild(pulse);
  pulse.addEventListener('animationend', () => pulse.remove());
}

if (saveRitualBtn) {
  saveRitualBtn.addEventListener('click', () => {
    createPulse(saveRitualBtn, '已儲存');
    saveRitualBtn.classList.add('active');
    setTimeout(() => saveRitualBtn.classList.remove('active'), 600);
  });
}

if (shareExperienceBtn) {
  shareExperienceBtn.addEventListener('click', () => {
    createPulse(shareExperienceBtn, '邀請已送出');
    shareExperienceBtn.classList.add('active');
    setTimeout(() => shareExperienceBtn.classList.remove('active'), 600);
  });
}

function animateHeroCards() {
  const cards = document.querySelectorAll('.experience-card');
  if (!('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.35 }
  );

  cards.forEach((card) => observer.observe(card));
}

animateHeroCards();

window.addEventListener('load', () => {
  const initialTheme = document.querySelector('[data-control="theme"] .chip.active');
  if (initialTheme) updateTheme(initialTheme.dataset.value);
});
