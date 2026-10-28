type Vec = { x: number; y: number };

type MoveSet =
  | { kind: "step"; dirs: Vec[] }
  | { kind: "beam"; dirs: Vec[] }
  | { kind: "furthest"; dirs: Vec[] };

type Piece = { pos: Vec; display: string; moveSet: MoveSet };

const SIZE = 8;

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (el == null) throw new Error(`missing #${id} element`);
  return el;
}

const board = byId("board");
const levelSelect = byId("level") as HTMLSelectElement;
const undoButton = byId("undo");
const resetButton = byId("reset");

function vec(x: number, y: number): Vec {
  return { x, y };
}

function cross_product(xs: number[], ys: number[]) {
  return xs.flatMap((x) => ys.map((y) => ({ x, y })));
}

const ds = [-1, 1];
const diags = cross_product(ds, ds);

const orths = [vec(0, 1), vec(1, 0), vec(-1, 0), vec(0, -1)];

const dirs = [-1, 0, 1];
const cardinal = cross_product(dirs, dirs).filter(
  ({ x, y }) => !(x === 0 && y === 0),
);

function bishop(x: number, y: number): Piece {
  return {
    pos: vec(x, y),
    display: "B",
    moveSet: { kind: "furthest", dirs: diags },
  };
}

function rook(x: number, y: number): Piece {
  return {
    pos: vec(x, y),
    display: "R",
    moveSet: { kind: "furthest", dirs: orths },
  };
}

function king(x: number, y: number): Piece {
  return {
    pos: vec(x, y),
    display: "K",
    moveSet: { kind: "step", dirs: cardinal },
  };
}

type Level = {
  pieces: Piece[];
  goals: Vec[];
};

const levels: Record<string, Level> = {
  "01. rooks 1": {
    pieces: [rook(0, 0), rook(7, 7)],
    goals: [vec(0, 3), vec(0, 4)],
  },
  "02. rooks 2": {
    pieces: [rook(0, 0), rook(7, 7), rook(7, 0)],
    goals: [vec(0, 0), vec(3, 3), vec(4, 3)],
  },
};

let pieces: Piece[] = [];
let goals: Vec[] = [];
let selectedPiece: Piece | null = null;
// Snapshots of `pieces` before each move or reset.
let undoStack: Piece[][] = [];

function currentLevel(): Level {
  const level = levels[levelSelect.value];
  if (level == null) throw new Error(`unknown level ${levelSelect.value}`);
  return level;
}

function loadLevel() {
  const level = currentLevel();
  // Copy so moving pieces doesn't mutate the level definition.
  pieces = structuredClone(level.pieces);
  goals = level.goals;
  undoStack = [];
  selectedPiece = null;
  render();
}

function saveHistory() {
  undoStack.push(structuredClone(pieces));
}

function undo() {
  const prev = undoStack.pop();
  if (prev == null) return;
  pieces = prev;
  selectedPiece = null;
  render();
}

function reset() {
  saveHistory();
  pieces = structuredClone(currentLevel().pieces);
  selectedPiece = null;
  render();
}

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}

function inBounds(p: Vec) {
  return 0 <= p.x && p.x < SIZE && 0 <= p.y && p.y < SIZE;
}

function occupied(pos: Vec) {
  return !inBounds(pos) || pieces.some((p) => eq(p.pos, pos));
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
          const m = add(pos, mult(d, i));
          if (occupied(m)) break;
          moves.push(m);
          i++;
        }
      }
      return moves;
    }
    case "furthest": {
      const moves: Vec[] = [];
      for (const d of moveSet.dirs) {
        let i = 0;
        const m = (i: number) => add(pos, mult(d, i));

        while (!occupied(m(i + 1))) i++;
        if (i > 0) moves.push(m(i));
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
  if (goals.some((g) => eq(g, pos))) {
    sq.classList.add("goal");
  }
  if (piece != null) {
    sq.textContent = piece.display;
  }

  const sel = selectedPiece;
  if (sel != null && piece == null && isMove) {
    sq.classList.add("target");
    sq.onclick = () => {
      saveHistory();
      sel.pos = pos;
      selectedPiece = null;
      render();
    };
  }
  if (piece != null) {
    sq.onclick = () => {
      if (selectedPiece != null && eq(selectedPiece.pos, pos)) {
        selectedPiece = null;
      } else {
        selectedPiece = piece;
      }
      render();
    };
  }

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

for (const name of Object.keys(levels)) {
  levelSelect.append(new Option(name, name));
}
levelSelect.onchange = () => loadLevel();
undoButton.onclick = undo;
resetButton.onclick = reset;
document.onkeydown = (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "z") undo();
  else if (e.key === "r") reset();
};
loadLevel();
