
"use strict";

// ============================================
// SUTO-TETRIS（すとてと）
// 管理人モード
// ============================================

// ※注意
// GitHub Pagesだけで動くため、
// このパスワードは本当の秘密にはできません。
// ブラウザの開発者ツールから確認できます。
// 重要なデータの保護には使わないでください。

const ADMIN_PASSWORD = "ADMIN";

// 管理人専用の初期最高スコア
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

  // Aurora購入済みなら隠し操作は使用不可
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
// ホーム画面で kk2556739 と入力
// ============================================

const ADMIN_KEY_SEQUENCE = "kk2556739";
let adminKeyBuffer = "";

window.addEventListener("keydown", event => {
  // ホーム画面以外では反応しない
  const home = document.getElementById("home");

  if (!home.classList.contains("active")) {
    return;
  }

  // ポップアップ表示中は反応しない
  if (
    !document.getElementById("modal")
      .classList.contains("hidden")
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

      <p>
        管理人専用最高スコア
      </p>

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
        この専用スコアは通常プレイヤーの
        記録には表示されません。
      </p>
    `,
    [
      {
        text: "スコアを保存",
        fn: () => {
          const input = document.getElementById(
            "adminBestInput"
          );

          const value = Number(input.value);

          if (
            !Number.isSafeInteger(value) ||
            value < 0
          ) {
            alert("0以上の整数を入力してください。");
            return;
          }

          save.adminBest = value;
          persist();

          closeModal();
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
