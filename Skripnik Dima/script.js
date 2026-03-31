const GAME_STATUS = {
    PLAYING: 'process',
    WIN: 'win',
    LOSE: 'lose'
};

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

const CELL_CONTENT = {
    EMPTY: 'empty',
    MINE: 'mine'
};

const gameState = {
    rows: 9,
    cols: 9,
    minesCount: 10,
    status: GAME_STATUS.PLAYING,
    gameTime: 0,
    timerId: null,
    field: []
};

function generateField(rows, cols, minesCount) {
    const field = [];

    for (let row = 0; row < rows; row++) {
        const rowCells = [];
        for (let col = 0; col < cols; col++) {
            rowCells.push({
                type: CELL_CONTENT.EMPTY,
                state: CELL_STATE.CLOSED,
                neighborMines: 0
            });
        }
        field.push(rowCells);
    }

    let placedMines = 0;
    while (placedMines < minesCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        
        if (field[row][col].type !== CELL_CONTENT.MINE) {
            field[row][col].type = CELL_CONTENT.MINE;
            placedMines++;
        }
    }

    return field;
}

function countNeighbourMines(field) {
    const rows = field.length;
    const cols = field[0].length;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (field[row][col].type === CELL_CONTENT.MINE) continue;

            let count = 0;
            for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
                for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                    const neighbourRow = row + directionalRow;
                    const neighbourCol = col + directionalCol;

                    if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
                        if (field[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE) {
                            count++;
                        }
                    }
                }
            }
            field[row][col].neighborMines = count;
        }
    }
}

function openCell(row, col) {
    if (gameState.status !== GAME_STATUS.PLAYING) return;

    const cell = gameState.field[row][col];
    if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

    if (cell.type === CELL_CONTENT.MINE) {
        gameState.status = GAME_STATUS.LOSE;
        stopTimer();
        revealAllMines();
        return;
    }

    cell.state = CELL_STATE.OPENED;

    if (cell.neighborMines === 0) {
        for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
            for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                const neighbourRow = row + directionalRow;
                const neighbourCol = col + directionalCol;
                if (neighbourRow >= 0 && neighbourRow < gameState.rows && neighbourCol >= 0 && neighbourCol < gameState.cols) {
                    openCell(neighbourRow, neighbourCol);
                }
            }
        }
    }
}

function toggleFlag(row, col) {
    if (gameState.status !== GAME_STATUS.PLAYING) return;
    
    const cell = gameState.field[row][col];
    if (cell.state === CELL_STATE.OPENED) return;

    if (cell.state === CELL_STATE.CLOSED) {
        cell.state = CELL_STATE.FLAGGED;
    } else if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
    }
}

function revealAllMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cell = gameState.field[row][col];
            if (cell.type === CELL_CONTENT.MINE && cell.state !== CELL_STATE.FLAGGED) {
                cell.state = CELL_STATE.OPENED;
            }
        }
    }
}

function startTimer() {
    if (gameState.timerId) return;
    
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            timerDisplay.textContent = String(gameState.gameTime).padStart(3, '0');
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    let flagsCount = 0;

    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            const cellData = gameState.field[row][col];
            const cellButton = document.createElement('button');
            
            cellButton.classList.add('cell');
            cellButton.dataset.row = row;
            cellButton.dataset.col = col;

            cellButton.oncontextmenu = (e) => e.preventDefault();

            if (cellData.state === CELL_STATE.FLAGGED) {
                cellButton.innerHTML = '<span>🚩</span>';
                cellButton.style.color = 'red'; 
                cellButton.querySelector('span').style.display = 'block';
                flagsCount++;
            } else if (cellData.state === CELL_STATE.OPENED) {
                cellButton.classList.add('opened');
                
                if (cellData.type === CELL_CONTENT.MINE) {
                    cellButton.classList.add('mine');
                    cellButton.innerHTML = '<span>💣</span>';
                } else if (cellData.neighborMines > 0) {
                    cellButton.innerHTML = `<span class="val-${cellData.neighborMines}">${cellData.neighborMines}</span>`;
                }
            }

            boardEl.appendChild(cellButton);
        }
    }

    const minesCounterElement = document.getElementById('mines-counter');
    const remainingMines = gameState.minesCount - flagsCount;
    minesCounterElement.textContent = String(remainingMines).padStart(3, '0');

    const smileyButton = document.getElementById('smiley-btn');
    if (gameState.status === GAME_STATUS.LOSE) {
        smileyButton.textContent = '😵';
    } else if (gameState.status === GAME_STATUS.WIN) {
        smileyButton.textContent = '😎';
    } else {
        smileyButton.textContent = '🙂';
    }
}

document.getElementById('board').addEventListener('mousedown', function(e) {
    const cellButton = e.target.closest('.cell');
    if (!cellButton) return;

    const row = parseInt(cellButton.dataset.row);
    const col = parseInt(cellButton.dataset.col);

    if (e.button === 0) {
        if (gameState.gameTime === 0 && gameState.status === GAME_STATUS.PLAYING) {
            startTimer();
        }
        openCell(row, col);
        checkWinCondition();
        }

    else if (e.button === 2) {
        toggleFlag(row, col);
    }

    renderBoard();
});

document.getElementById('smiley-btn').addEventListener('click', function(e) {
    e.preventDefault();
    initGame();
});

function checkWinCondition() {
    if (gameState.status !== GAME_STATUS.PLAYING) return;

    let closedCount = 0;
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (gameState.field[row][col].state !== CELL_STATE.OPENED) {
                closedCount++;
            }
        }
    }

    if (closedCount === gameState.minesCount) {
        gameState.status = GAME_STATUS.WIN;
        stopTimer();
    }
}

function initGame() {
    gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
    countNeighbourMines(gameState.field);
    gameState.status = GAME_STATUS.PLAYING;

    gameState.gameTime = 0;
    stopTimer();
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) timerDisplay.textContent = '000';
    renderBoard();
}

initGame();

