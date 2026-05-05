const CELL_TYPE = {
    EMPTY: 'empty',
    MINE: 'mine',
};

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged',
};

const GAME_STATUS = {
    PROCESS: 'process',
    WIN: 'win',
    LOSE: 'lose',
};

const gameState = {
    rows: 9,
    cols: 9,
    minesCount: 10,
    status: GAME_STATUS.PROCESS,
    gameTime: 0,
    timerId: null,
};

function generateField(rows, cols, minesCount) {
    const field = [];
    for (let row = 0; row < rows; row++) {
        field[row] = [];
        for (let col = 0; col < cols; col++) {
            field[row][col] = {
                type: CELL_TYPE.EMPTY,
                state: CELL_STATE.CLOSED,
                neighborMines: 0,
            };
        }
    }

    let placed = 0;
    while (placed < minesCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        if (field[row][col].type !== CELL_TYPE.MINE) {
            field[row][col].type = CELL_TYPE.MINE;
            placed++;
        }
    }

    return field;
}

function countNeighbourMines(field, rows, cols) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (field[row][col].type === CELL_TYPE.MINE) continue;

            let count = 0;
            for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
                for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                    const neighbourRow = row + directionalRow;
                    const neighbourCol = col + directionalCol;
                    if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
                        if (field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) count++;
                    }
                }
            }
            field[row][col].neighborMines = count;
        }
    }
}

function openCell(field, rows, cols, row, col) {
    if (gameState.status !== GAME_STATUS.PROCESS) return;

    const cell = field[row][col];

    if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

    cell.state = CELL_STATE.OPENED;

    if (cell.type === CELL_TYPE.MINE) {
        gameState.status = GAME_STATUS.LOSE;
        return;
    }

    if (cell.neighborMines === 0) {
        for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
            for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                const neighbourRow = row + directionalRow;
                const neighbourCol = col + directionalCol;
                if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
                    if (field[neighbourRow][neighbourCol].state === CELL_STATE.CLOSED) {
                        openCell(field, rows, cols, neighbourRow, neighbourCol);
                    }
                }
            }
        }
    }

    checkWin(field, rows, cols);
}

function toggleFlag(field, row, col) {
    if (gameState.status !== GAME_STATUS.PROCESS) return;

    const cell = field[row][col];
    if (cell.state === CELL_STATE.OPENED) return;

    if (cell.state === CELL_STATE.CLOSED) {
        cell.state = CELL_STATE.FLAGGED;
    } else if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
    }
}

function checkWin(field, rows, cols) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = field[row][col];
            if (cell.type === CELL_TYPE.EMPTY && cell.state !== CELL_STATE.OPENED) return;
        }
    }
    gameState.status = GAME_STATUS.WIN;
}

function startGame() {
    gameState.status = GAME_STATUS.PROCESS;
    gameState.gameTime = 0;
    gameState.timerId = null;

    const field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
    countNeighbourMines(field, gameState.rows, gameState.cols);

    return field;
}