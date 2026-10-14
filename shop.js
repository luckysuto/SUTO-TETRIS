
"use strict";

// ============================================
// SUTO-TETRIS（すとてと）
// ショップ・ポイント・着せ替え管理
// ============================================

// セーブデータの読み込み
const SAVE_KEY = "suto_tetris_save_v1";

const DEFAULT_SAVE = {
  points: 0,
  best: 0,
  sound: true,

  owned: {
    block: ["b0"],
    background: ["g0"],
    frame: ["f0"],
    effect: ["e0"]
  },

  equipped: {
    block: "b0",
    background: "g0",
    frame: "f0",
    effect: "e0"
  },

  admin: false,
  adminBest: 69843681
};

function loadSave() {
  let stored = {};

  try {
    stored = JSON.parse(
      localStorage.getItem(SAVE_KEY) || "{}"
    );
  } catch (error) {
    stored = {};
  }

  return {
    ...DEFAULT_SAVE,
    ...stored,

    owned: {
      ...DEFAULT_SAVE.owned,
      ...(stored.owned || {})
    },

    equipped: {
      ...DEFAULT_SAVE.equipped,
      ...(stored.equipped || {})
    }
  };
}

let save = loadSave();

function persist() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(save)
    );
  } catch (error) {
    console.warn("セーブできませんでした", error);
  }

  updateWallet();
}

function updateWallet() {
  const text =
    "💎 " +
    Math.floor(save.points).toLocaleString() +
    " P";

  const wallet = document.getElementById("wallet");
  const shopWallet = document.getElementById("shopWallet");
  const homeBest = document.getElementById("homeBest");

  if (wallet) {
    wallet.textContent = text;
  }

  if (shopWallet) {
    shopWallet.textContent = text;
  }

  if (homeBest) {
    homeBest.textContent =
      save.best.toLocaleString();
  }
}

// ============================================
// 商品データ
// ============================================

