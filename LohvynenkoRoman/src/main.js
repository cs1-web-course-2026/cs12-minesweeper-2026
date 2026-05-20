import { gameState, resetState } from './state.js';
import { generateField } from './gameLogic.js';
import { renderBoard, updateCounters } from './ui.js';

function startNewGame() {
  // Конфігурація для поля 9х9 та 10 мін відповідно до HTML/CSS макету
  resetState(9, 9, 10);
  generateField();
  renderBoard();
  updateCounters();

  // Робота з динамічним таймером інтервалу
  gameState.timerId = setInterval(() => {
    if (gameState.status === 'process') {
      gameState.gameTime++;
      updateCounters();
    }
  }, 1000);
}

// Запуск після повної готовності DOM-дерева
window.addEventListener('DOMContentLoaded', () => {
  startNewGame();
  
  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', startNewGame);
  }
});