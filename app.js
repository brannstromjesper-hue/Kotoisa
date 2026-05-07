import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const appState = {
  currentUserId: null,
  currentUser: null,
  currentFamily: null,
  recipes: [],
  tags: [],
  chores: [],
  weeklyChoreRows: [],
  weeklyMeals: [],
  members: [],
};

const AUTH_MODES = {
  login: "login",
  create: "create",
  join: "join",
};

const unsubs = {
  family: null,
  recipes: null,
  tags: null,
  chores: null,
  weeklyChores: null,
  weeklyMeals: null,
};

let db = null;
let auth = null;
let storage = null;
let lastTabBeforeProfile = "recipes";
let pendingAvatarFile = null;
let pendingAvatarPreviewUrl = null;
let profileRemoveAvatarOnSave = false;
let authReadyTimeoutId = null;
let activeRecipeId = null;
let activeWeeklyNoteId = null;
let weeklySelectionMode = false;
let headerBackAction = null;
let activeChoreMenu = null;

const authPanel = document.getElementById("authPanel");
const appPanel = document.getElementById("appPanel");
const menuBtn = document.getElementById("menuBtn");
const headerMenuIcon = document.getElementById("headerMenuIcon");
const headerBackIcon = document.getElementById("headerBackIcon");
const drawer = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerCloseBtn = document.getElementById("drawerCloseBtn");
const signInForm = document.getElementById("signInForm");
const signInBtn = signInForm.querySelector('button[type="submit"]');
const createFamilyForm = document.getElementById("createFamilyForm");
const joinFamilyForm = document.getElementById("joinFamilyForm");
const authLoginModeBtn = document.getElementById("authLoginModeBtn");
const createFamilyBtn = document.getElementById("createFamilyBtn");
const joinFamilyBtn = document.getElementById("joinFamilyBtn");
const setupMessage = document.getElementById("setupMessage");
const authMessage = document.getElementById("authMessage");
const familyNameLabel = document.getElementById("familyNameLabel");
const familyPinLabel = document.getElementById("familyPinLabel");
const familyMembersLabel = document.getElementById("familyMembersLabel");
const recipeList = document.getElementById("recipeList");
const weeklyRecipeList = document.getElementById("weeklyRecipeList");
const weeklyPlanList = document.getElementById("weeklyPlanList");
const tagList = document.getElementById("tagList");
const addTagForm = document.getElementById("addTagForm");
const addTagInput = document.getElementById("addTagInput");
const choreList = document.getElementById("choreList");
const weeklyChoreList = document.getElementById("weeklyChoreList");
const mealsRecipeFilter = document.getElementById("mealsRecipeFilter");
const mealsRecipeTimeFilter = document.getElementById("mealsRecipeTimeFilter");
const mealsRecipeRatingFilter = document.getElementById("mealsRecipeRatingFilter");
const mealsRecipeTagFilter = document.getElementById("mealsRecipeTagFilter");
const mealsFilterToggleBtn = document.getElementById("mealsFilterToggleBtn");
const mealsFilterPanel = document.getElementById("mealsFilterPanel");
const topbarMealsTools = document.getElementById("topbarMealsTools");
const topbarChoreTools = document.getElementById("topbarChoreTools");
const choresFilterToggleBtn = document.getElementById("choresFilterToggleBtn");
const choresFilterPanel = document.getElementById("choresFilterPanel");
const mealsRecipesView = document.getElementById("mealsRecipesView");
const mealsHeaderRow = document.getElementById("mealsHeaderRow");
const choresListView = document.getElementById("choresListView");
const choresHeaderRow = document.getElementById("choresHeaderRow");
const weeklyRecipeFilter = document.getElementById("weeklyRecipeFilter");
const weeklyRecipeSort = document.getElementById("weeklyRecipeSort");
const weeklyToMealsBtn = document.getElementById("weeklyToMealsBtn");
const clearWeeklyPlanBtn = document.getElementById("clearWeeklyPlanBtn");
const openRandomWeeklyBtn = document.getElementById("openRandomWeeklyBtn");
const randomWeeklyOverlay = document.getElementById("randomWeeklyOverlay");
const randomWeeklySheet = document.getElementById("randomWeeklySheet");
const closeRandomWeeklyBtn = document.getElementById("closeRandomWeeklyBtn");
const cancelRandomWeeklyBtn = document.getElementById("cancelRandomWeeklyBtn");
const randomWeeklyGoBtn = document.getElementById("randomWeeklyGoBtn");
const randomWeeklyCount = document.getElementById("randomWeeklyCount");
const randomWeeklyTimeFilter = document.getElementById("randomWeeklyTimeFilter");
const randomWeeklyRatingFilter = document.getElementById("randomWeeklyRatingFilter");
const randomWeeklyTagFilter = document.getElementById("randomWeeklyTagFilter");
const weekNumberLabel = document.getElementById("weekNumberLabel");
const weeklyChoresWeekNumberLabel = document.getElementById("weeklyChoresWeekNumberLabel");
const listChoreFilter = document.getElementById("listChoreFilter");
const listChoreSort = document.getElementById("listChoreSort");
const weeklyChoreFilter = document.getElementById("weeklyChoreFilter");
const weeklyChoreSortAskareTh = document.getElementById("weeklyChoreSortAskare");
const weeklyChoreSortKuormaTh = document.getElementById("weeklyChoreSortKuorma");
const weeklyChoreProgress = document.getElementById("weeklyChoreProgress");
const weeklyChoreProgressText = document.getElementById("weeklyChoreProgressText");
const weeklyChoreProgressFill = document.getElementById("weeklyChoreProgressFill");
const weeklyChoreScoreboard = document.getElementById("weeklyChoreScoreboard");
const weeklyChoreScoreboardSummary = document.getElementById("weeklyChoreScoreboardSummary");
const weeklyChoreScoreboardList = document.getElementById("weeklyChoreScoreboardList");
const weeklyToChoresBtn = document.getElementById("weeklyToChoresBtn");
const clearWeeklyChoresBtn = document.getElementById("clearWeeklyChoresBtn");
const choresAddHeader = document.getElementById("choresAddHeader");
const choresDeleteHeader = document.getElementById("choresDeleteHeader");
const recipeTagSelect = document.getElementById("recipeTagSelect");
const editRecipeTagSelect = document.getElementById("editRecipeTagSelect");
const pageTitle = document.getElementById("pageTitle");
const logoutBtn = document.getElementById("logoutBtn");
const weeklyPlanBtn = document.getElementById("weeklyPlanBtn");
const mealsRecipesBtn = document.getElementById("mealsRecipesBtn");
const tagsBtn = document.getElementById("tagsBtn");
const shoppingBtn = document.getElementById("shoppingBtn");
const weeklyChoresBtn = document.getElementById("weeklyChoresBtn");
const choresListBtn = document.getElementById("choresListBtn");
const backFromWeeklyBtn = document.getElementById("backFromWeeklyBtn");
const backFromMealsBtn = document.getElementById("backFromMealsBtn");
const backFromTagsBtn = document.getElementById("backFromTagsBtn");
const backFromShoppingBtn = document.getElementById("backFromShoppingBtn");
const backFromWeeklyChoresBtn = document.getElementById(
  "backFromWeeklyChoresBtn"
);
const backFromChoresListBtn = document.getElementById(
  "backFromChoresListBtn"
);
const addRecipeBtn = document.getElementById("addRecipeBtn");
const backFromAddRecipeBtn = document.getElementById("backFromAddRecipeBtn");
const addRecipeForm = document.getElementById("addRecipeForm");
const cancelAddRecipeBtn = document.getElementById("cancelAddRecipeBtn");
const closeAddRecipeBtn = document.getElementById("closeAddRecipeBtn");
const addRecipeOverlay = document.getElementById("addRecipeOverlay");
const backFromRecipeDetailBtn = document.getElementById(
  "backFromRecipeDetailBtn"
);
const recipeDetailEditBtn = document.getElementById("recipeDetailEditBtn");
const recipeDetailURL = document.getElementById("recipeDetailURL");
const recipeDetailRatePrompt = document.getElementById("recipeDetailRatePrompt");
const recipeDetailRateInput = document.getElementById("recipeDetailRateInput");
const saveRecipeDetailRatingBtn = document.getElementById("saveRecipeDetailRatingBtn");
const editRecipeForm = document.getElementById("editRecipeForm");
const cancelEditRecipeBtn = document.getElementById("cancelEditRecipeBtn");
const editRecipeOverlay = document.getElementById("editRecipeOverlay");
const addChoreBtn = document.getElementById("addChoreBtn");
const backFromAddChoreBtn = document.getElementById("backFromAddChoreBtn");
const addChoreForm = document.getElementById("addChoreForm");
const weeklyNoteOverlay = document.getElementById("weeklyNoteOverlay");
const weeklyNoteForm = document.getElementById("weeklyNoteForm");
const weeklyNoteText = document.getElementById("weeklyNoteText");
const closeWeeklyNoteBtn = document.getElementById("closeWeeklyNoteBtn");
const cancelWeeklyNoteBtn = document.getElementById("cancelWeeklyNoteBtn");
const mealsSortName = document.getElementById("mealsSortName");
const mealsSortRating = document.getElementById("mealsSortRating");
const mealsSortTime = document.getElementById("mealsSortTime");
const mealsAddHeader = document.getElementById("mealsAddHeader");
const mealsLinkHeader = document.getElementById("mealsLinkHeader");
const mealsDeleteHeader = document.getElementById("mealsDeleteHeader");
const drawerProfileBtn = document.getElementById("drawerProfileBtn");
const userProfileView = document.getElementById("userProfileView");
const profileAvatarPreview = document.getElementById("profileAvatarPreview");
const profileAvatarInput = document.getElementById("profileAvatarInput");
const profileChooseAvatarBtn = document.getElementById("profileChooseAvatarBtn");
const profileRemoveAvatarBtn = document.getElementById("profileRemoveAvatarBtn");
const profileBioInput = document.getElementById("profileBioInput");
const profileBioCount = document.getElementById("profileBioCount");
const profileSaveBtn = document.getElementById("profileSaveBtn");
const profileFormMessage = document.getElementById("profileFormMessage");

const tableState = {
  mealsRecipes: {
    filter: "",
    sort: "name-asc",
    timeFilter: "all",
    ratingFilter: "all",
    tagFilter: "all",
  },
  weeklyRecipes: { filter: "", sort: "name-asc" },
  listChores: { filter: "", sort: "title-asc" },
  weeklyChores: { filter: "", sort: "title-asc" },
};
const weeklyDays = [
  "Maanantai",
  "Tiistai",
  "Keskiviikko",
  "Torstai",
  "Perjantai",
  "Lauantai",
  "Sunnuntai",
];
const mealTypes = ["Lounas", "Päivällinen", "Välipala", "Aamupala"];

signInForm.addEventListener("submit", handleSignIn);
if (authLoginModeBtn) authLoginModeBtn.addEventListener("click", () => toggleAuthMode(AUTH_MODES.login));
createFamilyBtn.addEventListener("click", () => toggleAuthMode(AUTH_MODES.create));
joinFamilyBtn.addEventListener("click", () => toggleAuthMode(AUTH_MODES.join));
createFamilyForm.addEventListener("submit", handleCreateFamily);
joinFamilyForm.addEventListener("submit", handleJoinFamily);
addRecipeForm.addEventListener("submit", handleAddRecipe);
if (editRecipeForm) editRecipeForm.addEventListener("submit", handleEditRecipe);
addChoreForm.addEventListener("submit", handleAddChore);
logoutBtn.addEventListener("click", handleLogout);
if (weeklyPlanBtn)
  weeklyPlanBtn.addEventListener("click", () => openRecipeSubView("weekly"));
if (weeklyToMealsBtn)
  weeklyToMealsBtn.addEventListener("click", () => {
    weeklySelectionMode = true;
    openRecipeSubView("meals");
  });
if (clearWeeklyPlanBtn) clearWeeklyPlanBtn.addEventListener("click", handleClearWeeklyPlan);
if (mealsRecipesBtn)
  mealsRecipesBtn.addEventListener("click", () => openRecipeSubView("meals"));
if (addRecipeBtn)
  addRecipeBtn.addEventListener("click", () =>
    openRecipeSubView("addRecipe")
  );
if (cancelAddRecipeBtn)
  cancelAddRecipeBtn.addEventListener("click", () => {
    resetAddRecipeForm();
    openRecipeSubView("meals");
  });
if (closeAddRecipeBtn)
  closeAddRecipeBtn.addEventListener("click", () => {
    resetAddRecipeForm();
    openRecipeSubView("meals");
  });
if (addRecipeOverlay)
  addRecipeOverlay.addEventListener("click", () => {
    resetAddRecipeForm();
    openRecipeSubView("meals");
  });
if (recipeDetailEditBtn)
  recipeDetailEditBtn.addEventListener("click", () => {
    openRecipeEditForm();
  });
if (cancelEditRecipeBtn)
  cancelEditRecipeBtn.addEventListener("click", () => {
    closeRecipeEditForm();
  });
if (saveRecipeDetailRatingBtn)
  saveRecipeDetailRatingBtn.addEventListener("click", async () => {
    await handleRateRecipeFromDetail();
  });
if (editRecipeOverlay)
  editRecipeOverlay.addEventListener("click", () => {
    closeRecipeEditForm();
  });
if (weeklyNoteForm)
  weeklyNoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveWeeklyNote();
  });
