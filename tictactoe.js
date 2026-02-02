const cells = document.querySelectorAll(".cell");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");

let currentPlayer = "X";
let gameActive = true;
let board = Array(9).fill(null);

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

cells.forEach((cell) => cell.addEventListener("click", handleMove));
resetBtn.addEventListener("click", resetGame);

function handleMove(e) {
  const index = e.target.dataset.index;

  if (!gameActive || board[index]) return;

  board[index] = currentPlayer;
  e.target.textContent = currentPlayer;
  e.target.disabled = true;

  if (checkWin()) {
    statusEl.textContent = `Player ${currentPlayer} wins!`;
    gameActive = false;
    highlightWin();
    return;
  }

  if (board.every(Boolean)) {
    statusEl.textContent = "It's a draw!";
    gameActive = false;
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusEl.textContent = `Player ${currentPlayer}’s turn`;
}

function checkWin() {
  return WINNING_COMBOS.some((combo) =>
    combo.every((i) => board[i] === currentPlayer)
  );
}

function highlightWin() {
  WINNING_COMBOS.forEach((combo) => {
    if (combo.every((i) => board[i] === currentPlayer)) {
      combo.forEach((i) => cells[i].classList.add("win"));
    }
  });
}

function resetGame() {
  board.fill(null);
  currentPlayer = "X";
  gameActive = true;
  statusEl.textContent = "Player X’s turn";

  cells.forEach((cell) => {
    cell.textContent = "";
    cell.disabled = false;
    cell.classList.remove("win");
  });
}