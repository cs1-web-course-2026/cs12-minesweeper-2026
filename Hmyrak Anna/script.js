const DEFAULT_CONFIG = {
    rows: 8,
    cols: 8,
    minesCount: 10
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

const GAME_STATUS = {
    PROCESS: 'process',
    WIN: 'win',
    LOSE: 'lose',
    ERROR: 'error',
};

const DIFFICULTY_PRESETS = [
    { name: 'Beginner', rows: 8, cols: 8, minesCount: 10 },
    { name: 'Intermediate', rows: 12, cols: 12, minesCount: 24 },
    { name: 'Expert', rows: 16, cols: 16, minesCount: 40 }
];


function createCell() {
    return {
        type: CELL_TYPE.EMPTY,
        state: CELL_STATE.CLOSED,
        neighborMines: 0,
        exploded: false,
        wrongFlag: false
    };
}


function createEmptyGrid(rows, cols) {
    const result = [];
    for (let row = 0; row < rows; row++) {
        const currentRow = [];
        for (let col = 0; col < cols; col++) {
            currentRow.push(createCell());
        }
        result.push(currentRow);
    }
    return result;
}


function inBounds(rows, cols, row, col) {
    return row >= 0 && row < rows && col >= 0 && col < cols;
}


function placeMines(grid, rows, cols, minesCount, excludeRow, excludeCol) {
    const allowedPositions = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const isInclude = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
            if (!isInclude) {
                allowedPositions.push({ row, col });
            }  
        }
    }

    if (minesCount > allowedPositions.length) {
        throw new Error('Too many mines for the given field size and first click position.');
    }

    for (let i = allowedPositions.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = allowedPositions[i];
        allowedPositions[i] = allowedPositions[j];
        allowedPositions[j] = temp;
    }
    
    for (let i = 0; i < minesCount; i++) {
        const position = allowedPositions[i];
        grid[position.row][position.col].type = CELL_TYPE.MINE;
    }
}


function countNeighbourMines(grid, rows, cols) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (grid[row][col].type === CELL_TYPE.MINE) {
                continue;
            }

            let count = 0;
            for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
                for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                    const neighbourRow = row + directionalRow;
                    const neighbourCol = col + directionalCol;
                    if (inBounds(rows, cols, neighbourRow, neighbourCol) &&
                        grid[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) {
                        count++;
                    }
                }
            }

            grid[row][col].neighborMines = count;
        }
    }
}


