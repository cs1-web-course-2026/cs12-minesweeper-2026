const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: "process",
  gameTime: 0,
  timerId: null,
  field: [],
};

function createCell() {
  return {
    type: "empty",
    neighborMines: 0,
    state: "closed",
  };
}

function generateField(rows, cols, minesCount) {
  const field = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(createCell());
    }
    field.push(row);
  }

  let placed = 0;
  while (placed < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (field[r][c].type !== "mine") {
      field[r][c].type = "mine";
      placed++;
    }
  }

  countNeighbourMines(field, rows, cols);

  return field;
}

function countNeighbourMines(field, rows, cols) {
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (field[r][c].type === "mine") continue;

      let count = 0;
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (field[nr][nc].type === "mine") {
            count++;
          }
        }
      }
      field[r][c].neighborMines = count;
    }
  }
}

function openCell(row, col) {
  if (gameState.status !== "process") return;

  const cell = gameState.field[row][col];

  if (cell.state === "opened" || cell.state === "flagged") return;

  if (cell.type === "mine") {
    cell.state = "opened";
    gameState.status = "lose";
    stopTimer();
    revealAllMines();
    return;
  }

  cell.state = "opened";

  if (cell.neighborMines === 0) {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
        openCell(nr, nc);
      }
    }
  }

  checkWin();
}

function checkWin() {
  if (gameState.status !== "process") return;

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = gameState.field[r][c];

      if (cell.type === "empty" && cell.state !== "opened") {
        return;
      }
    }
  }

  gameState.status = "win";
  stopTimer();
}

function revealAllMines() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].type === "mine") {
        gameState.field[r][c].state = "opened";
      }
    }
  }
}

function toggleFlag(row, col) {
  if (gameState.status !== "process") return;

  const cell = gameState.field[row][col];

  if (cell.state === "opened") return;

  if (cell.state === "closed") {
    cell.state = "flagged";
  } else if (cell.state === "flagged") {
    cell.state = "closed";
  }
}

function startTimer() {
  if (gameState.timerId !== null) return;

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId !== null) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function initGame(rows, cols, minesCount) {
  stopTimer();

  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;
  gameState.status = "process";
  gameState.gameTime = 0;
  gameState.timerId = null;
  gameState.field = generateField(rows, cols, minesCount);

  startTimer();
}

function countFlags() {
  let count = 0;
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].state === "flagged") {
        count++;
      }
    }
  }
  return count;
}

function printField() {
  const symbols = [];
  for (let r = 0; r < gameState.rows; r++) {
    const row = [];
    for (let c = 0; c < gameState.cols; c++) {
      const cell = gameState.field[r][c];

      if (cell.state === "closed") {
        row.push("■");
      } else if (cell.state === "flagged") {
        row.push("⚑");
      } else if (cell.type === "mine") {
        row.push("✹");
      } else if (cell.neighborMines === 0) {
        row.push(" ");
      } else {
        row.push(String(cell.neighborMines));
      }
    }
    symbols.push(row.join(" "));
  }
  console.log(symbols.join("\n"));
  console.log(
    `Status: ${gameState.status} | Time: ${gameState.gameTime}s | Flags: ${countFlags()}/${gameState.minesCount}`,
  );
}

initGame(gameState.rows, gameState.cols, gameState.minesCount);

if (typeof process !== "undefined") {
  console.log("=== Minesweeper ініціалізовано ===");
  printField();
  stopTimer();
}
