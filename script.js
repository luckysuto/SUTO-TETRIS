
"use strict";

// ============================================
// SUTO-TETRIS（すとてと）
// ゲーム本体
// ============================================

const W = 8;
const H = 20;

const SHAPES = {
  T: [[0,1],[1,1],[2,1],[1,2]],
  S: [[1,0],[2,0],[0,1],[1,1]],
  Z: [[0,0],[1,0],[1,1],[2,1]],
  J: [[0,0],[0,1],[1,1],[2,1]],
  L: [[2,0],[0,1],[1,1],[2,1]],
  I: [[2,0],[2,1],[2,2],[2,3]],
  O: [[1,1],[2,1],[1,2],[2,2]]
};

const COLORS = {
  T: "#a64dff",
  S: "#20d76b",
  Z: "#f64c53",
  J: "#3989ff",
  L: "#ff9a30",
  I: "#29d7f8",
  O: "#ffd23e"
};

const boardCanvas = document.getElementById("board");
const ctx = boardCanvas.getContext("2d");

const holdCtx = document
  .getElementById("hold")
  .getContext("2d");

const nextCtx = document
  .getElementById("next")
  .getContext("2d");

const $ = id => document.getElementById(id);

let grid;
let piece;
let queue;
let held;
let holdUsed;

let score;
let level;
let lines;
let placed;
let levelPlaced;
let combo;
let b2b;

let over;
let paused;
let playing = false;

let last = 0;
let fallAcc = 0;
let lockTime = 0;
let lockResets = 0;
let grounded = false;
let lastRotation = false;
let gameSession = 0;

// ============================================
// 基本処理
// ============================================

const randPiece = () => {
  const names = Object.keys(SHAPES);
  return names[Math.floor(Math.random() * names.length)];
};

const freshGrid = () =>
  Array.from(
    { length: H },
    () => Array(W).fill(null)
  );

window.playingBGMAllowed = () =>
  playing && !paused && !over;

function showScreen(id) {
  if (id !== "game") {
    GameBGM.pause();
  }

  document.querySelectorAll(".screen").forEach(el => {
    el.classList.toggle("active", el.id === id);
  });

  if (id === "shop") {
    renderShop();
  }

  if (id === "home") {
    updateWallet();
  }
}

function showModal(title, html, actions) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = html;
  $("modalActions").innerHTML = "";

  for (const action of actions) {
    const button = document.createElement("button");

    button.textContent = action.text;
    button.onclick = action.fn;

    $("modalActions").appendChild(button);
  }

  $("modal").classList.remove("hidden");
}

function closeModal() {
  $("modal").classList.add("hidden");
}

// ============================================
// ゲーム開始
// ============================================

function startGame() {
  grid = freshGrid();

  queue = Array.from(
    { length: 5 },
    randPiece
  );

  held = null;
  holdUsed = false;

  score = 0;
  level = 1;
  lines = 0;
  placed = 0;
  levelPlaced = 0;
  combo = -1;
  b2b = false;

  over = false;
  paused = false;
  playing = true;

  last = 0;
  fallAcc = 0;
  lockTime = 0;
  lockResets = 0;
  grounded = false;

  gameSession++;

  spawn();
  showScreen("game");

  GameBGM.setEnabled(save.sound);
  GameBGM.resume();

  updateHUD();
  drawAll();

  requestAnimationFrame(t => tick(t, gameSession));
}

// ============================================
// ブロック出現
// ============================================

function spawn(type) {
  const name = type || queue.shift();

  if (!type) {
    queue.push(randPiece());
  }

  piece = {
    name,
    cells: SHAPES[name].map(cell => [...cell]),
    x: Math.floor(W / 2) - 2,
    y: -1,
    rotation: 0
  };

  lockTime = 0;
  lockResets = 0;
  grounded = false;
  lastRotation = false;

  if (!valid(piece.cells, piece.x, piece.y)) {
    finishGame();
  }
}

