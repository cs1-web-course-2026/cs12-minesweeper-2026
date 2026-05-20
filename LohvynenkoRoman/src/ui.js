import { gameState } from './state.js';
import { openCell, toggleFlag } from './gameLogic.js';

const boardElement = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const flagCounterElement = document.getElementById('flag-counter');
const resetButton = document.getElementById('reset-button');

// Форматування чисел для ретро-табло (наприклад: 7 -> "007", -2 -> "000")
function formatNumber(num) {
  if (num < 0) return "000";
  return String(num).padStart(3, '0');
}

// Оновлення таймера, лічильника прапорців та емодзі на кнопці
export function updateCounters() {
  if (!timerElement || !flagCounterElement || !resetButton) return;

  let flagsCount = 0;
  gameState.grid.forEach(row => row.forEach(cell => {
    if (cell.state === 'flagged') flagsCount++;
  }));

  const flagsLeft = gameState.minesCount - flagsCount;
  flagCounterElement.textContent = formatNumber(flagsLeft);
  timerElement.textContent = formatNumber(gameState.gameTime);

  // Зміна стану кнопки «Старт/Рестарт»
  if (gameState.status === 'win') resetButton.textContent = '😎';
  else if (gameState.status === 'lose') resetButton.textContent = '😵';
  else resetButton.textContent = '🙂';
}

// Показ усіх мін та перевірка помилкових прапорців після завершення гри
function revealBoardOnEnd() {
  gameState.grid.forEach(row => row.forEach(cell => {
    if (cell.type === 'mine' && cell.state !== 'flagged') {
      cell.state = 'open';
    }
  }));
}

// Динамічний рендеринг ігрового поля
export function renderBoard() {
  if (!boardElement) return;

  boardElement.innerHTML = '';
  // Динамічно налаштовуємо CSS Grid під кількість колонок
  boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;

  gameState.grid.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');

      // Відповідність логічних станів CSS-класам вашого макету
      if (cell.state === 'closed') {
        cellElement.classList.add('closed');
      } 
      else if (cell.state === 'flagged') {
        cellElement.classList.add('closed', 'flagged');
        cellElement.textContent = '🚩';

        // Візуалізація помилкового прапорця (wrong-flag) при програші
        if (gameState.status === 'lose' && cell.type !== 'mine') {
          cellElement.classList.add('wrong-flag');
          cellElement.textContent = '🚩❌';
        }
      } 
      else if (cell.state === 'open') {
        cellElement.classList.add('open');
        
        if (cell.type === 'mine') {
          cellElement.classList.add('mine');
          cellElement.textContent = '💣';
          
          // Перевірка на епіцентр вибуху (mine exploded)
          if (gameState.explodedCell && gameState.explodedCell.row === rIdx && gameState.explodedCell.col === cIdx) {
            cellElement.classList.add('exploded');
            cellElement.textContent = '💥';
          }
        } else if (cell.neighborMines > 0) {
          // Класи кольорів цифр: .cell-1, .cell-2 тощо
          cellElement.classList.add(`cell-${cell.neighborMines}`);
          cellElement.textContent = cell.neighborMines;
        }
      }

      // ОБРОБКА ПОДІЙ (Mouse Events)
      
      // Лівий клік: Відкриття клітинки
      cellElement.addEventListener('click', () => {
        if (gameState.status !== 'process') return;
        
        openCell(rIdx, cIdx);
        
        if (gameState.status === 'lose') {
          revealBoardOnEnd();
        }
        
        renderBoard();
        updateCounters();
      });

      // Правий клік: Встановлення/зняття прапорця
      cellElement.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // БЛОКУВАННЯ СТАНДАРТНОГО МЕНЮ БРАУЗЕРА
        if (gameState.status !== 'process') return;

        toggleFlag(rIdx, cIdx);
        renderBoard();
        updateCounters();
      });

      boardElement.appendChild(cellElement);
    });
  });
}