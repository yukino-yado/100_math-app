import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

/*
  Firebase Consoleからコピーした設定に置き換えてください。
*/
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1DwKuag7tuKC75aGWYq4AszDSJHONdy0",
  authDomain: "math-app-89b47.firebaseapp.com",
  projectId: "math-app-89b47",
  storageBucket: "math-app-89b47.firebasestorage.app",
  messagingSenderId: "908293875104",
  appId: "1:908293875104:web:f4779d37faeae2e31830c5",
  measurementId: "G-FEG9WC237V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const GRID_SIZE = 10;
const PENALTY_SECONDS = 5;

const GRADES = ["小3", "小4", "小5", "小6", "中1", "中2", "中3"];

const DIFFICULTIES = {
  easy: "やさしい",
  normal: "ふつう",
  hard: "むずかしい"
};

const OPERATION_NAMES = {
  add: "➕ たし算",
  sub: "➖ ひき算",
  mul: "✖️ かけ算",
  div: "➗ わり算"
};

const OPERATION_SYMBOLS = {
  add: "+",
  sub: "-",
  mul: "×",
  div: "÷"
};

const AVATAR_REWARDS = [
  { avatar: "🐰", required: 0 },
  { avatar: "🐱", required: 10 },
  { avatar: "🐶", required: 20 },
  { avatar: "🐼", required: 30 },
  { avatar: "🐻", required: 40 },
  { avatar: "🦊", required: 50 },
  { avatar: "🐹", required: 60 },
  { avatar: "🐨", required: 70 },
  { avatar: "🐧", required: 80 },
  { avatar: "🐥", required: 90 },
  { avatar: "🐢", required: 100 },
  { avatar: "🦁", required: 110 },
  { avatar: "🐯", required: 120 },
  { avatar: "🐮", required: 130 },
  { avatar: "🐷", required: 140 },
  { avatar: "🐸", required: 150 },
  { avatar: "🐵", required: 160 },
  { avatar: "🦄", required: 170 }
];

const THEME_REWARDS = [
  { key: "pastel", name: "パステル", required: 0 },
  { key: "sakura", name: "さくら", required: 5 },
  { key: "sky", name: "そら", required: 10 },
  { key: "mint", name: "ミント", required: 15 },
  { key: "lemon", name: "レモン", required: 20 },
  { key: "lavender", name: "ラベンダー", required: 25 },
  { key: "peach", name: "ピーチ", required: 30 },
  { key: "soda", name: "クリームソーダ", required: 35 },
  { key: "night", name: "夜空", required: 40 },
  { key: "chocomint", name: "チョコミント", required: 45 },
  { key: "candy", name: "キャンディ", required: 50 },
  { key: "orange", name: "オレンジ", required: 55 },
  { key: "bluegray", name: "ブルーグレー", required: 60 },
  { key: "green", name: "グリーン", required: 65 },
  { key: "pinkpurple", name: "ピンクパープル", required: 70 }
];

const BLOCKED_WORDS = [
  "死ね", "殺す", "消えろ", "うざい", "キモい", "きもい",
  "バカ", "ばか", "アホ", "あほ", "クソ", "くそ",
  "黙れ", "だまれ", "fuck", "shit"
];

let currentUser = null;
let currentProfile = null;
let draftProfile = null;

let selectedRegisterAvatar = "🐰";
let selectedOperation = null;
let selectedDifficulty = null;

let currentRankingOperation = "add";
let currentRankingDifficulty = "easy";
let currentRankingGrade = "all";

let previousScreenBeforeTutorial = "home";

const state = {
  operation: null,
  difficulty: null,
  symbol: "",
  rowNumbers: [],
  colNumbers: [],
  answers: [],
  correctAnswers: [],
  selectedCell: null,
  startTime: null,
  timerInterval: null,
  elapsedSeconds: 0,
  lastRecord: null,
  isCountingDown: false
};

const screens = {
  loading: document.getElementById("loadingScreen"),
  register: document.getElementById("registerScreen"),
  home: document.getElementById("homeScreen"),
  game: document.getElementById("gameScreen"),
  result: document.getElementById("resultScreen"),
  history: document.getElementById("historyScreen"),
  best: document.getElementById("bestScreen"),
  profileEdit: document.getElementById("profileEditScreen"),
  tutorial: document.getElementById("tutorialScreen")
};

const registerBtn = document.getElementById("registerBtn");
const playerNameInput = document.getElementById("playerNameInput");
const gradeSelect = document.getElementById("gradeSelect");
const statusMessageInput = document.getElementById("statusMessageInput");
const registerMessage = document.getElementById("registerMessage");
const avatarPreview = document.getElementById("avatarPreview");

const homePlayerName = document.getElementById("homePlayerName");
const menuPlayerName = document.getElementById("menuPlayerName");
const homeGrade = document.getElementById("homeGrade");
const menuGrade = document.getElementById("menuGrade");
const homeStatusMessage = document.getElementById("homeStatusMessage");
const menuStatusMessage = document.getElementById("menuStatusMessage");
const homeAvatar = document.getElementById("homeAvatar");
const menuAvatar = document.getElementById("menuAvatar");

const modeButtons = document.querySelectorAll(".mode-btn");

const difficultyModal = document.getElementById("difficultyModal");
const difficultyModalBg = document.getElementById("difficultyModalBg");
const closeDifficultyModalBtn = document.getElementById("closeDifficultyModalBtn");
const difficultyModalTitle = document.getElementById("difficultyModalTitle");
const modalDifficultyButtons = document.querySelectorAll(".modal-difficulty-btn");

const gameBoard = document.getElementById("gameBoard");
const reviewBoard = document.getElementById("reviewBoard");
const historyReviewBoard = document.getElementById("historyReviewBoard");

const operationLabel = document.getElementById("operationLabel");
const difficultyLabel = document.getElementById("difficultyLabel");
const timerDisplay = document.getElementById("timer");

const resultOperationLabel = document.getElementById("resultOperationLabel");
const resultDifficultyLabel = document.getElementById("resultDifficultyLabel");

const correctCountEl = document.getElementById("correctCount");
const mistakeCountEl = document.getElementById("mistakeCount");
const rawTimeEl = document.getElementById("rawTime");
const penaltyTimeEl = document.getElementById("penaltyTime");
const finalTimeEl = document.getElementById("finalTime");
const bestBadge = document.getElementById("bestBadge");
const saveMessage = document.getElementById("saveMessage");

const unlockArea = document.getElementById("unlockArea");
const unlockList = document.getElementById("unlockList");

const reviewArea = document.getElementById("reviewArea");
const showReviewBtn = document.getElementById("showReviewBtn");

const sideMenu = document.getElementById("sideMenu");
const historyList = document.getElementById("historyList");
const historyDetailArea = document.getElementById("historyDetailArea");
const historyDetailText = document.getElementById("historyDetailText");
const bestList = document.getElementById("bestList");

const rankingOperationSelect = document.getElementById("rankingOperationSelect");
const rankingDifficultySelect = document.getElementById("rankingDifficultySelect");
const rankingGradeSelect = document.getElementById("rankingGradeSelect");
const applyRankingFilterBtn = document.getElementById("applyRankingFilterBtn");

const keypad = document.getElementById("keypad");

const finishBtn = document.getElementById("finishBtn");
const retryBtn = document.getElementById("retryBtn");
const backHomeBtn = document.getElementById("backHomeBtn");

