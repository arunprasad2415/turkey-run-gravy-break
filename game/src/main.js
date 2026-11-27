/* Boot: size the canvas to its backing store, wire input and sound, and run one fixed-step update
   with a render after it. Nothing else lives here, so a reader can start at index.html and always
   know where the game begins. */

import { Game } from './game.js';
import { Input } from './input.js';
import { Audio } from './audio.js';

const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d', { alpha: false });

const input = new Input(canvas);
const audio = new Audio();
input.onFirstGesture = () => audio.start();

const game = new Game(ctx, canvas, input, audio);

let last = performance.now();
let accumulator = 0;
const STEP = 1 / 60;

function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  accumulator += elapsed;
  let guard = 0;
  while (accumulator >= STEP && guard < 6) {
    game.update(STEP);
    accumulator -= STEP;
    guard += 1;
  }
  game.render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// A tiny hook for the game's own tests and for a screenshot script to drive a scene by name.
window.gravyBreak = { game, input, audio };