// ============================================
// 当たり判定
// ============================================

function valid(cells, x, y) {
  return cells.every(([a, b]) => {
    const xx = x + a;
    const yy = y + b;

    return (
      xx >= 0 &&
      xx < W &&
      yy < H &&
      (
        yy < 0 ||
        grid[yy][xx] === null
      )
    );
  });
}

// ============================================
// 移動
// ============================================

function translate(dx, dy) {
  if (!playing || paused || over) {
    return false;
  }

  if (!valid(
    piece.cells,
    piece.x + dx,
    piece.y + dy
  )) {
    return false;
  }

  piece.x += dx;
  piece.y += dy;

  if (dx !== 0) {
    lastRotation = false;
  }

  return true;
}

function move(dx) {
  if (translate(dx, 0)) {
    resetLock();
  }

  drawAll();
}

// ============================================
// 回転
// ============================================

function rotate(dir) {
  if (!playing || paused || over) {
    return;
  }

  if (piece.name === "O") {
    return;
  }

  const old = piece.cells;
  let cells;

  if (piece.name === "I") {
    cells = old.map(([x, y]) =>
      dir === 1
        ? [3 - y, x]
        : [y, 3 - x]
    );
  } else if (piece.name === "L") {
    // L型は指定された右側の回転軸を使用
    cells = old.map(([x, y]) =>
      dir === 1
        ? [2 - (y - 1), 1 + (x - 2)]
        : [2 + (y - 1), 1 - (x - 2)]
    );
  } else {
    cells = old.map(([x, y]) =>
      dir === 1
        ? [2 - y, x]
        : [y, 2 - x]
    );
  }

  // 壁際でも回転できるように位置を調整
  const kicks = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [0, -1],
    [-1, -1],
    [1, -1],
    [0, -2]
  ];

  for (const [dx, dy] of kicks) {
    if (valid(
      cells,
      piece.x + dx,
      piece.y + dy
    )) {
      piece.cells = cells;
      piece.x += dx;
      piece.y += dy;

      piece.rotation =
        (piece.rotation + dir + 4) % 4;

      lastRotation = true;

      resetLock();
      drawAll();
      return;
    }
  }
}

// ============================================
// 設置猶予
// ============================================

function resetLock() {
  if (grounded && lockResets < 10) {
    lockTime = 0;
    lockResets++;
  }
}

// ============================================
// 落下
// ============================================

function softDrop() {
  if (translate(0, 1)) {
    fallAcc = 0;
  }

  drawAll();
}

function hardDrop() {
  if (!playing || paused || over) {
    return;
  }

  let distance = 0;

  while (translate(0, 1)) {
    distance++;
  }

  score += distance * 2;

  lockPiece();
  drawAll();
}

// ============================================
// ホールド
// ============================================

function doHold() {
  if (
    !playing ||
    paused ||
    over ||
    holdUsed
  ) {
    return;
  }

  const old = piece.name;

  if (held === null) {
    held = old;
    spawn();
  } else {
    const next = held;
    held = old;
    spawn(next);
  }

  holdUsed = true;

  drawAll();
}

// ============================================
// Tスピン判定
// ============================================

function getTSpin() {
  if (
    piece.name !== "T" ||
    !lastRotation
  ) {
    return null;
  }

  const cx = piece.x + 1;
  const cy = piece.y + 1;

  let count = 0;

  const corners = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ];

  for (const [dx, dy] of corners) {
    const x = cx + dx;
    const y = cy + dy;

    if (
      x < 0 ||
      x >= W ||
      y >= H ||
      (
        y >= 0 &&
        grid[y][x] !== null
      )
    ) {
      count++;
    }
  }

  if (count < 3) {
    return null;
  }

  return count === 3 ? "mini" : "full";
}

// ============================================
// ブロック設置・ライン消去
// ============================================