if (closeWeeklyNoteBtn) closeWeeklyNoteBtn.addEventListener("click", closeWeeklyNoteSheet);
if (cancelWeeklyNoteBtn) cancelWeeklyNoteBtn.addEventListener("click", closeWeeklyNoteSheet);
if (weeklyNoteOverlay) weeklyNoteOverlay.addEventListener("click", closeWeeklyNoteSheet);
if (openRandomWeeklyBtn) openRandomWeeklyBtn.addEventListener("click", openRandomWeeklySheet);
if (closeRandomWeeklyBtn) closeRandomWeeklyBtn.addEventListener("click", closeRandomWeeklySheet);
if (cancelRandomWeeklyBtn) cancelRandomWeeklyBtn.addEventListener("click", closeRandomWeeklySheet);
if (randomWeeklyOverlay) randomWeeklyOverlay.addEventListener("click", closeRandomWeeklySheet);
if (randomWeeklyGoBtn) randomWeeklyGoBtn.addEventListener("click", handleRandomWeeklyGo);
if (tagsBtn) tagsBtn.addEventListener("click", openTagsView);
if (addTagForm) addTagForm.addEventListener("submit", handleAddTag);
if (shoppingBtn) shoppingBtn.addEventListener("click", openShoppingView);
if (weeklyChoresBtn)
  weeklyChoresBtn.addEventListener("click", () => openChoreSubView("weekly"));
if (weeklyToChoresBtn)
  weeklyToChoresBtn.addEventListener("click", () => {
    weeklySelectionMode = true;
    openChoreSubView("list");
  });
if (clearWeeklyChoresBtn) {
  clearWeeklyChoresBtn.addEventListener("click", handleClearWeeklyChores);
}
if (choresListBtn)
  choresListBtn.addEventListener("click", () => {
    weeklySelectionMode = false;
    openChoreSubView("list");
  });
if (addChoreBtn)
  addChoreBtn.addEventListener("click", () => openChoreSubView("addChore"));
if (backFromWeeklyBtn)
  backFromWeeklyBtn.addEventListener("click", () =>
    openRecipeSubView("home")
  );
if (backFromMealsBtn)
  backFromMealsBtn.addEventListener("click", () =>
    openRecipeSubView(weeklySelectionMode ? "weekly" : "home")
  );
if (backFromAddRecipeBtn)
  backFromAddRecipeBtn.addEventListener("click", () =>
    openRecipeSubView("meals")
  );
if (backFromRecipeDetailBtn)
  backFromRecipeDetailBtn.addEventListener("click", () =>
    openRecipeSubView("meals")
  );
if (backFromTagsBtn)
  backFromTagsBtn.addEventListener("click", () => openRecipeSubView("home"));
if (backFromShoppingBtn)
  backFromShoppingBtn.addEventListener("click", () =>
    openRecipeSubView("home")
  );
if (backFromWeeklyChoresBtn)
  backFromWeeklyChoresBtn.addEventListener("click", () =>
    openChoreSubView("home")
  );
if (backFromChoresListBtn)
  backFromChoresListBtn.addEventListener("click", () =>
    openChoreSubView(weeklySelectionMode ? "weekly" : "home")
  );
if (backFromAddChoreBtn)
  backFromAddChoreBtn.addEventListener("click", () =>
    openChoreSubView("list")
  );

if (menuBtn) menuBtn.addEventListener("click", handleTopbarNavButton);
if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);
if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeDrawer);

if (drawer) {
  drawer.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.nav;
      closeDrawer();
      if (nav === "recipes") openTab("recipes");
      if (nav === "weekly") openRecipeSubView("weekly");
      if (nav === "meals") openRecipeSubView("meals");
      if (nav === "chores") openTab("chores");
      if (nav === "family") openTab("family");
    });
  });
}

if (drawerProfileBtn) drawerProfileBtn.addEventListener("click", openUserProfileView);
if (profileChooseAvatarBtn && profileAvatarInput) {
  profileChooseAvatarBtn.addEventListener("click", () => profileAvatarInput.click());
}
if (profileAvatarInput) profileAvatarInput.addEventListener("change", handleProfileAvatarChange);
if (profileRemoveAvatarBtn) profileRemoveAvatarBtn.addEventListener("click", handleProfileRemoveAvatarClick);
if (profileSaveBtn) profileSaveBtn.addEventListener("click", handleSaveUserProfile);
if (profileBioInput) {
  profileBioInput.addEventListener("input", () => {
    if (profileBioCount) profileBioCount.textContent = String(profileBioInput.value.length);
  });
}
toggleAuthMode(AUTH_MODES.login);

document.querySelectorAll(".tab-button").forEach((btn) => {
  btn.addEventListener("click", () => openTab(btn.dataset.tab));
});
wireFilledFieldBorders();
wireChoreListWeeklyAddDelegation();
if (mealsRecipeFilter) {
  mealsRecipeFilter.addEventListener("input", (event) => {
    tableState.mealsRecipes.filter = event.target.value || "";
    renderRecipes();
  });
}
if (mealsRecipeTimeFilter) {
  mealsRecipeTimeFilter.addEventListener("change", (event) => {
    tableState.mealsRecipes.timeFilter = event.target.value || "all";
    renderRecipes();
  });
}
if (mealsRecipeRatingFilter) {
  mealsRecipeRatingFilter.addEventListener("change", (event) => {
    tableState.mealsRecipes.ratingFilter = event.target.value || "all";
    renderRecipes();
  });
}
if (mealsRecipeTagFilter) {
  mealsRecipeTagFilter.addEventListener("change", (event) => {
    tableState.mealsRecipes.tagFilter = event.target.value || "all";
    renderRecipes();
  });
}
if (mealsFilterToggleBtn && mealsFilterPanel) {
  mealsFilterToggleBtn.addEventListener("click", () => {
    mealsFilterPanel.classList.toggle("hidden");
  });
}
if (choresFilterToggleBtn && choresFilterPanel) {
  choresFilterToggleBtn.addEventListener("click", () => {
    choresFilterPanel.classList.toggle("hidden");
  });
}
if (mealsSortName)
  mealsSortName.addEventListener("click", () => toggleMealsSort("name"));
if (mealsSortRating)
  mealsSortRating.addEventListener("click", () => toggleMealsSort("rating"));
if (mealsSortTime)
  mealsSortTime.addEventListener("click", () => toggleMealsSort("time"));
if (weeklyRecipeFilter) {
  weeklyRecipeFilter.addEventListener("input", (event) => {
    tableState.weeklyRecipes.filter = event.target.value || "";
    renderRecipes();
  });
}
if (weeklyRecipeSort) {
  weeklyRecipeSort.addEventListener("change", (event) => {
    tableState.weeklyRecipes.sort = event.target.value || "name-asc";
    renderRecipes();
  });
}
if (listChoreFilter) {
  listChoreFilter.addEventListener("input", (event) => {
    tableState.listChores.filter = event.target.value || "";
    renderChores();
  });
}
if (listChoreSort) {
  listChoreSort.addEventListener("change", (event) => {
    tableState.listChores.sort = event.target.value || "title-asc";
    renderChores();
  });
}
if (weeklyChoreFilter) {
  weeklyChoreFilter.addEventListener("input", (event) => {
    tableState.weeklyChores.filter = event.target.value || "";
    renderChores();
  });
}
if (weeklyChoreSortAskareTh) {
  weeklyChoreSortAskareTh.addEventListener("click", () => toggleWeeklyChoreSort("title"));
}
if (weeklyChoreSortKuormaTh) {
  weeklyChoreSortKuormaTh.addEventListener("click", () => toggleWeeklyChoreSort("load"));
}

bootstrap();
setSignInReady(false);

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function bootstrap() {
  if (!isFirebaseConfigured()) {
    authMessage.textContent =
      "Firebase config missing. Update firebase-config.js first.";
    render();
    return;
  }

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    storage = getStorage(firebaseApp);

    onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          clearFamilyListeners();
          appState.currentUserId = null;
          appState.currentUser = null;
          appState.currentFamily = null;
          appState.recipes = [];
          appState.tags = [];
          appState.chores = [];
          appState.weeklyChoreRows = [];
          appState.weeklyMeals = [];
          appState.members = [];
          localStorage.removeItem("userId");
          localStorage.removeItem("familyId");
          render();
          return;
        }

        clearAuthReadyTimeout();
        authMessage.textContent = "";
        setSignInReady(true);
        appState.currentUserId = user.uid;
        localStorage.setItem("userId", user.uid);
        await loadUserProfile();
        render();
      } catch (error) {
        authMessage.textContent = `Could not start sign-in session (${getFirebaseError(
          error
        )}). Enable Email/Password auth and check authorized domains.`;
        setSignInReady(false);
        console.error(error);
      }
    });
  } catch (error) {
    authMessage.textContent = `Firebase failed to initialize (${getFirebaseError(
      error
    )}). Check firebase-config.js values.`;
    setSignInReady(false);
    console.error(error);
  }

  authReadyTimeoutId = window.setTimeout(() => {
    if (!appState.currentUserId) {
      authMessage.textContent =
        "Still connecting to Firebase. Enable Email/Password auth and add localhost to Authorized domains.";
      setSignInReady(true);
    }
  }, 8000);
}

function render() {
  const user = appState.currentUser;
  const family = appState.currentFamily;

  authPanel.classList.toggle("hidden", !!user && !!family);
  appPanel.classList.toggle("hidden", !user || !family);

  if (user && family) {
    familyNameLabel.textContent = family.name;
    familyPinLabel.textContent = family.pin;
    familyMembersLabel.textContent = appState.members
      .map((member) => member.name)
      .join(", ");
    renderRecipes();
    renderChores();
  }
}

function toggleAuthMode(mode) {
  signInForm.classList.toggle("hidden", mode !== AUTH_MODES.login);
  createFamilyForm.classList.toggle("hidden", mode !== AUTH_MODES.create);
  joinFamilyForm.classList.toggle("hidden", mode !== AUTH_MODES.join);
  setAuthModeButtonState(authLoginModeBtn, mode === AUTH_MODES.login);
  setAuthModeButtonState(createFamilyBtn, mode === AUTH_MODES.create);
  setAuthModeButtonState(joinFamilyBtn, mode === AUTH_MODES.join);
  setupMessage.textContent = "";
  if (mode !== AUTH_MODES.login) authMessage.textContent = "";
}

function setAuthModeButtonState(button, isActive) {
  if (!button) return;
  button.classList.toggle("secondary", !isActive);
  button.setAttribute("aria-pressed", isActive ? "true" : "false");
}

function usernameToEmail(rawUsername) {
  const normalized = (rawUsername || "").toString().trim().toLowerCase();
  if (!normalized) return null;
  if (!/^[a-z0-9._-]{3,30}$/i.test(normalized)) return null;
  return `${normalized}@kotityot.app`;
}

