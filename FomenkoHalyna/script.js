/**
 * 1. Моделювання даних (Data Layer)
 */
const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    status: 'process', // 'process'  'win'  'lose'
    gameTime: 0,
    timerId: null,
    field: [] // Двовимірний масив (сітка)
};

/**
 * 2. Генерацыя поля та мін
 */
function generateField(rows, cols, minesCount) {
    gameState.field = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: 'empty',
                state: 'closed', // 'closed', 'opened', 'flagged'
                neighborMines: 0,
                row: r,
                col: c
            });
        }
        gameState.field.push(row);
    }

    // Розстановка мін 
    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        if (gameState.field[r][c].type !== 'mine') {
            gameState.field[r][c].type = 'mine';
            minesPlaced++;
        }
    }
    
    // Виклик підрахунку сусідів
    countNeighbourMines();
}

/**
 * 3. Алгоритмычна частина (Business Logic)
 */
function getNeighbors(r, c) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                neighbors.push(gameState.field[nr][nc]);
            }
        }
    }
    return neighbors;
}

function countNeighbourMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].type === 'mine') continue;
            const neighbors = getNeighbors(r, c);
            gameState.field[r][c].neighborMines = neighbors.filter(n => n.type === 'mine').length;
        }
    }
}

function openCell(r, c) {
    const cell = gameState.field[r][c];
    if (cell.state !== 'closed' || gameState.status !== 'process') return;

    if (cell.type === 'mine') {
        cell.state = 'opened';
        endGame('lose');
        return;
    }

    cell.state = 'opened';

    // Рекурсивне відкриття порожніх клітинок 
    if (cell.neighborMines === 0) {
        const neighbors = getNeighbors(r, c);
        neighbors.forEach(n => openCell(n.row, n.col));
    }
    checkWin();
}

/**
 * 4. Інтерактив та таймер
 * Керування прапорцями, часом та станами перемоги/поразки
 */
function toggleFlag(r, c) {
    const cell = gameState.field[r][c];
    if (gameState.status !== 'process' || cell.state === 'opened') return;
    cell.state = (cell.state === 'flagged') ? 'closed' : 'flagged';
}

function startTimer() {
    if (gameState.timerId) return;
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
    }, 1000);
}

function stopTimer() {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
}

function endGame(result) {
    gameState.status = result;
    stopTimer();
    console.log(result === 'win' ? "Перемога!" : "Поразка!");
}

function checkWin() {
    const allCells = gameState.field.flat();
    const isWin = allCells.filter(c => c.type === 'empty').every(c => c.state === 'opened');
    if (isWin) endGame('win');
}

generateField(gameState.rows, gameState.cols, gameState.minesCount);
startTimer();