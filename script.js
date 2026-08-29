// ========== YOUR DISCORD ID ==========
const DISCORD_ID = '822302196372602880';

// ========== VIEW COUNTER ==========
fetch('https://api.countapi.xyz/hit/nana-eewonie-bio/visits')
  .then(r => r.json())
  .then(data => {
    document.getElementById('view-count').textContent = data.value.toLocaleString();
  })
  .catch(() => {
    document.getElementById('view-count').textContent = '—';
  });

// ========== LANYARD  ==========
function updateDiscord() {
  fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        document.getElementById('discord-status').textContent = 'offline';
        return;
      }

      const d = data.data;
      const user = d.discord_user;

      if (user) {
        document.getElementById('discord-username').textContent = user.username;
      }

      if (user && user.avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${user.avatar}.png?size=256`;
        document.getElementById('main-avatar').src = avatarUrl;
        document.getElementById('discord-avatar').src = avatarUrl;
      }

      document.getElementById('discord-link').href = `https://discord.com/users/${DISCORD_ID}`;

      const statusEl = document.getElementById('discord-status');

      if (d.activities && d.activities.length > 0) {
        const custom = d.activities.find(a => a.type === 4);
        if (custom && custom.state) {
          statusEl.textContent = custom.state;
        } else {
          const activity = d.activities[0];
          let text = activity.name || '';
          if (activity.details) text += ` • ${activity.details}`;
          statusEl.textContent = text || d.discord_status;
        }
      } else {
        const statusMap = {
          online: 'online',
          idle: 'idle',
          dnd: 'do not disturb',
          offline: 'offline'
        };
        statusEl.textContent = statusMap[d.discord_status] || d.discord_status;
      }
    })
    .catch(() => {
      document.getElementById('discord-status').textContent = 'offline';
    });
}

updateDiscord();
setInterval(updateDiscord, 30000);

// ========== INTRO + MUSIC ==========
const intro = document.getElementById('intro');
const enterBtn = document.getElementById('enter-btn');
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const progressFill = document.getElementById('progress-fill');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');
const trackNameEl = document.getElementById('track-name');

const playlist = [
  { name: 'Lover Girl', src: 'music/lovergirl.mp3' },
];

let currentTrack = 0;
let isPlaying = false;

function loadTrack(index) {
  currentTrack = index;
  audio.src = playlist[index].src;
  trackNameEl.textContent = playlist[index].name;
  audio.load();
}

function formatTime(sec) {
  if (isNaN(sec) || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updatePlayIcon() {
  if (isPlaying) {
    playIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
  } else {
    playIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
  }
}

async function playMusic() {
  try {
    await audio.play();
    isPlaying = true;
    updatePlayIcon();
  } catch (err) {
    console.log('Play error:', err);
  }
}

function pauseMusic() {
  audio.pause();
  isPlaying = false;
  updatePlayIcon();
}


enterBtn.addEventListener('click', async () => {
  intro.classList.add('hidden');
  await playMusic();
});


playBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (isPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
});

// Progress
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = percent + '%';
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

// Seek
progressBar.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  audio.currentTime = percent * audio.duration;
});

// Volume
volumeSlider.addEventListener('input', (e) => {
  e.stopPropagation();
  audio.volume = volumeSlider.value / 100;
});
audio.volume = volumeSlider.value / 100;

// Prev / Next
document.getElementById('prev-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrack);
  if (isPlaying) playMusic();
});

document.getElementById('next-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  currentTrack = (currentTrack + 1) % playlist.length;
  loadTrack(currentTrack);
  if (isPlaying) playMusic();
});

// Song end
audio.addEventListener('ended', () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  loadTrack(currentTrack);
  playMusic();
});

audio.addEventListener('error', () => {
  trackNameEl.textContent = 'Error loading song';
  console.error('Audio failed. Check: music/lovergirl.mp3');
});

// Load track
loadTrack(0);