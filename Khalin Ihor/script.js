"use strict";


const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    status: "process",
    gameTime: 0,
    timerId: null,
    field: [],
};

const neighbourDirections = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
];

function isInsideBoard(row, col) {
    return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}

function countMinesInField(field) {
    let mines = 0;

    for (let row = 0; row < field.length; row += 1) {
        for (let col = 0; col < (field[row]?.length ?? 0); col += 1) {
            if (field[row][col].type === "mine") {
                mines += 1;
            }
        }
    }

    return mines;
}

function setField(field) {
    gameState.field = field;
    gameState.rows = field.length;
    gameState.cols = field[0]?.length ?? 0;
    gameState.minesCount = countMinesInField(field);
    gameState.status = "process";
    gameState.gameTime = 0;

    stopTimer();
    countNeighbourMines(gameState.field);
}

function countNeighbourMines(field) {
    const rows = field.length;
    const cols = field[0]?.length ?? 0;

    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const cell = field[row][col];
            if (cell.type === "mine") {
                continue;
            }

            let neighbourMines = 0;

            for (const [dRow, dCol] of neighbourDirections) {
                const nextRow = row + dRow;
                const nextCol = col + dCol;
                const inside = nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols;

                if (inside && field[nextRow][nextCol].type === "mine") {
                    neighbourMines += 1;
                }
            }

            cell.neighborMines = neighbourMines;
        }
    }
}

function startTimer(onTick) {
    if (gameState.timerId !== null) {
        return;
    }

    gameState.timerId = setInterval(() => {
        gameState.gameTime += 1;

        if (typeof onTick === "function") {
            onTick(gameState.gameTime);
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId === null) {
        return;
    }

    clearInterval(gameState.timerId);
    gameState.timerId = null;
}

function checkWinCondition() {
    const safeCells = gameState.rows * gameState.cols - gameState.minesCount;
    let openedSafeCells = 0;

    for (let row = 0; row < gameState.rows; row += 1) {
        for (let col = 0; col < gameState.cols; col += 1) {
            const cell = gameState.field[row][col];
            if (cell.type !== "mine" && cell.state === "opened") {
                openedSafeCells += 1;
            }
        }
    }

    if (openedSafeCells === safeCells) {
        gameState.status = "win";
        stopTimer();
    }
}

function openCellRecursive(row, col) {
    if (!isInsideBoard(row, col)) {
        return;
    }

    const cell = gameState.field[row][col];

    if (cell.state === "opened" || cell.state === "flagged") {
        return;
    }

    cell.state = "opened";

    if (cell.type === "mine") {
        gameState.status = "lose";
        stopTimer();
        return;
    }

    if (cell.neighborMines === 0) {
        for (const [dRow, dCol] of neighbourDirections) {
            openCellRecursive(row + dRow, col + dCol);
        }
    }
}

function openCell(row, col) {
    if (gameState.status !== "process" || !isInsideBoard(row, col)) {
        return;
    }

    const cell = gameState.field[row][col];
    if (cell.state === "opened" || cell.state === "flagged") {
        return;
    }

    if (gameState.timerId === null) {
        startTimer();
    }

    openCellRecursive(row, col);

    if (gameState.status === "process") {
        checkWinCondition();
    }
}

function toggleFlag(row, col) {
    if (gameState.status !== "process" || !isInsideBoard(row, col)) {
        return;
    }

    const cell = gameState.field[row][col];
    if (cell.state === "opened") {
        return;
    }

    if (gameState.timerId === null) {
        startTimer();
    }

    if (cell.state === "closed") {
        cell.state = "flagged";
    } else if (cell.state === "flagged") {
        cell.state = "closed";
    }
}
