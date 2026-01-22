/* --- STORAGE MODULE --- */

const DB_KEY = "ProPet_Data_v1";

const defaultState = {
  streak: 0,
  lastLoginDate: null,
  totalMinutes: 0,
  petsUnlocked: [],
};

/* --- CORE DATA MANAGEMENT --- */
function loadData() {
  const raw = localStorage.getItem(DB_KEY);
  return raw ? JSON.parse(raw) : defaultState;
}

function saveData(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
  updateStreakUI(data);
}

/* --- STREAK SYSTEM --- */
function checkStreak() {
  let data = loadData();
  const today = new Date().toDateString();

  // First login ever
  if (!data.lastLoginDate) {
    data.streak = 1;
    data.lastLoginDate = today;
    saveData(data);
    return;
  }

  // Already logged in today
  if (data.lastLoginDate === today) {
    updateStreakUI(data);
    return;
  }

  // Check consecutive days
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (data.lastLoginDate === yesterday.toDateString()) {
    data.streak++;
  } else {
    data.streak = 1; // Streak broken
  }

  data.lastLoginDate = today;
  saveData(data);
}

function updateStreakUI(data) {
  const display = document.getElementById("streak-display");
  if (display) {
    display.classList.remove("hidden");
    display.innerHTML = `🔥 Day ${data.streak}`;
  }
}

/* --- SESSION LOGGING --- */
function logSession(minutes, petType) {
  let data = loadData();
  data.totalMinutes += minutes;
  data.petsUnlocked.push({
    type: petType,
    date: new Date().toDateString(),
    isMega: false,
  });
  saveData(data);
  console.log("Session Saved:", data);
}

/* --- EVOLUTION SYSTEM --- */
function canEvolve(petType) {
  const data = loadData();
  const count = data.petsUnlocked.filter(
    (p) => p.type === petType && !p.isMega
  ).length;
  return count >= 3;
}

function fusePets(petType) {
  let data = loadData();
  let indicesToRemove = [];

  // Identify 3 normal pets to sacrifice
  data.petsUnlocked.forEach((p, index) => {
    if (p.type === petType && !p.isMega && indicesToRemove.length < 3) {
      indicesToRemove.push(index);
    }
  });

  if (indicesToRemove.length < 3) return false;

  // Remove sacrifices and add Mega
  data.petsUnlocked = data.petsUnlocked.filter(
    (_, index) => !indicesToRemove.includes(index)
  );

  data.petsUnlocked.push({
    type: petType,
    isMega: true,
    date: new Date().toDateString(),
  });

  saveData(data);
  return true;
}

// Initialize on load
document.addEventListener("DOMContentLoaded", checkStreak);