function createGame(customConfig = {}) {
    function normalizeConfig(rawConfig) {
        const mergedConfig = { ...DEFAULT_CONFIG, ...rawConfig };

        const rows = Number.isFinite(mergedConfig.rows) ? Math.max(2, Math.floor(mergedConfig.rows)) : DEFAULT_CONFIG.rows;
        const cols = Number.isFinite(mergedConfig.cols) ? Math.max(2, Math.floor(mergedConfig.cols)) : DEFAULT_CONFIG.cols;
        const requestedMines = Number.isFinite(mergedConfig.minesCount) ? Math.floor(mergedConfig.minesCount) : DEFAULT_CONFIG.minesCount;

        // Reserve up to a 3x3 safe area for the first click in the worst-case position.
        const maxMines = Math.max(0, (rows * cols) - 9);
        const minesCount = Math.min(Math.max(0, requestedMines), maxMines);

        return { rows, cols, minesCount };
    }

    const config = normalizeConfig(customConfig);

    const gameState = {
        rows: config.rows,
        cols: config.cols,
        minesCount: config.minesCount,
        status: GAME_STATUS.PROCESS,
        gameTime: 0,
        flagsCount: 0,
        openedCells: 0,
        firstClick: true,
        started: false,
        timerId: null,
        errorMessage: ''
    };


    let grid = createEmptyGrid(gameState.rows, gameState.cols);


    function stopTimer() {
        if (gameState.timerId !== null) {
            clearInterval(gameState.timerId);
            gameState.timerId = null;
        }
    }


    function resetGridDerivedState() {
        gameState.flagsCount = 0;
        gameState.openedCells = 0;
    }


    function resetCellsState() {
        stopTimer();
        gameState.status = GAME_STATUS.PROCESS;
        gameState.gameTime = 0;
        resetGridDerivedState();
        gameState.firstClick = true;
        gameState.started = false;
        gameState.errorMessage = '';
        grid = createEmptyGrid(gameState.rows, gameState.cols);
    }


    function startTimer() {
        if (gameState.timerId !== null) {
            return;
        }

        gameState.timerId = setInterval(() => {
            if (gameState.status !== GAME_STATUS.PROCESS || !gameState.started) {
                return;
            }
            gameState.gameTime++;
        }, 1000);
    }


    function generateField(rows, cols, minesCount, excludeRow = -1, excludeCol = -1) {
        resetGridDerivedState();
        grid = createEmptyGrid(rows, cols);
        placeMines(
            grid,
            rows,
            cols,
            minesCount,
            excludeRow,
            excludeCol
        );
        countNeighbourMines(grid, rows, cols);
    }


    function revealAllMines() {
        for (let row = 0; row < gameState.rows; row++) {
            for (let col = 0; col < gameState.cols; col++) {
                const cell = grid[row][col];
                if (cell.type === CELL_TYPE.MINE) {
                    if (cell.state !== CELL_STATE.FLAGGED) {
                        cell.state = CELL_STATE.OPENED;
                    }
                } else if (cell.state === CELL_STATE.FLAGGED) {
                    cell.wrongFlag = true;
                }
            }
        }
    }


    function flagAllMines() {
        for (let row = 0; row < gameState.rows; row++) {
            for (let col = 0; col < gameState.cols; col++) {
                const cell = grid[row][col];
                if (cell.type === CELL_TYPE.MINE && cell.state !== CELL_STATE.FLAGGED) {
                    cell.state = CELL_STATE.FLAGGED;
                    gameState.flagsCount++;
                }
            }
        }
    }


    function checkWinCondition() {
        const totalSafeCells = (gameState.rows * gameState.cols) - gameState.minesCount;
        return gameState.openedCells === totalSafeCells;
    }


    function floodOpen(row, col) {
        if (!inBounds(gameState.rows, gameState.cols, row, col)) {
            return;
        }

        const cell = grid[row][col];
        if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
            return;
        }

        if (cell.type === CELL_TYPE.MINE) {
            return;
        }

        cell.state = CELL_STATE.OPENED;
        gameState.openedCells++;

        if (cell.neighborMines !== 0) {
            return;
        }

        for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
            for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                if (directionalRow === 0 && directionalCol === 0) {
                    continue;
                }

                floodOpen(row + directionalRow, col + directionalCol);
            }
        }
    }


    function openCell(row, col) {
        if (gameState.status !== GAME_STATUS.PROCESS) {
            return false;
        }
        if (!inBounds(gameState.rows, gameState.cols, row, col)) {
            return false;
        }

        if (gameState.firstClick) {
            gameState.firstClick = false;
            gameState.started = true;
            startTimer();
            try {
                generateField(gameState.rows, gameState.cols, gameState.minesCount, row, col);
            } catch (error) {
                gameState.status = GAME_STATUS.ERROR;
                gameState.started = false;
                gameState.errorMessage = 'Unable to start the field with current settings.';
                stopTimer();
                return false;
            }
        }

        const cell = grid[row][col];
        if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
            return false;
        }

        if (cell.type === CELL_TYPE.MINE) {
            cell.exploded = true;
            gameState.status = GAME_STATUS.LOSE;
            stopTimer();
            revealAllMines();
            return true;
        }

        floodOpen(row, col);
        if (checkWinCondition()) {
            gameState.status = GAME_STATUS.WIN;
            stopTimer();
            flagAllMines();
        }
        return true;
    }


    function toggleFlag(row, col) {
        if (gameState.status !== GAME_STATUS.PROCESS) {
            return false;
        }
        if (gameState.firstClick) {
            return false;
        }
        if (!inBounds(gameState.rows, gameState.cols, row, col)) {
            return false;
        }

        const cell = grid[row][col];
        if (cell.state === CELL_STATE.OPENED) {
            return false;
        }

        if (cell.state === CELL_STATE.CLOSED) {
            cell.state = CELL_STATE.FLAGGED;
            gameState.flagsCount++;
            return true;
        }

        if (cell.state === CELL_STATE.FLAGGED) {
            cell.state = CELL_STATE.CLOSED;
            gameState.flagsCount--;
            return true;
        }

        return false;
    }


    function tick(seconds = 1) {
        if (gameState.status !== GAME_STATUS.PROCESS || !gameState.started) {
            return gameState.gameTime;
        }

        const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
        gameState.gameTime += safeSeconds;
        return gameState.gameTime;
    }


    function getMinesLeft() {
        return gameState.minesCount - gameState.flagsCount;
    }


    function getState() {
        return {
            ...gameState,
            minesLeft: getMinesLeft()
        };
    }


    function getGrid() {
        return grid.map((row) => row.map((cell) => ({ ...cell })));
    }


    function initGame() {
        resetCellsState();
        return getState();
    }


    initGame();


    return {
        initGame,
        openCell,
        toggleFlag,
        startTimer,
        tick,
        getState,
        getGrid,
        getMinesLeft
    };
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createGame
    };
}


