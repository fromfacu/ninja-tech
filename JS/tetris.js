/* tetris.js
   Tetris minimal (I + O tetrominós) con:
   - tablero 10x20
   - spawn, movimiento, rotación, colisión, apilado
   - detección y eliminación de líneas
   - puntuación y highscore en localStorage (nt_tetris_highscore)
   Expuesto: startTetris, stopTetris, togglePauseTetris, restartTetris, updateTetrisHighScoreUI
*/
(function(global) {
  const HS_KEY = 'nt_tetris_highscore';

  let canvas, ctx;
  const COLS = 10, ROWS = 20;
  let box;
  let board;
  let current = null, nextPiece = null;
  let gameInterval = null;
  let dropInterval = 500;
  let running = false, paused = false;
  let score = 0, highScore = 0;

  let onScore = null, onHighScoreChange = null, onGameOver = null;

  const COLORS = { 1: '#00f0ff', 2: '#ffd86b' };

  const TETROS = {
    I: { id:1, matrix:[
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0]
    ]},
    O: { id:2, matrix:[
      [0,1,1,0],
      [0,1,1,0],
      [0,0,0,0],
      [0,0,0,0]
    ]}
  };

  function clonePiece(p){ return { id: p.id, matrix: p.matrix.map(r=>r.slice()) }; }
  function randPiece(){ return Math.random() < 0.5 ? clonePiece(TETROS.I) : clonePiece(TETROS.O); }

  function initBoard(){ board = Array.from({length: ROWS}, ()=>Array(COLS).fill(0)); }

  function fitGrid() {
    box = Math.floor(Math.min(canvas.width / COLS, canvas.height / ROWS));
    if (box < 6) box = 6;
  }

  function spawnPiece() {
    current = nextPiece || randPiece();
    nextPiece = randPiece();
    current.x = Math.floor((COLS - 4) / 2);
    current.y = -1;
  }

  function rotateMatrix(m) {
    const N = m.length;
    const res = Array.from({length:N}, ()=>Array(N).fill(0));
    for (let x=0;x<N;x++) for (let y=0;y<N;y++) res[x][y] = m[N-1-y][x];
    return res;
  }

  function collide(matrix, posX, posY) {
    for (let r=0;r<matrix.length;r++){
      for (let c=0;c<matrix[r].length;c++){
        if (!matrix[r][c]) continue;
        const x = posX + c, y = posY + r;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && board[y][x]) return true;
      }
    }
    return false;
  }

  function lockPiece() {
    const m = current.matrix;
    for (let r=0;r<m.length;r++) for (let c=0;c<m[r].length;c++){
      if (!m[r][c]) continue;
      const x = current.x + c, y = current.y + r;
      if (y >= 0) board[y][x] = current.id;
    }
    clearLines();
    spawnPiece();
    if (collide(current.matrix, current.x, current.y)) endGame();
  }

  function clearLines() {
    let lines = 0;
    for (let r = ROWS -1; r >= 0; r--) {
      if (board[r].every(v => v !== 0)) {
        board.splice(r,1);
        board.unshift(Array(COLS).fill(0));
        lines++;
        r++;
      }
    }
    if (lines > 0) {
      const pointsMap = {1:100,2:300,3:500,4:800};
      const add = pointsMap[lines] || (lines * 200);
      score += add;
      if (onScore) onScore(score);
      if (score > highScore) {
        highScore = score;
        try { localStorage.setItem(HS_KEY, String(highScore)); } catch(e){}
        if (onHighScoreChange) onHighScoreChange(highScore);
      }
    }
  }

  function softDrop() {
    if (!current) return;
    if (!collide(current.matrix, current.x, current.y + 1)) current.y++;
    else lockPiece();
    draw();
  }

  function tick() {
    if (!running || paused) return;
    if (!collide(current.matrix, current.x, current.y + 1)) current.y++;
    else lockPiece();
    draw();
  }

  function drawCell(x,y,id){
    if (id === 0) return;
    ctx.fillStyle = COLORS[id] || '#888';
    ctx.fillRect(x*box, y*box, box-1, box-1);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x*box + (box*0.12), y*box + (box*0.12), box*0.76, box*0.76);
  }

  function draw(){
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width, canvas.height);

    const totalW = box * COLS, totalH = box * ROWS;
    const offsetX = Math.floor((canvas.width - totalW) / 2);
    const offsetY = Math.floor((canvas.height - totalH) / 2);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    for (let r=0;r<ROWS;r++){
      for (let c=0;c<COLS;c++){
        const id = board[r][c];
        if (id) drawCell(c,r,id);
        else {
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.strokeRect(c*box, r*box, box, box);
        }
      }
    }

    if (current) {
      const m = current.matrix;
      for (let r=0;r<m.length;r++){
        for (let c=0;c<m[r].length;c++){
          if (!m[r][c]) continue;
          const x = current.x + c, y = current.y + r;
          if (y >= -3) drawCell(x, y, current.id);
        }
      }
    }

    ctx.restore();
  }

  function moveLeft(){ if (!current) return; if (!collide(current.matrix, current.x-1, current.y)) current.x--; draw(); }
  function moveRight(){ if (!current) return; if (!collide(current.matrix, current.x+1, current.y)) current.x++; draw(); }
  function rotatePiece(){
    if (!current) return;
    const rotated = rotateMatrix(current.matrix);
    const kicks = [0, -1, 1, -2, 2];
    for (let k of kicks) {
      if (!collide(rotated, current.x + k, current.y)) {
        current.matrix = rotated;
        current.x += k;
        draw();
        return;
      }
    }
  }

  function onKeyDown(e){
    if (!running || paused) return;
    if (e.key === 'ArrowLeft') { moveLeft(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { moveRight(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { rotatePiece(); e.preventDefault(); }
    if (e.key === 'ArrowDown') { softDrop(); e.preventDefault(); }
    if (e.key === ' ') {
      e.preventDefault();
      while (!collide(current.matrix, current.x, current.y+1)) current.y++;
      lockPiece();
      draw();
    }
  }

  function startTetris(opts = {}) {
    if (!opts.canvas || !opts.ctx) {
      console.warn('startTetris requiere canvas y ctx en opts');
      return;
    }
    canvas = opts.canvas; ctx = opts.ctx;
    onScore = opts.onScore || null;
    onHighScoreChange = opts.onHighScoreChange || null;
    onGameOver = opts.onGameOver || null;

    fitGrid();
    initBoard();
    score = 0;
    running = true;
    paused = false;

    const raw = localStorage.getItem(HS_KEY);
    const parsed = parseInt(raw, 10);
    highScore = Number.isFinite(parsed) ? parsed : 0;
    if (onHighScoreChange) onHighScoreChange(highScore);
    if (onScore) onScore(score);

    spawnPiece();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(tick, dropInterval);
    window.addEventListener('keydown', onKeyDown);

    draw();
  }

  function endGame() {
    running = false;
    paused = false;
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    window.removeEventListener('keydown', onKeyDown);
    try { if (onGameOver) onGameOver(score); } catch(e){}
  }

  function stopTetris() {
    running = false;
    paused = false;
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    window.removeEventListener('keydown', onKeyDown);
    if (ctx && canvas) { ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height); }
  }

  function togglePauseTetris() {
    if (!running) return;
    paused = !paused;
    if (!paused && !gameInterval) gameInterval = setInterval(tick, dropInterval);
    else if (paused && gameInterval) { clearInterval(gameInterval); gameInterval = null; }
  }

  function restartTetris() {
    stopTetris();
    startTetris({ canvas, ctx, onScore, onHighScoreChange, onGameOver });
  }

  function updateTetrisHighScoreUI(hs) {
    highScore = hs || highScore;
    if (onHighScoreChange) onHighScoreChange(highScore);
  }

  global.startTetris = startTetris;
  global.stopTetris = stopTetris;
  global.togglePauseTetris = togglePauseTetris;
  global.restartTetris = restartTetris;
  global.updateTetrisHighScoreUI = updateTetrisHighScoreUI;
  global.getTetrisHighScore = () => highScore;

})(window);