function lockPiece() {
  if (over) {
    return;
  }

  const tspin = getTSpin();

  for (const [a, b] of piece.cells) {
    const x = piece.x + a;
    const y = piece.y + b;

    if (y < 0) {
      finishGame();
      return;
    }

    grid[y][x] = piece.name;
  }

  let clear = 0;

  for (let y = H - 1; y >= 0; y--) {
    if (grid[y].every(value => value !== null)) {
      grid.splice(y, 1);
      grid.unshift(Array(W).fill(null));

      clear++;
      y++;
    }
  }

  // レベル倍率
  const multiplier = 0.9 + 0.1 * level;

  // ブロック4マス分の基本得点
  let points = 16 * multiplier;

  let base = [0, 100, 300, 500, 800][clear];

  if (tspin) {
    base = tspin === "mini"
      ? [100, 200, 400, 600][Math.min(clear, 3)]
      : [400, 800, 1200, 1600][Math.min(clear, 3)];
  }

  let event = "";

  if (clear > 0) {
    combo++;

    if (combo > 0) {
      points += 50 * combo * multiplier;
    }

    const difficult =
      clear === 4 ||
      (tspin && clear > 0);

    if (difficult && b2b) {
      points += base * 0.5 * multiplier;
    }

    b2b = difficult ? true : false;

    if (tspin) {
      event =
        "T-SPIN " +
        (tspin === "mini" ? "MINI " : "") +
        clear +
        " LINE";
    } else if (clear === 4) {
      event = "TETRIS!";
    } else {
      event = clear + " LINE";
    }

    if (combo > 0) {
      event += " · COMBO " + combo;
    }

    lines += clear;
  } else {
    combo = -1;

    if (tspin) {
      event = "T-SPIN " + tspin.toUpperCase();
    }
  }

  points += base * multiplier;

  // パーフェクトクリア
  if (
    clear > 0 &&
    grid.every(row =>
      row.every(value => value === null)
    )
  ) {
    points += 2000 * multiplier;
    event = "PERFECT CLEAR!";
  }

  score += Math.round(points);

  placed++;
  levelPlaced++;

  // レベルアップ
  if (levelPlaced >= 10 + 5 * level) {
    levelPlaced = 0;
    level++;
    event = "LEVEL UP! " + level;
  }

  holdUsed = false;

  $("eventLabel").textContent = event;

  spawn();

  updateHUD();
  persist();

  if (!over) {
    drawAll();
  }
}

// ============================================
// ゲームオーバー
// ============================================

function finishGame() {
  if (over) {
    return;
  }

  GameBGM.pause();

  over = true;
  playing = false;

  if (score > save.best) {
    save.best = score;
  }

  const earned = Math.floor(score / 10);
  save.points += earned;

  persist();
  updateWallet();
  updateHUD();

  showModal(
    "GAME OVER",
    `
      <p>
        スコア：
        <b>${score.toLocaleString()}</b>
      </p>
      <p>レベル：${level}</p>
      <p>
        獲得ポイント：
        💎 ${earned.toLocaleString()} P
      </p>
    `,
    [
      {
        text: "もう一度",
        fn: () => {
          closeModal();
          startGame();
        }
      },
      {
        text: "ホーム",
        fn: () => {
          closeModal();
          showScreen("home");
        }
      }
    ]
  );
}

// ============================================
// 落下速度
// ============================================

function fallDelay() {
  const anchors = [
    [1, 1000],
    [5, 800],
    [10, 550],
    [20, 250],
    [30, 100],
    [40, 50]
  ];

  for (let i = 1; i < anchors.length; i++) {
    if (level <= anchors[i][0]) {
      const [l0, v0] = anchors[i - 1];
      const [l1, v1] = anchors[i];

      return (
        v0 +
        (v1 - v0) *
        (level - l0) /
        (l1 - l0)
      );
    }
  }

  return 50;
}

// ============================================
// メインループ
// ============================================