const menuBtn = document.getElementById("menuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const sideMenuBg = document.getElementById("sideMenuBg");

const showHistoryBtn = document.getElementById("showHistoryBtn");
const showBestBtn = document.getElementById("showBestBtn");
const changeProfileBtn = document.getElementById("changeProfileBtn");
const showTutorialBtn = document.getElementById("showTutorialBtn");
const showHomeBtn = document.getElementById("showHomeBtn");
const logoutBtn = document.getElementById("logoutBtn");

const historyBackBtn = document.getElementById("historyBackBtn");
const bestBackBtn = document.getElementById("bestBackBtn");
const reloadRankingBtn = document.getElementById("reloadRankingBtn");
const reloadHistoryBtn = document.getElementById("reloadHistoryBtn");

const countdownOverlay = document.getElementById("countdownOverlay");
const countdownText = document.getElementById("countdownText");

const profileBackBtn = document.getElementById("profileBackBtn");
const editAvatarButton = document.getElementById("editAvatarButton");
const editAvatarPreview = document.getElementById("editAvatarPreview");
const profileAvatarPanel = document.getElementById("profileAvatarPanel");
const editAvatarChoices = document.querySelectorAll(".edit-avatar-choice");

const profilePlayCount = document.getElementById("profilePlayCount");
const editProfileNameText = document.getElementById("editProfileNameText");
const editProfileGradeText = document.getElementById("editProfileGradeText");
const editStatusText = document.getElementById("editStatusText");

const editNameGradeBtn = document.getElementById("editNameGradeBtn");
const nameGradeEditPanel = document.getElementById("nameGradeEditPanel");
const editPlayerNameInput = document.getElementById("editPlayerNameInput");
const editGradeSelect = document.getElementById("editGradeSelect");
const applyNameGradeBtn = document.getElementById("applyNameGradeBtn");

const editStatusBtn = document.getElementById("editStatusBtn");
const statusEditPanel = document.getElementById("statusEditPanel");
const editStatusMessageInput = document.getElementById("editStatusMessageInput");
const applyStatusBtn = document.getElementById("applyStatusBtn");

const themeChoices = document.querySelectorAll(".theme-choice");

const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileEditMessage = document.getElementById("profileEditMessage");

const tutorialBackBtn = document.getElementById("tutorialBackBtn");
const finishTutorialBtn = document.getElementById("finishTutorialBtn");

initializeAuth();

function initializeAuth() {
  signInAnonymously(auth).catch(error => {
    console.error(error);
    alert("Firebaseの匿名ログインに失敗しました。設定を確認してください。");
  });

  onAuthStateChanged(auth, async user => {
    try {
      if (!user) return;

      currentUser = user;

      const profile = await fetchProfile();

      if (!profile) {
        switchScreen("register");
        return;
      }

      currentProfile = normalizeProfile(profile);
      applyProfileToScreen();
      resetHomeSelection();
      resetRankingSelects();

      await renderWeeklyRanking();

      if (!currentProfile.hasSeenTutorial) {
        previousScreenBeforeTutorial = "home";
        switchScreen("tutorial");
        return;
      }

      switchScreen("home");
    } catch (error) {
      console.error(error);
      alert("読み込み中にエラーが出ました。\n" + error.message);
      switchScreen("register");
    }
  });
}

registerBtn.addEventListener("click", async () => {
  const name = playerNameInput.value.trim();
  const grade = gradeSelect.value;
  const statusMessage = normalizeStatusMessage(statusMessageInput.value);

  if (!isValidPlayerName(name)) {
    registerMessage.textContent = "1〜12文字で名前を入力してください";
    return;
  }

  if (containsBlockedWord(name)) {
    registerMessage.textContent = "名前に使えない言葉が含まれています";
    return;
  }

  if (!isValidGrade(grade)) {
    registerMessage.textContent = "学年を選んでください";
    return;
  }

  if (!isValidStatusMessage(statusMessage)) {
    registerMessage.textContent = "一言メッセージは24文字以内で入力してください";
    return;
  }

  if (containsBlockedWord(statusMessage)) {
    registerMessage.textContent = "一言メッセージに使えない言葉が含まれています";
    return;
  }

  registerBtn.disabled = true;
  registerMessage.textContent = "登録中...";

  try {
    const profile = {
      playerName: name,
      grade,
      statusMessage,
      avatar: selectedRegisterAvatar,
      selectedTheme: "pastel",
      playCount: 0,
      hasSeenTutorial: false
    };

    await saveProfile(profile);

    currentProfile = normalizeProfile(profile);
    applyProfileToScreen();
    resetHomeSelection();
    resetRankingSelects();

    previousScreenBeforeTutorial = "home";
    switchScreen("tutorial");
  } catch (error) {
    console.error(error);
    registerMessage.textContent = "登録に失敗しました";
  } finally {
    registerBtn.disabled = false;
  }
});

async function fetchProfile() {
  if (!currentUser) return null;

  const profileRef = doc(db, "users", currentUser.uid, "profile", "main");
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) return null;

  return profileSnap.data();
}

async function saveProfile(profile) {
  if (!currentUser) throw new Error("ログインしていません");

  const profileRef = doc(db, "users", currentUser.uid, "profile", "main");

  await setDoc(profileRef, {
    playerName: profile.playerName,
    grade: profile.grade,
    statusMessage: profile.statusMessage,
    avatar: profile.avatar || "🐰",
    selectedTheme: profile.selectedTheme || "pastel",
    playCount: Number(profile.playCount || 0),
    hasSeenTutorial: Boolean(profile.hasSeenTutorial),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function updateProfileAfterGame(newPlayCount) {
  const profileRef = doc(db, "users", currentUser.uid, "profile", "main");

  await setDoc(profileRef, {
    playCount: newPlayCount,
    updatedAt: serverTimestamp()
  }, { merge: true });

  currentProfile.playCount = newPlayCount;
}

async function markTutorialSeen() {
  if (!currentProfile) return;

  currentProfile.hasSeenTutorial = true;

  const profileRef = doc(db, "users", currentUser.uid, "profile", "main");

  await setDoc(profileRef, {
    hasSeenTutorial: true,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function updateMyPublicResultsProfile(profile) {
  if (!currentUser) return;

  const q = query(
    collection(db, "publicResults"),
    where("uid", "==", currentUser.uid)
  );

  const snapshot = await getDocs(q);

  const updates = snapshot.docs.map(docSnap => {
    return setDoc(docSnap.ref, {
      playerName: profile.playerName,
      grade: profile.grade,
      statusMessage: profile.statusMessage,
      avatar: profile.avatar,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });

  await Promise.all(updates);
}

function normalizeProfile(profile) {
  const playCount = Number(profile.playCount || 0);
  const avatar = isUnlockedAvatar(profile.avatar, playCount) ? profile.avatar : "🐰";
  const selectedTheme = isUnlockedTheme(profile.selectedTheme, playCount) ? profile.selectedTheme : "pastel";

  return {
    playerName: profile.playerName || "プレイヤー",
    grade: isValidGrade(profile.grade) ? profile.grade : "小6",
    statusMessage: normalizeStatusMessage(profile.statusMessage || "今日もがんばる！"),
    avatar,
    selectedTheme,
    playCount,
    hasSeenTutorial: Boolean(profile.hasSeenTutorial)
  };
}

function applyProfileToScreen() {
  const name = currentProfile?.playerName || "プレイヤー";
  const avatar = currentProfile?.avatar || "🐰";
  const grade = currentProfile?.grade || "";
  const statusMessage = currentProfile?.statusMessage || "今日もがんばる！";
  const theme = currentProfile?.selectedTheme || "pastel";

  homePlayerName.textContent = name;
  menuPlayerName.textContent = name;

  homeAvatar.textContent = avatar;
  menuAvatar.textContent = avatar;

  homeGrade.textContent = grade;
  menuGrade.textContent = grade;

  homeStatusMessage.textContent = statusMessage;
  menuStatusMessage.textContent = statusMessage;

  homeGrade.classList.toggle("hidden", !grade);
  menuGrade.classList.toggle("hidden", !grade);

  applyTheme(theme);
}

function resetHomeSelection() {
  selectedOperation = null;
  selectedDifficulty = null;

  modeButtons.forEach(button => button.classList.remove("active"));
  closeDifficultyModal();
}

modeButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedOperation = button.dataset.op;
    selectedDifficulty = null;

    modeButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    openDifficultyModal(selectedOperation);
  });
});

modalDifficultyButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (!selectedOperation) return;

    selectedDifficulty = button.dataset.difficulty;

    closeDifficultyModal();

    setTimeout(() => {
      startGame(selectedOperation, selectedDifficulty);
    }, 260);
  });
});