async function ensureAuthenticatedUserFromForm(formData) {
  if (appState.currentUser) return appState.currentUser;
  if (!auth || !db) throw new Error("auth/not-ready");

  const name = (formData.get("displayName") || "").toString().trim();
  const username = (formData.get("username") || "").toString().trim();
  const password = (formData.get("password") || "").toString();
  if (!name) throw new Error("auth/missing-name");
  const email = usernameToEmail(username);
  if (!email) throw new Error("auth/invalid-username");
  if (!password || password.length < 6) throw new Error("auth/weak-password");

  const credentials = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credentials.user.uid;
  await setDoc(doc(db, "users", uid), {
    id: uid,
    name,
    username: username.toLowerCase(),
    familyId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  appState.currentUserId = uid;
  appState.currentUser = {
    id: uid,
    name,
    username: username.toLowerCase(),
    familyId: null,
  };
  return appState.currentUser;
}

async function handleSignIn(event) {
  event.preventDefault();
  if (!auth || !db) {
    authMessage.textContent =
      "Sign-in session is not ready. Refresh page and ensure Email/Password auth is enabled in Firebase.";
    setSignInReady(false);
    return;
  }

  const formData = new FormData(event.target);
  const username = (formData.get("username") || "").toString().trim();
  const password = (formData.get("password") || "").toString();
  const email = usernameToEmail(username);
  if (!email || !password) {
    authMessage.textContent =
      "Syötä käyttäjänimi (3-30 merkkiä: a-z, 0-9, ., _, -) ja salasana.";
    return;
  }

  try {
    const credentials = await signInWithEmailAndPassword(auth, email, password);
    appState.currentUserId = credentials.user.uid;
    await loadUserProfile();
    authMessage.textContent = "";
    setSignInReady(true);
    signInForm.reset();
    render();
  } catch (error) {
    const code = getFirebaseError(error);
    if (code === "auth/invalid-credential") {
      authMessage.textContent =
        "Väärä käyttäjänimi tai salasana. Jos tili on luotu vanhalla versiolla, tee uusi käyttäjä kohdasta Join family ja liity perheeseen PIN-koodilla.";
    } else {
      authMessage.textContent = `Kirjautuminen epäonnistui (${code}).`;
    }
    console.error(error);
    render();
  }
}

async function handleCreateFamily(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const familyName = (formData.get("familyName") || "").toString().trim();
  if (!familyName) {
    setupMessage.textContent = "Enter a family name.";
    return;
  }

  try {
    const user = await ensureAuthenticatedUserFromForm(formData);
    let pin = generatePin();
    while (await pinExists(pin)) {
      pin = generatePin();
    }

    const familyRef = await addDoc(collection(db, "families"), {
      name: familyName,
      pin,
      members: [user.id],
      createdBy: user.id,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", user.id), {
      familyId: familyRef.id,
      updatedAt: serverTimestamp(),
    });

    appState.currentUser.familyId = familyRef.id;
    setupMessage.textContent = "";
    createFamilyForm.reset();
    await attachFamilyListeners(familyRef.id);
  } catch (error) {
    setupMessage.textContent = `Could not create family (${getFirebaseError(
      error
    )}). Check Firestore rules.`;
    console.error(error);
  }
}

async function handleJoinFamily(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const pin = (formData.get("familyPin") || "").toString().trim();
  try {
    const user = await ensureAuthenticatedUserFromForm(formData);
    const familySnap = await getDocs(
      query(collection(db, "families"), where("pin", "==", pin))
    );
    if (familySnap.empty) {
      setupMessage.textContent = "Family not found. Check the pincode.";
      return;
    }
    const familyDoc = familySnap.docs[0];

    await updateDoc(doc(db, "families", familyDoc.id), {
      members: arrayUnion(user.id),
    });
    await updateDoc(doc(db, "users", user.id), {
      familyId: familyDoc.id,
      updatedAt: serverTimestamp(),
    });

    appState.currentUser.familyId = familyDoc.id;
    setupMessage.textContent = "";
    joinFamilyForm.reset();
    await attachFamilyListeners(familyDoc.id);
  } catch (error) {
    setupMessage.textContent = `Could not join family (${getFirebaseError(
      error
    )}). Check Firestore rules.`;
    console.error(error);
  }
}

async function handleAddRecipe(event) {
  event.preventDefault();
  const family = appState.currentFamily;
  if (!family) {
    setupMessage.textContent = "Create or join a family first.";
    return;
  }

  const formData = new FormData(event.target);
  const name = (formData.get("recipeName") || "").toString().trim();
  const rating = (formData.get("rating") || "").toString().trim();
  const time = (formData.get("recipeTime") || "").toString().trim();
  const tag = (formData.get("recipeTag") || "").toString().trim();
  const url = (formData.get("recipeURL") || "").toString().trim();
  const imageFile = formData.get("recipeImageFile");
  const text = (formData.get("recipeText") || "").toString().trim();

  if (!name || !time) {
    setupMessage.textContent = "Tayta pakolliset kentat: nimi ja aika.";
    return;
  }

  try {
    let image = "";
    if (imageFile instanceof File && imageFile.size > 0) {
      image = await readFileAsDataUrl(imageFile);
    }
    const numericRating = Number(rating) || 0;
    const ratingsByUser =
      numericRating > 0 && appState.currentUserId
        ? { [appState.currentUserId]: numericRating }
        : {};

    await addDoc(collection(db, "families", family.id, "recipes"), {
      name,
      rating: numericRating,
      ratingsByUser,
      time,
      tag,
      url,
      image,
      text,
      createdBy: appState.currentUserId,
      createdAt: serverTimestamp(),
    });
    setupMessage.textContent = "";
    resetAddRecipeForm();
    openRecipeSubView("meals");
  } catch (error) {
    setupMessage.textContent = `Could not add recipe (${getFirebaseError(
      error
    )}).`;
    console.error(error);
  }
}

async function handleEditRecipe(event) {
  event.preventDefault();
  const family = appState.currentFamily;
  if (!family || !activeRecipeId) return;

  const formData = new FormData(event.target);
  const name = (formData.get("recipeName") || "").toString().trim();
  const rating = (formData.get("rating") || "").toString().trim();
  const time = (formData.get("recipeTime") || "").toString().trim();
  const tag = (formData.get("recipeTag") || "").toString().trim();
  const url = (formData.get("recipeURL") || "").toString().trim();
  const imageFile = formData.get("recipeImageFile");
  const text = (formData.get("recipeText") || "").toString().trim();

  if (!name || !time) {
    setupMessage.textContent = "Tayta pakolliset kentat: nimi ja aika.";
    return;
  }

  try {
    const currentRecipe = appState.recipes.find((item) => item.id === activeRecipeId);
    let image = currentRecipe?.image || "";
    if (imageFile instanceof File && imageFile.size > 0) {
      image = await readFileAsDataUrl(imageFile);
    }
    const numericRating = Number(rating) || 0;
    const ratingsByUser = { ...getRecipeRatingsMap(currentRecipe) };
    if (appState.currentUserId) {
      if (numericRating > 0) {
        ratingsByUser[appState.currentUserId] = numericRating;
      } else {
        delete ratingsByUser[appState.currentUserId];
      }
    }
    const averageRating = getRecipeAverageRating({
      ...currentRecipe,
      ratingsByUser,
      rating: numericRating,
    });

    await updateDoc(doc(db, "families", family.id, "recipes", activeRecipeId), {
      name,
      rating: averageRating,
      ratingsByUser,
      time,
      tag,
      url,
      image,
      text,
      updatedAt: serverTimestamp(),
    });
    setupMessage.textContent = "";
    closeRecipeEditForm();
  } catch (error) {
    setupMessage.textContent = `Could not update recipe (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("Image file could not be read."));
    reader.readAsDataURL(file);
  });
}

async function handleAddChore(event) {
  event.preventDefault();
  const family = appState.currentFamily;
  if (!family) {
    setupMessage.textContent = "Create or join a family first.";
    window.alert("Perhettä ei löytynyt. Luo tai liity perheeseen ensin.");
    return;
  }

  const form = event.target;
  const title = (form.elements.addChoreTitle?.value || "").toString().trim();
  const loadHiddenValue = document.getElementById("addChoreLoadValue")?.value || "5";
  const loadValue = Number(loadHiddenValue);
  const load = Number.isFinite(loadValue) ? Math.max(1, Math.min(10, loadValue)) : 5;
  const recurringHiddenValue = document.getElementById("addChoreRecurringValue")?.value || "false";
  const isRecurring = recurringHiddenValue === "true";

  if (!title) {
    window.alert("Lisää askareelle nimi ennen tallennusta.");
    return;
  }

  try {
    const newChoreRef = await addDoc(collection(db, "families", family.id, "chores"), {
      title,
      load: String(load),
      default: isRecurring ? "Kyllä" : "Ei",
      createdBy: appState.currentUserId,
      createdAt: serverTimestamp(),
    });
    // Show the newly added chore immediately even before snapshot refresh.
    appState.chores = [
      ...appState.chores,
      {
        id: newChoreRef.id,
        title,
        load: String(load),
        default: isRecurring ? "Kyllä" : "Ei",
      },
    ];
    // Fallback refresh so the new chore is visible even if realtime listener lags.
    const choresSnap = await getDocs(collection(db, "families", family.id, "chores"));
    appState.chores = choresSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
    setupMessage.textContent = "";
    tableState.listChores.filter = "";
    if (listChoreFilter) listChoreFilter.value = "";
    event.target.reset();
    const loadInput = document.getElementById("addChoreLoadValue");
    if (loadInput) loadInput.value = "5";
    const recurringInput = document.getElementById("addChoreRecurringValue");
    if (recurringInput) recurringInput.value = "false";
    const recurringLabel = document.getElementById("addChoreRecurringLabel");
    if (recurringLabel) recurringLabel.textContent = "Ei";
    const recurringSwitch = document.getElementById("addChoreRecurringSwitch");
    if (recurringSwitch) recurringSwitch.checked = false;
    renderChores();
    openChoreSubView("list");
  } catch (error) {
    setupMessage.textContent = `Could not add chore (${getFirebaseError(
      error
    )}).`;
    window.alert(`Askareen tallennus epäonnistui: ${getFirebaseError(error)}`);
    console.error(error);
  }
}

function renderRecipes() {
  if (!recipeList && !weeklyRecipeList && !tagList) {
    return;
  }

  if (recipeList) recipeList.innerHTML = "";
  if (weeklyRecipeList) weeklyRecipeList.innerHTML = "";
  if (tagList) tagList.innerHTML = "";

  const recipeTags = appState.recipes.map((recipe) => (recipe.tag || "").toString().trim());
  const customTags = appState.tags.map((tag) => (tag.name || "").toString().trim());
  const uniqueTags = [...new Set([...recipeTags, ...customTags])].filter(Boolean);
  const customTagByName = new Map();
  appState.tags.forEach((tagDoc) => {
    const tagName = (tagDoc.name || "").toString().trim();
    if (!tagName) return;
    const normalized = tagName.toLowerCase();
    if (!customTagByName.has(normalized)) {
      customTagByName.set(normalized, tagDoc);
    }
  });

  uniqueTags.forEach((tag) => {
    if (!tagList) return;
    const customTag = customTagByName.get(tag.toLowerCase());
    const li = document.createElement("li");
    li.className = "row-item";
    li.innerHTML = `<div class="row-main"><strong>${escapeHtml(tag)}</strong></div>${
      customTag
        ? '<div class="row-actions"><button type="button" class="mini delete tag-delete-btn" aria-label="Poista tägi">×</button></div>'
        : ""
    }`;
    const deleteBtn = li.querySelector(".tag-delete-btn");
    if (deleteBtn && customTag?.id) {
      deleteBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await handleDeleteTag(customTag.id);
      });
    }
    tagList.appendChild(li);
  });

  populateRecipeTagSelect(uniqueTags);

  renderRecipeTable(recipeList, tableState.mealsRecipes);
  renderRecipeTable(weeklyRecipeList, tableState.weeklyRecipes);
  renderWeeklyPlanTable();
}

async function handleAddTag(event) {
  event.preventDefault();
  const family = appState.currentFamily;
  if (!family || !addTagInput) return;

  const name = (addTagInput.value || "").toString().trim();
  if (!name) return;

  const existingRecipeTags = appState.recipes
    .map((recipe) => (recipe.tag || "").toString().trim().toLowerCase())
    .filter(Boolean);
  const existingCustomTags = appState.tags
    .map((tag) => (tag.name || "").toString().trim().toLowerCase())
    .filter(Boolean);
  const normalized = name.toLowerCase();
  if ([...existingRecipeTags, ...existingCustomTags].includes(normalized)) {
    addTagInput.value = "";
    return;
  }

  try {
    await addDoc(collection(db, "families", family.id, "tags"), {
      name,
      createdBy: appState.currentUserId,
      createdAt: serverTimestamp(),
    });
    addTagInput.value = "";
  } catch (error) {
    setupMessage.textContent = `Could not add tag (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

async function handleDeleteTag(tagId) {
  const family = appState.currentFamily;
  if (!family || !tagId) return;
  const confirmed = window.confirm("Poistetaanko tägi?");
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "families", family.id, "tags", tagId));
  } catch (error) {
    setupMessage.textContent = `Could not delete tag (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

function renderChores() {
  renderChoreTable(choreList, tableState.listChores);
  renderWeeklyChorePlanTable();
}

function hideUserProfileView() {
  if (userProfileView) userProfileView.classList.add("hidden");
}

function getProfilePlaceholderLetter(name) {
  const c = String(name || "?").trim().charAt(0);
  if (!c) return "?";
  if (/^[\p{L}\p{N}]$/u.test(c)) return c;
  return "?";
}

function getProfilePlaceholderAvatarSrc(name) {
  const letter = getProfilePlaceholderLetter(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#1a1f28" width="120" height="120"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#8a96a8" font-size="44" font-family="system-ui,sans-serif">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function revokePendingAvatarPreview() {
  if (pendingAvatarPreviewUrl) {
    URL.revokeObjectURL(pendingAvatarPreviewUrl);
    pendingAvatarPreviewUrl = null;
  }
}

function setProfileAvatarPreviewSrc() {
  if (!profileAvatarPreview) return;
  const u = appState.currentUser;
  if (pendingAvatarPreviewUrl) {
    profileAvatarPreview.src = pendingAvatarPreviewUrl;
    return;
  }
  if (profileRemoveAvatarOnSave) {
    profileAvatarPreview.src = getProfilePlaceholderAvatarSrc(u?.name);
    return;
  }
  if (u?.avatarUrl) {
    profileAvatarPreview.src = u.avatarUrl;
    return;
  }
  profileAvatarPreview.src = getProfilePlaceholderAvatarSrc(u?.name);
}

function refreshUserProfileForm() {
  if (!profileBioInput) return;
  revokePendingAvatarPreview();
  pendingAvatarFile = null;
  profileRemoveAvatarOnSave = false;
  const u = appState.currentUser;
  profileBioInput.value = u?.bio != null ? String(u.bio) : "";
  if (profileBioCount) profileBioCount.textContent = String(profileBioInput.value.length);
  if (profileFormMessage) profileFormMessage.textContent = "";
  if (profileAvatarInput) profileAvatarInput.value = "";
  setProfileAvatarPreviewSrc();
}

function handleProfileAvatarChange(event) {
  const file = event.target.files?.[0];
  if (!file || !profileAvatarPreview) return;
  if (file.size > 3 * 1024 * 1024) {
    if (profileFormMessage) {
      profileFormMessage.textContent = "Kuva on liian suuri (enintään 3 MB).";
    }
    event.target.value = "";
    return;
  }
  revokePendingAvatarPreview();
  pendingAvatarFile = file;
  profileRemoveAvatarOnSave = false;
  pendingAvatarPreviewUrl = URL.createObjectURL(file);
  profileAvatarPreview.src = pendingAvatarPreviewUrl;
}

function handleProfileRemoveAvatarClick() {
  revokePendingAvatarPreview();
  pendingAvatarFile = null;
  if (profileAvatarInput) profileAvatarInput.value = "";
  profileRemoveAvatarOnSave = true;
  setProfileAvatarPreviewSrc();
}

function closeUserProfileView() {
  hideUserProfileView();
  openTab(lastTabBeforeProfile || "recipes");
}

function openUserProfileView() {
  const activeTab = document.querySelector(".tab-button.active")?.dataset.tab || "recipes";
  lastTabBeforeProfile = activeTab;
  [
    "recipesView",
    "weeklyPlanView",
    "mealsRecipesView",
    "addRecipeView",
    "recipeDetailView",
    "tagsView",
    "shoppingView",
    "choresView",
    "weeklyChoresView",
    "choresListView",
    "addChoreView",
    "familyView",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  if (userProfileView) userProfileView.classList.remove("hidden");
  if (pageTitle) pageTitle.textContent = "Oma profiili";
  setHeaderBackAction(closeUserProfileView);
  if (topbarMealsTools) topbarMealsTools.classList.add("hidden");
  if (topbarChoreTools) topbarChoreTools.classList.add("hidden");
  refreshUserProfileForm();
  closeDrawer();
}

async function handleSaveUserProfile() {
  const uid = appState.currentUserId;
  const user = appState.currentUser;
  if (!db || !uid || !user) {
    if (profileFormMessage) profileFormMessage.textContent = "Istunto ei ole valmis.";
    return;
  }
  if (profileFormMessage) profileFormMessage.textContent = "";
  const bio = (profileBioInput?.value || "").trim().slice(0, 200);
  try {
    let avatarUrl = user.avatarUrl || null;
    if (pendingAvatarFile) {
      if (!storage) {
        profileFormMessage.textContent = "Tallennustila ei ole käytössä (Firebase Storage).";
        return;
      }
      const storageRef = ref(storage, `avatars/${uid}/profile`);
      await uploadBytes(storageRef, pendingAvatarFile, {
        contentType: pendingAvatarFile.type || "image/jpeg",
      });
      avatarUrl = await getDownloadURL(storageRef);
      revokePendingAvatarPreview();
      pendingAvatarFile = null;
    } else if (profileRemoveAvatarOnSave) {
      avatarUrl = null;
    }
    await updateDoc(doc(db, "users", uid), {
      avatarUrl,
      bio,
      updatedAt: serverTimestamp(),
    });
    appState.currentUser = { ...user, avatarUrl, bio };
    const mi = appState.members.findIndex((m) => m.id === uid);
    if (mi >= 0) {
      appState.members[mi] = { ...appState.members[mi], avatarUrl, bio };
    }
    profileRemoveAvatarOnSave = false;
    if (profileAvatarInput) profileAvatarInput.value = "";
    profileFormMessage.textContent = "Tallennettu.";
    setProfileAvatarPreviewSrc();
  } catch (error) {
    profileFormMessage.textContent = `Tallennus epäonnistui (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

function openTab(tabName) {
  hideUserProfileView();
  const tabTitles = {
    recipes: "Ruoka",
    chores: "Askareet",
    family: "Perhe",
  };
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document
    .getElementById("recipesView")
    .classList.toggle("hidden", tabName !== "recipes");
  document.getElementById("weeklyPlanView").classList.add("hidden");
  document.getElementById("mealsRecipesView").classList.add("hidden");
  document.getElementById("addRecipeView").classList.add("hidden");
  document.getElementById("recipeDetailView").classList.add("hidden");
  document.getElementById("tagsView").classList.add("hidden");
  document.getElementById("shoppingView").classList.add("hidden");
  document
    .getElementById("choresView")
    .classList.toggle("hidden", tabName !== "chores");
  document.getElementById("weeklyChoresView").classList.add("hidden");
  document.getElementById("choresListView").classList.add("hidden");
  document.getElementById("addChoreView").classList.add("hidden");
  document
    .getElementById("familyView")
    .classList.toggle("hidden", tabName !== "family");
  pageTitle.textContent = tabTitles[tabName] || "Ruoka";
  setHeaderBackAction(null);
  if (topbarMealsTools) topbarMealsTools.classList.add("hidden");
  if (topbarChoreTools) topbarChoreTools.classList.add("hidden");
  closeDrawer();
}

function openRecipeSubView(view) {
  hideUserProfileView();
  const views = [
    "recipesView",
    "weeklyPlanView",
    "mealsRecipesView",
    "addRecipeView",
    "recipeDetailView",
    "tagsView",
    "shoppingView",
  ];
  const titles = {
    weekly: "Viikon ruokalista",
    meals: "Ateriat & reseptit",
    addRecipe: "Lisää uusi resepti",
    home: "Ruoka",
  };
  const viewMap = {
    weekly: "weeklyPlanView",
    meals: "mealsRecipesView",
    addRecipe: "addRecipeView",
    detail: "recipeDetailView",
    home: "recipesView",
  };

  const targetView = viewMap[view] || "recipesView";

  const phoneContent = document.querySelector(".phone-content");
  const addRecipeView = document.getElementById("addRecipeView");
  if (view === "home" || view === "weekly") weeklySelectionMode = false;

  if (view === "addRecipe") {
    views.forEach((v) => {
      const shouldShow = v === "mealsRecipesView" || v === "addRecipeView";
      document.getElementById(v).classList.toggle("hidden", !shouldShow);
    });
    if (addRecipeOverlay) addRecipeOverlay.classList.remove("hidden");
    if (addRecipeView) addRecipeView.classList.add("is-sheet-open");
  } else {
    views.forEach((v) => {
      document.getElementById(v).classList.toggle("hidden", v !== targetView);
    });
    if (addRecipeOverlay) addRecipeOverlay.classList.add("hidden");
    if (addRecipeView) addRecipeView.classList.remove("is-sheet-open");
    if (phoneContent) phoneContent.classList.remove("meals-lock-scroll");
  }

  pageTitle.textContent = titles[view] || pageTitle.textContent;
  const backByView = {
    weekly: () => openRecipeSubView("home"),
    meals: () => openRecipeSubView(weeklySelectionMode ? "weekly" : "home"),
    addRecipe: () => openRecipeSubView("meals"),
    detail: () => openRecipeSubView("meals"),
    home: null,
  };
  setHeaderBackAction(backByView[view] || null);
  if (topbarMealsTools) {
    topbarMealsTools.classList.toggle("hidden", view !== "meals");
  }
  if (topbarChoreTools) topbarChoreTools.classList.add("hidden");
  const weeklyMealsMode = view === "meals" && weeklySelectionMode;
  if (phoneContent) {
    phoneContent.classList.toggle("weekly-meals-mode", weeklyMealsMode);
  }
  if (mealsRecipesView) {
    mealsRecipesView.classList.toggle("weekly-selection-mode", weeklyMealsMode);
  }
  if (mealsHeaderRow) {
    mealsHeaderRow.classList.toggle("hidden", weeklyMealsMode);
  }
  if (view === "meals" || view === "weekly") renderRecipes();
  if (view === "weekly") {
    renderWeeklyViews();
    if (weekNumberLabel) weekNumberLabel.textContent = `Viikko ${getCurrentWeekNumber()}`;
  }
  if (view === "addRecipe") resetAddRecipeForm();

  closeDrawer();
}

function openRecipeDetailView(recipe) {
  activeRecipeId = recipe.id;
  openRecipeSubView("detail");
  document.getElementById("recipeDetailName").textContent = recipe.name;
  document.getElementById("recipeDetailImage").src = recipe.image;
  const avgRating = getRecipeAverageRating(recipe);
  const userRating = getUserRecipeRating(recipe);
  const ratingText = userRating
    ? `You ${userRating.toFixed(1)} / Avg. ${avgRating.toFixed(1)}`
    : `You - / Avg. ${avgRating.toFixed(1)}`;
  document.getElementById("recipeDetailRating").innerHTML = `${getStars(avgRating)} ${ratingText}`;
  if (recipeDetailRatePrompt && recipeDetailRateInput) {
    recipeDetailRatePrompt.classList.toggle("hidden", userRating > 0);
    recipeDetailRateInput.value = 0;
  }
  document.getElementById("recipeDetailTime").textContent = recipe.time;
  document.getElementById("recipeDetailTag").textContent = recipe.tag
    ? `#${recipe.tag}`
    : "";
  const safeUrl = normalizeRecipeUrl(recipe.url);
  recipeDetailURL.href = safeUrl || "#";
  recipeDetailURL.classList.toggle("hidden", !safeUrl);
  document.getElementById("recipeDetailText").textContent = recipe.text;
  closeRecipeEditForm();
  pageTitle.textContent = recipe.name;
}

async function handleRateRecipeFromDetail() {
  const family = appState.currentFamily;
  if (!family || !activeRecipeId || !appState.currentUserId || !recipeDetailRateInput) return;
  const currentRecipe = appState.recipes.find((item) => item.id === activeRecipeId);
  if (!currentRecipe) return;
  if (getUserRecipeRating(currentRecipe) > 0) return;

  const newRating = Number(recipeDetailRateInput.value) || 0;
  if (newRating <= 0) {
    setupMessage.textContent = "Valitse arvosana ennen tallennusta.";
    return;
  }

  try {
    const ratingsByUser = { ...getRecipeRatingsMap(currentRecipe) };
    ratingsByUser[appState.currentUserId] = newRating;
    const averageRating = getRecipeAverageRating({
      ...currentRecipe,
      ratingsByUser,
      rating: newRating,
    });
    await updateDoc(doc(db, "families", family.id, "recipes", activeRecipeId), {
      ratingsByUser,
      rating: averageRating,
      updatedAt: serverTimestamp(),
    });
    setupMessage.textContent = "";
    const updatedRecipe = {
      ...currentRecipe,
      ratingsByUser,
      rating: averageRating,
    };
    openRecipeDetailView(updatedRecipe);
  } catch (error) {
    setupMessage.textContent = `Could not save rating (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

function openTagsView() {
  hideUserProfileView();
  const recipesView = document.getElementById("recipesView");
  const weeklyPlanView = document.getElementById("weeklyPlanView");
  const mealsRecipesView = document.getElementById("mealsRecipesView");
  const tagsView = document.getElementById("tagsView");
  const shoppingView = document.getElementById("shoppingView");

  recipesView.classList.add("hidden");
  weeklyPlanView.classList.add("hidden");
  mealsRecipesView.classList.add("hidden");
  tagsView.classList.remove("hidden");
  shoppingView.classList.add("hidden");
  pageTitle.textContent = "Tägit";
  setHeaderBackAction(() => openRecipeSubView("home"));
  if (topbarMealsTools) topbarMealsTools.classList.add("hidden");
  if (topbarChoreTools) topbarChoreTools.classList.add("hidden");
  renderRecipes();
  closeDrawer();
}

function openShoppingView() {
  const recipesView = document.getElementById("recipesView");
  const weeklyPlanView = document.getElementById("weeklyPlanView");
  const mealsRecipesView = document.getElementById("mealsRecipesView");
  const tagsView = document.getElementById("tagsView");
  const shoppingView = document.getElementById("shoppingView");

  recipesView.classList.add("hidden");
  weeklyPlanView.classList.add("hidden");
  mealsRecipesView.classList.add("hidden");
  tagsView.classList.add("hidden");
  shoppingView.classList.remove("hidden");
  pageTitle.textContent = "Kauppalista";
  setHeaderBackAction(() => openRecipeSubView("home"));
  if (topbarMealsTools) topbarMealsTools.classList.add("hidden");
  if (topbarChoreTools) topbarChoreTools.classList.add("hidden");
  closeDrawer();
}

function openChoreSubView(view) {
  hideUserProfileView();
  const views = [
    "choresView",
    "weeklyChoresView",
    "choresListView",
    "addChoreView",
  ];
  const titles = {
    weekly: "Viikon Askareet",
    list: "Askareet",
    addChore: "Lisää uusi askare",
    home: "Askareet",
  };
  const viewMap = {
    weekly: "weeklyChoresView",
    list: "choresListView",
    addChore: "addChoreView",
    home: "choresView",
  };

  const targetView = viewMap[view] || "choresView";
  if (view === "home" || view === "weekly") weeklySelectionMode = false;

  views.forEach((v) => {
    document.getElementById(v).classList.toggle("hidden", v !== targetView);
  });

  pageTitle.textContent = titles[view] || "Askareet";
  if (topbarMealsTools) topbarMealsTools.classList.add("hidden");
  if (topbarChoreTools) {
    topbarChoreTools.classList.toggle("hidden", view !== "list");
  }
  const backByView = {
    weekly: () => openChoreSubView("home"),
    list: () => openChoreSubView(weeklySelectionMode ? "weekly" : "home"),
    addChore: () => openChoreSubView("list"),
    home: null,
  };
  setHeaderBackAction(backByView[view] || null);
  if (choresListView) {
    choresListView.classList.toggle("weekly-selection-mode", view === "list" && weeklySelectionMode);
  }
  if (choresHeaderRow) {
    choresHeaderRow.classList.toggle("hidden", view === "list" && weeklySelectionMode);
  }
  if (view === "list" || view === "weekly") renderChores();
  if (view === "weekly" && weeklyChoresWeekNumberLabel) {
    weeklyChoresWeekNumberLabel.textContent = `Viikko ${getCurrentWeekNumber()}`;
  }

  closeDrawer();
}

function handleTopbarNavButton() {
  if (headerBackAction) {
    headerBackAction();
    return;
  }
  openDrawer();
}

function setHeaderBackAction(action) {
  headerBackAction = typeof action === "function" ? action : null;
  const hasBack = !!headerBackAction;
  if (menuBtn) menuBtn.setAttribute("aria-label", hasBack ? "Back" : "Menu");
  if (headerMenuIcon) headerMenuIcon.classList.toggle("hidden", hasBack);
  if (headerBackIcon) headerBackIcon.classList.toggle("hidden", !hasBack);
}

function openDrawer() {
  if (!drawer || !drawerOverlay) return;
  drawerOverlay.classList.remove("hidden");
  drawer.classList.remove("hidden");
  drawer.classList.add("open");
  drawerOverlay.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  if (!drawer || !drawerOverlay) return;
  drawer.classList.remove("open");
  drawerOverlay.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    drawer.classList.add("hidden");
    drawerOverlay.classList.add("hidden");
  }, 170);
}

async function handleLogout() {
  revokePendingAvatarPreview();
  pendingAvatarFile = null;
  profileRemoveAvatarOnSave = false;
  clearFamilyListeners();
  appState.currentUserId = null;
  appState.currentUser = null;
  appState.currentFamily = null;
  appState.recipes = [];
  appState.tags = [];
  appState.chores = [];
  appState.weeklyChoreRows = [];
  appState.weeklyMeals = [];
  appState.members = [];
  localStorage.removeItem("userId");
  localStorage.removeItem("familyId");
  await signOut(auth);
  render();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** `crypto.randomUUID()` is missing or throws outside a secure context (http:// on a phone). */
function randomUuidV4() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    try {
      return c.randomUUID();
    } catch {
      /* fall through */
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let lastWeeklyChoreAddError = "";

function renderRecipeTable(targetList, options) {
  if (!targetList) return;
  targetList.innerHTML = "";
  const items = getFilteredAndSortedRecipes(options);
  const isMealsTable = targetList === recipeList;
  if (isMealsTable && mealsAddHeader) {
    mealsAddHeader.classList.toggle("hidden", !weeklySelectionMode);
  }
  if (isMealsTable && mealsSortName) {
    mealsSortName.textContent = weeklySelectionMode ? "Ruoka" : "Nimi";
  }
  if (isMealsTable && mealsLinkHeader) {
    mealsLinkHeader.classList.toggle("hidden", weeklySelectionMode);
  }
  if (isMealsTable && mealsDeleteHeader) {
    mealsDeleteHeader.classList.toggle("hidden", weeklySelectionMode);
  }

  items.forEach((recipe) => {
    const avgRating = getRecipeAverageRating(recipe);
    const safeUrl = normalizeRecipeUrl(recipe.url);
    const linkCell = !weeklySelectionMode && safeUrl
      ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">Link</a>`
      : "";
    const addCell =
      isMealsTable && weeklySelectionMode
        ? `<td><button type="button" class="mini row-add-btn" aria-label="Lisää">+</button></td>`
        : "";
    const deleteCell = !weeklySelectionMode
      ? '<td><button type="button" class="mini delete row-delete-btn" aria-label="Poista">×</button></td>'
      : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      ${addCell}
      <td>${escapeHtml(recipe.name || "")}</td>
      <td>${getStars(avgRating)}</td>
      <td>${escapeHtml(recipe.time || "")}</td>
      <td>${escapeHtml(recipe.tag || "")}</td>
      ${!weeklySelectionMode ? `<td>${linkCell}</td>` : ""}
      ${deleteCell}
    `;
    const addBtn = tr.querySelector(".row-add-btn");
    if (addBtn) {
      addBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const success = await addWeeklyMealRow(recipe.id);
        if (success) {
          window.alert("Ruoka lisätty viikkolistaan");
        }
      });
    }
    const deleteBtn = tr.querySelector(".row-delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await handleDeleteRecipe(recipe.id);
      });
    }
    tr.addEventListener("click", () => openRecipeDetailView(recipe));
    targetList.appendChild(tr);
  });
}

function renderWeeklyViews() {
  renderWeeklyPlanTable();
}

function renderWeeklyPlanTable() {
  if (!weeklyPlanList) return;
  weeklyPlanList.innerHTML = "";
  const rows = appState.weeklyMeals || [];
  rows.forEach((item) => {
    const recipe = appState.recipes.find((recipeItem) => recipeItem.id === item.recipeId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><button type="button" class="weekly-recipe-link">${escapeHtml(
        recipe?.name || "Tuntematon"
      )}</button></td>
      <td class="weekly-multi-cell">${buildWeeklyMultiDropdown(
        "day",
        weeklyDays,
        normalizeWeeklyMultiValue(item.day),
        item.id
      )}</td>
      <td class="weekly-multi-cell">${buildWeeklyMultiDropdown(
        "meal",
        mealTypes,
        normalizeWeeklyMultiValue(item.meal),
        item.id
      )}</td>
      <td><button type="button" class="mini row-note-btn">Huomio</button></td>
      <td><button type="button" class="mini delete row-delete-btn" aria-label="Poista">🗑</button></td>
    `;

    const recipeBtn = tr.querySelector(".weekly-recipe-link");
    if (recipeBtn) {
      recipeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (recipe) openRecipeDetailView(recipe);
      });
    }
    tr.querySelectorAll(".weekly-multi-dropdown").forEach((wrap) => {
      wireWeeklyMultiDropdown(wrap, item.id);
    });
    const noteBtn = tr.querySelector(".row-note-btn");
    if (noteBtn) {
      noteBtn.addEventListener("click", () => openWeeklyNoteSheet(item.id, item.note || ""));
    }
    const deleteBtn = tr.querySelector(".row-delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        await deleteWeeklyMeal(item.id);
      });
    }
    weeklyPlanList.appendChild(tr);
  });
}

