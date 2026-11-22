// input.js — keyboard + mouse input for the thief.
// WASD / arrows to walk, Shift to sneak, E to grab loot, Q or right-click to
// toss a coin, R to retry after being caught, Enter to start, M to mute.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    // Click-to-move target in canvas coordinates, or null.
    clickTarget: null,
    // A coin toss request: {x, y} in canvas coordinates, consumed by the game.
    coinToss: null,
    // Edge-triggered presses (consumed once per keydown).
    pressed: new Set(),
  };

  function canvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  window.addEventListener('keydown', (ev) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(ev.key)) {
      ev.preventDefault();
    }
    const k = ev.key.toLowerCase();
    if (!ev.repeat) state.pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (ev) => keys.delete(ev.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (ev) => {
    const p = canvasPoint(ev.clientX, ev.clientY);
    if (ev.button === 2) {
      state.coinToss = p;
    } else if (ev.button === 0) {
      state.clickTarget = p;
    }
  });
  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  // Direction from held keys. Returns a unit vector or null.
  state.moveVector = function moveVector() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (x === 0 && y === 0) return null;
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  };

  state.sneaking = function sneaking() {
    return keys.has('shift');
  };

  // True once for a key pressed since the last check.
  state.wasPressed = function wasPressed(key) {
    if (state.pressed.has(key)) {
      state.pressed.delete(key);
      return true;
    }
    return false;
  };

  state.endFrame = function endFrame() {
    state.pressed.clear();
  };

  return state;
}
