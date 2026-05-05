/**
 * КОНСТАНТИ (Enums) - Виправлення згідно з коментарем про "Raw string literals"
 */
const CELL_CONTENT = {
    MINE: 'mine',
    EMPTY: 'empty'
};

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

const GAME_STATUS = {
    IDLE: 'idle',
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
};

/**
 * НАЛАШТУВАННЯ - Виправлення "Magic numbers"
 */
const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_MINES_COUNT = 15;

const gameState = {
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    minesCount: DEFAULT_MINES_COUNT,
    status: GAME_STATUS.IDLE,
    gameTime: 0,
    timerId: null,
    field: []
};

/**
 * ЛОГІКА ГЕНЕРАЦІЇ - Тепер функція "чиста" (Pure function)
 */
function generateField(rows, cols, minesCount) {
    const newField = [];
    for (let row = 0; row < rows; row++) {
        const currentRow = [];
        for (let col = 0; col < cols; col++) {
            currentRow.push({
                type: CELL_CONTENT.EMPTY,
                state: CELL_STATE.CLOSED,
                neighborMines: 0,
                row: row,
                col: col
            });
        }
        newField.push(currentRow);
    }

    let minesPlaced = 0;
    while (minesPlaced < minesCount) {
        const randomRow = Math.floor(Math.random() * rows);
        const randomCol = Math.floor(Math.random() * cols);

        if (newField[randomRow][randomCol].type !== CELL_CONTENT.MINE) {
            newField[randomRow][randomCol].type = CELL_CONTENT.MINE;
            minesPlaced++;
        }
    }
    return newField;
}

/**
 * АЛГОРИТМІЧНА ЧАСТИНА - Виправлені імена змінних (Naming)
 */
function getNeighbors(field, rows, cols, row, col) {
    const neighbors = [];
    for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
        for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
            if (directionalRow === 0 && directionalCol === 0) continue;
            
            const neighbourRow = row + directionalRow;
            const neighbourCol = col + directionalCol;

            if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
                neighbors.push(field[neighbourRow][neighbourCol]);
            }
        }
    }
    return neighbors;
}

function countNeighbourMines(field, rows, cols) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (field[row][col].type === CELL_CONTENT.MINE) continue;
            
            const neighbors = getNeighbors(field, rows, cols, row, col);
            field[row][col].neighborMines = neighbors.filter(n => n.type === CELL_CONTENT.MINE).length;
        }
    }
}

/**
 * ІГРОВІ ДІЇ
 */
function openCell(row, col) {
    // Таймер стартує тільки при першому кліку - Виправлення "Timer auto-starts"
    if (gameState.status === GAME_STATUS.IDLE) {
        gameState.status = GAME_STATUS.PLAYING;
        startTimer();
    }

    const cell = gameState.field[row][col];
    if (cell.state !== CELL_STATE.CLOSED || gameState.status !== GAME_STATUS.PLAYING) return;

    if (cell.type === CELL_CONTENT.MINE) {
        cell.state = CELL_STATE.OPENED;
        endGame(GAME_STATUS.LOST);
        return;
    }

    cell.state = CELL_STATE.OPENED;

    if (cell.neighborMines === 0) {
        const neighbors = getNeighbors(gameState.field, gameState.rows, gameState.cols, row, col);
        neighbors.forEach(n => {
            if (n.state === CELL_STATE.CLOSED) {
                openCell(n.row, n.col);
            }
        });
    }
    checkWin();
}

function startTimer() {
    if (gameState.timerId) clearInterval(gameState.timerId);
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
    // Прибрано console.log з повідомленням про перемогу - Виправлення "Accessibility"
}

function checkWin() {
    const allCells = gameState.field.flat();
    const isWin = allCells.filter(c => c.type === CELL_CONTENT.EMPTY).every(c => c.state === CELL_STATE.OPENED);
    if (isWin) endGame(GAME_STATUS.WON);
}

// Ініціалізація
gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
countNeighbourMines(gameState.field, gameState.rows, gameState.cols);
