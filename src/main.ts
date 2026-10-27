type Vec = { x: number; y: number };

type MoveSet = { kind: "step"; dirs: Vec[] };

type Piece = { pos: Vec; moveSet: MoveSet };

type PieceId = number;

const SIZE = 8;
const board = document.getElementById("board")!;

function vec(x: number, y: number): Vec {
  return { x, y };
}

const dirs = [-1, 0, 1];

function cross_product(xs: number[], ys: number[]) {
  return xs.flatMap((x) => ys.map((y) => ({ x, y })));
}

const cardinal = cross_product(dirs, dirs).filter(
  ({ x, y }) => !(x == 0 && y == 0),
);

function king(pos: Vec): Piece {
  return { pos, moveSet: { kind: "step", dirs: cardinal } };
}

let pieces: Piece[] = [king(vec(0, 0)), king(vec(3, 5))];

let selectedPiece: Piece | null = null;

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}

function offsets(moveSet: MoveSet): Vec[] {
  switch (moveSet.kind) {
    case "step":
      return moveSet.dirs;
    default:
      return assertNever(moveSet.kind);
  }
}

function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

function eq(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y;
}

function moves(piece: Piece): Vec[] {
  return offsets(piece.moveSet).map((pos) => add(pos, piece.pos));
}

function renderSquare(pos: Vec, piece: Piece | null, isMove: boolean) {
  const sq = document.createElement("div");
  sq.className = "sq " + ((pos.x + pos.y) % 2 ? "dark" : "light");
  if (piece != null) {
    sq.textContent = "♔";
  }

  const sel = selectedPiece;
  if (sel != null && isMove) {
    sq.onclick = () => {
      sel.pos = pos;
      selectedPiece = null;
      render();
    };
  } else if (piece != null) {
    sq.onclick = () => {
      selectedPiece = piece;
      render();
    };
  }

  if (isMove) sq.classList.add("target");
  return sq;
}

function render() {
  board.replaceChildren();
  const targets = selectedPiece != null ? moves(selectedPiece) : [];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const pos = vec(x, y);
      const piece = pieces.find((p) => eq(p.pos, pos)) ?? null;
      const isMove = targets.some((m) => eq(m, pos));
      board.append(renderSquare(pos, piece, isMove));
    }
  }
}

render();
