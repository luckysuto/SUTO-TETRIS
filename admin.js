
"use strict";

// ============================================
// SUTO-TETRIS（すとてと）
// 管理人モード・ポイント管理機能付き
// ============================================

// ※GitHub Pagesの公開JavaScriptに書かれた
// パスワードは誰でも確認できます。
// これは簡易的な管理人モードです。

const ADMIN_PASSWORD = "ADMIN";
const ADMIN_DEFAULT_BEST = 69843681;

// ============================================
// 管理人ログイン
// ============================================

function openAdminLogin() {
  if (save.admin) {
    openAdmin();
    return;
  }

  showModal(
    "管理人ログイン",
    `
      <p>管理人パスワードを入力してください。</p>
      <input
        id="adminPasswordInput"
        type="password"
        placeholder="パスワード"
        autocomplete="off"
      >
      <p id="adminLoginError"
         style="color:#ff8f9d"></p>
    `,
    [
      {
        text: "ログイン",
        fn: () => {
          const input = document.getElementById(
            "adminPasswordInput"
          );

          if (input.value === ADMIN_PASSWORD) {
            save.admin = true;

            if (!Number.isFinite(save.adminBest)) {
              save.adminBest = ADMIN_DEFAULT_BEST;
            }

            persist();
            closeModal();
            openAdmin();
          } else {
            document.getElementById(
              "adminLoginError"
            ).textContent =
              "パスワードが違います。";
          }
        }
      },
      {
        text: "キャンセル",
        fn: closeModal
      }
    ]
  );
}

// ============================================
// スマホの隠し操作
// Aurora 5回 → Gold 4回
// ============================================

let adminTapStep = 0;
let adminTapCount = 0;

function checkAdminTap(category, id) {
  if (category !== "block") {
    resetAdminTap();
    return;
  }

  // Auroraを購入済みなら使用不可
  if (save.owned.block.includes("b11")) {
    resetAdminTap();
    return;
  }

  if (adminTapStep === 0) {
    if (id === "b11") {
      adminTapCount++;

      if (adminTapCount >= 5) {
        adminTapStep = 1;
        adminTapCount = 0;
      }
    } else {
      resetAdminTap();
    }
    return;
  }

  if (adminTapStep === 1) {
    if (id === "b10") {
      adminTapCount++;

      if (adminTapCount >= 4) {
        resetAdminTap();
        openAdminLogin();
      }
    } else {
      resetAdminTap();
    }
  }
}

function resetAdminTap() {
  adminTapStep = 0;
  adminTapCount = 0;
}

// ============================================
// PCの隠し操作
// ホーム画面で kk2556739
// ============================================

const ADMIN_KEY_SEQUENCE = "kk2556739";
let adminKeyBuffer = "";

window.addEventListener("keydown", event => {
  const home = document.getElementById("home");
  const modal = document.getElementById("modal");

  if (
    !home.classList.contains("active") ||
    !modal.classList.contains("hidden")
  ) {
    return;
  }

  if (
    event.target instanceof HTMLElement &&
    event.target.matches("input,textarea")
  ) {
    return;
  }

  if (event.key.length !== 1) {
    return;
  }

  adminKeyBuffer += event.key.toLowerCase();

  adminKeyBuffer = adminKeyBuffer.slice(
    -ADMIN_KEY_SEQUENCE.length
  );

  if (adminKeyBuffer === ADMIN_KEY_SEQUENCE) {
    adminKeyBuffer = "";
    openAdminLogin();
  }
});

// ============================================
// 数値の入力チェック
// ============================================

function readAdminNumber(id) {
  const input = document.getElementById(id);

  if (!input || input.value.trim() === "") {
    alert("数値を入力してください。");
    return null;
  }

  const value = Number(input.value);

  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    alert("0以上の整数を入力してください。");
    return null;
  }

  return value;
}

// ============================================
// 管理人設定画面
// ============================================

function openAdmin() {
  if (!save.admin) {
    openAdminLogin();
    return;
  }

  showModal(
    "管理人設定",
    `
      <p>管理人モードが有効です。</p>

      <h3>💎 ポイント管理</h3>

      <p>
        現在の所持ポイント：
        <b>${save.points.toLocaleString()} P</b>
      </p>

      <input
        id="adminPointsInput"
        type="number"
        min="0"
        step="1"
        placeholder="ポイント数を入力"
      >

      <p>
        「追加」は現在のポイントに加算、
        「設定」は入力した数値に変更します。
      </p>

      <hr>

      <h3>🏆 管理人専用最高スコア</h3>

      <input
        id="adminBestInput"
        type="number"
        min="0"
        step="1"
        value="${save.adminBest}"
      >

      <p>
        管理人モード中はショップの商品を
        ポイントを使わず装備できます。
      </p>

      <p>
        ※変更内容はこのブラウザに保存されます。
      </p>
    `,
    [
      {
        text: "ポイント追加",
        fn: () => {
          const value = readAdminNumber(
            "adminPointsInput"
          );

          if (value === null) return;

          if (
            !Number.isSafeInteger(
              save.points + value
            )
          ) {
            alert("ポイント数が大きすぎます。");
            return;
          }

          save.points += value;
          persist();
          openAdmin();
        }
      },
      {
        text: "ポイント設定",
        fn: () => {
          const value = readAdminNumber(
            "adminPointsInput"
          );

          if (value === null) return;

          save.points = value;
          persist();
          openAdmin();
        }
      },
      {
        text: "スコア保存",
        fn: () => {
          const value = readAdminNumber(
            "adminBestInput"
          );

          if (value === null) return;

          save.adminBest = value;
          persist();
          openAdmin();
        }
      },
      {
        text: "ログアウト",
        fn: () => {
          save.admin = false;
          persist();

          closeModal();
          renderShop();
        }
      },
      {
        text: "閉じる",
        fn: closeModal
      }
    ]
  );
}