function normalizeWeeklyMultiValue(raw) {
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }
  if (raw == null || raw === "") return [];
  return [String(raw).trim()].filter(Boolean);
}

function weeklyMultiLabelsHtml(values) {
  if (!values.length) {
    return `<span class="weekly-multi-placeholder">Valitse…</span>`;
  }
  return values
    .map((v) => `<span class="weekly-multi-chip">${escapeHtml(v)}</span>`)
    .join("");
}

function buildWeeklyMultiDropdown(field, options, selectedValues, weeklyMealId) {
  const selectedSet = new Set(selectedValues);
  const labelsHtml = weeklyMultiLabelsHtml(selectedValues);
  const checks = options
    .map(
      (value) => `
      <label class="weekly-multi-option">
        <input type="checkbox" value="${escapeHtml(value)}" ${
        selectedSet.has(value) ? "checked" : ""
      } />
        <span>${escapeHtml(value)}</span>
      </label>`
    )
    .join("");
  return `
    <div class="weekly-multi-dropdown" data-weekly-field="${escapeHtml(
      field
    )}" data-weekly-meal-id="${escapeHtml(weeklyMealId)}">
      <button type="button" class="weekly-multi-trigger">
        <span class="weekly-multi-labels">${labelsHtml}</span>
        <span class="weekly-multi-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="weekly-multi-panel hidden">${checks}</div>
    </div>
  `;
}