function tick(t, session) {
  if (
    session !== gameSession ||
    !playing ||
    over
  ) {
    return;
  }

  if (!last) {
    last = t;
  }

  const dt = Math.min(t - last, 80);
  last = t;

  if (!paused) {
    fallAcc += dt;

    let steps = 0;

    while (
      fallAcc >= fallDelay() &&
      steps++ < 8
    ) {
      fallAcc -= fallDelay();

      if (!translate(0, 1)) {
        break;
      }
    }

    const isGround = !valid(
      piece.cells,
      piece.x,
      piece.y + 1
    );

    if (isGround) {
      lockTime += dt;
      grounded = true;

      if (lockTime >= 500) {
        lockPiece();
      }
    } else {
      grounded = false;
      lockTime = 0;
    }

    drawAll();
  }

  requestAnimationFrame(n =>
    tick(n, session)
  );
}

// ============================================
// ブロック描画
// ============================================

function blockStyle(context, x, y, size, color) {
  const skin = getItem(
    "block",
    save.equipped.block
  );

  context.fillStyle =
    skin.id === "b0"
      ? color
      : skin.color;

  context.fillRect(
    x + 1,
    y + 1,
    size - 2,
    size - 2
  );

  context.fillStyle = "#ffffff50";

  context.fillRect(
    x + 2,
    y + 2,
    size - 4,
    Math.max(2, size * 0.13)
  );

  context.strokeStyle = "#ffffff50";
  context.lineWidth = 1;

  context.strokeRect(
    x + 1.5,
    y + 1.5,
    size - 3,
    size - 3
  );

  if (
    ["b2", "b3", "b9", "b10", "b11"]
      .includes(skin.id)
  ) {
    context.strokeStyle =
      skin.id === "b10"
        ? "#fff0b2"
        : "#e6fbff";

    context.beginPath();

    context.moveTo(
      x + size * 0.25,
      y + size * 0.75
    );

    context.lineTo(
      x + size * 0.75,
      y + size * 0.25
    );

    context.stroke();
  }
}

// ============================================
// 着せ替え反映
// ============================================

function applyCosmetics() {
  const bg = getItem(
    "background",
    save.equipped.background
  );

  const frame = getItem(
    "frame",
    save.equipped.frame
  );

  document.querySelector(".ambient").style.background =
    `radial-gradient(
      ellipse at 20% 80%,
      ${bg.color}aa,
      transparent 55%
    ),
    radial-gradient(
      ellipse at 80% 20%,
      ${bg.other || bg.color}88,
      transparent 55%
    ),
    #06122e`;

  document.querySelector(".board-wrap").style.borderColor =
    frame.color;

  document.querySelector(".board-wrap").style.boxShadow =
    `0 0 17px ${frame.color}88`;

  drawAll();
}

// ============================================
// 盤面描画
// ============================================

function drawAll() {
  if (!grid) {
    return;
  }

  const s = 30;

  ctx.clearRect(0, 0, 240, 600);

  ctx.fillStyle = "#06162e";
  ctx.fillRect(0, 0, 240, 600);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      ctx.strokeStyle = "#24436c80";

      ctx.strokeRect(
        x * s + 0.5,
        y * s + 0.5,
        s,
        s
      );

      if (grid[y][x]) {
        blockStyle(
          ctx,
          x * s,
          y * s,
          s,
          COLORS[grid[y][x]]
        );
      }
    }
  }

  if (piece && !over) {
    let gy = piece.y;

    while (
      valid(
        piece.cells,
        piece.x,
        gy + 1
      )
    ) {
      gy++;
    }

    // ゴーストブロック
    ctx.save();
    ctx.globalAlpha = 0.23;

    for (const [a, b] of piece.cells) {
      if (gy + b >= 0) {
        blockStyle(
          ctx,
          (piece.x + a) * s,
          (gy + b) * s,
          s,
          COLORS[piece.name]
        );
      }
    }

    ctx.restore();

    // 操作中のブロック
    for (const [a, b] of piece.cells) {
      if (piece.y + b >= 0) {
        blockStyle(
          ctx,
          (piece.x + a) * s,
          (piece.y + b) * s,
          s,
          COLORS[piece.name]
        );
      }
    }
  }

  drawMini(
    holdCtx,
    held ? [held] : [],
    100,
    100
  );

  drawMini(
    nextCtx,
    queue.slice(0, 3),
    100,
    255
  );
}

