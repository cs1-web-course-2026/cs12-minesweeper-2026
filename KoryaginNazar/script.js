'use strict';

const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const CELL_STATE = {
  CLOSED: 'closed',
	OPEN: 'open',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
	IDLE: 'idle',
	PLAYING: 'playing',
	WON: 'won',
	LOST: 'lost',
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
		status: GAME_STATUS.PLAYING,
    gameTime: 0,
    timerId: null,
  };

  return initialState;
}


function createEmptyCell() {
	const emptyCell = {
		type: CELL_TYPE.EMPTY,
		neighbourMines: 0,
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
	if (!Array.isArray(field) || field.length === 0 || !Array.isArray(field[0])) {
		return false;
	}
	if (!Array.isArray(field) || field.length === 0) {
		return false;
	}

	const isCorrectRow = row >= 0 && row < field.length;

	if (!isCorrectRow || !Array.isArray(field[row])) {
		return false;
	}

	const isCorrectCol = col >= 0 && col < field[row].length;

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
		throw new RangeError('minesCount must be greater than or equal to 0 and smaller than total cells count.');
	}

	const field = createEmptyField(rows, cols);
	const coordinates = [];

	for (let row = 0; row < rows; row += 1) {
		for (let col = 0; col < cols; col += 1) {
			coordinates.push({ row, col });
		}
	}

	for (let index = coordinates.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		const temporaryCoordinate = coordinates[index];

		coordinates[index] = coordinates[randomIndex];
		coordinates[randomIndex] = temporaryCoordinate;
	}

	for (let mineIndex = 0; mineIndex < minesCount; mineIndex += 1) {
		const mineCoordinate = coordinates[mineIndex];
		const mineRow = mineCoordinate.row;
		const mineCol = mineCoordinate.col;

		field[mineRow][mineCol].type = CELL_TYPE.MINE;
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

			currentCell.state = CELL_STATE.OPEN;
		}
	}

	return field;
}


function checkWinCondition(field, minesCount) {
	const totalCellsCount = field.length * field[0].length;
	let openedCellsCount = 0;

	for (let row = 0; row < field.length; row += 1) {
		for (let col = 0; col < field[row].length; col += 1) {
			if (field[row][col].state === CELL_STATE.OPEN) {
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
		if (currentGameState.status !== GAME_STATUS.PLAYING) {
			return;
		}

		currentGameState.gameTime += 1;
	}, 1000);
}


function openCell(row, col, field = gameField, currentGameState = gameState) {
	if (currentGameState.status !== GAME_STATUS.PLAYING) {
		return false;
	}

	if (!isInBounds(field, row, col)) {
		return false;
	}

	const selectedCell = field[row][col];

	if (selectedCell.state === CELL_STATE.OPEN || selectedCell.state === CELL_STATE.FLAGGED) {
		return false;
	}

	let isAnyCellOpened = false;

	function openCellRecursive(currentRow, currentCol) {
		if (currentGameState.status !== GAME_STATUS.PLAYING) {
			return;
		}

		if (!isInBounds(field, currentRow, currentCol)) {
			return;
		}

		const currentCell = field[currentRow][currentCol];

		if (currentCell.state === CELL_STATE.OPEN || currentCell.state === CELL_STATE.FLAGGED) {
			return;
		}

		currentCell.state = CELL_STATE.OPEN;
		isAnyCellOpened = true;

		if (currentCell.type === CELL_TYPE.MINE) {
			currentGameState.status = GAME_STATUS.LOST;
			revealAllMines(field);
			stopGameTimer(currentGameState);

			return;
		}

		if (currentCell.neighborMines !== 0) {
			return;
		}

		for (const [directionalRow, directionalCol] of NEIGHBOUR_DIRECTIONS) {
			openCellRecursive(currentRow + directionalRow, currentCol + directionalCol);
		}
	}

	openCellRecursive(row, col);

	if (isAnyCellOpened && currentGameState.status === GAME_STATUS.PLAYING) {
		if (checkWinCondition(field, currentGameState.minesCount)) {
			currentGameState.status = GAME_STATUS.WON;
			stopGameTimer(currentGameState);
		}
	}

	return isAnyCellOpened;
}


function toggleFlag(row, col, field = gameField, currentGameState = gameState) {
	if (currentGameState.status !== GAME_STATUS.PLAYING) {
		return false;
	}

	if (!isInBounds(field, row, col)) {
		return false;
	}

	const selectedCell = field[row][col];

	if (selectedCell.state === CELL_STATE.OPEN) {
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
