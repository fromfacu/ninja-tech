/* DOJO: menú + Snake + integración Tetris (usa funciones globales de tetris.js) */
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const $ = q => document.querySelector(q);

/* UI elements */
const startBtn    = $('#startBtn');
const pauseBtn    = $('#pauseBtn');
const restartBtn  = $('#restartBtn');
const gameSelect  = $('#gameSelect');
const fullscreenBtn = $('#fullscreenBtn');
const overlayMsg  = $('#overlayMsg');

const scoreEl = $('#score');
const hsSnakeEl = $('#highscore-snake');
const hsTetrisEl = $('#highscore-tetris');

/* LocalStorage keys */
const HS_KEY_SNAKE  = 'nt_snake_highscore';
const HS_KEY_TETRIS = 'nt_tetris_highscore';

/* ---------- Variables Snake ---------- */
let box, gridCols, gridRows;
let snake = [], direction = null, score = 0, food = null, gameSnake = null;
let runningSnake = false, pausedSnake = false;
let highScoreSnake = 0;
let snakeRecordSetThisRun = false;

/* ---------- High Scores (carga inicial) ---------- */
function loadAllHighScores() {
  const rawS = localStorage.getItem(HS_KEY_SNAKE);
  const parsedS = parseInt(rawS, 10);
  highScoreSnake = Number.isFinite(parsedS) ? parsedS : 0;

  const rawT = localStorage.getItem(HS_KEY_TETRIS);
  const parsedT = parseInt(rawT, 10);
  const highT = Number.isFinite(parsedT) ? parsedT : 0;

  updateHighScoreUI();
  // sincronizar UI tetris (tetris.js puede exponer una función para esto)
  if (typeof updateTetrisHighScoreUI === 'function') updateTetrisHighScoreUI(highT);
  // set UI text for tetris HS if present
  hsTetrisEl.textContent = 'Tetris Récord: ' + highT;
}

function saveSnakeHighScore() {
  try { localStorage.setItem(HS_KEY_SNAKE, String(highScoreSnake)); } catch(e) {}
}

function updateHighScoreUI() {
  hsSnakeEl.textContent = 'Snake Récord: ' + highScoreSnake;
}

/* ---------- Utilidades UI ---------- */
function showMessage(text, ms = 1200) {
  overlayMsg.textContent = text;
  overlayMsg.style.display = 'block';
  setTimeout(() => overlayMsg.style.display = 'none', ms);
}

/* ---------- Canvas / grid (Snake) ---------- */
function fitCanvas() {
  canvas.style.width  = '90vw';
  canvas.style.height = '90vh';
  const rect = canvas.getBoundingClientRect();
  canvas.width  = Math.floor(rect.width) || 400;
  canvas.height = Math.floor(rect.height) || 400;

  const approx = 20;
  gridCols = Math.max(6, Math.floor(canvas.width / approx));
  gridRows = Math.max(6, Math.floor(canvas.height / approx));
  box = Math.floor(Math.min(canvas.width / gridCols, canvas.height / gridRows));
  if (box < 4) box = 4;
  gridCols = Math.floor(canvas.width / box);
  gridRows = Math.floor(canvas.height / box);

  resetToMenu();
}

/* ---------- Snake: lógica (igual que antes) ---------- */
function placeFood() {
  const cols = gridCols;
  const rows = gridRows;
  let tries = 0;
  do {
    const cx = Math.floor(Math.random() * cols);
    const ry = Math.floor(Math.random() * rows);
    food = { x: cx * box, y: ry * box };
    tries++;
    if (tries > 1000) break;
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function startSnake() {
  const startC = Math.floor(gridCols / 2);
  const startR = Math.floor(gridRows / 2);
  snake = [
    { x: startC * box, y: startR * box },
    { x: (startC - 1) * box, y: startR * box },
    { x: (startC - 2) * box, y: startR * box }
  ];
  direction = 'RIGHT';
  score = 0;
  snakeRecordSetThisRun = false;
  scoreEl.textContent = 'Puntuación: 0';
  placeFood();
  if (gameSnake) clearInterval(gameSnake);
  gameSnake = setInterval(loopSnake, 100);
  runningSnake = true;
  pausedSnake = false;

  pauseBtn.disabled = false;
  restartBtn.disabled = false;
  startBtn.disabled = true;
  gameSelect.disabled = true;
  showMessage('Snake iniciado');
}

function stopSnake() {
  if (gameSnake) clearInterval(gameSnake);
  gameSnake = null;
  runningSnake = false;
  pausedSnake = false;
}

function pauseSnakeToggle() {
  if (!runningSnake) return;
  pausedSnake = !pausedSnake;
  pauseBtn.textContent = pausedSnake ? 'Continuar' : 'Pausa';
  showMessage(pausedSnake ? 'Pausado' : 'Continuando');
}

function restartSnake() {
  stopSnake();
  startSnake();
}

function loopSnake() {
  if (!box || !runningSnake || pausedSnake) return;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#e63946' : '#fff';
    ctx.fillRect(seg.x, seg.y, box, box);
  });
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(food.x, food.y, box, box);

  if (!direction) return;

  const head = { x: snake[0].x, y: snake[0].y };
  if (direction === 'LEFT')  head.x -= box;
  if (direction === 'UP')    head.y -= box;
  if (direction === 'RIGHT') head.x += box;
  if (direction === 'DOWN')  head.y += box;

  const maxX = gridCols * box;
  const maxY = gridRows * box;

  if (head.x < 0 || head.y < 0 || head.x >= maxX || head.y >= maxY ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    stopSnake();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    gameSelect.disabled = false;
    restartBtn.disabled = false;

    if (score > highScoreSnake) {
      highScoreSnake = score;
      saveSnakeHighScore();
      updateHighScoreUI();
      showMessage('¡Nuevo récord Snake: ' + highScoreSnake + '!');
    } else {
      showMessage('Game Over · Puntuación: ' + score);
    }
    setTimeout(() => alert('Game Over · Puntuación final: ' + score), 50);
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = 'Puntuación: ' + score;
    if (score > highScoreSnake && !snakeRecordSetThisRun) {
      highScoreSnake = score;
      saveSnakeHighScore();
      updateHighScoreUI();
      snakeRecordSetThisRun = true;
      showMessage('¡Nuevo récord Snake: ' + highScoreSnake + '!');
    }
    placeFood();
  } else {
    snake.pop();
  }
}

