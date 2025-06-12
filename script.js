async function fetchCameras() {
  const res = await fetch('streams.json');
  return await res.json();
}

function setupHLS(video, src) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(err => console.warn("Autoplay blocked:", err));
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = src;
    video.play().catch(err => console.warn("Autoplay blocked:", err));
  }
}

async function loadAllCameras() {
  const grid = document.getElementById('cameraGrid');
  const cameras = await fetchCameras();
  cameras.forEach(cam => {
    const card = document.createElement('div');
    card.className = 'video-card';
    const title = document.createElement('h2');
    title.textContent = cam.label;
    const video = document.createElement('video');
    video.controls = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    setupHLS(video, cam.src);
    card.appendChild(title);
    card.appendChild(video);
    grid.appendChild(card);
  });
}

async function loadRotationView() {
  const video = document.getElementById('rotationVideo');
  const intervalSelect = document.getElementById('interval');
  const cameras = await fetchCameras();
  let index = 0;

  function playNext() {
    setupHLS(video, cameras[index].src);
    index = (index + 1) % cameras.length;
  }

  playNext();
  setInterval(playNext, parseInt(intervalSelect.value) * 1000);
  intervalSelect.addEventListener('change', () => {
    location.reload();
  });
}

async function loadSingleView() {
  const select = document.getElementById('cameraSelect');
  const video = document.getElementById('singleVideo');
  const cameras = await fetchCameras();

  cameras.forEach(cam => {
    const option = document.createElement('option');
    option.value = cam.src;
    option.textContent = cam.label;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    setupHLS(video, select.value);
  });

  setupHLS(video, select.value);
}

// Hamburger menu toggle
window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('menu-toggle');
  const dropdown = document.getElementById('dropdown');
  toggle.addEventListener('click', () => {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });
});
