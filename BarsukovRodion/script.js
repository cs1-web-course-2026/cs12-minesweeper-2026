const GAME_STATUS = {
	PROCESS: 'process',
	WIN: 'win',
	LOSE: 'lose',
};

const CELL_TYPE = {
	EMPTY: 'empty',
	MINE: 'mine',
};

const CELL_STATE = {
	CLOSED: 'closed',
	OPENED: 'opened',
	FLAGGED: 'flagged',
};

const gameState = {
	rows: 9,
	cols: 9,
	minesCount: 10,
	status: GAME_STATUS.PROCESS,
	gameTime: 0,
	timerId: null,
};

let field = [];

function generateField(rows, cols, minesCount) {
	const maxMines = rows * cols;
	const safeMinesCount = Math.min(minesCount, maxMines);

	const grid = Array.from({ length: rows }, () =>
			Array.from({ length: cols }, () => ({
				type: CELL_TYPE.EMPTY,
				neighborMines: 0,
				state: CELL_STATE.CLOSED,
			})),
	);

	let placed = 0;

	while (placed < safeMinesCount) {
		const row = Math.floor(Math.random() * rows);
		const col = Math.floor(Math.random() * cols);

		if (grid[row][col].type !== CELL_TYPE.MINE) {
			grid[row][col].type = CELL_TYPE.MINE;
			placed += 1;
		}
	}

	countNeighborMines(grid, rows, cols);

	return grid;
}

function countNeighborMines(grid, rows, cols) {
	for (let row = 0; row < rows; row += 1) {
		for (let col = 0; col < cols; col += 1) {
			if (grid[row][col].type === CELL_TYPE.MINE) {
				continue;
			}

			let count = 0;

			for (let directionalRow = -1; directionalRow <= 1; directionalRow += 1) {
				for (let directionalCol = -1; directionalCol <= 1; directionalCol += 1) {
					if (directionalRow === 0 && directionalCol === 0) {
						continue;
					}

					const neighbourRow = row + directionalRow;
					const neighbourCol = col + directionalCol;

					if (
							neighbourRow >= 0 &&
							neighbourRow < rows &&
							neighbourCol >= 0 &&
							neighbourCol < cols
					) {
						if (grid[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) {
							count += 1;
						}
					}
				}
			}

			grid[row][col].neighborMines = count;
		}
	}
}

function openCell(row, col) {
	if (gameState.status !== GAME_STATUS.PROCESS) {
		return;
	}

	const cell = field[row][col];

	if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
		return;
	}

	cell.state = CELL_STATE.OPENED;

	if (cell.type === CELL_TYPE.MINE) {
		cell.exploded = true;
		gameState.status = GAME_STATUS.LOSE;
		stopTimer();
		revealAllMines();

		return;
	}

	if (cell.neighborMines === 0) {
		for (let directionalRow = -1; directionalRow <= 1; directionalRow += 1) {
			for (let directionalCol = -1; directionalCol <= 1; directionalCol += 1) {
				if (directionalRow === 0 && directionalCol === 0) {
					continue;
				}

				const neighbourRow = row + directionalRow;
				const neighbourCol = col + directionalCol;

				if (
						neighbourRow >= 0 &&
						neighbourRow < gameState.rows &&
						neighbourCol >= 0 &&
						neighbourCol < gameState.cols &&
						field[neighbourRow][neighbourCol].state === CELL_STATE.CLOSED
				) {
					openCell(neighbourRow, neighbourCol);
				}
			}
		}
	}

	checkWin();
}

function toggleFlag(row, col) {
	if (gameState.status !== GAME_STATUS.PROCESS) {
		return;
	}

	const cell = field[row][col];

	if (cell.state === CELL_STATE.OPENED) {
		return;
	}

	cell.state =
			cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;
}

function checkWin() {
	let openedCount = 0;

	for (let row = 0; row < gameState.rows; row += 1) {
		for (let col = 0; col < gameState.cols; col += 1) {
			if (field[row][col].state === CELL_STATE.OPENED) {
				openedCount += 1;
			}
		}
	}

	if (
			openedCount ===
			gameState.rows * gameState.cols - gameState.minesCount
	) {
		gameState.status = GAME_STATUS.WIN;
		stopTimer();
	}
}

function revealAllMines() {
	for (let row = 0; row < gameState.rows; row += 1) {
		for (let col = 0; col < gameState.cols; col += 1) {
			const cell = field[row][col];

			if (cell.state === CELL_STATE.FLAGGED && cell.type !== CELL_TYPE.MINE) {
				cell.revealedWrong = true;
			}

			if (cell.type === CELL_TYPE.MINE && !cell.exploded) {
				cell.state = CELL_STATE.OPENED;
			}
		}
	}
}

function startTimer() {
	gameState.timerId = setInterval(() => {
		gameState.gameTime += 1;
	}, 1000);
}

function stopTimer() {
	if (gameState.timerId) {
		clearInterval(gameState.timerId);
		gameState.timerId = null;
	}
}

function initGame() {
	stopTimer();
	gameState.status = GAME_STATUS.PROCESS;
	gameState.gameTime = 0;
	gameState.timerId = null;
	field = generateField(
			gameState.rows,
			gameState.cols,
			gameState.minesCount,
	);
	startTimer();
}

initGame();
