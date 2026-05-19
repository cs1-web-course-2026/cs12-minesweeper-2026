const cells = document.querySelectorAll(".cell");
const resetBtn = document.querySelector(".reset-button");
const minesCountText = document.querySelector(".info p:last-child");

let minesCount = 15;
let fieldSize = cells.length;
let mines = [];
let gameOver = false;

function generateMines() {
    mines = [];
    while (mines.length < minesCount) {
        let index = Math.floor(Math.random() * fieldSize);
        if (!mines.includes(index)) {
            mines.push(index);
        }
    }
}

function getNeighbors(index) {
    const neighbors = [];
    const cols = 5;

    const row = Math.floor(index / cols);
    const col = index % cols;

    for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
            if (r === 0 && c === 0) continue;

            let newRow = row + r;
            let newCol = col + c;

            if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < cols) {
                neighbors.push(newRow * cols + newCol);
            }
        }
    }

    return neighbors;
}

function countMines(index) {
    return getNeighbors(index).filter(n => mines.includes(n)).length;
}

function openCell(index) {
    if (gameOver) return;

    const cell = cells[index];

    if (cell.classList.contains("flag")) return;

    if (mines.includes(index)) {
        cell.textContent = "💣";
        cell.style.background = "red";
        gameOver = true;
        alert("💥 Game Over!");
        return;
    }

    let count = countMines(index);

    if (count > 0) {
        cell.textContent = count;
        cell.style.background = "white";
    } else {
        cell.style.background = "white";

        getNeighbors(index).forEach(n => {
            if (!cells[n].textContent) {
                openCell(n);
            }
        });
    }
}

cells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
        openCell(index);
    });

    cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        if (gameOver) return;

        if (cell.classList.contains("flag")) {
            cell.classList.remove("flag");
            cell.textContent = "";
        } else {
            cell.classList.add("flag");
            cell.textContent = "🚩";
        }
    });
});

resetBtn.addEventListener("click", () => {
    gameOver = false;

    cells.forEach(cell => {
        cell.textContent = "";
        cell.className = "cell";
        cell.style.background = "";
    });

    generateMines();
});

generateMines();