function onChoreKukaPanelViewportChange() {
  document.querySelectorAll(".weekly-chore-kuka-dropdown.is-open .weekly-multi-panel").forEach((panel) => {
    const wrap = panel.closest(".weekly-chore-kuka-dropdown");
    if (wrap && !panel.classList.contains("hidden")) {
      syncChoreKukaFixedPanelGeometry(wrap, panel);
    }
  });
}

function detachChoreKukaPanelViewportListeners() {
  window.removeEventListener("scroll", onChoreKukaPanelViewportChange, true);
  window.removeEventListener("resize", onChoreKukaPanelViewportChange);
}

function syncChoreKukaFixedPanelGeometry(wrap, panel) {
  const trigger = wrap.querySelector(".weekly-multi-trigger");
  if (!trigger) return;
  const r = trigger.getBoundingClientRect();
  const pad = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(Math.max(r.width, 120), vw - pad * 2);
  const left = Math.min(Math.max(pad, r.left), vw - pad - width);
  const spaceBelow = vh - r.bottom - pad;
  const spaceAbove = r.top - pad;
  let top = r.bottom + 4;
  let maxH = Math.max(120, spaceBelow - 6);
  if (spaceBelow < 160 && spaceAbove > spaceBelow) {
    maxH = Math.max(120, spaceAbove - 8);
    top = Math.max(pad, r.top - maxH - 8);
  }
  panel.style.position = "fixed";
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.width = `${width}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  panel.style.zIndex = "10000";
  panel.style.maxHeight = `${maxH}px`;
  panel.style.overflowY = "auto";
}

function positionChoreKukaDropdownPanel(wrap, panel, open) {
  if (!wrap || !panel) return;
  if (!open) {
    detachChoreKukaPanelViewportListeners();
    panel.style.position = "";
    panel.style.left = "";
    panel.style.top = "";
    panel.style.width = "";
    panel.style.right = "";
    panel.style.bottom = "";
    panel.style.zIndex = "";
    panel.style.maxHeight = "";
    panel.style.overflowY = "";
    return;
  }
  detachChoreKukaPanelViewportListeners();
  syncChoreKukaFixedPanelGeometry(wrap, panel);
  window.addEventListener("scroll", onChoreKukaPanelViewportChange, true);
  window.addEventListener("resize", onChoreKukaPanelViewportChange);
}

function closeAllWeeklyMultiPanels() {
  document.querySelectorAll(".weekly-multi-panel").forEach((p) => {
    const wrap = p.closest(".weekly-multi-dropdown");
    p.classList.add("hidden");
    wrap?.classList.remove("is-open");
    if (wrap?.classList.contains("weekly-chore-kuka-dropdown")) {
      positionChoreKukaDropdownPanel(wrap, p, false);
    }
  });
}

function setWeeklyMultiPanelOpen(wrap, panel, open) {
  if (!wrap || !panel) return;
  panel.classList.toggle("hidden", !open);
  wrap.classList.toggle("is-open", Boolean(open));
  if (wrap.classList.contains("weekly-chore-kuka-dropdown")) {
    positionChoreKukaDropdownPanel(wrap, panel, open);
  }
}

/** Stops the scrollable table/view from stealing the first touch on phones (iOS / Android). */
function attachWeeklyMultiDropdownTouchGuards(wrap) {
  if (!wrap || wrap.dataset.touchGuard === "1") return;
  wrap.dataset.touchGuard = "1";
  const trigger = wrap.querySelector(".weekly-multi-trigger");
  /* Do not stop touch propagation on the panel — iOS Safari may not toggle checkboxes or fire clicks. */
  [trigger].filter(Boolean).forEach((el) => {
    el.addEventListener(
      "touchstart",
      (event) => {
        event.stopPropagation();
      },
      { passive: true }
    );
    el.addEventListener(
      "touchend",
      (event) => {
        event.stopPropagation();
      },
      { passive: true }
    );
  });
}

function wireWeeklyMultiDropdown(wrap, weeklyMealId) {
  if (!wrap || wrap.dataset.wired === "1") return;
  wrap.dataset.wired = "1";
  const trigger = wrap.querySelector(".weekly-multi-trigger");
  const panel = wrap.querySelector(".weekly-multi-panel");
  const labelsEl = wrap.querySelector(".weekly-multi-labels");
  const field = wrap.dataset.weeklyField;
  if (!trigger || !panel || !labelsEl || !field) return;
  attachWeeklyMultiDropdownTouchGuards(wrap);

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const willOpen = panel.classList.contains("hidden");
    closeAllWeeklyMultiPanels();
    if (willOpen) setWeeklyMultiPanelOpen(wrap, panel, true);
  });

  panel.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", async (event) => {
      event.stopPropagation();
      const values = Array.from(panel.querySelectorAll('input[type="checkbox"]:checked'))
        .map((input) => input.value)
        .filter(Boolean);
      labelsEl.innerHTML = weeklyMultiLabelsHtml(values);
      await updateWeeklyMeal(weeklyMealId, { [field]: values });
    });
  });
}

if (typeof window !== "undefined" && !window.__weeklyMultiOutsideClose) {
  window.__weeklyMultiOutsideClose = true;
  const closeWeeklyMultiIfOutside = (event) => {
    if (event.target?.closest?.(".weekly-multi-dropdown")) return;
    const hadOpen = document.querySelector(".weekly-multi-dropdown.is-open");
    if (!hadOpen) return;
    closeAllWeeklyMultiPanels();
    if (event.type === "pointerdown" && event.pointerType === "touch") {
      event.preventDefault();
    }
  };
  document.addEventListener("click", closeWeeklyMultiIfOutside);
  document.addEventListener("pointerdown", closeWeeklyMultiIfOutside, true);
}

function populateRecipeTagSelect(tags) {
  if (!recipeTagSelect) return;
  populateTagSelect(recipeTagSelect, tags);
  if (editRecipeTagSelect) populateTagSelect(editRecipeTagSelect, tags);
  populateMealsTagFilter(tags);
}

function populateTagSelect(selectElement, tags) {
  const previousValue = selectElement.value;
  selectElement.innerHTML = `
    <option value="" disabled>Valitse tagi</option>
  `;
  tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    selectElement.appendChild(option);
  });
  if (previousValue && tags.includes(previousValue)) {
    selectElement.value = previousValue;
  } else {
    selectElement.value = "";
  }
}

function getFilteredAndSortedRecipes(options) {
  const filterValue = (options?.filter || "").toLowerCase();
  const sortValue = options?.sort || "name-asc";
  const timeFilter = options?.timeFilter || "all";
  const ratingFilter = options?.ratingFilter || "all";
  const tagFilter = options?.tagFilter || "all";
  const items = appState.recipes.filter((recipe) => {
    const avgRating = getRecipeAverageRating(recipe);
    if (timeFilter !== "all" && (recipe.time || "").toString().trim() !== timeFilter) {
      return false;
    }
    if (ratingFilter !== "all" && avgRating < Number(ratingFilter)) {
      return false;
    }
    if (tagFilter !== "all" && (recipe.tag || "").toString().trim() !== tagFilter) {
      return false;
    }
    if (!filterValue) return true;
    return [recipe.name, recipe.tag, recipe.time]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(filterValue));
  });

  items.sort((a, b) => compareBySort(sortValue, a, b, "name", "rating", "time"));
  return items;
}

let choreWeeklyAddBusy = false;

function wireChoreListWeeklyAddDelegation() {
  if (!choreList || choreList.dataset.weeklyAddDelegated === "1") return;
  choreList.dataset.weeklyAddDelegated = "1";

  const runAdd = async (event) => {
    if (!weeklySelectionMode || choreWeeklyAddBusy) return;
    const raw = event.target;
    const el = raw instanceof Element ? raw : raw?.parentElement;
    const btn = el?.closest?.(".row-add-btn");
    if (!btn || !choreList.contains(btn)) return;
    const choreId = btn.getAttribute("data-chore-id");
    if (!choreId) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    choreWeeklyAddBusy = true;
    try {
      const success = await addWeeklyChoreRow(choreId);
      if (success) {
        window.alert("Askare lisätty viikkolistaan");
      } else {
        const detail = lastWeeklyChoreAddError ? ` (${lastWeeklyChoreAddError})` : "";
        window.alert(
          `Viikkolistaan lisääminen epäonnistui.${detail} Jos käytät osoitetta http://, kokeile https:// tai localhost.`
        );
      }
    } finally {
      window.setTimeout(() => {
        choreWeeklyAddBusy = false;
      }, 400);
    }
  };

  choreList.addEventListener("click", runAdd, true);
  choreList.addEventListener(
    "pointerup",
    (event) => {
      if (event.pointerType === "mouse") return;
      void runAdd(event);
    },
    { passive: true }
  );
}

