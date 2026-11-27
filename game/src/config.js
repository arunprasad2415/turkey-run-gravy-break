/* Tuning for Gravy Break. Every number a designer would want to change twice lives here so the
   behaviour modules (player, farmer, hazards) stay about behaviour and not about balance. */

export const VIEW = { w: 1280, h: 720 };

export const WORLD_SEED = 0x9e3779b9;

export const PALETTE = {
  sky: '#f3c98b',
  ground: '#8a5a34',
  groundLight: '#a06b3e',
  groundDark: '#6f4526',
  straw: '#e8c873',
  strawDark: '#c9a54c',
  barnRed: '#9b3a2c',
  barnShade: '#7a2b21',
  leaf: '#c9752f',
  leafDeep: '#8c4a1e',
  cream: '#f7e7c8',
  ink: '#2a1a10',
  turkeyBody: '#6b4326',
  turkeyWing: '#8a5a34',
  turkeyFan: '#b0703c',
  turkeyHead: '#c9a08a',
  wattle: '#d8453a',
  overalls: '#3f5d7d',
  shirt: '#d9d2c4',
  skin: '#e0a87a',
  metal: '#c9ced6',
  steel: '#8f97a3',
  flame: '#f6a02a',
  flameHot: '#ffe08a',
  danger: '#d2452f',
  good: '#7dc26a',
  night: '#3a2418',
  tile: '#7c8785',
  tileDark: '#727d7b',
  path: '#a87d5a',
  pathEdge: '#8d6746',
  pumpkin: '#d97a2b',
  pumpkinDark: '#a9521c',
  stew: '#6f8f4a',
};

export const PLAYER = {
  radius: 16,
  walkSpeed: 200,
  sprintSpeed: 312,
  sprintCost: 30,
  staminaRegen: 19,
  staminaMax: 100,
  dashSpeed: 560,
  dashTime: 0.16,
  dashCost: 18,
  dashCooldown: 1.05,
  hitInvuln: 1.6,
  caughtShove: 190,
  gobbleRadius: 300,
};

export const FARMER = {
  radius: 20,
  patrolSpeed: 118,
  chaseSpeed: 252,
  searchSpeed: 158,
  visionRange: 336,
  visionHalfAngle: 0.62,
  nearSense: 92,
  loseSightAfter: 3.4,
  searchTime: 5.5,
  catchRange: 36,
  spottedGrowlSeconds: 0.35,
};

export const KNIFE = {
  telegraph: 0.92,
  fall: 0.24,
  hitRadius: 24,
  life: 1.5,
};

export const OVEN = {
  cycle: 3.4,
  warn: 0.75,
  jet: 1.0,
  jetLength: 168,
  jetHalfWidth: 52,
};

export const SCORE = {
  corn: 40,
  distancePerPoint: 9,
  stageClear: 250,
  lifeLeft: 150,
  timeBonusMax: 320,
  timeBonusPar: 75,
  comboWindow: 2.4,
  comboStep: 0.25,
};

export const STAMINA_BAR = { w: 232, h: 14 };

export const KEYMAP = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  dash: ['Space'],
  gobble: ['KeyG', 'KeyE'],
  start: ['Enter', 'NumpadEnter'],
  restart: ['KeyR'],
  mute: ['KeyM'],
  pause: ['KeyP', 'Escape'],
};

export const STAGE_NAMES = ['The Farmyard', 'Cider Orchard', 'The Kitchen'];

export const FLOW = {
  stageIntro: 1.6,
  stageClearHold: 2.4,
  endDelay: 0.9,
  cameraLag: 0.12,
};