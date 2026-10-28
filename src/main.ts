type Vec = { x: number; y: number };

type MoveSet = { kind: "step" | "beam" | "furthest"; dirs: Vec[] };

type Piece = { pos: Vec; display: string; moveSet: MoveSet };

type Level = { pieces: Piece[]; goals: Vec[] };

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

function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

function eq(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y;
}

function crossProduct(xs: number[], ys: number[]): Vec[] {
  return xs.flatMap((x) => ys.map((y) => vec(x, y)));
}

const diags = crossProduct([-1, 1], [-1, 1]);
const orths = [vec(0, 1), vec(1, 0), vec(-1, 0), vec(0, -1)];
const allDirs = [...orths, ...diags];

function piece(display: string, moveSet: MoveSet) {
  return (x: number, y: number): Piece => ({ pos: vec(x, y), display, moveSet });
}

const jumpBishop = piece("B", { kind: "furthest", dirs: diags });
const jumpRook = piece("R", { kind: "furthest", dirs: orths });
const king = piece("K", { kind: "step", dirs: allDirs });

const levels: Record<string, Level> = {
  "01. rooks 1": {
    pieces: [jumpRook(0, 0), jumpRook(7, 7)],
    goals: [vec(0, 3), vec(0, 4)],
  },
  "02. rooks 2": {
    pieces: [jumpRook(0, 0), jumpRook(7, 7), jumpRook(7, 0)],
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
  undoStack = [];
  restart();
  goals = currentLevel().goals;
  render();
}

function restart() {
  // Copy so moving pieces doesn't mutate the level definition.
  pieces = structuredClone(currentLevel().pieces);
  selectedPiece = null;
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
  restart();
  render();
}

function inBounds(p: Vec) {
  return 0 <= p.x && p.x < SIZE && 0 <= p.y && p.y < SIZE;
}

function pieceAt(pos: Vec): Piece | null {
  return pieces.find((p) => eq(p.pos, pos)) ?? null;
}

function occupied(pos: Vec) {
  return !inBounds(pos) || pieceAt(pos) != null;
}

function moves({ pos, moveSet: { kind, dirs } }: Piece): Vec[] {
  const result: Vec[] = [];
  for (const d of dirs) {
    if (kind === "step") {
      const m = add(pos, d);
      if (!occupied(m)) result.push(m);
    } else {
      let m = pos;
      while (!occupied(add(m, d))) {
        m = add(m, d);
        if (kind === "beam") result.push(m);
      }
      if (kind === "furthest" && m !== pos) result.push(m);
    }
  }
  return result;
}

function renderSquare(pos: Vec, piece: Piece | null, isMove: boolean) {
  const sq = document.createElement("div");
  sq.className = `sq ${(pos.x + pos.y) % 2 ? "dark" : "light"}`;
  if (goals.some((g) => eq(g, pos))) sq.classList.add("goal");

  const sel = selectedPiece;
  if (piece != null) {
    sq.textContent = piece.display;
    sq.onclick = () => {
      selectedPiece = sel === piece ? null : piece;
      render();
    };
  } else if (sel != null && isMove) {
    sq.classList.add("target");
    sq.onclick = () => {
      saveHistory();
      sel.pos = pos;
      selectedPiece = null;
      render();
    };
  }

  return sq;
}

function render() {
  const targets = selectedPiece != null ? moves(selectedPiece) : [];
  board.replaceChildren();
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const pos = vec(x, y);
      const isMove = targets.some((m) => eq(m, pos));
      board.append(renderSquare(pos, pieceAt(pos), isMove));
    }
  }
}

for (const name of Object.keys(levels)) {
  levelSelect.append(new Option(name, name));
}
levelSelect.onchange = loadLevel;
undoButton.onclick = undo;
resetButton.onclick = reset;
document.onkeydown = (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "z") undo();
  else if (e.key === "r") reset();
};
loadLevel();
