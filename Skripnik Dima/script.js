const ROWS = 9;
const COLS = 9;
const MINES_COUNT = 10;

let board = [];
let isGameOver = false;
let flagsLeft = MINES_COUNT;
let cellsRevealed = 0;
let timerInterval = null;
let timeElapsed = 0;
let isFirstClick = true;

const boardElement = document.getElementById('board');
const minesCounter = document.getElementById('mines-counter');
const timerElement = document.getElementById('timer');
const smileyBtn = document.getElementById('smiley-btn');

boardElement.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

function initGame() {
isGameOver = false;
flagsLeft = MINES_COUNT;
cellsRevealed = 0;
timeElapsed = 0;
isFirstClick = true;
board = [];

clearInterval(timerInterval);
updateTimerDisplay();
updateMinesDisplay();

smileyBtn.textContent = '🙂';
boardElement.innerHTML = '';

for (let r = 0; r < ROWS; r++) {
let row = [];
for (let c = 0; c < COLS; c++) {
    row.push({
        r: r, c: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
    });
}
board.push(row);
}
renderBoard();
}

function placeMines(firstRow, firstCol) {
let minesPlaced = 0;
while (minesPlaced < MINES_COUNT) {
let r = Math.floor(Math.random() * ROWS);
let c = Math.floor(Math.random() * COLS);
if (!board[r][c].isMine && (r !== firstRow || c !== firstCol)) {
    board[r][c].isMine = true;
    minesPlaced++;
}
}
calculateNeighbors();
}

function calculateNeighbors() {
for (let r = 0; r < ROWS; r++) {
for (let c = 0; c < COLS; c++) {
    if (board[r][c].isMine) continue;
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
                count++;
            }
        }
    }
    board[r][c].neighborMines = count;
}
}
}

function renderBoard() {
boardElement.innerHTML = '';
for (let r = 0; r < ROWS; r++) {
for (let c = 0; c < COLS; c++) {
    const cellData = board[r][c];
    const cellEl = document.createElement('div');
    cellEl.classList.add('cell');
    
    cellEl.addEventListener('mousedown', (e) => {
        if(e.button === 0 && !isGameOver && !cellData.isRevealed && !cellData.isFlagged) {
            smileyBtn.textContent = '😮';
            cellEl.classList.add('active'); 
        }
    });
    
    cellEl.addEventListener('mouseup', () => {
        if(!isGameOver) smileyBtn.textContent = '🙂';
    });
    
    cellEl.addEventListener('mouseleave', () => {
        cellEl.classList.remove('active');
    });

    cellEl.addEventListener('click', () => handleLeftClick(r, c));
    cellEl.addEventListener('contextmenu', (e) => handleRightClick(e, r, c));

    if (cellData.isRevealed) {
        cellEl.classList.add('revealed');
        if (cellData.isMine) {
            cellEl.textContent = '💣';
            if (cellData.exploded) cellEl.classList.add('exploded');
        } else if (cellData.neighborMines > 0) {
            cellEl.textContent = cellData.neighborMines;
            cellEl.classList.add(`val-${cellData.neighborMines}`);
        }
    } else if (cellData.isFlagged) {
        cellEl.textContent = '🚩';
    } else if (isGameOver && !cellData.isMine && cellData.isFlagged) {
        cellEl.textContent = '💣';
        cellEl.classList.add('wrong-flag');
    }

    boardElement.appendChild(cellEl);
}
}
}

function handleLeftClick(r, c) {
if (isGameOver || board[r][c].isFlagged || board[r][c].isRevealed) return;

if (isFirstClick) {
isFirstClick = false;
placeMines(r, c);
startTimer();
}

if (board[r][c].isMine) {
board[r][c].exploded = true;
gameOver(false);
} else {
revealCell(r, c);
checkWin();
}
renderBoard();
}

function handleRightClick(e, r, c) {
e.preventDefault();
if (isGameOver || board[r][c].isRevealed) return;

const cell = board[r][c];
if (!cell.isFlagged && flagsLeft > 0) {
cell.isFlagged = true;
flagsLeft--;
} else if (cell.isFlagged) {
cell.isFlagged = false;
flagsLeft++;
}
updateMinesDisplay();
renderBoard();
}

function revealCell(r, c) {
if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c].isRevealed || board[r][c].isFlagged) return;

board[r][c].isRevealed = true;
cellsRevealed++;

if (board[r][c].neighborMines === 0) {
for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) revealCell(r + dr, c + dc);
    }
}
}
}

function checkWin() {
if (cellsRevealed === (ROWS * COLS) - MINES_COUNT) gameOver(true);
}

function gameOver(isWin) {
isGameOver = true;
clearInterval(timerInterval);

if (isWin) {
smileyBtn.textContent = '😎';
flagsLeft = 0;
updateMinesDisplay();
for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
        if (board[r][c].isMine) board[r][c].isFlagged = true;
    }
}
} else {
smileyBtn.textContent = '😵';
for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
        if (board[r][c].isMine && !board[r][c].isFlagged) {
            board[r][c].isRevealed = true;
        }
    }
}
}
}

function startTimer() {
timerInterval = setInterval(() => {
timeElapsed++;
if (timeElapsed > 999) timeElapsed = 999;
updateTimerDisplay();
}, 1000);
}

function updateTimerDisplay() {
timerElement.textContent = timeElapsed.toString().padStart(3, '0');
}

function updateMinesDisplay() {
let num = flagsLeft >= 0 ? flagsLeft : Math.abs(flagsLeft);
let sign = flagsLeft < 0 ? '-' : '0';
minesCounter.textContent = sign + num.toString().padStart(2, '0');
}

smileyBtn.addEventListener('click', initGame);
window.onload = initGame;
