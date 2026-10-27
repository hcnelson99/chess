type Vec = { x: number; y: number };

type MoveSet = { kind: "step"; dirs: Vec[] } | { kind: "beam"; dirs: Vec[] };

type Piece = { pos: Vec; display: string; moveSet: MoveSet };

const SIZE = 8;

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (el == null) throw new Error(`missing #${id} element`);
  return el;
}

const board = byId("board");

function vec(x: number, y: number): Vec {
  return { x, y };
}

function cross_product(xs: number[], ys: number[]) {
  return xs.flatMap((x) => ys.map((y) => ({ x, y })));
}

const ds = [-1, 1];
const diags = cross_product(ds, ds);
const dirs = [-1, 0, 1];
const cardinal = cross_product(dirs, dirs).filter(
  ({ x, y }) => !(x === 0 && y === 0),
);

function bishop(x: number, y: number): Piece {
  return { pos : vec(x, y), display: "B", moveSet: { kind: "beam", dirs: diags } };
}

function king(x: number, y: number): Piece {
  return { pos: vec(x, y), display: "K", moveSet: { kind: "step", dirs: cardinal } };
}

const pieces: Piece[] = [king(0, 0), king(3, 5), bishop(2, 4)];

let selectedPiece: Piece | null = null;

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}

function inBounds(p: Vec) {
  return 0 <= p.x && p.x < SIZE && 0 <= p.y && p.y < SIZE;
}

function moves(pos: Vec, moveSet: MoveSet): Vec[] {
  switch (moveSet.kind) {
    case "step":
      return moveSet.dirs.map((p) => add(pos, p));
    case "beam": {
      const moves: Vec[] = [];
      for (const d of moveSet.dirs) {
        let i = 1;
        while (true) {
          const m = mult(d, i);
          if (!inBounds(m)) break;
          moves.push(m);
          i++;
        }
      }
      return moves;
    }
    default:
      return assertNever(moveSet);
  }
}

function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

function mult(a: Vec, k: number): Vec {
  return { x: a.x * k, y: a.y * k };
}

function eq(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y;
}

function renderSquare(pos: Vec, piece: Piece | null, isMove: boolean) {
  const sq = document.createElement("div");
  sq.className = `sq ${(pos.x + pos.y) % 2 ? "dark" : "light"}`;
  if (piece != null) {
    sq.textContent = piece.display;
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
  const targets =
    selectedPiece != null
      ? moves(selectedPiece.pos, selectedPiece.moveSet)
      : [];

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