// ============================================
// HOLD / NEXT 表示
// ============================================

function drawMini(c, names, w, h) {
  c.clearRect(0, 0, w, h);

  names.forEach((name, i) => {
    const cells = SHAPES[name];
    const size = 19;

    const minX = Math.min(
      ...cells.map(cell => cell[0])
    );

    const maxX = Math.max(
      ...cells.map(cell => cell[0])
    );

    const minY = Math.min(
      ...cells.map(cell => cell[1])
    );

    const maxY = Math.max(
      ...cells.map(cell => cell[1])
    );

    const ox =
      (w - (maxX - minX + 1) * size) / 2;

    const oy =
      names.length === 1
        ? 32
        : i * 82 + 15;

    for (const [x, y] of cells) {
      blockStyle(
        c,
        ox + (x - minX) * size,
        oy + (y - minY) * size,
        size,
        COLORS[name]
      );
    }
  });
}

// ============================================
// スコア表示
// ============================================

function updateHUD() {
  $("score").textContent =
    Math.round(score || 0).toLocaleString();

  $("level").textContent = level || 1;
  $("lines").textContent = lines || 0;
}

// ============================================
// 一時停止
// ============================================

function togglePause() {
  if (!playing || over) {
    return;
  }

  paused = !paused;

  if (paused) {
    GameBGM.pause();
  } else {
    GameBGM.resume();
  }

  if (paused) {
    showModal(
      "一時停止",
      "<p>ゲームを停止しています。</p>",
      [
        {
          text: "再開",
          fn: () => {
            paused = false;
            last = 0;
            closeModal();
            GameBGM.resume();
          }
        },
        {
          text: "ホームへ",
          fn: () => {
            playing = false;
            gameSession++;
            GameBGM.pause();
            closeModal();
            showScreen("home");
          }
        }
      ]
    );
  } else {
    closeModal();
  }
}

// ============================================
// 操作の振り分け
// ============================================

function control(action) {
  switch (action) {
    case "left":
      move(-1);
      break;

    case "right":
      move(1);
      break;

    case "down":
      softDrop();
      break;

    case "cw":
      rotate(1);
      break;

    case "ccw":
      rotate(-1);
      break;

    case "drop":
      hardDrop();
      break;

    case "hold":
      doHold();
      break;

    case "pause":
      togglePause();
      break;
  }

  drawAll();
}

// ============================================
// PCキーボード操作
// ============================================

const keymap = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowUp: "cw",
  KeyX: "cw",
  KeyZ: "ccw",
  Space: "drop",
  KeyC: "hold",
  ShiftLeft: "hold",
  Escape: "pause"
};

window.addEventListener("keydown", e => {
  if (
    !$("game").classList.contains("active") ||
    document.activeElement?.matches(
      "input,textarea"
    )
  ) {
    return;
  }

  const action = keymap[e.code];

  if (!action) {
    return;
  }

  e.preventDefault();

  if (
    e.repeat &&
    !["left", "right", "down"].includes(action)
  ) {
    return;
  }

  control(action);
});

// ============================================
// スマホタッチ操作
// ============================================

let repeating = null;

