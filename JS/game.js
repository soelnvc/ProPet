/* --- CONFIGURATION & STATE --- */
let timeLeft = 0;
let duration = 0;
let timerInterval = null;
let currentTier = 1;
let currentPetType = "";
let isPaused = false;

const ASSETS = {
  cat: {
    folder: "assets/Cats",
    stages: ["Baby.png", "Teen.png", "Adult.png", "Mega.png"],
  },
  dog: {
    folder: "assets/Dogs",
    stages: ["Baby.png", "Teen.png", "Adult.png", "Mega.png"],
  },
  dragon: {
    folder: "assets/Dragon",
    stages: ["Baby.png", "Teen.png", "Adult.png", "Mega.png"],
  },
  lion: {
    folder: "assets/Lions",
    stages: ["Baby.png", "Teen.png", "Adult.png", "Mega.png"],
  },
  eggs: {
    1: "assets/eggs/normal_egg.png",
    2: "assets/eggs/epic_egg.png",
    3: "assets/eggs/legendary_egg.png",
  },
};

const screens = {
  selection: document.getElementById("screen-selection"),
  active: document.getElementById("screen-active"),
  victory: document.getElementById("screen-victory"),
  collection: document.getElementById("screen-collection"),
};

const ui = {
  timer: document.getElementById("timer-display"),
  bar: document.getElementById("growth-bar"),
  petImg: document.getElementById("pet-display"),
  stageName: document.getElementById("pet-stage-name"),
  body: document.body,
};

/* --- NAVIGATION & UI --- */
function handleNavClick() {
  if (screens.collection.classList.contains("active-screen")) {
    switchScreen("selection");
  } else {
    openCollection();
  }
}

function switchScreen(screenName) {
  Object.values(screens).forEach((s) => {
    if (s) {
      s.classList.remove("active-screen");
      s.classList.add("hidden");
      s.style.display = "none";
    }
  });

  const target = screens[screenName];
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active-screen");
    target.style.display = "flex";
  }

  const header = document.querySelector("header");
  const logo = document.querySelector(".logo");
  const btn = document.getElementById("collection-btn");

  if (screenName === "selection") {
    header.style.display = "flex";
    logo.style.display = "block";
    btn.innerText = "My Pets";
    btn.style.display = "block";
  } else if (screenName === "collection") {
    header.style.display = "flex";
    logo.style.display = "none";
    btn.innerText = "Home";
    btn.style.display = "block";
  } else {
    header.style.display = "none";
  }
}

function selectTier(tier) {
  currentTier = tier;
  document
    .querySelectorAll(".egg-card")
    .forEach((card) => card.classList.remove("selected"));
  const cards = document.querySelectorAll(".egg-card");
  if (cards[tier - 1]) cards[tier - 1].classList.add("selected");
}

/* --- GAME LOGIC --- */
function startProPet() {
  const hrsInput = document.getElementById("hours-input");
  const minsInput = document.getElementById("minutes-input");

  let hrs = parseInt(hrsInput.value) || 0;
  let mins = parseInt(minsInput.value) || 0;
  const totalMinutes = hrs * 60 + mins;

  // Validation Rules
  let minRequired = 0;
  if (currentTier === 3) minRequired = 180;
  else if (currentTier === 2) minRequired = 60;
  else minRequired = 15;

  if (totalMinutes < minRequired) {
    alert(`Minimum focus time for this egg is ${minRequired} minutes.`);
    return;
  }

  if (totalMinutes > 720) {
    alert("Maximum focus time is 12 hours!");
    return;
  }

  determinePet();
  applyTheme();

  ui.petImg.src = ASSETS.eggs[currentTier];
  ui.stageName.innerText = "Incubation Phase";

  switchScreen("active");

  duration = totalMinutes * 60;
  timeLeft = duration;
  isPaused = false;
  updateDisplay(0);

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(gameLoop, 1000);
}

function determinePet() {
  if (currentTier === 1) currentPetType = Math.random() > 0.5 ? "cat" : "dog";
  else if (currentTier === 2) currentPetType = "lion";
  else currentPetType = "dragon";
}

function applyTheme() {
  ui.body.className = `theme-${currentPetType}`;
}

function gameLoop() {
  if (isPaused) return;

  timeLeft--;
  const progress = ((duration - timeLeft) / duration) * 100;
  updateDisplay(progress);

  if (timeLeft <= 0) finishGame();
}

function updateDisplay(progress) {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  ui.timer.innerText = `${m}:${s < 10 ? "0" + s : s}`;
  ui.bar.style.width = `${progress}%`;

  const petData = ASSETS[currentPetType];

  if (progress >= 25 && progress < 50) {
    setStage(petData.folder + "/" + petData.stages[0], "Baby Phase");
  } else if (progress >= 50 && progress < 75) {
    setStage(petData.folder + "/" + petData.stages[1], "Teen Phase");
  } else if (progress >= 75) {
    setStage(petData.folder + "/" + petData.stages[2], "Adult Phase");
  }
}

function setStage(imgSrc, text) {
  if (!ui.petImg.src.includes(imgSrc)) {
    ui.petImg.src = imgSrc;
    ui.stageName.innerText = text;
    playLevelUpSound();
  }
}

