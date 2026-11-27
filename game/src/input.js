/* Keyboard and pointer input. The game asks for a direction vector and for edges (a key that went
   down this frame), never for a raw key event, so gameplay code holds no DOM detail. */

import { KEYMAP } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.held = new Set();
    this.edges = new Set();
    this.pointer = { x: 0, y: 0, clicked: false };
    this.anyKeyAt = 0;
    this.onFirstGesture = null;
    this.gestureSeen = false;

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.held.add(event.code);
      this.edges.add(event.code);
      this.anyKeyAt = performance.now();
      this.firstGesture();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.held.delete(event.code);
    });
    window.addEventListener('blur', () => this.held.clear());
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.pointer.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.pointer.clicked = true;
      this.firstGesture();
    });
  }

  firstGesture() {
    if (this.gestureSeen) return;
    this.gestureSeen = true;
    if (this.onFirstGesture) this.onFirstGesture();
  }

  down(action) {
    return KEYMAP[action].some((code) => this.held.has(code));
  }

  pressed(action) {
    return KEYMAP[action].some((code) => this.edges.has(code));
  }

  get anyPressed() {
    return this.edges.size > 0;
  }

  axis() {
    let x = 0;
    let y = 0;
    if (this.down('left')) x -= 1;
    if (this.down('right')) x += 1;
    if (this.down('up')) y -= 1;
    if (this.down('down')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  endFrame() {
    this.edges.clear();
    this.pointer.clicked = false;
  }
}