difficultyModalBg.addEventListener("click", closeDifficultyModal);
closeDifficultyModalBtn.addEventListener("click", closeDifficultyModal);

function openDifficultyModal(operation) {
  const operationName = OPERATION_NAMES[operation] || "計算";

  difficultyModalTitle.textContent = `${operationName} の難易度を選ぶ`;

  difficultyModal.classList.remove("hidden");

  requestAnimationFrame(() => {
    difficultyModal.classList.add("open");
  });
}

function closeDifficultyModal() {
  if (!difficultyModal) return;

  difficultyModal.classList.remove("open");

  setTimeout(() => {
    difficultyModal.classList.add("hidden");
  }, 260);
}

function resetRankingSelects() {
  currentRankingOperation = "add";
  currentRankingDifficulty = "easy";
  currentRankingGrade = "all";

  if (rankingOperationSelect) rankingOperationSelect.value = "add";
  if (rankingDifficultySelect) rankingDifficultySelect.value = "easy";
  if (rankingGradeSelect) rankingGradeSelect.value = "all";
}

applyRankingFilterBtn.addEventListener("click", async () => {
  currentRankingOperation = rankingOperationSelect.value;
  currentRankingDifficulty = rankingDifficultySelect.value;
  currentRankingGrade = rankingGradeSelect.value;

  await renderWeeklyRanking();
});

function openProfileEditScreen() {
  if (!currentProfile) return;

  draftProfile = {
    playerName: currentProfile.playerName,
    grade: currentProfile.grade,
    statusMessage: currentProfile.statusMessage,
    avatar: currentProfile.avatar,
    selectedTheme: currentProfile.selectedTheme,
    playCount: currentProfile.playCount,
    hasSeenTutorial: currentProfile.hasSeenTutorial
  };

  profileAvatarPanel.classList.add("hidden");
  nameGradeEditPanel.classList.add("hidden");
  statusEditPanel.classList.add("hidden");
  profileEditMessage.textContent = "";

  syncProfileEditView();
  switchScreen("profileEdit");
}

function syncProfileEditView() {
  if (!draftProfile) return;

  editAvatarPreview.textContent = draftProfile.avatar || "🐰";
  editProfileNameText.textContent = draftProfile.playerName || "プレイヤー";
  editProfileGradeText.textContent = draftProfile.grade || "小6";
  editStatusText.textContent = draftProfile.statusMessage || "今日もがんばる！";
  profilePlayCount.textContent = `${draftProfile.playCount || 0}回`;

  editPlayerNameInput.value = draftProfile.playerName || "";
  editGradeSelect.value = draftProfile.grade || "小6";
  editStatusMessageInput.value = draftProfile.statusMessage || "今日もがんばる！";

  syncAvatarChoices();
  syncThemeChoices();
}

function syncAvatarChoices() {
  const playCount = draftProfile?.playCount || 0;

  editAvatarChoices.forEach(button => {
    const avatar = button.dataset.avatar;
    const required = Number(button.dataset.requiredPlays || 0);
    const unlocked = playCount >= required;

    button.classList.toggle("locked", !unlocked);
    button.classList.toggle("active", avatar === draftProfile.avatar);
  });
}

function syncThemeChoices() {
  const playCount = draftProfile?.playCount || 0;

  themeChoices.forEach(button => {
    const theme = button.dataset.theme;
    const required = Number(button.dataset.requiredPlays || 0);
    const unlocked = playCount >= required;

    button.classList.toggle("locked", !unlocked);
    button.classList.toggle("active", theme === draftProfile.selectedTheme);
  });
}

editAvatarButton.addEventListener("click", () => {
  profileAvatarPanel.classList.toggle("hidden");
  nameGradeEditPanel.classList.add("hidden");
  statusEditPanel.classList.add("hidden");
});

editAvatarChoices.forEach(button => {
  button.addEventListener("click", () => {
    const avatar = button.dataset.avatar;
    const required = Number(button.dataset.requiredPlays || 0);

    if ((draftProfile.playCount || 0) < required) {
      profileEditMessage.textContent = `${required}回プレイすると解放されます`;
      return;
    }

    draftProfile.avatar = avatar;
    profileEditMessage.textContent = "";
    syncProfileEditView();
    profileAvatarPanel.classList.add("hidden");
  });
});

themeChoices.forEach(button => {
  button.addEventListener("click", () => {
    const theme = button.dataset.theme;
    const required = Number(button.dataset.requiredPlays || 0);

    if ((draftProfile.playCount || 0) < required) {
      profileEditMessage.textContent = `${required}回プレイすると解放されます`;
      return;
    }

    draftProfile.selectedTheme = theme;
    profileEditMessage.textContent = "";
    syncProfileEditView();
  });
});

editNameGradeBtn.addEventListener("click", () => {
  nameGradeEditPanel.classList.toggle("hidden");
  profileAvatarPanel.classList.add("hidden");
  statusEditPanel.classList.add("hidden");
  syncProfileEditView();
});

applyNameGradeBtn.addEventListener("click", () => {
  const name = editPlayerNameInput.value.trim();
  const grade = editGradeSelect.value;

  if (!isValidPlayerName(name)) {
    profileEditMessage.textContent = "1〜12文字で名前を入力してください";
    return;
  }

  if (containsBlockedWord(name)) {
    profileEditMessage.textContent = "名前に使えない言葉が含まれています";
    return;
  }

  if (!isValidGrade(grade)) {
    profileEditMessage.textContent = "学年を選んでください";
    return;
  }

  draftProfile.playerName = name;
  draftProfile.grade = grade;

  profileEditMessage.textContent = "";
  nameGradeEditPanel.classList.add("hidden");
  syncProfileEditView();
});

editStatusBtn.addEventListener("click", () => {
  statusEditPanel.classList.toggle("hidden");
  profileAvatarPanel.classList.add("hidden");
  nameGradeEditPanel.classList.add("hidden");
  syncProfileEditView();
});

