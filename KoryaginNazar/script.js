'use strict';

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

const DEFAULT_GAME_CONFIGURATION = {
	rows: 10,
	cols: 10,
	minesCount: 15,
};

const NEIGHBOUR_DIRECTIONS = [
	[-1, -1],
	[-1, 0],
	[-1, 1],
	[0, -1],
	[0, 1],
	[1, -1],
	[1, 0],
	[1, 1],
];

let gameState = createInitialGameState(
	DEFAULT_GAME_CONFIGURATION.rows,
	DEFAULT_GAME_CONFIGURATION.cols,
	DEFAULT_GAME_CONFIGURATION.minesCount,
);

let gameField = [];


function createInitialGameState(rows, cols, minesCount) {
	const initialState = {
		rows,
		cols,
		minesCount,
		status: GAME_STATUS.PROCESS,
		gameTime: 0,
		timerId: null,
	};

	return initialState;
}


function createEmptyCell() {
	const emptyCell = {
		type: CELL_TYPE.EMPTY,
		neighborMines: 0,
		state: CELL_STATE.CLOSED,
	};

	return emptyCell;
}


function createEmptyField(rows, cols) {
	const field = [];

	for (let row = 0; row < rows; row += 1) {
		const rowCells = [];

		for (let col = 0; col < cols; col += 1) {
			rowCells.push(createEmptyCell());
		}

		field.push(rowCells);
	}

	return field;
}


function isInBounds(field, row, col) {
	const isCorrectRow = row >= 0 && row < field.length;
	const isCorrectCol = col >= 0 && col < field[0].length;

	return isCorrectRow && isCorrectCol;
}


function countNeighbourMines(field) {
	for (let row = 0; row < field.length; row += 1) {
		for (let col = 0; col < field[row].length; col += 1) {
			const currentCell = field[row][col];

			if (currentCell.type === CELL_TYPE.MINE) {
				continue;
			}

			let neighbourMinesCount = 0;

			for (const [directionalRow, directionalCol] of NEIGHBOUR_DIRECTIONS) {
				const neighbourRow = row + directionalRow;
				const neighbourCol = col + directionalCol;

				if (!isInBounds(field, neighbourRow, neighbourCol)) {
					continue;
				}

				if (field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) {
					neighbourMinesCount += 1;
				}
			}

			currentCell.neighborMines = neighbourMinesCount;
		}
	}

	return field;
}


function generateField(rows, cols, minesCount) {
	const cellsCount = rows * cols;

	if (minesCount < 0 || minesCount >= cellsCount) {
		throw new RangeError('minesCount must be greater or equal to 0 and smaller than total cells count.');
	}

	const field = createEmptyField(rows, cols);
	let placedMinesCount = 0;

	while (placedMinesCount < minesCount) {
		const randomRow = Math.floor(Math.random() * rows);
		const randomCol = Math.floor(Math.random() * cols);
		const randomCell = field[randomRow][randomCol];

		if (randomCell.type === CELL_TYPE.MINE) {
			continue;
		}

		randomCell.type = CELL_TYPE.MINE;
		placedMinesCount += 1;
	}

	countNeighbourMines(field);

	return field;
}


function revealAllMines(field) {
	for (let row = 0; row < field.length; row += 1) {
		for (let col = 0; col < field[row].length; col += 1) {
			const currentCell = field[row][col];

			if (currentCell.type !== CELL_TYPE.MINE) {
				continue;
			}

			currentCell.state = CELL_STATE.OPENED;
		}
	}

	return field;
}


function checkWinCondition(field, minesCount) {
	const totalCellsCount = field.length * field[0].length;
	let openedCellsCount = 0;

	for (let row = 0; row < field.length; row += 1) {
		for (let col = 0; col < field[row].length; col += 1) {
			if (field[row][col].state === CELL_STATE.OPENED) {
				openedCellsCount += 1;
			}
		}
	}

	const shouldBeOpenedCellsCount = totalCellsCount - minesCount;

	return openedCellsCount === shouldBeOpenedCellsCount;
}


function stopGameTimer(currentGameState = gameState) {
	if (currentGameState.timerId === null) {
		return;
	}

	clearInterval(currentGameState.timerId);
	currentGameState.timerId = null;
}


function startGameTimer(currentGameState = gameState) {
	if (currentGameState.timerId !== null) {
		return;
	}

	currentGameState.timerId = setInterval(() => {
		if (currentGameState.status !== GAME_STATUS.PROCESS) {
			return;
		}

		currentGameState.gameTime += 1;
	}, 1000);
}


function openCell(row, col, field = gameField, currentGameState = gameState) {
	if (currentGameState.status !== GAME_STATUS.PROCESS) {
		return false;
	}

	if (!isInBounds(field, row, col)) {
		return false;
	}

	const selectedCell = field[row][col];

	if (selectedCell.state === CELL_STATE.OPENED || selectedCell.state === CELL_STATE.FLAGGED) {
		return false;
	}

	selectedCell.state = CELL_STATE.OPENED;

	if (selectedCell.type === CELL_TYPE.MINE) {
		currentGameState.status = GAME_STATUS.LOSE;
		revealAllMines(field);
		stopGameTimer(currentGameState);

		return true;
	}

	if (selectedCell.neighborMines === 0) {
		for (const [directionalRow, directionalCol] of NEIGHBOUR_DIRECTIONS) {
			const neighbourRow = row + directionalRow;
			const neighbourCol = col + directionalCol;

			openCell(neighbourRow, neighbourCol, field, currentGameState);
		}
	}

	if (checkWinCondition(field, currentGameState.minesCount)) {
		currentGameState.status = GAME_STATUS.WIN;
		stopGameTimer(currentGameState);
	}

	return true;
}


function toggleFlag(row, col, field = gameField, currentGameState = gameState) {
	if (currentGameState.status !== GAME_STATUS.PROCESS) {
		return false;
	}

	if (!isInBounds(field, row, col)) {
		return false;
	}

	const selectedCell = field[row][col];

	if (selectedCell.state === CELL_STATE.OPENED) {
		return false;
	}

	if (selectedCell.state === CELL_STATE.CLOSED) {
		selectedCell.state = CELL_STATE.FLAGGED;

		return true;
	}

	if (selectedCell.state === CELL_STATE.FLAGGED) {
		selectedCell.state = CELL_STATE.CLOSED;

		return true;
	}

	return false;
}


function resetGame(rows = DEFAULT_GAME_CONFIGURATION.rows, cols = DEFAULT_GAME_CONFIGURATION.cols, minesCount = DEFAULT_GAME_CONFIGURATION.minesCount) {
	stopGameTimer(gameState);
	gameState = createInitialGameState(rows, cols, minesCount);
	gameField = generateField(rows, cols, minesCount);
	startGameTimer(gameState);

	return {
		gameState,
		gameField,
	};
}


function getGameState() {
	return gameState;
}


function getGameField() {
	return gameField;
}


const minesweeperApi = {
	CELL_TYPE,
	CELL_STATE,
	GAME_STATUS,
	generateField,
	countNeighbourMines,
	openCell,
	toggleFlag,
	startGameTimer,
	stopGameTimer,
	resetGame,
	getGameState,
	getGameField,
};

window.minesweeperApi = minesweeperApi;

resetGame();