function renderChoreTable(targetList, options) {
  if (!targetList) return;
  targetList.innerHTML = "";
  const items = getFilteredAndSortedChores(options);
  const isChoreListTable = targetList === choreList;
  if (isChoreListTable && choresAddHeader) {
    choresAddHeader.classList.toggle("hidden", !weeklySelectionMode);
  }
  if (isChoreListTable && choresDeleteHeader) {
    choresDeleteHeader.classList.toggle("hidden", weeklySelectionMode);
    choresDeleteHeader.textContent = weeklySelectionMode ? "Poista" : "Toiminnot";
  }

  items.forEach((chore) => {
    const addCell = weeklySelectionMode
      ? `<td><button type="button" class="mini row-add-btn" data-chore-id="${escapeHtml(
          chore.id
        )}" aria-label="Lisää">+</button></td>`
      : "";
    const actionsCell = !weeklySelectionMode
      ? '<td class="row-actions-cell"><button type="button" class="mini row-menu-btn" aria-label="Toiminnot">⋮</button></td>'
      : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      ${addCell}
      <td>${escapeHtml(chore.title || "")}</td>
      <td>${escapeHtml(chore.load || "")}</td>
      ${buildChoreRecurringSwitchCell(chore.id, chore)}
      ${actionsCell}
    `;
    wireChoreRecurringSwitchInRow(tr);
    const menuBtn = tr.querySelector(".row-menu-btn");
    if (menuBtn) {
      menuBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleChoreRowMenu(menuBtn, chore);
      });
    }
    targetList.appendChild(tr);
  });
}

function toggleChoreRowMenu(anchorBtn, chore) {
  if (!anchorBtn || !chore) return;
  const sameAnchorOpen =
    activeChoreMenu &&
    activeChoreMenu.anchorBtn === anchorBtn &&
    activeChoreMenu.menuElement?.isConnected;
  if (sameAnchorOpen) {
    closeChoreRowMenu();
    return;
  }
  closeChoreRowMenu();

  const menu = document.createElement("div");
  menu.className = "row-action-menu";
  menu.innerHTML = `
    <button type="button" class="row-action-item" data-action="edit">Muokkaa</button>
    <button type="button" class="row-action-item delete" data-action="delete">Poista</button>
  `;
  const hostCell = anchorBtn.closest(".row-actions-cell");
  if (!hostCell) return;
  hostCell.style.position = "relative";
  hostCell.appendChild(menu);

  const handleMenuClick = async (event) => {
    const action = event.target?.dataset?.action;
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    closeChoreRowMenu();
    if (action === "edit") await handleEditChore(chore);
    if (action === "delete") await handleDeleteChore(chore.id);
  };
  menu.addEventListener("click", handleMenuClick);

  const handleDocumentClick = (event) => {
    if (!menu.contains(event.target) && event.target !== anchorBtn) {
      closeChoreRowMenu();
    }
  };
  const handleEscape = (event) => {
    if (event.key === "Escape") closeChoreRowMenu();
  };
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleEscape);
  activeChoreMenu = {
    anchorBtn,
    menuElement: menu,
    cleanup: () => {
      menu.removeEventListener("click", handleMenuClick);
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    },
  };
}

function closeChoreRowMenu() {
  if (!activeChoreMenu) return;
  activeChoreMenu.cleanup?.();
  if (activeChoreMenu.menuElement?.isConnected) {
    activeChoreMenu.menuElement.remove();
  }
  activeChoreMenu = null;
}

function toggleWeeklyChoreSort(column) {
  const state = tableState.weeklyChores;
  if (column === "title") {
    if ((state.sort || "").startsWith("title-")) {
      state.sort = state.sort === "title-asc" ? "title-desc" : "title-asc";
    } else {
      state.sort = "title-asc";
    }
  } else if (column === "load") {
    if ((state.sort || "").startsWith("load-")) {
      state.sort = state.sort === "load-desc" ? "load-asc" : "load-desc";
    } else {
      state.sort = "load-desc";
    }
  }
  renderChores();
}

function updateWeeklyChoreSortHeaders() {
  const sort = tableState.weeklyChores.sort || "title-asc";
  if (weeklyChoreSortAskareTh) {
    const active = sort.startsWith("title-");
    weeklyChoreSortAskareTh.setAttribute(
      "aria-sort",
      active ? (sort === "title-asc" ? "ascending" : "descending") : "none"
    );
  }
  if (weeklyChoreSortKuormaTh) {
    const active = sort.startsWith("load-");
    weeklyChoreSortKuormaTh.setAttribute(
      "aria-sort",
      active ? (sort === "load-asc" ? "ascending" : "descending") : "none"
    );
  }
}

function renderWeeklyChorePlanTable() {
  if (!weeklyChoreList) return;
  weeklyChoreList.innerHTML = "";
  const rows = getFilteredAndSortedWeeklyChoreRows(tableState.weeklyChores);
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.title || "Tuntematon")}</td>
      <td>${escapeHtml(row.load || "")}</td>
      ${buildChoreRecurringSwitchCell(row.choreId, row)}
      <td class="weekly-chore-kuka-cell">${buildWeeklyChoreKukaDropdownHtml(row)}</td>
      ${buildWeeklyChoreTehtyCell(row.id, row.doneCount)}
      <td><button type="button" class="mini delete row-delete-btn" aria-label="Poista">×</button></td>
    `;
    tr.querySelectorAll(".weekly-chore-kuka-dropdown").forEach((wrap) => {
      wireWeeklyChoreKukaDropdown(wrap);
    });
    wireChoreRecurringSwitchInRow(tr);
    wireWeeklyChoreTehtyCell(tr);
    const deleteBtn = tr.querySelector(".row-delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const groupKey = getWeeklyChoreGroupKey(row);
        const siblings = getWeeklyChoreSiblings(row);
        if (siblings.length > 1) {
          const confirmed = window.confirm(
            "Tämä askare on jaettu usealle henkilölle. Poistetaanko kaikki rivit tästä jaosta?"
          );
          if (!confirmed) return;
          await Promise.all(siblings.map((s) => deleteWeeklyChoreRow(s.id)));
        } else {
          await deleteWeeklyChoreRow(row.id);
        }
      });
    }
    weeklyChoreList.appendChild(tr);
  });
  updateWeeklyChoreSortHeaders();
  renderWeeklyChoreProgress();
  renderWeeklyChoreScoreboard();
}

function renderWeeklyChoreProgress() {
  if (!weeklyChoreProgress || !weeklyChoreProgressText || !weeklyChoreProgressFill) return;
  const myId = appState.currentUserId;
  const rows = (appState.weeklyChoreRows || []).filter(
    (row) => (row.assignedUserId || "").toString().trim() === myId
  );
  const total = rows.length;
  const done = rows.filter((row) => clampWeeklyDoneCount(row.doneCount) > 0).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  weeklyChoreProgressText.textContent =
    total > 0 ? `${done} / ${total} tehtävää` : "Ei omia askareita tällä viikolla";
  weeklyChoreProgressFill.style.width = `${percent}%`;
  weeklyChoreProgress.setAttribute("data-empty", total > 0 ? "0" : "1");

  const track = weeklyChoreProgress.querySelector(".weekly-chore-progress-track");
  if (track) {
    track.setAttribute("aria-valuenow", String(percent));
    track.setAttribute("aria-valuetext", `${done} / ${total}`);
  }
}