applyStatusBtn.addEventListener("click", () => {
  const statusMessage = normalizeStatusMessage(editStatusMessageInput.value);

  if (!isValidStatusMessage(statusMessage)) {
    profileEditMessage.textContent = "一言メッセージは24文字以内で入力してください";
    return;
  }

  if (containsBlockedWord(statusMessage)) {
    profileEditMessage.textContent = "一言メッセージに使えない言葉が含まれています";
    return;
  }

  draftProfile.statusMessage = statusMessage;

  profileEditMessage.textContent = "";
  statusEditPanel.classList.add("hidden");
  syncProfileEditView();
});

saveProfileBtn.addEventListener("click", async () => {
  if (!draftProfile) return;

  if (!isValidPlayerName(draftProfile.playerName)) {
    profileEditMessage.textContent = "1〜12文字で名前を入力してください";
    return;
  }

  if (containsBlockedWord(draftProfile.playerName)) {
    profileEditMessage.textContent = "名前に使えない言葉が含まれています";
    return;
  }

  if (!isValidGrade(draftProfile.grade)) {
    profileEditMessage.textContent = "学年を選んでください";
    return;
  }

  if (!isValidStatusMessage(draftProfile.statusMessage)) {
    profileEditMessage.textContent = "一言メッセージは24文字以内で入力してください";
    return;
  }

  if (containsBlockedWord(draftProfile.statusMessage)) {
    profileEditMessage.textContent = "一言メッセージに使えない言葉が含まれています";
    return;
  }

  if (!isUnlockedAvatar(draftProfile.avatar, draftProfile.playCount)) {
    profileEditMessage.textContent = "まだ解放されていないアイコンです";
    return;
  }

  if (!isUnlockedTheme(draftProfile.selectedTheme, draftProfile.playCount)) {
    profileEditMessage.textContent = "まだ解放されていない背景です";
    return;
  }

  saveProfileBtn.disabled = true;
  profileEditMessage.textContent = "保存中...";

  try {
    await saveProfile(draftProfile);

    try {
      await updateMyPublicResultsProfile(draftProfile);
    } catch (error) {
      console.warn("ランキング側プロフィール更新に失敗しました", error);
    }

    currentProfile = normalizeProfile(draftProfile);
    applyProfileToScreen();

    profileEditMessage.textContent = "保存しました！";

    setTimeout(async () => {
      await renderWeeklyRanking();
      switchScreen("home");
    }, 450);
  } catch (error) {
    console.error(error);
    profileEditMessage.textContent = "保存に失敗しました";
  } finally {
    saveProfileBtn.disabled = false;
  }
});

function isValidPlayerName(name) {
  return name.length >= 1 && name.length <= 12;
}

function isValidGrade(grade) {
  return GRADES.includes(grade);
}

function isValidTheme(theme) {
  return THEME_REWARDS.some(item => item.key === theme);
}

function isUnlockedAvatar(avatar, playCount) {
  const item = AVATAR_REWARDS.find(reward => reward.avatar === avatar);
  return Boolean(item) && playCount >= item.required;
}

function isUnlockedTheme(theme, playCount) {
  const item = THEME_REWARDS.find(reward => reward.key === theme);
  return Boolean(item) && playCount >= item.required;
}

function isValidStatusMessage(message) {
  return message.length >= 0 && message.length <= 24;
}

function normalizeStatusMessage(message) {
  const text = String(message || "").trim();
  return text === "" ? "今日もがんばる！" : text;
}

function normalizeForFilter(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[！!？?。、,.・ー\-＿_]/g, "");
}

function containsBlockedWord(text) {
  const normalized = normalizeForFilter(text);

  return BLOCKED_WORDS.some(word => {
    return normalized.includes(normalizeForFilter(word));
  });
}

finishBtn.addEventListener("click", finishGame);

retryBtn.addEventListener("click", () => {
  if (!state.lastRecord) return;
  startGame(state.lastRecord.operation, state.lastRecord.difficulty);
});

backHomeBtn.addEventListener("click", async () => {
  await renderWeeklyRanking();
  switchScreen("home");
});

showReviewBtn.addEventListener("click", () => {
  reviewArea.classList.toggle("hidden");

  showReviewBtn.textContent = reviewArea.classList.contains("hidden")
    ? "自分の解答を確認"
    : "解答確認を閉じる";
});

keypad.addEventListener("click", event => {
  if (state.isCountingDown) return;

  const key = event.target.closest(".key");
  if (!key || !state.selectedCell) return;

  if (key.dataset.action === "backspace") {
    removeLastDigit();
    return;
  }

  if (key.dataset.action === "clear") {
    clearCell();
    return;
  }

  let value = key.textContent;

  if (key.dataset.action === "zero") value = "0";

  addDigit(value);
});

document.addEventListener("keydown", event => {
  if (!isScreenActive("game")) return;
  if (state.isCountingDown) return;
  if (!state.selectedCell) return;

  const key = event.key;

  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    addDigit(key);
    return;
  }

  if (key === "-") {
    event.preventDefault();

    if (canUseNegativeAnswer()) {
      toggleMinusSign();
    }

    return;
  }

  if (key === "Backspace") {
    event.preventDefault();
    removeLastDigit();
    return;
  }

  if (key === "Delete" || key.toLowerCase() === "c") {
    event.preventDefault();
    clearCell();
    return;
  }

  if (key === "ArrowRight") {
    event.preventDefault();
    moveToNextCell();
  }
});

document.addEventListener(
  "dblclick",
  event => {
    if (isScreenActive("game")) {
      event.preventDefault();
    }
  },
  { passive: false }
);

menuBtn.addEventListener("click", openMenu);
closeMenuBtn.addEventListener("click", closeMenu);
sideMenuBg.addEventListener("click", closeMenu);

showHistoryBtn.addEventListener("click", async () => {
  closeMenu();
  await renderHistoryList();
  switchScreen("history");
});

showBestBtn.addEventListener("click", async () => {
  closeMenu();
  await renderBestList();
  switchScreen("best");
});

changeProfileBtn.addEventListener("click", () => {
  closeMenu();
  setTimeout(openProfileEditScreen, 320);
});

showTutorialBtn.addEventListener("click", () => {
  closeMenu();
  previousScreenBeforeTutorial = getActiveScreenName() || "home";
  setTimeout(() => switchScreen("tutorial"), 320);
});

showHomeBtn.addEventListener("click", async () => {
  closeMenu();
  await renderWeeklyRanking();
  switchScreen("home");
});

historyBackBtn.addEventListener("click", async () => {
  await renderWeeklyRanking();
  switchScreen("home");
});

bestBackBtn.addEventListener("click", async () => {
  await renderWeeklyRanking();
  switchScreen("home");
});

profileBackBtn.addEventListener("click", async () => {
  await renderWeeklyRanking();
  switchScreen("home");
});

reloadRankingBtn.addEventListener("click", renderWeeklyRanking);
reloadHistoryBtn.addEventListener("click", renderHistoryList);

tutorialBackBtn.addEventListener("click", async () => {
  if (currentProfile && !currentProfile.hasSeenTutorial) {
    await markTutorialSeen();
  }

  switchScreen(previousScreenBeforeTutorial || "home");
});

finishTutorialBtn.addEventListener("click", async () => {
  await markTutorialSeen();
  switchScreen("home");
});

