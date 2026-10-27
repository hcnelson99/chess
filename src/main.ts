type Pos = { x: number; y: number };

const SIZE = 8;
const board = document.getElementById("board")!;
let king: Pos = { x: 4, y: 7 };

function kingMoves(p: Pos): Pos[] {
  const moves: Pos[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const x = p.x + dx, y = p.y + dy;
      if ((dx || dy) && x >= 0 && x < SIZE && y >= 0 && y < SIZE) moves.push({ x, y });
    }
  }
  return moves;
}

function render() {
  board.replaceChildren();
  const moves = kingMoves(king);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const sq = document.createElement("div");
      sq.className = "sq " + ((x + y) % 2 ? "dark" : "light");
      if (x === king.x && y === king.y) sq.textContent = "♔";
      const isMove = moves.some((m) => m.x === x && m.y === y);
      if (isMove) {
        sq.classList.add("target");
        sq.onclick = () => { king = { x, y }; render(); };
      }
      board.append(sq);
    }
  }
}

render();