if (typeof window !== 'undefined') {
    window.MinesweeperLogic = {
        createGame
    };
}


if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    (function initMinesweeperUI() {
        const fieldElement = document.getElementById('field');
        const titleContainerElement = document.querySelector('.title-container');
        const headerElement = document.querySelector('.header');
        const timerCounterElement = document.getElementById('timer-counter');
        const minesCounterElement = document.getElementById('mines-counter');
        const restartButton = document.getElementById('restart-btn');
        const optionsButton = document.getElementById('options-btn');
        const helpButton = document.getElementById('help-btn');
        const faceButton = document.getElementById('face-btn');
        const statusMessageElement = document.getElementById('status-message');

        if (!fieldElement || !titleContainerElement || !headerElement || !timerCounterElement || !minesCounterElement || !restartButton || !optionsButton || !helpButton || !faceButton || !statusMessageElement) {
            return;
        }

        let currentDifficultyIndex = 0;
        let game = createGame(DIFFICULTY_PRESETS[currentDifficultyIndex]);
        const cellElements = [];
        const uiState = {
            headerIntervalId: null,
            currentFocus: { row: 0, col: 0 }
        };

        function formatCounter(value) {
            const numericValue = Number.isFinite(value) ? Math.floor(value) : 0;
            const sign = numericValue < 0 ? '-' : '';
            return sign + String(Math.abs(numericValue)).padStart(3, '0');
        }

        function getCellAriaLabel(cell, row, col) {
            const basePosition = 'Row ' + (row + 1) + ', column ' + (col + 1) + '. ';

            if (cell.state === CELL_STATE.FLAGGED) {
                return basePosition + (cell.wrongFlag ? 'Wrong flag.' : 'Flagged cell.');
            }

            if (cell.state === CELL_STATE.CLOSED) {
                return basePosition + 'Closed cell.';
            }

            if (cell.type === CELL_TYPE.MINE) {
                return basePosition + (cell.exploded ? 'Exploded mine.' : 'Mine.');
            }

            if (cell.neighborMines > 0) {
                return basePosition + cell.neighborMines + ' neighboring mines.';
            }

            return basePosition + 'Open empty cell.';
        }

        function getCellClass(cell) {
            if (cell.state === CELL_STATE.FLAGGED) {
                return cell.wrongFlag ? 'flag-bang' : 'flag';
            }

            if (cell.state === CELL_STATE.OPENED) {
                if (cell.type === CELL_TYPE.MINE) {
                    return cell.exploded ? 'open-cage mine-bang' : 'open-cage mine';
                }

                if (cell.neighborMines > 0) {
                    return 'open-cage num' + cell.neighborMines;
                }

                return 'open-cage';
            }

            return 'closed-cage';
        }

        function applyCellPresentation(cellElement, cell, row, col) {
            cellElement.className = 'cell-btn ' + getCellClass(cell);
            cellElement.setAttribute('aria-label', getCellAriaLabel(cell, row, col));
            const isDisabled = cell.state === CELL_STATE.OPENED;
            cellElement.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
            cellElement.setAttribute('aria-pressed', cell.state === CELL_STATE.FLAGGED ? 'true' : 'false');
        }

        function buildGridDOM() {
            const state = game.getState();

            fieldElement.innerHTML = '';
            cellElements.length = 0;
            fieldElement.setAttribute('aria-rowcount', String(state.rows));
            fieldElement.setAttribute('aria-colcount', String(state.cols));

            const fragment = document.createDocumentFragment();

            for (let row = 0; row < state.rows; row++) {
                const rowElement = document.createElement('div');
                rowElement.className = 'field-row';
                rowElement.setAttribute('role', 'row');

                const currentRowCells = [];

                for (let col = 0; col < state.cols; col++) {
                    const cellElement = document.createElement('button');
                    cellElement.type = 'button';
                    cellElement.className = 'cell-btn closed-cage';
                    cellElement.dataset.row = String(row);
                    cellElement.dataset.col = String(col);
                    cellElement.setAttribute('aria-rowindex', String(row + 1));
                    cellElement.setAttribute('aria-colindex', String(col + 1));
                    cellElement.setAttribute('tabindex', row === uiState.currentFocus.row && col === uiState.currentFocus.col ? '0' : '-1');
                    cellElement.setAttribute('aria-label', 'Row ' + (row + 1) + ', column ' + (col + 1) + '. Closed cell.');

                    rowElement.appendChild(cellElement);
                    currentRowCells.push(cellElement);
                }

                cellElements.push(currentRowCells);
                fragment.appendChild(rowElement);
            }

            fieldElement.appendChild(fragment);
        }

        function updateLayoutDimensions() {
            const state = game.getState();
            const cellSize = 31;
            const fieldInnerWidth = state.cols * cellSize;
            const fieldInnerHeight = state.rows * cellSize;

            fieldElement.style.width = fieldInnerWidth + 'px';
            fieldElement.style.height = fieldInnerHeight + 'px';
            headerElement.style.width = fieldInnerWidth + 'px';

            const menuWidth = 250;
            const frameBorder = 10;
            const sidePadding = 20;
            const desiredContainerWidth = Math.max(fieldInnerWidth + frameBorder + sidePadding, menuWidth);
            titleContainerElement.style.width = desiredContainerWidth + 'px';
        }

        function moveFocusToCell(row, col) {
            const targetCell = cellElements[row] && cellElements[row][col];
            if (!targetCell) {
                return;
            }

            const previousCell = cellElements[uiState.currentFocus.row] && cellElements[uiState.currentFocus.row][uiState.currentFocus.col];

            if (previousCell && previousCell !== targetCell) {
                previousCell.setAttribute('tabindex', '-1');
            }

            uiState.currentFocus.row = row;
            uiState.currentFocus.col = col;
            targetCell.setAttribute('tabindex', '0');
            targetCell.focus();
        }

        function startHeaderSync() {
            if (uiState.headerIntervalId !== null) {
                return;
            }

            uiState.headerIntervalId = setInterval(() => {
                const state = game.getState();
                if (state.status === GAME_STATUS.PROCESS && state.started) {
                    renderHeader();
                }
            }, 1000);
        }

        function stopHeaderSync() {
            if (uiState.headerIntervalId !== null) {
                clearInterval(uiState.headerIntervalId);
                uiState.headerIntervalId = null;
            }
        }

        function openCellAction(row, col) {
            faceButton.classList.add('face-pressed');
            game.openCell(row, col);
            faceButton.classList.remove('face-pressed');
            render();
        }

        function toggleFlagAction(row, col) {
            game.toggleFlag(row, col);
            render();
        }

        function renderGrid() {
            const grid = game.getGrid();
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    applyCellPresentation(cellElements[row][col], grid[row][col], row, col);
                }
            }
        }

        function renderHeader() {
            const state = game.getState();
            timerCounterElement.textContent = formatCounter(state.gameTime);
            minesCounterElement.textContent = formatCounter(state.minesLeft);

            if (state.status === GAME_STATUS.PROCESS && state.started) {
                startHeaderSync();
            } else {
                stopHeaderSync();
            }

            faceButton.classList.remove('face-win', 'face-lose', 'face-pressed');

            if (state.status === GAME_STATUS.WIN) {
                faceButton.classList.add('face-win');
            } else if (state.status === GAME_STATUS.LOSE) {
                faceButton.classList.add('face-lose');
            } else if (state.status === GAME_STATUS.ERROR) {
                faceButton.classList.add('face-lose');
            }
        }

        function renderStatusMessage() {
            const state = game.getState();

            statusMessageElement.classList.remove('win', 'lose');
            statusMessageElement.textContent = '';

            if (state.status === GAME_STATUS.WIN) {
                statusMessageElement.textContent = 'You win!';
                statusMessageElement.classList.add('win');
            } else if (state.status === GAME_STATUS.LOSE) {
                statusMessageElement.textContent = 'Boom! You hit a mine.';
                statusMessageElement.classList.add('lose');
            } else if (state.status === GAME_STATUS.ERROR) {
                statusMessageElement.textContent = state.errorMessage || 'Unable to generate field. Try another difficulty.';
                statusMessageElement.classList.add('lose');
            }
        }

        function render() {
            renderHeader();
            renderGrid();
            renderStatusMessage();
        }

        function getCellCoordinates(target) {
            if (!target || typeof target.closest !== 'function') {
                return null;
            }

            const cellElement = target.closest('[data-row][data-col]');
            if (!cellElement) {
                return null;
            }

            return {
                row: Number(cellElement.dataset.row),
                col: Number(cellElement.dataset.col)
            };
        }

        function getCurrentFocusCoordinates() {
            if (
                typeof uiState.currentFocus.row === 'number' &&
                typeof uiState.currentFocus.col === 'number' &&
                uiState.currentFocus.row >= 0 &&
                uiState.currentFocus.col >= 0 &&
                uiState.currentFocus.row < cellElements.length &&
                uiState.currentFocus.col < cellElements[0].length
            ) {
                return { row: uiState.currentFocus.row, col: uiState.currentFocus.col };
            }

            return null;
        }

        function resetGame() {
            game.initGame();
            stopHeaderSync();

            const state = game.getState();
            const shouldRebuild =
                cellElements.length !== state.rows ||
                (cellElements[0] && cellElements[0].length !== state.cols);

            if (uiState.currentFocus.row >= state.rows || uiState.currentFocus.col >= state.cols) {
                uiState.currentFocus.row = 0;
                uiState.currentFocus.col = 0;
            }

            if (shouldRebuild) {
                buildGridDOM();
            }

            updateLayoutDimensions();

            render();
        }

        function switchDifficulty() {
            currentDifficultyIndex = (currentDifficultyIndex + 1) % DIFFICULTY_PRESETS.length;
            const preset = DIFFICULTY_PRESETS[currentDifficultyIndex];

            game = createGame(preset);
            uiState.currentFocus.row = 0;
            uiState.currentFocus.col = 0;

            buildGridDOM();
            resetGame();

            statusMessageElement.classList.remove('win', 'lose');
            statusMessageElement.textContent = 'Difficulty: ' + preset.name + ' (' + preset.rows + 'x' + preset.cols + ', ' + preset.minesCount + ' mines)';
        }

        function showHelp() {
            const helpText = [
                'Controls:',
                'Left click / Enter / Space: open a cell',
                'Right click / F: place or remove a flag',
                'Arrow keys: move between cells',
                'Restart button or smiley: start a new game',
                'Options: switch difficulty'
            ].join('\n');

            window.alert(helpText);
        }

        fieldElement.addEventListener('click', (event) => {
            const coords = getCellCoordinates(event.target);
            if (!coords) {
                return;
            }

            openCellAction(coords.row, coords.col);
            moveFocusToCell(coords.row, coords.col);
        });

        fieldElement.addEventListener('contextmenu', (event) => {
            const coords = getCellCoordinates(event.target);
            if (!coords) {
                return;
            }

            event.preventDefault();

            toggleFlagAction(coords.row, coords.col);
            moveFocusToCell(coords.row, coords.col);
        });

        fieldElement.addEventListener('keydown', (event) => {
            let coords = getCellCoordinates(event.target);
            if (!coords) {
                coords = getCurrentFocusCoordinates();
            }
            if (!coords) {
                return;
            }

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openCellAction(coords.row, coords.col);
                moveFocusToCell(coords.row, coords.col);
                return;
            }

            if (event.key === 'f' || event.key === 'F') {
                event.preventDefault();
                toggleFlagAction(coords.row, coords.col);
                moveFocusToCell(coords.row, coords.col);
                return;
            }

            let nextRow = coords.row;
            let nextCol = coords.col;

            if (event.key === 'ArrowUp') {
                nextRow = Math.max(0, coords.row - 1);
            } else if (event.key === 'ArrowDown') {
                nextRow = Math.min(cellElements.length - 1, coords.row + 1);
            } else if (event.key === 'ArrowLeft') {
                nextCol = Math.max(0, coords.col - 1);
            } else if (event.key === 'ArrowRight') {
                nextCol = Math.min(cellElements[0].length - 1, coords.col + 1);
            } else {
                return;
            }

            event.preventDefault();
            moveFocusToCell(nextRow, nextCol);
        });

        restartButton.addEventListener('click', resetGame);
        optionsButton.addEventListener('click', switchDifficulty);
        helpButton.addEventListener('click', showHelp);
        faceButton.addEventListener('click', resetGame);

        window.addEventListener('beforeunload', stopHeaderSync, { once: true });

        buildGridDOM();
        resetGame();
    })();
}