function playLevelUpSound() {
  try {
    const audio = new Audio("assets/sounds/levelup.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {}
}

/* --- COMPLETION & UTILS --- */
function finishGame() {
  clearInterval(timerInterval);
  const minutesCompleted = duration / 60;

  if (typeof logSession === "function")
    logSession(minutesCompleted, currentPetType);

  const petName =
    currentPetType.charAt(0).toUpperCase() + currentPetType.slice(1);
  document.getElementById(
    "reward-pet-name"
  ).innerText = `You raised a ${petName}!`;
  document.getElementById("reward-pet-img").src =
    ASSETS[currentPetType].folder + "/" + ASSETS[currentPetType].stages[2];

  switchScreen("victory");
}

function giveUp() {
  if (confirm("Are you sure? Your pet will be lost!")) {
    clearInterval(timerInterval);
    switchScreen("selection");
    ui.body.className = "theme-default";
  }
}

function resetApp() {
  switchScreen("selection");
  ui.body.className = "theme-default";
}

/* --- COLLECTION SYSTEM --- */
function openCollection() {
  renderCollection();
  switchScreen("collection");
}

function renderCollection() {
  const mainContainer = document.getElementById("collection-grid");
  if (!mainContainer) return;

  mainContainer.innerHTML = "";
  const data = loadData();
  const inventory = {};

  if (data.petsUnlocked) {
    data.petsUnlocked.forEach((p) => {
      if (!inventory[p.type]) inventory[p.type] = { normal: 0, mega: 0 };
      if (p.isMega) inventory[p.type].mega++;
      else inventory[p.type].normal++;
    });
  }

  const tiers = [
    { title: "Common Tier (15-59 Mins)", pets: ["cat", "dog"] },
    { title: "Epic Tier (1-3 Hours)", pets: ["lion"] },
    { title: "Legendary Tier (3+ Hours)", pets: ["dragon"] },
  ];

  tiers.forEach((tier, index) => {
    const section = document.createElement("div");
    section.className = "tier-section";
    section.innerHTML = `<div class="tier-header">${tier.title}</div>`;

    const grid = document.createElement("div");
    grid.className = "tier-grid";

    tier.pets.forEach((petType) => {
      if (!ASSETS[petType]) return;

      const petData = ASSETS[petType];
      const stats = inventory[petType] || { normal: 0, mega: 0 };

      // 1. Normal Card
      const normalCard = document.createElement("div");
      normalCard.className = `pet-card ${stats.normal > 0 ? "" : "locked"}`;
      const normalImg = petData.folder + "/" + petData.stages[2];
      const displayName = petType.charAt(0).toUpperCase() + petType.slice(1);

      let evolveBtnHTML = "";
      if (stats.normal >= 3) {
        evolveBtnHTML = `<button class="evolve-btn" onclick="triggerEvolution('${petType}')">⚡ EVOLVE</button>`;
      }

      normalCard.innerHTML = `
                <img src="${normalImg}" alt="${petType}">
                <h3>${displayName}</h3>
                <span class="pet-count">Owned: ${stats.normal}</span>
                ${evolveBtnHTML}
            `;
      grid.appendChild(normalCard);

      // 2. Mega Card
      const megaCard = document.createElement("div");
      megaCard.className = `pet-card ${
        stats.mega > 0 ? "mega-card-unlocked" : "locked"
      }`;
      const megaImg = petData.folder + "/" + petData.stages[3];

      megaCard.innerHTML = `
                <img src="${megaImg}" alt="Mega ${petType}" class="${
        stats.mega > 0 ? "glow-mega" : ""
      }">
                <h3 class="mega-title">Mega ${displayName}</h3>
                <span class="pet-count">Owned: ${stats.mega}</span>
            `;
      grid.appendChild(megaCard);
    });

    section.appendChild(grid);
    mainContainer.appendChild(section);

    if (index < tiers.length - 1) {
      const separator = document.createElement("div");
      separator.className = "tier-separator";
      mainContainer.appendChild(separator);
    }
  });
}

function triggerEvolution(petType) {
  const evoScreen = document.getElementById("screen-evolution");
  const stage = document.querySelector(".fusion-stage");
  const resultBox = document.getElementById("fusion-result");

  stage.classList.remove("fusion-active");
  resultBox.classList.add("hidden");
  resultBox.style.display = "none";

  const petData = ASSETS[petType];
  const normalImg = petData.folder + "/" + petData.stages[2];

  document.querySelectorAll(".sacrificial-pet").forEach((div) => {
    div.style.backgroundImage = `url('${normalImg}')`;
  });

  evoScreen.style.display = "flex";
  evoScreen.classList.add("active-screen");

  setTimeout(() => {
    stage.classList.add("fusion-active");
    fusePets(petType);
  }, 500);

  setTimeout(() => {
    const megaImg = petData.folder + "/" + petData.stages[3];
    document.getElementById("mega-reveal-img").src = megaImg;
    document.getElementById(
      "mega-reveal-name"
    ).innerText = `MEGA ${petType.toUpperCase()}!`;
    resultBox.style.display = "flex";
    resultBox.classList.remove("hidden");
  }, 2500);
}

function closeEvolution() {
  const evoScreen = document.getElementById("screen-evolution");
  evoScreen.style.display = "none";
  evoScreen.classList.remove("active-screen");
  renderCollection();
}

/* --- TAB PROTECTION --- */
document.addEventListener("visibilitychange", () => {
  if (
    document.hidden &&
    screens.active &&
    screens.active.classList.contains("active-screen")
  ) {
    isPaused = true;
    document.getElementById("warning-overlay")?.classList.remove("hidden");
    document.title = "⚠️ COME BACK!";
  } else {
    isPaused = false;
    document.getElementById("warning-overlay")?.classList.add("hidden");
    document.title = "ProPet";
  }
});