logoutBtn.addEventListener("click", async () => {
  const firstConfirm = confirm(
    "この操作を行うと、現在のプレイヤーデータを削除してログアウトします。\n\n" +
    "削除されるもの：\n" +
    "・プロフィール\n" +
    "・過去の記録\n" +
    "・自己ベスト\n" +
    "・今週のランキング上の自分の記録\n\n" +
    "この操作は取り消せません。\n\n" +
    "本当に続けますか？"
  );

  if (!firstConfirm) return;

  const secondConfirm = confirm(
    "最終確認です。\n\n" +
    "ログアウト後、この端末では前のプレイヤーデータに戻れません。\n" +
    "次に開くと、新しいプレイヤーとして登録し直すことになります。\n\n" +
    "本当にデータを削除してログアウトしますか？"
  );

  if (!secondConfirm) return;

  closeMenu();

  try {
    saveMessage.textContent = "";
    registerMessage.textContent = "";

    await deleteCurrentUserData();
    await signOut(auth);

    resetLocalUserState();
    switchScreen("register");

    await signInAnonymously(auth);
  } catch (error) {
    console.error("データ削除ログアウトに失敗しました", error);
    alert("データ削除またはログアウトに失敗しました。通信状態やFirebaseルールを確認してください。");
  }
});

async function startGame(operation, difficulty) {
  try {
    resetState();

    state.operation = operation;
    state.difficulty = difficulty;
    state.symbol = OPERATION_SYMBOLS[operation];

    generateHeaders(operation, difficulty);
    generateCorrectAnswers();

    operationLabel.textContent = OPERATION_NAMES[operation];
    difficultyLabel.textContent = DIFFICULTIES[difficulty];
    timerDisplay.textContent = "00:00";

    renderGameBoard();
    switchScreen("game");

    finishBtn.disabled = true;
    state.isCountingDown = true;

    await runCountdown();

    state.isCountingDown = false;
    finishBtn.disabled = false;

    state.startTime = Date.now();
    state.timerInterval = setInterval(updateTimer, 200);
  } catch (error) {
    console.error(error);
    alert("問題の作成に失敗しました。\n" + error.message);

    state.isCountingDown = false;
    finishBtn.disabled = false;

    switchScreen("home");
  }
}

function resetState() {
  clearInterval(state.timerInterval);

  state.operation = null;
  state.difficulty = null;
  state.symbol = "";
  state.rowNumbers = [];
  state.colNumbers = [];
  state.answers = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(""));
  state.correctAnswers = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  state.selectedCell = null;
  state.startTime = null;
  state.timerInterval = null;
  state.elapsedSeconds = 0;
  state.isCountingDown = false;

  reviewArea.classList.add("hidden");
  showReviewBtn.textContent = "自分の解答を確認";
  bestBadge.classList.add("hidden");
  unlockArea.classList.add("hidden");
  unlockList.innerHTML = "";
  saveMessage.textContent = "";
}

async function runCountdown() {
  const counts = ["3", "2", "1", "Go!"];

  countdownOverlay.classList.remove("hidden");

  for (const count of counts) {
    countdownText.textContent = count;
    countdownText.classList.remove("pop", "go");
    void countdownText.offsetWidth;
    countdownText.classList.add("pop");

    if (count === "Go!") {
      countdownText.classList.add("go");
    }

    await sleep(800);
  }

  countdownOverlay.classList.add("hidden");
}

function generateHeaders(operation, difficulty) {
  if (operation === "add") generateAddHeaders(difficulty);
  if (operation === "sub") generateSubHeaders(difficulty);
  if (operation === "mul") generateMulHeaders(difficulty);
  if (operation === "div") generateDivHeaders(difficulty);
}

function generateAddHeaders(difficulty) {
  if (difficulty === "easy") {
    state.rowNumbers = generateUniqueRandomNumbers(10, 1, 10);
    state.colNumbers = generateUniqueRandomNumbers(10, 1, 10);
  }

  if (difficulty === "normal") {
    state.rowNumbers = generateUniqueRandomNumbers(10, 10, 99);
    state.colNumbers = generateUniqueRandomNumbers(10, 10, 99, new Set(state.rowNumbers));
  }

  if (difficulty === "hard") {
    state.rowNumbers = generateUniqueRandomNumbers(10, 100, 999);
    state.colNumbers = generateUniqueRandomNumbersMixed(10, [[10, 99], [100, 999]], new Set(state.rowNumbers));
  }
}

function generateSubHeaders(difficulty) {
  const allowNegative = isJuniorHighOrAbove(currentProfile?.grade);

  if (difficulty === "easy") {
    if (allowNegative) {
      state.rowNumbers = generateUniqueRandomNumbers(10, 1, 10);
      state.colNumbers = generateUniqueRandomNumbers(10, 1, 10);
    } else {
      state.rowNumbers = generateUniqueRandomNumbers(10, 10, 19);
      state.colNumbers = generateUniqueRandomNumbers(10, 1, 10);
    }
  }

  if (difficulty === "normal") {
    state.rowNumbers = generateUniqueRandomNumbers(10, 10, 99);
    state.colNumbers = generateUniqueRandomNumbers(10, 10, 99, new Set(state.rowNumbers));
  }

  if (difficulty === "hard") {
    state.rowNumbers = generateUniqueRandomNumbers(10, 100, 999);
    state.colNumbers = generateUniqueRandomNumbersMixed(10, [[10, 99], [100, 999]], new Set(state.rowNumbers));
  }

  if (!allowNegative && difficulty !== "easy") {
    const minRow = Math.min(...state.rowNumbers);

    state.colNumbers = state.colNumbers.map(value => {
      if (value <= minRow) return value;
      return randomInt(1, minRow);
    });
  }
}

function generateMulHeaders(difficulty) {
  if (difficulty === "easy") {
    state.rowNumbers = generateUniqueRandomNumbers(10, 1, 10);
    state.colNumbers = generateUniqueRandomNumbers(10, 1, 10);
  }

  if (difficulty === "normal") {
    state.rowNumbers = generateUniqueRandomNumbers(10, 10, 99);
    state.colNumbers = Array.from({ length: GRID_SIZE }, () => randomInt(1, 9));
  }

  if (difficulty === "hard") {
    state.rowNumbers = generateUniqueRandomNumbers(10, 10, 99);
    state.colNumbers = generateUniqueRandomNumbers(10, 10, 99, new Set(state.rowNumbers));
  }
}

function generateDivHeaders(difficulty) {
  if (difficulty === "easy") {
    state.colNumbers = [1, 2, 3, 6, 1, 2, 3, 6, 1, 2];
    state.rowNumbers = generateDivisionRows({
      min: 12,
      max: 96,
      base: 6
    });
  }

  if (difficulty === "normal") {
    state.colNumbers = [1, 2, 3, 4, 6, 8, 1, 2, 3, 4];
    state.rowNumbers = generateDivisionRows({
      min: 120,
      max: 984,
      base: 24,
      evenOnesPlace: true
    });
  }

  if (difficulty === "hard") {
    state.colNumbers = [2, 3, 4, 5, 6, 10, 12, 2, 3, 4];
    state.rowNumbers = generateDivisionRows({
      min: 120,
      max: 960,
      base: 60,
      evenOnesPlace: true
    });
  }
}

function generateDivisionRows({ min, max, base, evenOnesPlace = false }) {
  const candidates = [];

  for (let n = min; n <= max; n++) {
    if (n % base !== 0) continue;
    if (evenOnesPlace && n % 2 !== 0) continue;

    candidates.push(n);
  }

  if (candidates.length < GRID_SIZE) {
    throw new Error("割り算の数字生成に失敗しました");
  }

  return shuffleArray(candidates).slice(0, GRID_SIZE);
}

