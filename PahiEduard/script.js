const gameState = {
    rows: 9,
    cols: 9,
    minesCount: 10,
    status: 'process',
    gameTime: 0,
    timerId: null,
};

function generateField(rows, cols, minesCount){
    const field = [];
    for (let r = 0; r < rows; r++){
        field[r] = [];
        for(let c = 0; c < cols; c++){
            field[r][c] = {
                type: 'empty',
                state: 'closed',
                neighborMines: 0,
            };
        }
    }

    let placed = 0;
    while (placed < minesCount){
        const r = Math.floor(Math.random()*rows);
        const c = Math.floor(Math.random()*cols);
        if (field[r][c].type !== 'mine') {
            field[r][c].type = 'mine';
            placed++;
        }
    }

    return field;
}

function countNeighbourMines(field, rows, cols){
    for (let r = 0; r < rows; r++){
        for(let c  = 0; c < cols; c++){
            if (field[r][c].type === 'mine') continue;

            let count = 0;
            for (let dr = -1; dr <= 1; dr++){
                for(let dc = -1; dc <= 1; dc++){
                    const nr = r + dr;
                    const nc = c + dc;
                    if(nr >= 0 && nr < rows && nc >= 0 && nc < cols){
                        if(field[nr][nc].type === 'mine') count++;
                    }
                }
            }
            field[r][c].neighborMines = count;
        }
    }
}

function openCell(field, rows, cols, r, c){
    const cell = field[r][c];

    if(cell.state === 'opened' || cell.state === 'flagged') return;

    cell.state = 'opened';

    if(cell.type === 'mine'){
        gameState.status = 'lose';
        stopTimer();
        return;
    }

    if(cell.neighborMines === 0){
        for(let dr = -1; dr <= 1; dr++){
            for(let dc = -1; dc <= 1; dc++){
                const nr = r + dr;
                const nc = c + dc;
                if(nr >= 0 && nr < rows && nc >= 0 && nc < cols){
                    if(field[nr][nc].state === 'closed'){
                        openCell(field, rows, cols, nr, nc)
                    }
                }
            }
        }
    }
    checkWin(field,rows,cols);
}

function toggleFlag(field, r, c){
    const cell = field[r][c];
    if(cell.state === 'opened') return;

    if(cell.state === 'closed'){
        cell.state = 'flagged';
    } else if (cell.state === 'flagged'){
        cell.state = 'closed';
    }
}

function checkWin(field, rows, cols){
    for (let r = 0; r < rows; r++){
        for (let c = 0; c < cols; c++){
            const cell = field[r][c];
            if(cell.type === 'empty' && cell.state !== 'opened') return;
        }
    }
    gameState.status = 'win';
    stopTimer();
}

function startTimer(){
    gameState.timerId = setInterval(()=>{
        gameState.gameTime++;
    }, 1000);
}

function stopTimer(){
    clearInterval(gameState.timerId);
    gameState.timerId = null;
}

function startGame(){
    stopTimer();
    gameState.status = 'process';
    gameState.gameTime = 0;

    const field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
    countNeighbourMines(field, gameState.rows, gameState.cols);
    startTimer();

    return field;
}