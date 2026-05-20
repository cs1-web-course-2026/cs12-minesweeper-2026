export const gameState = {
  rows: 9,
  cols: 9,
  minesCount: 10,
  status: 'process', // 'process' | 'win' | 'lose'
  gameTime: 0,
  timerId: null,
  explodedCell: null, // Координати міни, на якій підірвалися: {row, col}
  grid: []
};

export function resetState(rows = 9, cols = 9, minesCount = 10) {
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;
  gameState.status = 'process';
  gameState.gameTime = 0;
  gameState.explodedCell = null;
  
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
  }
  gameState.timerId = null;
  gameState.grid = [];
}