function generateCorrectAnswers() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const rowValue = state.rowNumbers[r];
      const colValue = state.colNumbers[c];

      let answer = 0;

      if (state.operation === "add") answer = rowValue + colValue;
      if (state.operation === "sub") answer = rowValue - colValue;
      if (state.operation === "mul") answer = rowValue * colValue;
      if (state.operation === "div") answer = rowValue / colValue;

      state.correctAnswers[r][c] = answer;
    }
  }
}

function renderGameBoard() {
  gameBoard.innerHTML = "";

  const firstRow = document.createElement("tr");

  const corner = document.createElement("td");
  corner.className = "corner-cell";
  corner.textContent = state.symbol;
  firstRow.appendChild(corner);

  for (let c = 0; c < GRID_SIZE; c++) {
    const td = document.createElement("td");
    td.className = "header-cell";
    td.textContent = state.colNumbers[c];
    firstRow.appendChild(td);
  }

  gameBoard.appendChild(firstRow);

  for (let r = 0; r < GRID_SIZE; r++) {
    const tr = document.createElement("tr");

    const header = document.createElement("td");
    header.className = "header-cell";
    header.textContent = state.rowNumbers[r];
    tr.appendChild(header);

    for (let c = 0; c < GRID_SIZE; c++) {
      const td = document.createElement("td");
      td.className = "answer-cell";

      if (state.selectedCell && state.selectedCell.row === r && state.selectedCell.col === c) {
        td.classList.add("selected");
      }

      const span = document.createElement("span");
      span.className = "answer-text";
      span.textContent = state.answers[r][c];

      td.appendChild(span);

      td.addEventListener("click", () => {
        state.selectedCell = { row: r, col: c };
        renderGameBoard();
      });

      tr.appendChild(td);
    }

    gameBoard.appendChild(tr);
  }
}

function addDigit(digit) {
  const { row, col } = state.selectedCell;
  const current = state.answers[row][col];

  if (current.length >= 6) return;

  if (current === "0") {
    state.answers[row][col] = digit;
  } else if (current === "-0") {
    state.answers[row][col] = "-" + digit;
  } else {
    state.answers[row][col] += digit;
  }

  renderGameBoard();
}

function toggleMinusSign() {
  const { row, col } = state.selectedCell;
  const current = state.answers[row][col];

  if (current.startsWith("-")) {
    state.answers[row][col] = current.slice(1);
  } else {
    state.answers[row][col] = "-" + current;
  }

  renderGameBoard();
}

function removeLastDigit() {
  const { row, col } = state.selectedCell;
  state.answers[row][col] = state.answers[row][col].slice(0, -1);
  renderGameBoard();
}

function clearCell() {
  const { row, col } = state.selectedCell;
  state.answers[row][col] = "";
  renderGameBoard();
}

function moveToNextCell() {
  if (!state.selectedCell) {
    state.selectedCell = { row: 0, col: 0 };
    renderGameBoard();
    return;
  }

  let { row, col } = state.selectedCell;

  col++;

  if (col >= GRID_SIZE) {
    col = 0;
    row++;
  }

  if (row >= GRID_SIZE) {
    row = GRID_SIZE - 1;
    col = GRID_SIZE - 1;
  }

  state.selectedCell = { row, col };
  renderGameBoard();
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  state.elapsedSeconds = elapsed;
  timerDisplay.textContent = formatTime(elapsed);
}

async function finishGame() {
  if (state.isCountingDown) return;

  clearInterval(state.timerInterval);
  finishBtn.disabled = true;
  saveMessage.textContent = "";

  let correct = 0;
  let mistakes = 0;
  let answeredCount = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const userAnswerText = state.answers[r][c];
      const userAnswer = Number(userAnswerText);
      const correctAnswer = state.correctAnswers[r][c];

      if (userAnswerText !== "") answeredCount++;

      if (userAnswerText !== "" && userAnswer === correctAnswer) {
        correct++;
      } else {
        mistakes++;
      }
    }
  }

  const isCompletedAllCells = answeredCount === GRID_SIZE * GRID_SIZE;
  const penalty = mistakes * PENALTY_SECONDS;
  const finalSeconds = state.elapsedSeconds + penalty;

  let isBest = false;

  try {
    isBest = await isPersonalBest(state.operation, state.difficulty, finalSeconds);
  } catch (error) {
    console.error("自己ベスト判定に失敗しました", error);
  }

  correctCountEl.textContent = `${correct} / 100`;
  mistakeCountEl.textContent = `${mistakes}問`;
  rawTimeEl.textContent = formatTime(state.elapsedSeconds);
  penaltyTimeEl.textContent = `+${penalty}秒`;
  finalTimeEl.textContent = formatTime(finalSeconds);

  resultOperationLabel.textContent = OPERATION_NAMES[state.operation];
  resultDifficultyLabel.textContent = DIFFICULTIES[state.difficulty];

  bestBadge.classList.toggle("hidden", !isBest);

  const oldPlayCount = currentProfile.playCount || 0;
  const newPlayCount = isCompletedAllCells ? oldPlayCount + 1 : oldPlayCount;
  const unlockMessages = isCompletedAllCells ? getUnlockMessages(oldPlayCount, newPlayCount) : [];

  renderUnlockMessages(unlockMessages);

  const record = {
    playerName: currentProfile.playerName,
    grade: currentProfile.grade,
    statusMessage: currentProfile.statusMessage,
    avatar: currentProfile.avatar,
    uid: currentUser.uid,
    operation: state.operation,
    operationLabel: OPERATION_NAMES[state.operation],
    difficulty: state.difficulty,
    difficultyLabel: DIFFICULTIES[state.difficulty],
    symbol: state.symbol,
    date: new Date().toLocaleString("ja-JP"),
    weekId: getWeekId(),
    correct,
    mistakes,
    answeredCount,
    isCompletedAllCells,
    rawTime: state.elapsedSeconds,
    penalty,
    finalTime: finalSeconds,
    isBest,
    rowNumbers: deepCopy(state.rowNumbers),
    colNumbers: deepCopy(state.colNumbers),
    userAnswers: matrixToObject(state.answers),
    correctAnswers: matrixToObject(state.correctAnswers)
  };

  renderReviewBoardFromRecord(record, reviewBoard);
  switchScreen("result");

  try {
    saveMessage.textContent = "記録を保存中...";
    await savePlayRecord(record);

    if (isCompletedAllCells) {
      await updateProfileAfterGame(newPlayCount);
    }

    saveMessage.textContent = isCompletedAllCells
      ? "記録を保存しました！プレイ回数が1回増えました。"
      : "記録を保存しました。100問すべて入力するとプレイ回数が増えます。";

    await renderWeeklyRanking();
  } catch (error) {
    console.error("記録の保存に失敗しました", error);
    saveMessage.textContent = "記録の保存に失敗しました";
  } finally {
    finishBtn.disabled = false;
  }

  state.lastRecord = record;
}

function getUnlockMessages(oldCount, newCount) {
  const messages = [];

  AVATAR_REWARDS.forEach(item => {
    if (item.required > oldCount && item.required <= newCount) {
      messages.push(`新アイコン ${item.avatar} を獲得！`);
    }
  });

  THEME_REWARDS.forEach(item => {
    if (item.required > oldCount && item.required <= newCount) {
      messages.push(`新背景カラー「${item.name}」を獲得！`);
    }
  });

  return messages;
}