const SHOP_ITEMS = {

  block: [
    {
      id: "b0",
      name: "Classic",
      price: 0,
      color: "#4f9bff",
      description: "定番のカラフルなブロック。"
    },
    {
      id: "b1",
      name: "Pastel",
      price: 1000,
      color: "#ffb8d8",
      description: "優しいパステルカラー。"
    },
    {
      id: "b2",
      name: "Neon",
      price: 5000,
      color: "#00f5ff",
      description: "鮮やかに光るネオン。"
    },
    {
      id: "b3",
      name: "Crystal",
      price: 10000,
      color: "#b0f3ff",
      description: "透明感のあるクリスタル。"
    },
    {
      id: "b4",
      name: "Magma",
      price: 15000,
      color: "#ff4b22",
      description: "溶岩をイメージした赤いブロック。"
    },
    {
      id: "b5",
      name: "Wood",
      price: 20000,
      color: "#a66b3d",
      description: "木目調の落ち着いたデザイン。"
    },
    {
      id: "b6",
      name: "Digital",
      price: 25000,
      color: "#29ff9a",
      description: "デジタル回路風のデザイン。"
    },
    {
      id: "b7",
      name: "Dark",
      price: 30000,
      color: "#40465c",
      description: "暗く重厚なブロック。"
    },
    {
      id: "b8",
      name: "Bronze",
      price: 25000,
      color: "#c6814b",
      description: "ブロンズの金属光沢。"
    },
    {
      id: "b9",
      name: "Silver",
      price: 50000,
      color: "#d5e0ed",
      description: "輝くシルバーブロック。"
    },
    {
      id: "b10",
      name: "Gold",
      price: 75000,
      color: "#ffd65e",
      description: "豪華なゴールドブロック。"
    },
    {
      id: "b11",
      name: "Aurora",
      price: 100000,
      color: "#9e91ff",
      description: "最高級のオーロラブロック。"
    }
  ],

  background: [
    {
      id: "g0",
      name: "Blue Sky",
      price: 0,
      color: "#4a9cf2",
      other: "#b8e4ff",
      description: "柔らかい青空の背景。"
    },
    {
      id: "g1",
      name: "Sunset",
      price: 1000,
      color: "#ff925c",
      other: "#bb5edc",
      description: "夕焼けのグラデーション。"
    },
    {
      id: "g2",
      name: "Stars",
      price: 5000,
      color: "#243c89",
      other: "#7058bf",
      description: "星空をイメージした背景。"
    },
    {
      id: "g3",
      name: "Forest",
      price: 10000,
      color: "#176c54",
      other: "#7fb986",
      description: "深い森の緑。"
    },
    {
      id: "g4",
      name: "Deep Sea",
      price: 15000,
      color: "#064a8a",
      other: "#03284c",
      description: "深海の静かな青。"
    },
    {
      id: "g5",
      name: "Sakura",
      price: 20000,
      color: "#f3a3c8",
      other: "#bba8f5",
      description: "桜色の柔らかい背景。"
    },
    {
      id: "g6",
      name: "Cyber",
      price: 25000,
      color: "#00bca8",
      other: "#4936c6",
      description: "近未来のサイバー空間。"
    },
    {
      id: "g7",
      name: "Monochrome",
      price: 30000,
      color: "#454c61",
      other: "#a5acbd",
      description: "白黒を基調とした背景。"
    },
    {
      id: "g8",
      name: "Bronze",
      price: 20000,
      color: "#a66b45",
      other: "#4e2b22",
      description: "ブロンズの高級感。"
    },
    {
      id: "g9",
      name: "Silver",
      price: 45000,
      color: "#9caec6",
      other: "#4d5b78",
      description: "銀色の幻想的な空間。"
    },
    {
      id: "g10",
      name: "Gold",
      price: 70000,
      color: "#e8bd55",
      other: "#78531b",
      description: "黄金に包まれた背景。"
    },
    {
      id: "g11",
      name: "Aurora",
      price: 95000,
      color: "#61d9d1",
      other: "#ad65f0",
      description: "オーロラの柔らかい光。"
    }
  ],

  frame: [
    {
      id: "f0",
      name: "Simple",
      price: 0,
      color: "#5d8dff",
      description: "標準のシンプルな枠。"
    },
    {
      id: "f1",
      name: "Neon",
      price: 1000,
      color: "#00eaff",
      description: "青く発光するネオン枠。"
    },
    {
      id: "f2",
      name: "Wood",
      price: 5000,
      color: "#9d6a45",
      description: "木製の温かい枠。"
    },
    {
      id: "f3",
      name: "Stone",
      price: 10000,
      color: "#8892a4",
      description: "石をイメージした枠。"
    },
    {
      id: "f4",
      name: "Ice",
      price: 15000,
      color: "#8beaff",
      description: "氷のような透明感。"
    },
    {
      id: "f5",
      name: "Fire",
      price: 20000,
      color: "#ff6333",
      description: "炎のような赤い枠。"
    },
    {
      id: "f6",
      name: "Future",
      price: 25000,
      color: "#65ffc7",
      description: "未来的な発光デザイン。"
    },
    {
      id: "f7",
      name: "Diamond",
      price: 30000,
      color: "#c5f3ff",
      description: "ダイヤモンド風の枠。"
    },
    {
      id: "f8",
      name: "Bronze",
      price: 15000,
      color: "#bf824d",
      description: "ブロンズの金属枠。"
    },
    {
      id: "f9",
      name: "Silver",
      price: 40000,
      color: "#cdd8e8",
      description: "銀色に輝く枠。"
    },
    {
      id: "f10",
      name: "Gold",
      price: 65000,
      color: "#ffdb72",
      description: "金色の豪華な枠。"
    },
    {
      id: "f11",
      name: "Aurora",
      price: 90000,
      color: "#ab8aff",
      description: "オーロラが輝く最高級の枠。"
    }
  ],

  effect: [
    {
      id: "e0",
      name: "Normal",
      price: 0,
      color: "#ffffff",
      description: "標準のライン消去エフェクト。"
    },
    {
      id: "e1",
      name: "Spark",
      price: 1000,
      color: "#ffe58a",
      description: "小さな光が飛び散る。"
    },
    {
      id: "e2",
      name: "Flame",
      price: 5000,
      color: "#ff672e",
      description: "炎のような光が広がる。"
    },
    {
      id: "e3",
      name: "Ice",
      price: 10000,
      color: "#9beeff",
      description: "冷たい氷のきらめき。"
    },
    {
      id: "e4",
      name: "Thunder",
      price: 15000,
      color: "#f6e95b",
      description: "稲妻をイメージした光。"
    },
    {
      id: "e5",
      name: "Rainbow",
      price: 25000,
      color: "#fa79d2",
      description: "虹色に輝くエフェクト。"
    },
    {
      id: "e6",
      name: "Galaxy",
      price: 50000,
      color: "#7959ff",
      description: "銀河のような幻想的な光。"
    },
    {
      id: "e7",
      name: "Aurora Burst",
      price: 95000,
      color: "#65e6dd",
      description: "最高級のオーロラ演出。"
    }
  ]
};

