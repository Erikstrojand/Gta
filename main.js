const map = L.map('map').setView([51.505, -0.09], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let moneyCount = 0;
let playerLatLng = map.getCenter();

const playerIcon = L.divIcon({
  className: 'emoji-marker',
  html: `<span class="emoji-inner">
           <span class="player-face">😀</span>
           <span class="player-weapon">✊️</span>
         </span>`,
  iconSize: [48, 32],
  iconAnchor: [24, 16],
});

const playerMarker = L.marker(playerLatLng, { icon: playerIcon }).addTo(map);

const moneyMarkers = [];

function randomNearbyLatLng(center, radiusMeters) {
  const radiusDegrees = radiusMeters / 111320;
  const lat = center.lat + (Math.random() - 0.5) * radiusDegrees * 2;
  const lng = center.lng + (Math.random() - 0.5) * radiusDegrees * 2;
  return L.latLng(lat, lng);
}

for (let i = 0; i < 10; i++) {
  const loc = randomNearbyLatLng(playerLatLng, 200);
  const moneyIcon = L.divIcon({
    className: 'emoji-marker',
    html: '💸',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  const m = L.marker(loc, { icon: moneyIcon }).addTo(map);
  moneyMarkers.push(m);
}

function updateScore() {
  document.getElementById('score').textContent = `Money: ${moneyCount}`;
}

const moveStepMeters = 0.2;

const keysPressed = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

const buttonsPressed = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const DOUBLE_TAP_THRESHOLD = 300;
const lastTapTime = {
  ArrowUp: 0,
  ArrowDown: 0,
  ArrowLeft: 0,
  ArrowRight: 0,
  up: 0,
  down: 0,
  left: 0,
  right: 0,
};

function movePlayer(dx, dy) {
  const deltaLat = dy / 111320;
  const deltaLng = dx / (111320 * Math.cos(playerLatLng.lat * Math.PI / 180));

  playerLatLng = L.latLng(playerLatLng.lat + deltaLat, playerLatLng.lng + deltaLng);
  playerMarker.setLatLng(playerLatLng);
  map.panTo(playerLatLng, { animate: true, duration: 0.25 });

  checkPickup();
}

function checkPickup() {
  for (let i = 0; i < moneyMarkers.length; i++) {
    if (!moneyMarkers[i]) continue;
    const dist = playerLatLng.distanceTo(moneyMarkers[i].getLatLng());
    if (dist < 10) {
      map.removeLayer(moneyMarkers[i]);
      moneyMarkers[i] = null;
      moneyCount++;
      updateScore();
    }
  }
}

function swingWeapon(direction) {
  const iconEl = playerMarker.getElement();
  if (!iconEl) return;

  const inner = iconEl.querySelector('.emoji-inner');
  if (!inner) return;

  inner.classList.add('swinging');
  inner.addEventListener('animationend', () => {
    inner.classList.remove('swinging');
  }, { once: true });

  const weaponEl = iconEl.querySelector('.player-weapon');
  if (!weaponEl) return;

  weaponEl.classList.remove('up', 'down', 'left', 'right');

  if (['ArrowUp', 'up'].includes(direction)) {
    weaponEl.classList.add('up');
  } else if (['ArrowDown', 'down'].includes(direction)) {
    weaponEl.classList.add('down');
  } else if (['ArrowLeft', 'left'].includes(direction)) {
    weaponEl.classList.add('left');
  } else if (['ArrowRight', 'right'].includes(direction)) {
    weaponEl.classList.add('right');
  }

  weaponEl.classList.add('swinging-weapon');
  weaponEl.addEventListener('animationend', () => {
    weaponEl.classList.remove('swinging-weapon', 'up', 'down', 'left', 'right');
  }, { once: true });
}

window.addEventListener('keydown', (e) => {
  if (keysPressed.hasOwnProperty(e.key)) {
    const now = Date.now();
    if (now - lastTapTime[e.key] < DOUBLE_TAP_THRESHOLD) {
      swingWeapon(e.key);
      lastTapTime[e.key] = 0;
    } else {
      keysPressed[e.key] = true;
      lastTapTime[e.key] = now;
    }
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (keysPressed.hasOwnProperty(e.key)) {
    keysPressed[e.key] = false;
    e.preventDefault();
  }
});

document.querySelectorAll('#mobile-controls button').forEach(btn => {
  const dir = btn.getAttribute('data-dir');

  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastTapTime[dir] < DOUBLE_TAP_THRESHOLD) {
      swingWeapon(dir);
      lastTapTime[dir] = 0;
    } else {
      buttonsPressed[dir] = true;
      lastTapTime[dir] = now;
    }
  });

  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    buttonsPressed[dir] = false;
  });

  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastTapTime[dir] < DOUBLE_TAP_THRESHOLD) {
      swingWeapon(dir);
      lastTapTime[dir] = 0;
    } else {
      buttonsPressed[dir] = true;
      lastTapTime[dir] = now;
    }
  });

  btn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    buttonsPressed[dir] = false;
  });

  btn.addEventListener('mouseleave', (e) => {
    e.preventDefault();
    buttonsPressed[dir] = false;
  });
});

function gameLoop() {
  let dx = 0;
  let dy = 0;

  if (keysPressed.ArrowUp) dy += moveStepMeters;
  if (keysPressed.ArrowDown) dy -= moveStepMeters;
  if (keysPressed.ArrowLeft) dx -= moveStepMeters;
  if (keysPressed.ArrowRight) dx += moveStepMeters;

  if (buttonsPressed.up) dy += moveStepMeters;
  if (buttonsPressed.down) dy -= moveStepMeters;
  if (buttonsPressed.left) dx -= moveStepMeters;
  if (buttonsPressed.right) dx += moveStepMeters;

  if (dx !== 0 || dy !== 0) {
    movePlayer(dx, dy);
  }

  requestAnimationFrame(gameLoop);
}

updateScore();
requestAnimationFrame(gameLoop);