function renderUnlockMessages(messages) {
  if (messages.length === 0) {
    unlockArea.classList.add("hidden");
    unlockList.innerHTML = "";
    return;
  }

  unlockArea.classList.remove("hidden");
  unlockList.innerHTML = "";

  messages.forEach(message => {
    const div = document.createElement("div");
    div.textContent = message;
    unlockList.appendChild(div);
  });
}

async function savePlayRecord(record) {
  await addDoc(collection(db, "users", currentUser.uid, "records"), {
    ...record,
    createdAt: serverTimestamp()
  });

  await savePublicBestResult(record);
}

async function savePublicBestResult(record) {
  const publicResultId = `${record.weekId}_${record.operation}_${record.difficulty}_${currentUser.uid}`;
  const publicResultRef = doc(db, "publicResults", publicResultId);

  const publicResultSnap = await getDoc(publicResultRef);

  const publicResult = {
    uid: currentUser.uid,
    playerName: currentProfile.playerName,
    grade: currentProfile.grade,
    statusMessage: currentProfile.statusMessage,
    avatar: currentProfile.avatar,
    operation: record.operation,
    operationLabel: record.operationLabel,
    difficulty: record.difficulty,
    difficultyLabel: record.difficultyLabel,
    correct: record.correct,
    mistakes: record.mistakes,
    answeredCount: record.answeredCount,
    isCompletedAllCells: record.isCompletedAllCells,
    rawTime: record.rawTime,
    penalty: record.penalty,
    finalTime: record.finalTime,
    weekId: record.weekId,
    date: record.date,
    updatedAt: serverTimestamp()
  };

  if (!publicResultSnap.exists()) {
    await setDoc(publicResultRef, {
      ...publicResult,
      createdAt: serverTimestamp()
    });
    return;
  }

  const oldResult = publicResultSnap.data();

  if (record.finalTime < oldResult.finalTime) {
    await setDoc(publicResultRef, publicResult, { merge: true });
    return;
  }

  await setDoc(publicResultRef, {
    playerName: currentProfile.playerName,
    grade: currentProfile.grade,
    statusMessage: currentProfile.statusMessage,
    avatar: currentProfile.avatar,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function isPersonalBest(operation, difficulty, finalTime) {
  const recordsRef = collection(db, "users", currentUser.uid, "records");

  const q = query(
    recordsRef,
    where("operation", "==", operation),
    where("difficulty", "==", difficulty)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return true;

  const records = snapshot.docs.map(docSnap => docSnap.data());
  const bestTime = Math.min(...records.map(record => record.finalTime));

  return finalTime < bestTime;
}

async function renderWeeklyRanking() {
  const list = document.getElementById("weeklyRankingList");

  list.innerHTML = `<li><span class="rank-name">読み込み中...</span><span class="rank-time">--:--</span></li>`;

  try {
    const weekId = getWeekId();

    let q;

    if (currentRankingGrade === "all") {
      q = query(
        collection(db, "publicResults"),
        where("weekId", "==", weekId),
        where("operation", "==", currentRankingOperation),
        where("difficulty", "==", currentRankingDifficulty)
      );
    } else {
      q = query(
        collection(db, "publicResults"),
        where("weekId", "==", weekId),
        where("operation", "==", currentRankingOperation),
        where("difficulty", "==", currentRankingDifficulty),
        where("grade", "==", currentRankingGrade)
      );
    }

    const snapshot = await getDocs(q);
    list.innerHTML = "";

    if (snapshot.empty) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="rank-name">まだ記録がありません</span><span class="rank-time">--:--</span>`;
      list.appendChild(li);
      return;
    }

    const bestByUser = new Map();

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.uid) return;

      const existing = bestByUser.get(data.uid);

      if (!existing || data.finalTime < existing.finalTime) {
        bestByUser.set(data.uid, data);
      }
    });

    const ranking = Array.from(bestByUser.values())
      .sort((a, b) => a.finalTime - b.finalTime)
      .slice(0, 10);

    ranking.forEach((player, index) => {
      const li = document.createElement("li");

      const name = document.createElement("span");
      name.className = "rank-name";

      const avatarText = player.avatar || "🐰";
      const gradeText = player.grade ? ` ${player.grade}` : "";

      name.textContent = `${getRankEmoji(index)} ${avatarText} ${player.playerName}${gradeText}`;

      const time = document.createElement("span");
      time.className = "rank-time";
      time.textContent = formatTime(player.finalTime);

      li.appendChild(name);
      li.appendChild(time);
      list.appendChild(li);
    });
  } catch (error) {
    console.error(error);
    list.innerHTML = `<li><span class="rank-name">ランキング取得に失敗しました</span><span class="rank-time">--:--</span></li>`;
  }
}

async function getPlayRecords() {
  const recordsRef = collection(db, "users", currentUser.uid, "records");
  const q = query(recordsRef, orderBy("createdAt", "desc"), limit(50));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

async function renderHistoryList() {
  historyList.innerHTML = `<div class="empty-message">読み込み中...</div>`;
  historyDetailArea.classList.add("hidden");

  try {
    const records = await getPlayRecords();
    historyList.innerHTML = "";

    if (records.length === 0) {
      historyList.innerHTML = `<div class="empty-message">まだ記録がありません</div>`;
      return;
    }

    records.forEach(record => {
      const item = document.createElement("div");
      item.className = "history-item";

      const title = document.createElement("div");
      title.className = "history-item-title";
      title.textContent = `${record.operationLabel} ${record.difficultyLabel}　${formatTime(record.finalTime)}`;

      const meta = document.createElement("div");
      meta.className = "history-item-meta";
      meta.innerHTML = `
        ${record.date}<br>
        入力 ${record.answeredCount ?? "-"} / 100<br>
        正解 ${record.correct}/100　
        ミス ${record.mistakes}問　
        加算 +${record.penalty}秒
        ${record.isBest ? "<br>✨ 自己ベスト達成" : ""}
      `;

      const detailButton = document.createElement("button");
      detailButton.className = "detail-btn";
      detailButton.textContent = "詳細を見る";

      detailButton.addEventListener("click", () => {
        showHistoryDetail(record);
      });

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(detailButton);

      historyList.appendChild(item);
    });
  } catch (error) {
    console.error(error);
    historyList.innerHTML = `<div class="empty-message">履歴の取得に失敗しました</div>`;
  }
}

function showHistoryDetail(record) {
  historyDetailArea.classList.remove("hidden");

  historyDetailText.innerHTML = `
    <strong>${record.operationLabel} ${record.difficultyLabel}</strong><br>
    日付：${record.date}<br>
    入力数：${record.answeredCount ?? "-"} / 100<br>
    正解数：${record.correct}/100<br>
    ミス数：${record.mistakes}問<br>
    計測タイム：${formatTime(record.rawTime)}<br>
    加算タイム：+${record.penalty}秒<br>
    最終タイム：${formatTime(record.finalTime)}
    ${record.isCompletedAllCells ? "<br>✅ 100問入力済み" : "<br>⚠️ 100問未入力"}
    ${record.isBest ? "<br>✨ 自己ベストの記録です" : ""}
  `;

  renderReviewBoardFromRecord(record, historyReviewBoard);
}

async function renderBestList() {
  bestList.innerHTML = `<div class="empty-message">読み込み中...</div>`;

  try {
    const records = await getPlayRecords();
    bestList.innerHTML = "";

    ["add", "sub", "mul", "div"].forEach(operation => {
      ["easy", "normal", "hard"].forEach(difficulty => {
        const sameRecords = records.filter(record => {
          return record.operation === operation && record.difficulty === difficulty;
        });

        const item = document.createElement("div");
        item.className = "best-item";

        const modeName = document.createElement("div");
        modeName.className = "best-mode";
        modeName.textContent = `${OPERATION_NAMES[operation]} ${DIFFICULTIES[difficulty]}`;

        const time = document.createElement("div");
        time.className = "best-time";

        if (sameRecords.length === 0) {
          time.textContent = "記録なし";
        } else {
          const bestRecord = sameRecords.reduce((best, current) => {
            return current.finalTime < best.finalTime ? current : best;
          });

          time.textContent = formatTime(bestRecord.finalTime);
        }

        item.appendChild(modeName);
        item.appendChild(time);
        bestList.appendChild(item);
      });
    });
  } catch (error) {
    console.error(error);
    bestList.innerHTML = `<div class="empty-message">自己ベストの取得に失敗しました</div>`;
  }
}

function renderReviewBoardFromRecord(record, tableElement) {
  tableElement.innerHTML = "";

  const userAnswers = objectToMatrix(record.userAnswers, "");
  const correctAnswers = objectToMatrix(record.correctAnswers, 0);

  const firstRow = document.createElement("tr");

  const corner = document.createElement("td");
  corner.className = "corner-cell";
  corner.textContent = record.symbol;
  firstRow.appendChild(corner);

  for (let c = 0; c < GRID_SIZE; c++) {
    const td = document.createElement("td");
    td.className = "header-cell";
    td.textContent = record.colNumbers[c];
    firstRow.appendChild(td);
  }

  tableElement.appendChild(firstRow);

  for (let r = 0; r < GRID_SIZE; r++) {
    const tr = document.createElement("tr");

    const header = document.createElement("td");
    header.className = "header-cell";
    header.textContent = record.rowNumbers[r];
    tr.appendChild(header);

    for (let c = 0; c < GRID_SIZE; c++) {
      const td = document.createElement("td");

      const user = userAnswers[r][c];
      const correct = correctAnswers[r][c];

      if (user === "") {
        td.className = "empty";
      } else if (Number(user) === correct) {
        td.className = "correct";
      } else {
        td.className = "wrong";
      }

      const wrap = document.createElement("div");
      wrap.className = "review-cell-wrap";

      const userAnswer = document.createElement("div");
      userAnswer.className = "review-user-answer";
      userAnswer.textContent = user === "" ? "空欄" : user;

      wrap.appendChild(userAnswer);

      if (user === "" || Number(user) !== correct) {
        const correctAnswer = document.createElement("div");
        correctAnswer.className = "review-correct-answer";
        correctAnswer.textContent = `正:${correct}`;
        wrap.appendChild(correctAnswer);
      }

      td.appendChild(wrap);
      tr.appendChild(td);
    }

    tableElement.appendChild(tr);
  }
}

async function deleteCurrentUserData() {
  if (!currentUser) throw new Error("ログインしていません");

  const uid = currentUser.uid;

  await deleteUserProfile(uid);
  await deleteUserRecords(uid);
  await deleteUserPublicResults(uid);
}

async function deleteUserProfile(uid) {
  await deleteDoc(doc(db, "users", uid, "profile", "main"));
}

async function deleteUserRecords(uid) {
  const recordsRef = collection(db, "users", uid, "records");
  const snapshot = await getDocs(recordsRef);

  await Promise.all(snapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
}

async function deleteUserPublicResults(uid) {
  const q = query(collection(db, "publicResults"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  await Promise.all(snapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
}

function resetLocalUserState() {
  currentUser = null;
  currentProfile = null;
  draftProfile = null;
  selectedRegisterAvatar = "🐰";

  playerNameInput.value = "";
  gradeSelect.value = "";
  statusMessageInput.value = "";
  avatarPreview.textContent = "🐰";
  registerMessage.textContent = "";

  resetHomeSelection();
  resetRankingSelects();
  resetState();
}

function matrixToObject(matrix) {
  const result = {};

  for (let r = 0; r < matrix.length; r++) {
    result[String(r)] = {};

    for (let c = 0; c < matrix[r].length; c++) {
      result[String(r)][String(c)] = matrix[r][c];
    }
  }

  return result;
}

function objectToMatrix(value, defaultValue) {
  if (Array.isArray(value)) return value;

  const matrix = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    matrix[r] = [];

    for (let c = 0; c < GRID_SIZE; c++) {
      matrix[r][c] = value?.[String(r)]?.[String(c)] ?? defaultValue;
    }
  }

  return matrix;
}

function generateUniqueRandomNumbers(count, min, max, excludedSet = new Set()) {
  const result = [];
  const used = new Set(excludedSet);

  const excludedInRangeCount = [...excludedSet].filter(n => n >= min && n <= max).length;
  const possibleCount = max - min + 1 - excludedInRangeCount;

  if (possibleCount < count) {
    throw new Error("指定範囲内で十分なユニーク数字を生成できません");
  }

  while (result.length < count) {
    const value = randomInt(min, max);

    if (!used.has(value)) {
      used.add(value);
      result.push(value);
    }
  }

  return result;
}

function generateUniqueRandomNumbersMixed(count, ranges, excludedSet = new Set()) {
  const result = [];
  const used = new Set(excludedSet);
  const candidates = [];

  ranges.forEach(([min, max]) => {
    for (let n = min; n <= max; n++) {
      if (!used.has(n)) candidates.push(n);
    }
  });

  const shuffled = shuffleArray(candidates);

  for (const value of shuffled) {
    if (result.length >= count) break;
    used.add(value);
    result.push(value);
  }

  if (result.length < count) throw new Error("十分な数字を生成できません");

  return result;
}

function shuffleArray(array) {
  const copied = [...array];

  for (let i = copied.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }

  return copied;
}

function isJuniorHighOrAbove(grade) {
  return ["中1", "中2", "中3"].includes(grade);
}

function canUseNegativeAnswer() {
  return state.operation === "sub" && isJuniorHighOrAbove(currentProfile?.grade);
}

function applyTheme(theme) {
  const validTheme = isValidTheme(theme) ? theme : "pastel";

  document.body.className = "";
  document.body.classList.add(`theme-${validTheme}`);
}

function getWeekId(date = new Date()) {
  const target = new Date(date.valueOf());

  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);

  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);

  const weekNumber = 1 + Math.round((target - firstThursday) / (7 * 24 * 60 * 60 * 1000));

  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function getRankEmoji(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}位`;
}

function switchScreen(screenName) {
  Object.values(screens).forEach(screen => {
    screen.classList.remove("active");
  });

  const targetScreen = screens[screenName];
  if (!targetScreen) return;

  targetScreen.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function isScreenActive(screenName) {
  return screens[screenName].classList.contains("active");
}

function getActiveScreenName() {
  return Object.keys(screens).find(name => screens[name].classList.contains("active"));
}

function openMenu() {
  sideMenu.classList.remove("hidden");

  requestAnimationFrame(() => {
    sideMenu.classList.add("open");
  });
}

function closeMenu() {
  sideMenu.classList.remove("open");

  setTimeout(() => {
    sideMenu.classList.add("hidden");
  }, 320);
}

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