// ============================================
// 商品取得
// ============================================

function getItem(category, id) {
  return (
    SHOP_ITEMS[category]?.find(
      item => item.id === id
    ) ||
    SHOP_ITEMS[category]?.[0]
  );
}

function isOwned(category, id) {
  return (
    save.owned[category].includes(id) ||
    save.admin === true
  );
}

function isEquipped(category, id) {
  return save.equipped[category] === id;
}

// ============================================
// ショップ表示
// ============================================

let currentCategory = "block";
let selectedItem = null;

function renderShop() {
  const container = document.getElementById("items");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  document.querySelectorAll(
    "#tabs [data-category]"
  ).forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.category === currentCategory
    );
  });

  for (const item of SHOP_ITEMS[currentCategory]) {
    const card = document.createElement("button");

    card.className = "shop-item";

    if (selectedItem === item.id) {
      card.classList.add("selected");
    }

    const preview = document.createElement("div");
    preview.className = "shop-preview";

    const skin = document.createElement("div");
    skin.className = "skin-preview";

    skin.style.background =
      currentCategory === "background"
        ? `linear-gradient(135deg,
            ${item.color},
            ${item.other || "#111a3c"})`
        : item.color;

    if (
      currentCategory === "block" ||
      currentCategory === "frame"
    ) {
      skin.style.border =
        `4px solid ${item.color}`;
    }

    if (currentCategory === "effect") {
      skin.style.borderRadius = "50%";
      skin.style.boxShadow =
        `0 0 25px ${item.color}`;
    }

    preview.appendChild(skin);

    const name = document.createElement("strong");
    name.textContent = item.name;

    const price = document.createElement("span");
    price.className = "shop-price";

    if (isEquipped(currentCategory, item.id)) {
      price.textContent = "装備中";
    } else if (isOwned(currentCategory, item.id)) {
      price.textContent = "購入済み";
    } else {
      price.textContent =
        item.price.toLocaleString() + " P";
    }

    card.append(
      preview,
      name,
      price
    );

    card.onclick = () => {
      selectedItem = item.id;

      // 管理人モードの隠し操作
      if (
        typeof checkAdminTap === "function"
      ) {
        checkAdminTap(currentCategory, item.id);
      }

      renderShop();
      showShopDetail(item);
    };

    container.appendChild(card);
  }

  updateWallet();
}

// ============================================
// 商品詳細・購入・装備
// ============================================

function showShopDetail(item) {
  const detail = document.getElementById("shopDetail");
  const category = currentCategory;

  detail.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = item.name;

  const description = document.createElement("p");
  description.textContent = item.description;

  const price = document.createElement("p");
  price.textContent =
    "価格：" +
    item.price.toLocaleString() +
    " P";

  detail.append(
    title,
    description,
    price
  );

  const button = document.createElement("button");

  if (isEquipped(category, item.id)) {
    button.textContent = "装備中";
    button.disabled = true;

  } else if (isOwned(category, item.id)) {
    button.textContent = "装備する";

    button.onclick = () => {
      equipItem(category, item.id);
    };

  } else {
    button.textContent = "購入する";

    button.onclick = () => {
      buyItem(category, item.id);
    };
  }

  detail.appendChild(button);
}

// ============================================
// 購入
// ============================================

function buyItem(category, id) {
  const item = getItem(category, id);

  if (!item || isOwned(category, id)) {
    return;
  }

  if (save.points < item.price) {
    alert("ポイントが足りません！");
    return;
  }

  save.points -= item.price;

  if (!save.owned[category].includes(id)) {
    save.owned[category].push(id);
  }

  save.equipped[category] = id;

  persist();
  applyCosmetics();
  renderShop();
  showShopDetail(item);
}

// ============================================
// 装備
// ============================================

function equipItem(category, id) {
  if (!isOwned(category, id)) {
    return;
  }

  save.equipped[category] = id;

  persist();
  applyCosmetics();
  renderShop();

  const item = getItem(category, id);

  if (item) {
    showShopDetail(item);
  }
}

// ============================================
// カテゴリー切り替え
// ============================================

document.querySelectorAll(
  "#tabs [data-category]"
).forEach(button => {
  button.onclick = () => {
    currentCategory = button.dataset.category;
    selectedItem = null;

    renderShop();

    document.getElementById("shopDetail")
      .textContent = "商品を選んでください";
  };
});

// ============================================
// 初期設定
// ============================================

updateWallet();