document.querySelectorAll(
  "[data-control]"
).forEach(button => {
  const action = button.dataset.control;

  button.addEventListener("pointerdown", e => {
    e.preventDefault();

    button.setPointerCapture(e.pointerId);

    control(action);

    if (repeating) {
      clearTimeout(repeating.delay);
      clearInterval(repeating.interval);
    }

    if (
      ["left", "right", "down"].includes(action)
    ) {
      const state = {};
      repeating = state;

      state.delay = setTimeout(() => {
        state.interval = setInterval(
          () => control(action),
          action === "down" ? 45 : 75
        );
      }, 180);
    }
  });

  for (const eventName of [
    "pointerup",
    "pointercancel",
    "lostpointercapture"
  ]) {
    button.addEventListener(eventName, () => {
      if (repeating) {
        clearTimeout(repeating.delay);
        clearInterval(repeating.interval);
        repeating = null;
      }
    });
  }
});

// ============================================
// ホーム画面ボタン
// ============================================

$("playBtn").onclick = startGame;

$("shopBtn").onclick = () => {
  showScreen("shop");
};

$("homeBtn").onclick = () => {
  if (playing && !over) {
    paused = true;
    GameBGM.pause();

    showModal(
      "ホームに戻る？",
      "<p>現在のプレイは終了します。スコアはポイントに換算されません。</p>",
      [
        {
          text: "戻る",
          fn: () => {
            playing = false;
            gameSession++;
            GameBGM.pause();
            closeModal();
            showScreen("home");
          }
        },
        {
          text: "続ける",
          fn: () => {
            paused = false;
            last = 0;
            closeModal();
            GameBGM.resume();
          }
        }
      ]
    );
  } else {
    showScreen("home");
  }
};

$("pauseBtn").onclick = togglePause;

// ============================================
// 設定
// ============================================

$("settingsBtn").onclick = () => {
  showModal(
    "設定",
    `
      <p>オリジナルBGM（8bit風）</p>

      <label>
        <input
          id="soundToggle"
          type="checkbox"
          ${save.sound ? "checked" : ""}
        >
        BGMを有効にする
      </label>

      <p>
        ※スマホではプレイ開始時に再生されます。
      </p>
    `,
    [
      {
        text: "保存",
        fn: () => {
          save.sound = $("soundToggle").checked;

          GameBGM.setEnabled(save.sound);

          persist();
          closeModal();
        }
      },
      {
        text: "閉じる",
        fn: closeModal
      }
    ]
  );
};

// ============================================
// 記録
// ============================================

$("recordsBtn").onclick = () => {
  showModal(
    "記録",
    `
      <p>
        あなたの最高スコア：
        <b>${save.best.toLocaleString()}</b>
      </p>

      ${
        save.admin
          ? `
            <p>
              管理人専用スコア：
              <b>${save.adminBest.toLocaleString()}</b>
            </p>
          `
          : ""
      }
    `,
    save.admin
      ? [
          {
            text: "管理人設定",
            fn: () => {
              closeModal();
              openAdmin();
            }
          },
          {
            text: "閉じる",
            fn: closeModal
          }
        ]
      : [
          {
            text: "閉じる",
            fn: closeModal
          }
        ]
  );
};

// ============================================
// 遊び方
// ============================================

$("howBtn").onclick = () => {
  showModal(
    "遊び方",
    `
      <p>
        横一列を8マス埋めると消えます。
      </p>

      <p>
        ← →：左右移動<br>
        ↓：ソフトドロップ<br>
        ↶ ↷：回転<br>
        ⤓：ハードドロップ<br>
        H：ホールド<br>
        Ⅱ：一時停止
      </p>

      <p>
        ブロックを設置するとレベルが上がり、
        落下速度も速くなります。
      </p>
    `,
    [
      {
        text: "閉じる",
        fn: closeModal
      }
    ]
  );
};

// ============================================
// BGM・画面切り替え
// ============================================

GameBGM.setEnabled(save.sound);

document.addEventListener(
  "visibilitychange",
  () => {
    if (document.hidden) {
      GameBGM.pause();
    } else if (
      playing &&
      !paused &&
      !over
    ) {
      GameBGM.resume();
    }
  }
);

// ============================================
// 初期表示
// ============================================

updateWallet();
renderShop();
applyCosmetics();
