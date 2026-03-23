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
	flagsPlaced: 0,
	status: GAME_STATUS.PROCESS,
	gameTime: 0,
	timerId: null,
};

let field = [];

const boardElement = document.getElementById('board');
const timerElement = document.getElementById('timer');
const flagsElement = document.getElementById('flag-count');
const resetButton = document.getElementById('reset-button');
const statusElement = document.getElementById('game-status');


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

	if (cell.state === CELL_STATE.FLAGGED) {
		cell.state = CELL_STATE.CLOSED;
		gameState.flagsPlaced -= 1;
	} else {
		cell.state = CELL_STATE.FLAGGED;
		gameState.flagsPlaced += 1;
	}
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

		field.forEach(row => row.forEach(cell => {
			if (cell.type === CELL_TYPE.MINE) cell.state = CELL_STATE.FLAGGED;
		}));
		gameState.flagsPlaced = gameState.minesCount;
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
	if (gameState.timerId) return;
	gameState.timerId = setInterval(() => {
		gameState.gameTime += 1;
		updateTimerUI();
	}, 1000);
}


function stopTimer() {
	if (gameState.timerId) {
		clearInterval(gameState.timerId);
		gameState.timerId = null;
	}
}


function renderBoard() {
	boardElement.innerHTML = '';

	field.forEach((row, rowIndex) => {
		const rowElement = document.createElement('div');
		rowElement.className = 'row';
		rowElement.setAttribute('role', 'row');

		row.forEach((cell, colIndex) => {
			const cellElement = document.createElement('div');
			cellElement.className = 'cell';
			cellElement.dataset.row = rowIndex;
			cellElement.dataset.col = colIndex;
			cellElement.setAttribute('role', 'gridcell');

			if (cell.state === CELL_STATE.CLOSED) {
				cellElement.classList.add('cell--closed');
			} else if (cell.state === CELL_STATE.FLAGGED) {
				if (cell.revealedWrong) {
					cellElement.classList.add('cell--flag-wrong');
				} else {
					cellElement.classList.add('cell--flag');
				}
			} else if (cell.state === CELL_STATE.OPENED) {
				cellElement.classList.add('cell--open');
				if (cell.type === CELL_TYPE.MINE) {
					cellElement.classList.add('cell--mine');
					if (cell.exploded) {
						cellElement.classList.add('cell--exploded');
					}
				} else if (cell.neighborMines > 0) {
					cellElement.classList.add(`cell--number-${cell.neighborMines}`);
					cellElement.textContent = cell.neighborMines;
				}
			}

			rowElement.appendChild(cellElement);
		});
		boardElement.appendChild(rowElement);
	});

	updateUI();
}


function updateTimerUI() {
	timerElement.textContent = gameState.gameTime.toString().padStart(3, '0');
}


function updateFlagsUI() {
	const flagsLeft = gameState.minesCount - gameState.flagsPlaced;
	flagsElement.textContent = flagsLeft.toString().padStart(3, '0');
}


function updateStatusUI() {
	if (gameState.status === GAME_STATUS.LOSE) {
		resetButton.textContent = '😵';
		statusElement.textContent = 'Game over! You hit a mine.';
		statusElement.hidden = false;
		statusElement.style.color = '#ff4444';
	} else if (gameState.status === GAME_STATUS.WIN) {
		resetButton.textContent = '😎';
		statusElement.textContent = 'Victory! You cleared the field.';
		statusElement.hidden = false;
		statusElement.style.color = '#33ff66';
	} else {
		resetButton.textContent = '🙂';
		statusElement.hidden = true;
	}
}


function updateUI() {
	updateTimerUI();
	updateFlagsUI();
	updateStatusUI();
}

boardElement.addEventListener('click', (event) => {
	const cellElement = event.target.closest('.cell');
	if (!cellElement) return;

	if (gameState.gameTime === 0 && !gameState.timerId && gameState.status === GAME_STATUS.PROCESS) {
		startTimer();
	}

	const row = parseInt(cellElement.dataset.row, 10);
	const col = parseInt(cellElement.dataset.col, 10);

	openCell(row, col);
	renderBoard();
});

boardElement.addEventListener('contextmenu', (event) => {
	event.preventDefault();

	const cellElement = event.target.closest('.cell');
	if (!cellElement) return;

	if (gameState.gameTime === 0 && !gameState.timerId && gameState.status === GAME_STATUS.PROCESS) {
		startTimer();
	}

	const row = parseInt(cellElement.dataset.row, 10);
	const col = parseInt(cellElement.dataset.col, 10);

	toggleFlag(row, col);
	renderBoard();
});

resetButton.addEventListener('click', () => {
	initGame();
});

function initGame() {
	stopTimer();
	gameState.status = GAME_STATUS.PROCESS;
	gameState.gameTime = 0;
	gameState.flagsPlaced = 0;
	gameState.timerId = null;
	field = generateField(
			gameState.rows,
			gameState.cols,
			gameState.minesCount,
	);
	renderBoard();
}

initGame();