/* ---------- Input global para Snake (flechas + WASD) ---------- */
window.addEventListener('keydown', e => {
  if (!runningSnake && gameSelect.value === 'snake' && (e.key.startsWith('Arrow') || ['w','a','s','d'].includes(e.key.toLowerCase()))) {
    startSnake();
  }

  if (runningSnake && !pausedSnake && gameSelect.value === 'snake') {
    if (e.key === 'ArrowLeft'  && direction !== 'RIGHT') direction = 'LEFT';
    if (e.key === 'ArrowUp'    && direction !== 'DOWN')  direction = 'UP';
    if (e.key === 'ArrowRight' && direction !== 'LEFT')  direction = 'RIGHT';
    if (e.key === 'ArrowDown'  && direction !== 'UP')    direction = 'DOWN';
    if (e.key.toLowerCase() === 'a' && direction !== 'RIGHT') direction = 'LEFT';
    if (e.key.toLowerCase() === 'w' && direction !== 'DOWN')  direction = 'UP';
    if (e.key.toLowerCase() === 'd' && direction !== 'LEFT')  direction = 'RIGHT';
    if (e.key.toLowerCase() === 's' && direction !== 'UP')    direction = 'DOWN';
  }
});

/* ---------- Botones comunes ---------- */
startBtn.addEventListener('click', () => {
  const selection = gameSelect.value;
  if (selection === 'snake') {
    if (typeof stopTetris === 'function') stopTetris();
    startSnake();
  } else if (selection === 'tetris') {
    stopSnake();
    if (typeof startTetris === 'function') {
      startTetris({
        canvas,
        ctx,
        onScore: newScore => { scoreEl.textContent = 'Puntuación: ' + newScore; },
        onHighScoreChange: hs => { hsTetrisEl.textContent = 'Tetris Récord: ' + hs; },
        onGameOver: finalScore => {
          startBtn.disabled = false;
          pauseBtn.disabled = true;
          restartBtn.disabled = false;
          gameSelect.disabled = false;
          showMessage('Game Over · Puntuación: ' + finalScore);
        }
      });
      // disable UI while tetris runs
      pauseBtn.disabled = false;
      restartBtn.disabled = false;
      startBtn.disabled = true;
      gameSelect.disabled = true;
    } else {
      alert('Tetris no disponible. Asegurate de que js/tetris.js esté en la misma carpeta.');
    }
  }
});

pauseBtn.addEventListener('click', () => {
  const selection = gameSelect.value;
  if (selection === 'snake') {
    pauseSnakeToggle();
  } else if (selection === 'tetris') {
    if (typeof togglePauseTetris === 'function') {
      togglePauseTetris();
      pauseBtn.textContent = pauseBtn.textContent === 'Pausa' ? 'Continuar' : 'Pausa';
    }
  }
});

restartBtn.addEventListener('click', () => {
  const selection = gameSelect.value;
  if (selection === 'snake') restartSnake();
  else if (selection === 'tetris' && typeof restartTetris === 'function') restartTetris();
});

fullscreenBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(()=>{});
});

/* ---------- Reset menu (detener ambos y limpiar canvas) ---------- */
function resetToMenu() {
  stopSnake();
  if (typeof stopTetris === 'function') stopTetris();

  score = 0;
  scoreEl.textContent = 'Puntuación: 0';
  pauseBtn.disabled = true;
  restartBtn.disabled = true;
  startBtn.disabled = false;
  gameSelect.disabled = false;
  pauseBtn.textContent = 'Pausa';

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  showMessage('Seleccioná juego y presioná Iniciar', 900);
}

/* ---------- Inicialización ---------- */
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 200));
loadAllHighScores();
fitCanvas();