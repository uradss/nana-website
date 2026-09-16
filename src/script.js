const DISCORD_ID = '822302196372602880';

/* ------------------------------------------------------------------
   PROFILE EFFECT
   Lanyard does not expose which profile effect you own, so paste the
   asset URL here manually. Leave as null to hide it.
   How to get it: open Discord in browser -> DevTools -> Network tab ->
   filter "profile-effects" -> click your own profile -> copy the
   .png / .gif URL of the effect that loads.
   Example:
   const PROFILE_EFFECT_URL =
     'https://cdn.discordapp.com/assets/profile_effects/effects/<id>/intro.png';
------------------------------------------------------------------- */
const PROFILE_EFFECT_URL = null;

const $ = (id) => document.getElementById(id);

/* ---------- profile effect ---------- */
if (PROFILE_EFFECT_URL) {
  const fx = $('profile-effect');
  fx.src = PROFILE_EFFECT_URL;
  fx.hidden = false;
}

/* ---------- view counter ---------- */
fetch('https://api.counterapi.dev/v1/nana-eewonie/visits/up')
  .then((r) => r.json())
  .then((d) => {
    const n = d.count ?? d.value;
    $('view-count').textContent = typeof n === 'number' ? n.toLocaleString() : '—';
  })
  .catch(() => {
    $('view-count').textContent = '—';
  });

/* ---------- discord presence ---------- */
function decorationUrl(user) {
  const deco = user && user.avatar_decoration_data;
  if (!deco || !deco.asset) return null;
  return `https://cdn.discordapp.com/avatar-decoration-presets/${deco.asset}.png?size=256&passthrough=true`;
}

function avatarUrl(user) {
  if (!user || !user.avatar) return null;
  const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${user.avatar}.${ext}?size=256`;
}

function setStatusDots(status) {
  $('avatar-dot').dataset.status = status;
  $('discord-dot').dataset.status = status;
}

function activityText(d) {
  const acts = d.activities || [];
  const custom = acts.find((a) => a.type === 4);
  if (custom && custom.state) {
    return custom.emoji ? `${custom.emoji.name} ${custom.state}` : custom.state;
  }
  const playing = acts.find((a) => a.type !== 4);
  if (playing) {
    return playing.details ? `${playing.name} • ${playing.details}` : playing.name;
  }
  const map = { online: 'online', idle: 'idle', dnd: 'do not disturb', offline: 'offline' };
  return map[d.discord_status] || d.discord_status;
}

function updateSpotify(d) {
  const art = $('spotify-art');
  const fallback = $('spotify-fallback');

  if (d.listening_to_spotify && d.spotify) {
    $('spotify-song').textContent = d.spotify.song;
    $('spotify-artist').textContent = d.spotify.artist;
    if (d.spotify.album_art_url) {
      art.src = d.spotify.album_art_url;
      art.hidden = false;
      fallback.style.display = 'none';
    }
  } else {
    $('spotify-song').textContent = 'Not listening';
    $('spotify-artist').textContent = 'Spotify';
    art.hidden = true;
    fallback.style.display = '';
  }
}

function updateDiscord() {
  fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)
    .then((r) => r.json())
    .then((data) => {
      if (!data.success) {
        $('discord-status').textContent = 'offline';
        setStatusDots('offline');
        return;
      }

      const d = data.data;
      const user = d.discord_user;

      if (user) {
        $('discord-username').textContent = user.global_name || user.username;
      }

      const av = avatarUrl(user);
      if (av) {
        $('main-avatar').src = av;
        $('discord-avatar').src = av;
      }

      // avatar decoration (cat ears, etc.)
      const deco = decorationUrl(user);
      const bigDeco = $('avatar-deco');
      const tileDeco = $('discord-tile-deco');
      if (deco) {
        bigDeco.src = deco;
        tileDeco.src = deco;
        bigDeco.hidden = false;
        tileDeco.hidden = false;
        $('avatar-wrap').classList.add('has-deco');
      } else {
        bigDeco.hidden = true;
        tileDeco.hidden = true;
        $('avatar-wrap').classList.remove('has-deco');
      }

      $('discord-link').href = `https://discord.com/users/${DISCORD_ID}`;
      $('discord-status').textContent = activityText(d);
      setStatusDots(d.discord_status || 'offline');
      updateSpotify(d);
    })
    .catch(() => {
      $('discord-status').textContent = 'offline';
      setStatusDots('offline');
    });
}

updateDiscord();
setInterval(updateDiscord, 20000);

/* ---------- music player ---------- */
const intro = $('intro');
const enterBtn = $('enter-btn');
const audio = $('audio');
const playBtn = $('play-btn');
const playIcon = $('play-icon');
const progressFill = $('progress-fill');
const progressBar = $('progress-bar');
const currentTimeEl = $('current-time');
const durationEl = $('duration');
const volumeSlider = $('volume-slider');
const trackNameEl = $('track-name');

const playlist = [{ name: 'Lover Girl', src: 'src/assets/music/lovergirl.mp3' }];

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
  playIcon.innerHTML = isPlaying
    ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
}

async function playMusic() {
  try {
    await audio.play();
    isPlaying = true;
    updatePlayIcon();
    startVisualizer();
  } catch (err) {
    console.log('Play blocked:', err);
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
  isPlaying ? pauseMusic() : playMusic();
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  progressFill.style.width = (audio.currentTime / audio.duration) * 100 + '%';
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

progressBar.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});

volumeSlider.addEventListener('input', () => {
  audio.volume = volumeSlider.value / 100;
});
audio.volume = volumeSlider.value / 100;

$('prev-btn').addEventListener('click', () => {
  loadTrack((currentTrack - 1 + playlist.length) % playlist.length);
  if (isPlaying) playMusic();
});

$('next-btn').addEventListener('click', () => {
  loadTrack((currentTrack + 1) % playlist.length);
  if (isPlaying) playMusic();
});

audio.addEventListener('ended', () => {
  loadTrack((currentTrack + 1) % playlist.length);
  playMusic();
});

audio.addEventListener('error', () => {
  trackNameEl.textContent = 'Song not found';
});

loadTrack(0);

/* ---------- visualizer ---------- */
const BAR_COUNT = 48;
const vis = $('visualizer');
for (let i = 0; i < BAR_COUNT; i++) vis.appendChild(document.createElement('span'));
const bars = vis.children;

let ctx, analyser, dataArray, rafId;

function startVisualizer() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      return;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  cancelAnimationFrame(rafId);
  draw();
}

function draw() {
  analyser.getByteFrequencyData(dataArray);
  for (let i = 0; i < BAR_COUNT; i++) {
    const v = dataArray[Math.floor((i / BAR_COUNT) * dataArray.length)] || 0;
    bars[i].style.height = Math.max(2, (v / 255) * 22) + 'px';
  }
  rafId = requestAnimationFrame(draw);
}