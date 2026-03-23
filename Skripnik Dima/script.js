const gameState = {
    rows: 9,
    cols: 9,
    minesCount: 10,
    status: 'process',
    gameTime: 0,
    timerId: null,
    field: []
};

function generateField(rows, cols, minesCount) {
    const field = [];

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: 'empty',
                state: 'closed',
                neighborMines: 0
            });
        }
        field.push(row);
    }

    let placedMines = 0;
    while (placedMines < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        
        if (field[r][c].type !== 'mine') {
            field[r][c].type = 'mine';
            placedMines++;
        }
    }

    return field;
}

function countNeighbourMines(field) {
    const rows = field.length;
    const cols = field[0].length;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (field[r][c].type === 'mine') continue;

            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nr = r + i;
                    const nc = c + j;

                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        if (field[nr][nc].type === 'mine') {
                            count++;
                        }
                    }
                }
            }
            field[r][c].neighborMines = count;
        }
    }
}

function openCell(r, c) {
    if (gameState.status !== 'process') return;

    const cell = gameState.field[r][c];
    if (cell.state === 'opened' || cell.state === 'flagged') return;

    if (cell.type === 'mine') {
        gameState.status = 'lose';
        stopTimer();
        revealAllMines();
        return;
    }

    cell.state = 'opened';

    if (cell.neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const nr = r + i;
                const nc = c + j;
                if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                    openCell(nr, nc);
                }
            }
        }
    }
}

function toggleFlag(r, c) {
    if (gameState.status !== 'process') return;
    
    const cell = gameState.field[r][c];
    if (cell.state === 'opened') return;

    if (cell.state === 'closed') {
        cell.state = 'flagged';
    } else if (cell.state === 'flagged') {
        cell.state = 'closed';
    }
}

function revealAllMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cell = gameState.field[r][c];
            if (cell.type === 'mine' && cell.state !== 'flagged') {
                cell.state = 'opened';
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
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    let flagsCount = 0;

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cellData = gameState.field[r][c];
            const btn = document.createElement('button');
            
            btn.classList.add('cell');
            btn.dataset.row = r;
            btn.dataset.col = c;

            btn.oncontextmenu = (e) => e.preventDefault();

            if (cellData.state === 'flagged') {
                btn.innerHTML = '<span>🚩</span>';
                btn.style.color = 'red'; 
                btn.querySelector('span').style.display = 'block';
                flagsCount++;
            } else if (cellData.state === 'opened') {
                btn.classList.add('opened');
                
                if (cellData.type === 'mine') {
                    btn.classList.add('mine');
                    btn.innerHTML = '<span>💣</span>';
                } else if (cellData.neighborMines > 0) {
                    btn.innerHTML = `<span class="val-${cellData.neighborMines}">${cellData.neighborMines}</span>`;
                }
            }

            boardEl.appendChild(btn);
        }
    }

    const minesCounterEl = document.getElementById('mines-counter');
    const remainingMines = gameState.minesCount - flagsCount;
    minesCounterEl.textContent = String(remainingMines).padStart(3, '0');

    const smileyBtn = document.getElementById('smiley-btn');
    if (gameState.status === 'lose') {
        smileyBtn.textContent = '😵';
    } else if (gameState.status === 'win') {
        smileyBtn.textContent = '😎';
    } else {
        smileyBtn.textContent = '🙂';
    }
}

document.getElementById('board').addEventListener('mousedown', function(e) {
    const btn = e.target.closest('.cell');
    if (!btn) return;

    const r = parseInt(btn.dataset.row);
    const c = parseInt(btn.dataset.col);

    if (e.button === 0) {
        if (gameState.gameTime === 0 && gameState.status === 'process') {
            startTimer();
        }
        openCell(r, c);
        checkWinCondition();
        }

    else if (e.button === 2) {
        toggleFlag(r, c);
    }

    renderBoard();
});

document.getElementById('smiley-btn').addEventListener('click', function(e) {
    e.preventDefault();
    initGame();
});

function checkWinCondition() {
    if (gameState.status !== 'process') return;

    let closedCount = 0;
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.field[r][c].state !== 'opened') {
                closedCount++;
            }
        }
    }

    if (closedCount === gameState.minesCount) {
        gameState.status = 'win';
        stopTimer();
    }
}

function initGame() {
    gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
    countNeighbourMines(gameState.field);
    gameState.status = 'process';
    
    gameState.gameTime = 0;
    stopTimer();
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) timerDisplay.textContent = '000';
    renderBoard();
}

initGame();