function renderWeeklyChoreScoreboard() {
  if (!weeklyChoreScoreboard || !weeklyChoreScoreboardSummary || !weeklyChoreScoreboardList) return;
  const choresById = new Map((appState.chores || []).map((c) => [c.id, c]));
  const scoreByUser = new Map();

  (appState.weeklyChoreRows || []).forEach((row) => {
    const uid = (row.assignedUserId || "").toString().trim();
    if (!uid) return;
    const chore = choresById.get(row.choreId);
    const load = Number(chore?.load) || 0;
    const done = clampWeeklyDoneCount(row.doneCount);
    const score = Math.max(0, load * done);
    scoreByUser.set(uid, (scoreByUser.get(uid) || 0) + score);
  });

  const ranked = Array.from(scoreByUser.entries())
    .map(([uid, score]) => {
      const member = (appState.members || []).find((m) => m.id === uid);
      return { uid, name: member?.name || "Nimetön", score };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "fi"));

  const total = ranked.reduce((sum, item) => sum + item.score, 0);
  const myId = appState.currentUserId;
  const mine = ranked.find((item) => item.uid === myId);
  const myScore = mine?.score || 0;
  const myPct = total > 0 ? Math.round((myScore / total) * 100) : 0;
  weeklyChoreScoreboardSummary.textContent = `${myPct}%`;

  if (!ranked.length) {
    weeklyChoreScoreboardList.innerHTML =
      '<div class="weekly-chore-scoreboard-empty">Ei vielä pisteitä.</div>';
    return;
  }

  const topScore = ranked[0]?.score || 0;
  const winnerUids = new Set(
    topScore > 0 ? ranked.filter((item) => item.score === topScore).map((item) => item.uid) : []
  );

  weeklyChoreScoreboardList.innerHTML = ranked
    .map((item) => {
      const pct = total > 0 ? Math.round((item.score / total) * 100) : 0;
      const isMe = item.uid === myId;
      const crown = winnerUids.has(item.uid) ? " 👑" : "";
      return `
        <div class="weekly-score-row${isMe ? " mine" : ""}">
          <div class="weekly-score-row-head">
            <span>${escapeHtml(item.name)}</span>
            <span>${pct}%${crown}</span>
          </div>
          <div class="weekly-score-track">
            <div class="weekly-score-fill" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function getFilteredAndSortedChores(options) {
  const filterValue = (options?.filter || "").toLowerCase();
  const sortValue = options?.sort || "title-asc";
  const items = appState.chores.filter((chore) => {
    if (!filterValue) return true;
    return [chore.title, chore.load, chore.default]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(filterValue));
  });

  items.sort((a, b) => compareBySort(sortValue, a, b, "title", "load", "default"));
  return items;
}

function getFilteredAndSortedWeeklyChoreRows(options) {
  const filterValue = (options?.filter || "").toLowerCase();
  const sortValue = options?.sort || "title-asc";
  const rows = (appState.weeklyChoreRows || []).map((row) => {
    const chore = appState.chores.find((item) => item.id === row.choreId);
    const assignee = appState.members.find((m) => m.id === row.assignedUserId);
    return {
      id: row.id,
      choreId: row.choreId,
      assignmentGroupId: row.assignmentGroupId,
      assignedUserId: (row.assignedUserId || "").toString().trim(),
      assigneeName: assignee?.name || "",
      title: chore?.title || "",
      load: chore?.load || "",
      default: chore?.default,
      isDefault: chore?.isDefault,
      doneCount: Math.max(0, Math.min(99, Math.floor(Number(row.doneCount) || 0))),
    };
  });
  const filtered = rows.filter((row) => {
    if (!filterValue) return true;
    return [row.title, row.load, row.default, row.assigneeName, String(row.doneCount ?? "")]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(filterValue));
  });
  filtered.sort((a, b) => compareBySort(sortValue, a, b, "title", "load", "default"));
  return filtered;
}

function compareBySort(sortValue, a, b, defaultKey, numericKey, fallbackKey) {
  if (sortValue.includes("rating")) {
    const dir = sortValue.endsWith("desc") ? -1 : 1;
    return dir * (getRecipeAverageRating(a) - getRecipeAverageRating(b));
  }

  const [key, direction] = sortValue.split("-");
  if (key === numericKey) {
    const aNum = Number(a[key] ?? a[fallbackKey] ?? 0);
    const bNum = Number(b[key] ?? b[fallbackKey] ?? 0);
    const baseNum = aNum - bNum;
    return direction === "desc" ? -baseNum : baseNum;
  }
  const resolvedKey = key || defaultKey;
  const aVal = String(a[resolvedKey] ?? a[fallbackKey] ?? "").toLowerCase();
  const bVal = String(b[resolvedKey] ?? b[fallbackKey] ?? "").toLowerCase();
  const base = aVal.localeCompare(bVal, "fi");
  return direction === "desc" ? -base : base;
}

function isRecurringDefaultValue(item) {
  if (!item) return false;
  const raw = (item.default ?? item.isDefault ?? "")
    .toString()
    .trim()
    .toLowerCase();
  if (!raw) return false;
  return ["kyllä", "k", "yes", "true", "1", "on"].includes(raw);
}

function getDefaultLabel(item) {
  return isRecurringDefaultValue(item) ? "Kyllä" : "Ei";
}

function buildChoreRecurringSwitchCell(choreId, item) {
  const on = isRecurringDefaultValue(item);
  return `<td class="chore-recurring-cell">
    <label class="chore-recurring-switch">
      <input type="checkbox" class="chore-recurring-input" data-chore-id="${escapeHtml(
        choreId
      )}" ${on ? "checked" : ""} aria-label="Toistuva askare" title="Toistuva askare" />
    </label>
  </td>`;
}

function wireChoreRecurringSwitchInRow(tr) {
  const input = tr.querySelector("input.chore-recurring-input");
  if (!input) return;
  const choreId = input.getAttribute("data-chore-id");
  if (!choreId) return;
  input.addEventListener("change", async (event) => {
    event.stopPropagation();
    const checked = Boolean(input.checked);
    await updateChoreRecurring(choreId, checked);
  });
}

function clampWeeklyDoneCount(value) {
  return Math.max(0, Math.min(99, Math.floor(Number(value) || 0)));
}

function buildWeeklyChoreTehtyCell(weeklyChoreId, doneCount) {
  const n = clampWeeklyDoneCount(doneCount);
  return `<td class="weekly-chore-tehty-cell">
    <div class="weekly-chore-tehty-controls" data-weekly-chore-id="${escapeHtml(weeklyChoreId)}">
      <button type="button" class="mini weekly-tehty-step" data-delta="-1" aria-label="Vähennä">−</button>
      <input type="number" class="weekly-tehty-input" min="0" max="99" step="1" value="${n}" inputmode="numeric" aria-label="Montako kertaa tehty" />
      <button type="button" class="mini weekly-tehty-step" data-delta="1" aria-label="Lisää">+</button>
    </div>
  </td>`;
}

function wireWeeklyChoreTehtyCell(tr) {
  const wrap = tr.querySelector(".weekly-chore-tehty-controls");
  if (!wrap) return;
  const weeklyChoreId = wrap.getAttribute("data-weekly-chore-id");
  if (!weeklyChoreId) return;
  const input = wrap.querySelector(".weekly-tehty-input");
  if (!input) return;

  const commitFromInput = async () => {
    const v = clampWeeklyDoneCount(input.value);
    input.value = String(v);
    await updateWeeklyChoreDoneCount(weeklyChoreId, v);
  };

  wrap.querySelectorAll(".weekly-tehty-step").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const delta = Number(btn.getAttribute("data-delta")) || 0;
      const v = clampWeeklyDoneCount((Number(input.value) || 0) + delta);
      input.value = String(v);
      await updateWeeklyChoreDoneCount(weeklyChoreId, v);
    });
  });
  input.addEventListener("change", (event) => {
    event.stopPropagation();
    void commitFromInput();
  });
  input.addEventListener("blur", () => {
    void commitFromInput();
  });
}

function collectWeeklyChoreDoneCounts(siblings) {
  const byUser = new Map();
  let unassigned = 0;
  (siblings || []).forEach((s) => {
    const uid = (s.assignedUserId || "").toString().trim();
    const c = clampWeeklyDoneCount(s.doneCount);
    if (uid) {
      byUser.set(uid, Math.max(c, byUser.get(uid) || 0));
    } else {
      unassigned = Math.max(unassigned, c);
    }
  });
  return { byUser, unassigned };
}

function getStars(ratingValue) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(ratingValue) || 0)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

function getRecipeRatingsMap(recipe) {
  if (!recipe) return {};
  const map = recipe.ratingsByUser;
  if (map && typeof map === "object") return map;
  return {};
}

function getRecipeAverageRating(recipe) {
  const map = getRecipeRatingsMap(recipe);
  const values = Object.values(map)
    .map((value) => Number(value) || 0)
    .filter((value) => value > 0);
  if (values.length > 0) {
    const sum = values.reduce((acc, value) => acc + value, 0);
    return Number((sum / values.length).toFixed(1));
  }
  return Number(recipe?.rating) || 0;
}

function getUserRecipeRating(recipe) {
  if (!appState.currentUserId) return 0;
  const map = getRecipeRatingsMap(recipe);
  return Number(map[appState.currentUserId]) || 0;
}

function normalizeRecipeUrl(value) {
  const raw = (value ?? "").toString().trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower === "#" || lower === "null" || lower === "undefined") return "";
  return raw;
}

async function addWeeklyMealRow(recipeId) {
  const family = appState.currentFamily;
  if (!family || !recipeId) return false;
  try {
    await addDoc(collection(db, "families", family.id, "weeklyMeals"), {
      recipeId,
      day: [weeklyDays[0]],
      meal: [mealTypes[0]],
      note: "",
      createdBy: appState.currentUserId,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    setupMessage.textContent = `Could not add weekly meal (${getFirebaseError(error)}).`;
    console.error(error);
    return false;
  }
}

function getWeeklyChoreGroupKey(row) {
  if (!row) return "";
  return row.assignmentGroupId || row.id;
}

function getWeeklyChoreSiblings(row) {
  if (!row?.choreId) return [];
  const groupKey = getWeeklyChoreGroupKey(row);
  return (appState.weeklyChoreRows || []).filter(
    (r) =>
      r.choreId === row.choreId &&
      (r.assignmentGroupId || r.id) === groupKey
  );
}

function getAssigneeIdsForWeeklyChoreGroup(row) {
  return getWeeklyChoreSiblings(row)
    .map((r) => (r.assignedUserId || "").toString().trim())
    .filter(Boolean);
}

function weeklyChoreSingleAssigneeLabelHtml(assignedUserId) {
  const id = (assignedUserId || "").toString().trim();
  if (!id) {
    return `<span class="weekly-multi-placeholder">Valitse…</span>`;
  }
  const member = (appState.members || []).find((m) => m.id === id);
  const name = member?.name || "Nimetön";
  return `<span class="weekly-multi-chip">${escapeHtml(name)}</span>`;
}

function buildWeeklyChoreKukaDropdownHtml(row) {
  const members = appState.members || [];
  if (!members.length) {
    return `<span class="weekly-chore-kuka-empty">Ei perheen jäseniä</span>`;
  }
  const selectedIds = getAssigneeIdsForWeeklyChoreGroup(row);
  const selectedSet = new Set(selectedIds.map(String));
  const labelsHtml = weeklyChoreSingleAssigneeLabelHtml(row.assignedUserId);
  const checks = members
    .map(
      (m) => `
      <label class="weekly-multi-option">
        <input type="checkbox" value="${escapeHtml(m.id)}" ${
        selectedSet.has(String(m.id)) ? "checked" : ""
      } />
        <span>${escapeHtml(m.name || "Nimetön")}</span>
      </label>`
    )
    .join("");
  return `
    <div class="weekly-multi-dropdown weekly-chore-kuka-dropdown" data-weekly-chore-id="${escapeHtml(
      row.id
    )}">
      <button type="button" class="weekly-multi-trigger" aria-label="Kuka" aria-haspopup="listbox">
        <span class="weekly-multi-labels">${labelsHtml}</span>
        <span class="weekly-multi-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="weekly-multi-panel hidden" role="listbox">${checks}</div>
    </div>
  `;
}

function wireWeeklyChoreKukaDropdown(wrap) {
  if (!wrap || wrap.dataset.kukaWired === "1") return;
  wrap.dataset.kukaWired = "1";
  const trigger = wrap.querySelector(".weekly-multi-trigger");
  const panel = wrap.querySelector(".weekly-multi-panel");
  const anchorId = wrap.dataset.weeklyChoreId;
  if (!trigger || !panel || !anchorId) return;
  attachWeeklyMultiDropdownTouchGuards(wrap);

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const willOpen = panel.classList.contains("hidden");
    closeAllWeeklyMultiPanels();
    if (willOpen) setWeeklyMultiPanelOpen(wrap, panel, true);
  });

  /* `change` fires once per toggle; panel `click` on iOS often fires twice (label + input). */
  let applyDebounceTimer = null;
  const scheduleApplyFromPanel = () => {
    window.clearTimeout(applyDebounceTimer);
    applyDebounceTimer = window.setTimeout(() => {
      applyDebounceTimer = null;
      void (async () => {
        const values = Array.from(panel.querySelectorAll('input[type="checkbox"]:checked'))
          .map((input) => input.value)
          .filter(Boolean);
        await applyWeeklyChoreAssignees(anchorId, values);
      })();
    }, 90);
  };

  panel.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      event.stopPropagation();
      scheduleApplyFromPanel();
    });
  });
}

async function applyWeeklyChoreAssignees(anchorWeeklyChoreId, selectedUserIds) {
  const family = appState.currentFamily;
  if (!family || !anchorWeeklyChoreId) return;
  const row = appState.weeklyChoreRows.find((r) => r.id === anchorWeeklyChoreId);
  if (!row?.choreId) return;
  const siblings = getWeeklyChoreSiblings(row);
  const normalized = [...new Set((selectedUserIds || []).map(String).filter(Boolean))];
  const nextKey = normalized.slice().sort().join("|");
  const currentKey = getAssigneeIdsForWeeklyChoreGroup(row)
    .map(String)
    .sort()
    .join("|");
  if (nextKey === currentKey) return;

  try {
    const { byUser, unassigned } = collectWeeklyChoreDoneCounts(siblings);
    const batch = writeBatch(db);
    siblings.forEach((s) => {
      batch.delete(doc(db, "families", family.id, "weeklyChores", s.id));
    });
    const newGroupId = randomUuidV4();
    if (normalized.length === 0) {
      const ref = doc(collection(db, "families", family.id, "weeklyChores"));
      batch.set(ref, {
        choreId: row.choreId,
        assignedUserId: "",
        assignmentGroupId: newGroupId,
        createdBy: appState.currentUserId,
        createdAt: serverTimestamp(),
        doneCount: unassigned,
      });
    } else {
      normalized.forEach((uid, idx) => {
        const ref = doc(collection(db, "families", family.id, "weeklyChores"));
        const preserved = byUser.get(uid);
        const doneCount =
          preserved !== undefined
            ? preserved
            : byUser.size === 0 && unassigned > 0 && idx === 0
              ? unassigned
              : 0;
        batch.set(ref, {
          choreId: row.choreId,
          assignedUserId: uid,
          assignmentGroupId: newGroupId,
          createdBy: appState.currentUserId,
          createdAt: serverTimestamp(),
          doneCount,
        });
      });
    }
    await batch.commit();
  } catch (error) {
    setupMessage.textContent = `Could not update assignees (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

async function addWeeklyChoreRow(choreId) {
  const family = appState.currentFamily;
  lastWeeklyChoreAddError = "";
  if (!family || !choreId) {
    lastWeeklyChoreAddError = !family ? "Perhe puuttuu." : "Askareen tunniste puuttuu.";
    return false;
  }
  try {
    const newGroupId = randomUuidV4();
    await addDoc(collection(db, "families", family.id, "weeklyChores"), {
      choreId,
      assignedUserId: "",
      assignmentGroupId: newGroupId,
      doneCount: 0,
      createdBy: appState.currentUserId,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    lastWeeklyChoreAddError = getFirebaseError(error);
    setupMessage.textContent = `Could not add weekly chore (${lastWeeklyChoreAddError}).`;
    console.error(error);
    return false;
  }
}

async function updateWeeklyChoreDoneCount(weeklyChoreId, doneCount) {
  const family = appState.currentFamily;
  if (!family || !weeklyChoreId) return;
  const n = clampWeeklyDoneCount(doneCount);
  try {
    await updateDoc(doc(db, "families", family.id, "weeklyChores", weeklyChoreId), {
      doneCount: n,
      updatedAt: serverTimestamp(),
    });
    const r = appState.weeklyChoreRows.find((row) => row.id === weeklyChoreId);
    if (r) r.doneCount = n;
    renderWeeklyChorePlanTable();
  } catch (error) {
    setupMessage.textContent = `Could not update Tehty (${getFirebaseError(error)}).`;
    console.error(error);
    renderWeeklyChorePlanTable();
  }
}

async function deleteWeeklyChoreRow(weeklyChoreId) {
  const family = appState.currentFamily;
  if (!family || !weeklyChoreId) return;
  try {
    await deleteDoc(doc(db, "families", family.id, "weeklyChores", weeklyChoreId));
  } catch (error) {
    setupMessage.textContent = `Could not delete weekly chore (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

async function handleClearWeeklyChores() {
  const family = appState.currentFamily;
  if (!family) return;
  if (!appState.weeklyChoreRows.length) return;
  const confirmed = window.confirm(
    "Poistetaanko viikon askareista ne, jotka eivät ole toistuvia? Toistuviksi merkityt (Kyllä) jäävät listalle."
  );
  if (!confirmed) return;
  const rowsToDelete = appState.weeklyChoreRows.filter((row) => {
    const chore = appState.chores.find((c) => c.id === row.choreId);
    if (!chore) return true;
    return !isRecurringDefaultValue(chore);
  });
  if (!rowsToDelete.length) {
    window.alert("Ei poistettavia rivejä — kaikki listalla olevat askareet on merkitty toistuviksi.");
    return;
  }
  try {
    await Promise.all(
      rowsToDelete.map((row) => deleteDoc(doc(db, "families", family.id, "weeklyChores", row.id)))
    );
  } catch (error) {
    setupMessage.textContent = `Could not clear weekly chores (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

async function updateWeeklyMeal(weeklyMealId, patch) {
  const family = appState.currentFamily;
  if (!family || !weeklyMealId) return;
  try {
    await updateDoc(doc(db, "families", family.id, "weeklyMeals", weeklyMealId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    setupMessage.textContent = `Could not update weekly meal (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

async function deleteWeeklyMeal(weeklyMealId) {
  const family = appState.currentFamily;
  if (!family || !weeklyMealId) return;
  try {
    await deleteDoc(doc(db, "families", family.id, "weeklyMeals", weeklyMealId));
  } catch (error) {
    setupMessage.textContent = `Could not delete weekly meal (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

async function handleClearWeeklyPlan() {
  const family = appState.currentFamily;
  if (!family) return;
  if (!appState.weeklyMeals.length) return;
  const confirmed = window.confirm("Tyhjennetäänkö viikon ruokalista");
  if (!confirmed) return;
  try {
    await Promise.all(
      appState.weeklyMeals.map((item) =>
        deleteDoc(doc(db, "families", family.id, "weeklyMeals", item.id))
      )
    );
  } catch (error) {
    setupMessage.textContent = `Could not clear weekly plan (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

function openRandomWeeklySheet() {
  if (randomWeeklyOverlay) randomWeeklyOverlay.classList.remove("hidden");
  if (randomWeeklySheet) randomWeeklySheet.classList.remove("hidden");
}

function closeRandomWeeklySheet() {
  if (randomWeeklyOverlay) randomWeeklyOverlay.classList.add("hidden");
  if (randomWeeklySheet) randomWeeklySheet.classList.add("hidden");
}

function shuffleArrayInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function handleRandomWeeklyGo() {
  const rawCount = Number.parseInt(String(randomWeeklyCount?.value || "3"), 10);
  const n = Math.max(1, Math.min(30, Number.isFinite(rawCount) ? rawCount : 3));
  const timeFilter = randomWeeklyTimeFilter?.value || "all";
  const ratingFilter = randomWeeklyRatingFilter?.value || "all";
  const tagFilter = randomWeeklyTagFilter?.value || "all";

  let pool = getFilteredAndSortedRecipes({
    filter: "",
    sort: "name-asc",
    timeFilter,
    ratingFilter,
    tagFilter,
  });
  const usedIds = new Set((appState.weeklyMeals || []).map((row) => row.recipeId));
  pool = pool.filter((recipe) => !usedIds.has(recipe.id));

  if (!pool.length) {
    window.alert(
      "Yhtään sopivaa ruokaa ei löytynyt suodattimilla tai kaikki sopivat ovat jo viikolla."
    );
    return;
  }

  shuffleArrayInPlace(pool);
  const take = Math.min(n, pool.length);
  const chosen = pool.slice(0, take);

  let added = 0;
  for (const recipe of chosen) {
    const ok = await addWeeklyMealRow(recipe.id);
    if (ok) added += 1;
  }

  closeRandomWeeklySheet();
  if (added > 0) {
    window.alert(`Lisättiin ${added} ruokaa viikolle.`);
  } else {
    window.alert("Ruokia ei voitu lisätä.");
  }
}

function openWeeklyNoteSheet(weeklyMealId, currentNote) {
  activeWeeklyNoteId = weeklyMealId;
  if (weeklyNoteText) weeklyNoteText.value = currentNote || "";
  if (weeklyNoteOverlay) weeklyNoteOverlay.classList.remove("hidden");
  if (weeklyNoteForm) weeklyNoteForm.classList.remove("hidden");
}

function closeWeeklyNoteSheet() {
  activeWeeklyNoteId = null;
  if (weeklyNoteOverlay) weeklyNoteOverlay.classList.add("hidden");
  if (weeklyNoteForm) weeklyNoteForm.classList.add("hidden");
}

async function saveWeeklyNote() {
  if (!activeWeeklyNoteId) return;
  const note = (weeklyNoteText?.value || "").trim();
  await updateWeeklyMeal(activeWeeklyNoteId, { note });
  closeWeeklyNoteSheet();
}

function getCurrentWeekNumber() {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

function populateMealsTagFilter(tags) {
  const fillTagSelect = (selectEl, previousValue, onResetToAll) => {
    if (!selectEl) return;
    const prev = previousValue || "all";
    selectEl.innerHTML = `<option value="all">Kaikki tagit</option>`;
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      selectEl.appendChild(option);
    });
    if (prev === "all" || tags.includes(prev)) {
      selectEl.value = prev;
    } else {
      selectEl.value = "all";
      if (onResetToAll) onResetToAll();
    }
  };

  if (mealsRecipeTagFilter) {
    const previousValue = mealsRecipeTagFilter.value || "all";
    fillTagSelect(mealsRecipeTagFilter, previousValue, () => {
      tableState.mealsRecipes.tagFilter = "all";
    });
  }

  if (randomWeeklyTagFilter) {
    const previousRandom = randomWeeklyTagFilter.value || "all";
    fillTagSelect(randomWeeklyTagFilter, previousRandom, null);
  }
}

function toggleMealsSort(key) {
  const current = tableState.mealsRecipes.sort || "name-asc";
  const isSameKey = current.startsWith(`${key}-`);
  const nextDirection = isSameKey && current.endsWith("asc") ? "desc" : "asc";
  tableState.mealsRecipes.sort = `${key}-${nextDirection}`;
  renderRecipes();
}

function resetAddRecipeForm() {
  if (!addRecipeForm) return;
  addRecipeForm.reset();
  addRecipeForm.querySelectorAll(".has-value").forEach((field) => {
    field.classList.remove("has-value");
  });
}

function wireFilledFieldBorders() {
  wireFilledBordersForForm(addRecipeForm);
  wireFilledBordersForForm(editRecipeForm);
}

function wireFilledBordersForForm(formElement) {
  if (!formElement) return;
  const fields = formElement.querySelectorAll("input, select, textarea");
  fields.forEach((field) => {
    const refresh = () => {
      const hasFile = field.type === "file" && field.files && field.files.length > 0;
      const hasValue = hasFile || !!field.value;
      field.classList.toggle("has-value", hasValue);
    };
    field.addEventListener("input", refresh);
    field.addEventListener("change", refresh);
    refresh();
  });
}

function openRecipeEditForm() {
  if (!editRecipeForm || !activeRecipeId) return;
  const recipe = appState.recipes.find((item) => item.id === activeRecipeId);
  if (!recipe) return;

  editRecipeForm.elements.recipeName.value = recipe.name || "";
  editRecipeForm.elements.rating.value = getUserRecipeRating(recipe) || 0;
  editRecipeForm.elements.recipeTime.value = recipe.time || "";
  editRecipeForm.elements.recipeTag.value = recipe.tag || "";
  editRecipeForm.elements.recipeURL.value = recipe.url || "";
  editRecipeForm.elements.recipeText.value = recipe.text || "";
  editRecipeForm.elements.recipeImageFile.value = "";
  wireFilledBordersForForm(editRecipeForm);
  editRecipeForm.classList.remove("hidden");
  if (editRecipeOverlay) editRecipeOverlay.classList.remove("hidden");
}

function closeRecipeEditForm() {
  if (!editRecipeForm) return;
  editRecipeForm.classList.add("hidden");
  if (editRecipeOverlay) editRecipeOverlay.classList.add("hidden");
  editRecipeForm.reset();
  editRecipeForm.querySelectorAll(".has-value").forEach((field) => {
    field.classList.remove("has-value");
  });
}

async function handleDeleteRecipe(recipeId) {
  const family = appState.currentFamily;
  if (!family || !recipeId) return;
  try {
    await deleteDoc(doc(db, "families", family.id, "recipes", recipeId));
  } catch (error) {
    setupMessage.textContent = `Could not delete recipe (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

async function handleDeleteChore(choreId) {
  const family = appState.currentFamily;
  if (!family || !choreId) return;
  try {
    await deleteDoc(doc(db, "families", family.id, "chores", choreId));
  } catch (error) {
    setupMessage.textContent = `Could not delete chore (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

async function updateChoreRecurring(choreId, isRecurring) {
  const family = appState.currentFamily;
  if (!family || !choreId) return;
  const nextDefault = isRecurring ? "Kyllä" : "Ei";
  try {
    await updateDoc(doc(db, "families", family.id, "chores", choreId), {
      default: nextDefault,
      updatedAt: serverTimestamp(),
    });
    const chore = appState.chores.find((c) => c.id === choreId);
    if (chore) {
      chore.default = nextDefault;
    }
    renderChores();
  } catch (error) {
    setupMessage.textContent = `Could not update askare (${getFirebaseError(error)}).`;
    console.error(error);
    renderChores();
  }
}

async function handleEditChore(chore) {
  const family = appState.currentFamily;
  if (!family || !chore?.id) return;
  const nextTitle = window.prompt("Muokkaa askareen nimeä", chore.title || "");
  if (nextTitle === null) return;
  const title = nextTitle.toString().trim();
  if (!title) return;

  const nextLoad = window.prompt("Muokkaa kuormaa (1-10)", String(chore.load || "5"));
  if (nextLoad === null) return;
  const loadNum = Number(nextLoad);
  const load = Number.isFinite(loadNum) ? String(Math.max(1, Math.min(10, loadNum))) : "5";

  try {
    await updateDoc(doc(db, "families", family.id, "chores", chore.id), {
      title,
      load,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    setupMessage.textContent = `Could not update chore (${getFirebaseError(error)}).`;
    console.error(error);
  }
}

async function loadUserProfile() {
  const userRef = doc(db, "users", appState.currentUserId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    appState.currentUser = null;
    appState.currentFamily = null;
    clearFamilyListeners();
    return;
  }

  appState.currentUser = { id: snap.id, ...snap.data() };

  if (appState.currentUser.familyId) {
    localStorage.setItem("familyId", appState.currentUser.familyId);
    await attachFamilyListeners(appState.currentUser.familyId);
  } else {
    appState.currentFamily = null;
    appState.recipes = [];
    appState.tags = [];
    appState.chores = [];
    appState.weeklyChoreRows = [];
    appState.weeklyMeals = [];
    appState.members = [];
    localStorage.removeItem("familyId");
    clearFamilyListeners();
  }
}

async function attachFamilyListeners(familyId) {
  clearFamilyListeners();
  const familyRef = doc(db, "families", familyId);

  unsubs.family = onSnapshot(familyRef, async (familySnap) => {
    if (!familySnap.exists()) {
      appState.currentFamily = null;
      appState.recipes = [];
      appState.tags = [];
      appState.chores = [];
      appState.weeklyChoreRows = [];
      appState.weeklyMeals = [];
      appState.members = [];
      render();
      return;
    }
    appState.currentFamily = { id: familySnap.id, ...familySnap.data() };
    await loadFamilyMembers(appState.currentFamily.members || []);
    render();
  });

  unsubs.recipes = onSnapshot(
    collection(db, "families", familyId, "recipes"),
    (snap) => {
      appState.recipes = snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      renderRecipes();
    }
  );

  unsubs.tags = onSnapshot(collection(db, "families", familyId, "tags"), (snap) => {
    appState.tags = snap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
    renderRecipes();
  });

  unsubs.chores = onSnapshot(
    collection(db, "families", familyId, "chores"),
    (snap) => {
      appState.chores = snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      renderChores();
    }
  );

  unsubs.weeklyChores = onSnapshot(
    collection(db, "families", familyId, "weeklyChores"),
    (snap) => {
      appState.weeklyChoreRows = snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      renderWeeklyChorePlanTable();
    }
  );

  unsubs.weeklyMeals = onSnapshot(
    collection(db, "families", familyId, "weeklyMeals"),
    (snap) => {
      appState.weeklyMeals = snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      renderWeeklyPlanTable();
    }
  );
}

function clearFamilyListeners() {
  if (unsubs.family) unsubs.family();
  if (unsubs.recipes) unsubs.recipes();
  if (unsubs.tags) unsubs.tags();
  if (unsubs.chores) unsubs.chores();
  if (unsubs.weeklyChores) unsubs.weeklyChores();
  if (unsubs.weeklyMeals) unsubs.weeklyMeals();
  unsubs.family = null;
  unsubs.recipes = null;
  unsubs.tags = null;
  unsubs.chores = null;
  unsubs.weeklyChores = null;
  unsubs.weeklyMeals = null;
}

async function pinExists(pin) {
  const snap = await getDocs(
    query(collection(db, "families"), where("pin", "==", pin))
  );
  return !snap.empty;
}

async function loadFamilyMembers(memberIds) {
  const users = await Promise.all(
    memberIds.map((id) => getDoc(doc(db, "users", id)))
  );
  appState.members = users
    .filter((snap) => snap.exists())
    .map((snap) => ({ id: snap.id, ...snap.data() }));
}

async function updateDocOrSet(docRef, data) {
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await updateDoc(docRef, data);
    return;
  }
  await setDoc(docRef, data);
}

function setSignInReady(isReady) {
  signInBtn.disabled = !isReady;
  signInBtn.textContent = isReady ? "Log in" : "Connecting...";
}

function clearAuthReadyTimeout() {
  if (!authReadyTimeoutId) return;
  window.clearTimeout(authReadyTimeoutId);
  authReadyTimeoutId = null;
}

function getFirebaseError(error) {
  if (!error) return "unknown";
  return error.code || error.message || "unknown";
}