import { useEffect } from "react";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import Rating from "@mui/material/Rating";
import List from "@mui/material/List";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ChecklistIcon from "@mui/icons-material/Checklist";
import GroupIcon from "@mui/icons-material/Group";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import "../styles.css";

export default function App() {
  useEffect(() => {
    if (window.__kotiTyotBootstrapped) return;
    window.__kotiTyotBootstrapped = true;
    import("../app.js");
  }, []);

  return (
    <main className="app-shell">
      <section id="authPanel" className="panel">
        <h2>Tervetuloa</h2>
        <p className="hint">Valitse kirjautuminen tai perheen perustaminen.</p>
        <div className="setup-actions">
          <button id="authLoginModeBtn" type="button" aria-pressed="true">
            Log in
          </button>
          <button id="createFamilyBtn" type="button" className="secondary" aria-pressed="false">
            Create family
          </button>
          <button id="joinFamilyBtn" type="button" className="secondary" aria-pressed="false">
            Join family
          </button>
        </div>
        <p id="authMessage" className="hint" />
        <p id="setupMessage" className="hint" />
        <form id="signInForm" className="stack auth-mode-form">
          <label htmlFor="loginUsername">Username</label>
          <input id="loginUsername" name="username" autoComplete="username" required />
          <label htmlFor="loginPassword">Password</label>
          <input
            id="loginPassword"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <button type="submit">Log in</button>
        </form>
        <form id="createFamilyForm" className="stack auth-mode-form hidden">
          <label htmlFor="createDisplayName">Your name</label>
          <input id="createDisplayName" name="displayName" required />
          <label htmlFor="createUsername">Username</label>
          <input id="createUsername" name="username" autoComplete="username" required />
          <label htmlFor="createPassword">Password</label>
          <input
            id="createPassword"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <label htmlFor="familyName">Family name</label>
          <input id="familyName" name="familyName" required />
          <button type="submit">Create</button>
        </form>
        <form id="joinFamilyForm" className="stack auth-mode-form hidden">
          <label htmlFor="joinDisplayName">Your name</label>
          <input id="joinDisplayName" name="displayName" required />
          <label htmlFor="joinUsername">Username</label>
          <input id="joinUsername" name="username" autoComplete="username" required />
          <label htmlFor="joinPassword">Password</label>
          <input
            id="joinPassword"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
          <label htmlFor="familyPin">Family PIN</label>
          <input id="familyPin" name="familyPin" required />
          <button type="submit">Join</button>
        </form>
      </section>
      <section id="appPanel" className="phone hidden">
        <header className="phone-topbar">
          <div className="phone-topbar-main">
            <button id="menuBtn" type="button" className="icon-button">
              <span id="headerMenuIcon">☰</span>
              <ArrowBackIosNewIcon id="headerBackIcon" className="hidden" fontSize="small" />
            </button>
            <h2 id="pageTitle">Ruoka</h2>
            <button id="logoutBtn" type="button" className="text-button">
              Log out
            </button>
          </div>
          <div id="topbarMealsTools" className="topbar-meals-tools hidden">
            <div className="meals-filter-row">
              <input id="mealsRecipeFilter" type="text" placeholder="🔍 Hae" />
              <button id="mealsFilterToggleBtn" type="button" className="filter-toggle-btn">
                <FilterListIcon fontSize="small" />
              </button>
              <button id="addRecipeBtn" type="button" className="filter-add-btn" aria-label="Lisää">
                +
              </button>
              <div id="mealsFilterPanel" className="meals-filter-panel hidden">
                <label htmlFor="mealsRecipeTimeFilter">Aikasuodatin</label>
                <select id="mealsRecipeTimeFilter">
                  <option value="all">Kaikki ajat</option>
                  <option value="Alle 30 min">Alle 30 min</option>
                  <option value="30-60 min">30-60 min</option>
                  <option value="60-90 min">60-90 min</option>
                  <option value="+ 90 min">+ 90 min</option>
                </select>
                <label htmlFor="mealsRecipeRatingFilter">Arvosana</label>
                <select id="mealsRecipeRatingFilter">
                  <option value="all">Kaikki arvosanat</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5</option>
                </select>
                <label htmlFor="mealsRecipeTagFilter">Tagi</label>
                <select id="mealsRecipeTagFilter">
                  <option value="all">Kaikki tagit</option>
                </select>
              </div>
            </div>
          </div>
          <div id="topbarChoreTools" className="topbar-chore-tools hidden">
            <div className="meals-filter-row">
              <input id="listChoreFilter" type="text" placeholder="🔍 Hae askareita" />
              <button id="choresFilterToggleBtn" type="button" className="filter-toggle-btn">
                <FilterListIcon fontSize="small" />
              </button>
              <button id="addChoreBtn" type="button" className="filter-add-btn" aria-label="Lisää">
                +
              </button>
              <div id="choresFilterPanel" className="meals-filter-panel hidden">
                <label htmlFor="listChoreSort">Järjestys</label>
                <select id="listChoreSort">
                  <option value="title-asc">Nimi A-Z</option>
                  <option value="title-desc">Nimi Z-A</option>
                  <option value="load-asc">Kuorma A-Z</option>
                  <option value="load-desc">Kuorma Z-A</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <div id="drawerOverlay" className="drawer-overlay hidden" aria-hidden="true" />
        <aside id="drawer" className="drawer hidden">
          <div className="drawer-header">
            <div className="drawer-title">Menu</div>
            <button id="drawerCloseBtn" type="button" className="drawer-close">
              ×
            </button>
          </div>
          <nav className="drawer-nav">
            <button type="button" className="drawer-link" data-nav="recipes">
              Recipes
            </button>
            <button type="button" className="drawer-link" data-nav="weekly">
              Weekly menu
            </button>
            <button type="button" className="drawer-link" data-nav="meals">
              Meals & recipes
            </button>
            <button type="button" className="drawer-link" data-nav="chores">
              Chores
            </button>
            <button type="button" className="drawer-link" data-nav="family">
              Family
            </button>
          </nav>
          <div className="drawer-footer">
            <button type="button" id="drawerProfileBtn" className="drawer-link drawer-profile-link">
              <AccountCircleIcon className="drawer-icon" fontSize="small" />
              Oma profiili
            </button>
          </div>
        </aside>

        <div className="phone-content">
          <section id="recipesView">
            <div className="stack">
              <button id="weeklyPlanBtn" type="button" className="image-link-card">
                <div className="recipe-highlight">
                  <img src="/images/Ruokalista.jpg" alt="Viikon ruokalista" />
                  <div className="recipe-headline">Viikon ruokalista</div>
                </div>
              </button>
              <button id="mealsRecipesBtn" type="button" className="image-link-card">
                <div className="recipe-highlight">
                  <img src="/images/Resepti.jpg" alt="Ateriat ja reseptit" />
                  <div className="recipe-headline">Ateriat / Reseptit</div>
                </div>
              </button>
              <button id="tagsBtn" type="button" className="secondary">
                <LocalOfferIcon fontSize="small" />
                Tägit
              </button>
              <button id="shoppingBtn" type="button" className="secondary">
                <ShoppingCartIcon fontSize="small" />
                Kauppalista
              </button>
            </div>
          </section>

          <section id="weeklyPlanView" className="hidden">
            <button id="backFromWeeklyBtn" type="button" className="secondary in-view-back">
              Back
            </button>
            <div className="meals-header-row">
              <img
                className="meals-header-thumb"
                src="/images/Ruokalista.jpg"
                alt="Viikon ruokalista"
              />
              <div>
                <div className="recipe-headline meals-header-title">Viikon ruokalista</div>
                <div id="weekNumberLabel" className="week-subtitle" />
              </div>
            </div>
            <button id="weeklyToMealsBtn" type="button" className="full-width-btn weekly-meals-btn">
              <RestaurantIcon fontSize="small" />
              Ruokalistaan
            </button>
            <button id="openRandomWeeklyBtn" type="button" className="secondary full-width-btn">
              Satunnaiset ruoat
            </button>
            <TableContainer className="data-table">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ruoka</TableCell>
                    <TableCell>Päivä</TableCell>
                    <TableCell>Ateria</TableCell>
                    <TableCell>Huomio</TableCell>
                    <TableCell>Poista</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody id="weeklyPlanList" />
              </Table>
            </TableContainer>
            <button id="clearWeeklyPlanBtn" type="button" className="secondary full-width-btn">
              Tyhjennä ruokalista
            </button>
            <div id="randomWeeklyOverlay" className="sheet-overlay hidden" />
            <div id="randomWeeklySheet" className="stack bottom-sheet-form hidden">
              <button id="closeRandomWeeklyBtn" type="button" className="sheet-close-btn">
                <CloseIcon fontSize="small" />
              </button>
              <h3 className="random-weekly-title">Satunnaiset ruoat viikolle</h3>
              <p className="form-note">Valitse määrä ja suodattimet. Reseptit arvotaan suodatetusta listasta.</p>
              <label htmlFor="randomWeeklyCount">Montako ruokaa lisätään</label>
              <input id="randomWeeklyCount" type="number" min={1} max={30} defaultValue={3} />
              <label htmlFor="randomWeeklyTimeFilter">Aika</label>
              <select id="randomWeeklyTimeFilter" defaultValue="all">
                <option value="all">Kaikki ajat</option>
                <option value="Alle 30 min">Alle 30 min</option>
                <option value="30-60 min">30-60 min</option>
                <option value="60-90 min">60-90 min</option>
                <option value="+ 90 min">+ 90 min</option>
              </select>
              <label htmlFor="randomWeeklyRatingFilter">Arvosana (vähintään)</label>
              <select id="randomWeeklyRatingFilter" defaultValue="all">
                <option value="all">Kaikki arvosanat</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5</option>
              </select>
              <label htmlFor="randomWeeklyTagFilter">Tagi</label>
              <select id="randomWeeklyTagFilter" defaultValue="all">
                <option value="all">Kaikki tagit</option>
              </select>
              <div className="form-actions-row">
                <button id="randomWeeklyGoBtn" type="button">
                  Lisää
                </button>
                <button id="cancelRandomWeeklyBtn" type="button" className="secondary">
                  Peruuta
                </button>
              </div>
            </div>
            <div id="weeklyNoteOverlay" className="sheet-overlay hidden" />
            <form id="weeklyNoteForm" className="stack bottom-sheet-form hidden">
              <button id="closeWeeklyNoteBtn" type="button" className="sheet-close-btn">
                <CloseIcon fontSize="small" />
              </button>
              <label htmlFor="weeklyNoteText">Huomio</label>
              <textarea id="weeklyNoteText" rows={4} placeholder="Kirjoita huomio..." />
              <div className="form-actions-row">
                <button type="submit">Tallenna</button>
                <button id="cancelWeeklyNoteBtn" type="button" className="secondary">
                  Peruuta
                </button>
              </div>
            </form>
          </section>

          <section id="mealsRecipesView" className="hidden">
            <button id="backFromMealsBtn" type="button" className="secondary in-view-back">
              <ArrowBackIosNewIcon fontSize="small" />
            </button>
            <div id="mealsHeaderRow" className="meals-header-row">
              <img
                className="meals-header-thumb"
                src="/images/Resepti.jpg"
                alt="Ateriat ja reseptit"
              />
              <div className="recipe-headline meals-header-title">Ateriat / Reseptit</div>
            </div>
            <TableContainer className="data-table">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell id="mealsAddHeader" className="hidden">
                      Lisää
                    </TableCell>
                    <TableCell id="mealsSortName" className="sortable-header">
                      Ruoka
                    </TableCell>
                    <TableCell id="mealsSortRating" className="sortable-header">
                      Arvosana
                    </TableCell>
                    <TableCell id="mealsSortTime" className="sortable-header time-col">
                      Aika
                    </TableCell>
                    <TableCell>Tag</TableCell>
                    <TableCell id="mealsLinkHeader">Link</TableCell>
                    <TableCell id="mealsDeleteHeader">Poista</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody id="recipeList" />
              </Table>
            </TableContainer>
          </section>

          <section id="addRecipeView" className="hidden">
            <div id="addRecipeOverlay" className="sheet-overlay hidden" />
            <form id="addRecipeForm" className="stack bottom-sheet-form">
              <button id="closeAddRecipeBtn" type="button" className="sheet-close-btn">
                <CloseIcon fontSize="small" />
              </button>
              <label htmlFor="recipeName">Nimi *</label>
              <input id="recipeName" name="recipeName" placeholder="Nimi" required />
              <div className="rating-field">
                <label htmlFor="recipeRating">Rating</label>
                <Rating
                  id="recipeRating"
                  name="rating"
                  defaultValue={0}
                  precision={0.5}
                  max={5}
                />
              </div>
              <label htmlFor="recipeTime">Aika *</label>
              <select id="recipeTime" name="recipeTime" defaultValue="" required>
                <option value="" disabled>
                  Valitse aika
                </option>
                <option value="Alle 30 min">Alle 30 min</option>
                <option value="30-60 min">30-60 min</option>
                <option value="60-90 min">60-90 min</option>
                <option value="+ 90 min">+ 90 min</option>
              </select>
              <label htmlFor="recipeTagSelect">Tagi</label>
              <select id="recipeTagSelect" name="recipeTag" defaultValue="">
                <option value="" disabled>
                  Valitse tagi
                </option>
              </select>
              <label htmlFor="recipeURL">Linkki (valinnainen)</label>
              <input id="recipeURL" name="recipeURL" placeholder="URL" />
              <label htmlFor="recipeImageFile">Kuva laitteelta</label>
              <input id="recipeImageFile" name="recipeImageFile" type="file" accept="image/*" />
              <label htmlFor="recipeText">Ruoka</label>
              <textarea id="recipeText" name="recipeText" placeholder="Resepti / kuvaus" rows={4} />
              <div className="form-actions-row">
                <button type="submit">Tallenna resepti</button>
                <button id="cancelAddRecipeBtn" type="button" className="secondary">
                  Peruuta
                </button>
              </div>
            </form>
          </section>

          <section id="recipeDetailView" className="hidden">
            <button id="backFromRecipeDetailBtn" type="button" className="secondary in-view-back">
              Back
            </button>
            <div className="detail-title-row">
              <h3 id="recipeDetailName" />
              <button id="recipeDetailEditBtn" type="button" className="detail-edit-btn">
                <EditIcon fontSize="small" />
                Edit
              </button>
            </div>
            <img id="recipeDetailImage" alt="Recipe" />
            <div className="detail-meta-row">
              <p id="recipeDetailTime" />
              <p id="recipeDetailRating" />
            </div>
            <div id="recipeDetailRatePrompt" className="detail-rate-prompt hidden">
              <label htmlFor="recipeDetailRateInput">Arvioi resepti</label>
              <Rating
                id="recipeDetailRateInput"
                name="recipeDetailRateInput"
                defaultValue={0}
                precision={0.5}
                max={5}
              />
              <button id="saveRecipeDetailRatingBtn" type="button">
                Tallenna arvio
              </button>
            </div>
            <p id="recipeDetailTag" className="detail-tags" />
            <a
              id="recipeDetailURL"
              className="detail-link-btn"
              href="#"
              target="_blank"
              rel="noreferrer"
            >
              <LinkIcon fontSize="small" />
              Katso resepti
            </a>
            <p id="recipeDetailText" />
            <div id="editRecipeOverlay" className="sheet-overlay hidden" />

            <form id="editRecipeForm" className="stack bottom-sheet-form hidden">
              <label htmlFor="editRecipeName">Nimi *</label>
              <input id="editRecipeName" name="recipeName" placeholder="Nimi" required />
              <div className="rating-field">
                <label htmlFor="editRecipeRating">Rating</label>
                <Rating
                  id="editRecipeRating"
                  name="rating"
                  defaultValue={0}
                  precision={0.5}
                  max={5}
                />
              </div>
              <label htmlFor="editRecipeTime">Aika *</label>
              <select id="editRecipeTime" name="recipeTime" defaultValue="" required>
                <option value="" disabled>
                  Valitse aika
                </option>
                <option value="Alle 30 min">Alle 30 min</option>
                <option value="30-60 min">30-60 min</option>
                <option value="60-90 min">60-90 min</option>
                <option value="+ 90 min">+ 90 min</option>
              </select>
              <label htmlFor="editRecipeTagSelect">Tagi</label>
              <select id="editRecipeTagSelect" name="recipeTag" defaultValue="">
                <option value="" disabled>
                  Valitse tagi
                </option>
              </select>
              <label htmlFor="editRecipeURL">Linkki (valinnainen)</label>
              <input id="editRecipeURL" name="recipeURL" placeholder="URL" />
              <label htmlFor="editRecipeImageFile">Kuva laitteelta</label>
              <input
                id="editRecipeImageFile"
                name="recipeImageFile"
                type="file"
                accept="image/*"
              />
              <label htmlFor="editRecipeText">Ruoka</label>
              <textarea
                id="editRecipeText"
                name="recipeText"
                placeholder="Resepti / kuvaus"
                rows={4}
              />
              <div className="form-actions-row">
                <button type="submit">Tallenna muutokset</button>
                <button id="cancelEditRecipeBtn" type="button" className="secondary">
                  Peruuta
                </button>
              </div>
            </form>
          </section>

          <section id="tagsView" className="hidden">
            <button id="backFromTagsBtn" type="button" className="secondary in-view-back">
              Back
            </button>
            <form id="addTagForm" className="inline-form">
              <input id="addTagInput" name="addTagName" type="text" placeholder="Uusi tägi..." />
              <button id="addTagBtn" type="submit">
                + Lisää
              </button>
            </form>
            <List id="tagList" disablePadding />
          </section>

          <section id="shoppingView" className="hidden">
            <button id="backFromShoppingBtn" type="button" className="secondary in-view-back">
              Back
            </button>
          </section>

          <section id="choresView" className="hidden">
            <div className="stack">
              <button id="weeklyChoresBtn" type="button" className="image-link-card">
                <div className="recipe-highlight">
                  <img src="/images/askareet.jpg" alt="Viikon askareet" />
                  <div className="recipe-headline">Viikon askareet</div>
                </div>
              </button>
              <button id="choresListBtn" type="button" className="image-link-card">
                <div className="recipe-highlight">
                  <img src="/images/siivous.jpg" alt="Askareet" />
                  <div className="recipe-headline">Askareet</div>
                </div>
              </button>
            </div>
          </section>

          <section id="weeklyChoresView" className="hidden">
            <button
              id="backFromWeeklyChoresBtn"
              type="button"
              className="secondary in-view-back"
            >
              Back
            </button>
            <div className="meals-header-row">
              <img
                className="meals-header-thumb"
                src="/images/askareet.jpg"
                alt="Viikon askareet"
              />
              <div>
                <div className="recipe-headline meals-header-title">Viikon askareet</div>
                <div id="weeklyChoresWeekNumberLabel" className="week-subtitle" />
              </div>
            </div>
            <div className="table-tools">
              <input
                id="weeklyChoreFilter"
                type="text"
                placeholder="Suodata askareita..."
              />
            </div>
            <button id="weeklyToChoresBtn" type="button" className="full-width-btn weekly-meals-btn">
              Askareisiin
            </button>
            <TableContainer className="data-table">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell id="weeklyChoreSortAskare" className="sortable-header" scope="col">
                      Askare
                    </TableCell>
                    <TableCell id="weeklyChoreSortKuorma" className="sortable-header" scope="col">
                      Kuorma
                    </TableCell>
                    <TableCell scope="col">Toistuva</TableCell>
                    <TableCell scope="col">Kuka</TableCell>
                    <TableCell scope="col">Tehty</TableCell>
                    <TableCell scope="col">Poista</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody id="weeklyChoreList" />
              </Table>
            </TableContainer>
            <div id="weeklyChoreProgress" className="weekly-chore-progress" aria-live="polite">
              <div className="weekly-chore-progress-head">
                <span>Oma edistyminen</span>
                <span id="weeklyChoreProgressText">0 / 0</span>
              </div>
              <div
                className="weekly-chore-progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="0"
              >
                <div
                  id="weeklyChoreProgressFill"
                  className="weekly-chore-progress-fill"
                  style={{ width: "0%" }}
                />
              </div>
            </div>
            <div id="weeklyChoreScoreboard" className="weekly-chore-progress" aria-live="polite">
              <div className="weekly-chore-progress-head">
                <span>Pisteet vs muut</span>
                <span id="weeklyChoreScoreboardSummary">0 p / 0 p (0%)</span>
              </div>
              <div id="weeklyChoreScoreboardList" className="weekly-chore-scoreboard-list" />
            </div>
            <button id="clearWeeklyChoresBtn" type="button" className="secondary full-width-btn">
              Tyhjennä viikon askareet
            </button>
          </section>

          <section id="choresListView" className="hidden">
            <button id="backFromChoresListBtn" type="button" className="secondary in-view-back">
              Back
            </button>
            <div id="choresHeaderRow" className="meals-header-row">
              <img className="meals-header-thumb" src="/images/siivous.jpg" alt="Askareet" />
              <div className="recipe-headline meals-header-title">Askareet</div>
            </div>
            <TableContainer className="data-table">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell id="choresAddHeader" className="hidden">
                      Lisää
                    </TableCell>
                    <TableCell>Askare</TableCell>
                    <TableCell>Kuorma</TableCell>
                    <TableCell>Toistuva</TableCell>
                    <TableCell id="choresDeleteHeader">Poista</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody id="choreList" />
              </Table>
            </TableContainer>
          </section>

          <section id="addChoreView" className="hidden">
            <button id="backFromAddChoreBtn" type="button" className="secondary in-view-back">
              Back
            </button>
            <form id="addChoreForm" className="stack">
              <input name="addChoreTitle" placeholder="Title" required />
              <div className="rating-field">
                <label htmlFor="addChoreLoad">Kuorma (1-10)</label>
                <Slider
                  id="addChoreLoad"
                  min={1}
                  max={10}
                  step={1}
                  defaultValue={5}
                  valueLabelDisplay="auto"
                  onChange={(_, value) => {
                    const loadInput = document.getElementById("addChoreLoadValue");
                    if (loadInput) {
                      const nextValue = Array.isArray(value) ? value[0] : value;
                      loadInput.value = String(nextValue ?? 5);
                    }
                  }}
                />
                <input id="addChoreLoadValue" name="addChoreLoad" type="hidden" defaultValue="5" />
              </div>
              <div className="switch-row">
                <span>Toistuva askare:</span>
                <span id="addChoreRecurringLabel">Ei</span>
                <Switch
                  id="addChoreRecurringSwitch"
                  color="primary"
                  onChange={(event) => {
                    const hidden = document.getElementById("addChoreRecurringValue");
                    const label = document.getElementById("addChoreRecurringLabel");
                    const next = event.target.checked;
                    if (hidden) hidden.value = next ? "true" : "false";
                    if (label) label.textContent = next ? "Kyllä" : "Ei";
                  }}
                />
                <input
                  id="addChoreRecurringValue"
                  name="addChoreRecurring"
                  type="hidden"
                  defaultValue="false"
                />
              </div>
              <button type="submit">Save chore</button>
            </form>
          </section>

          <section id="userProfileView" className="hidden stack user-profile-view">
            <p className="hint user-profile-intro">
              Muokkaa profiilikuvaasi ja lyhyttä kuvausta. Muut perheenjäsenet näkevät nämä perhe-näkymässä.
            </p>
            <div className="profile-avatar-block">
              <img id="profileAvatarPreview" className="profile-avatar-img" alt="" />
              <input id="profileAvatarInput" type="file" accept="image/*" className="hidden" />
              <div className="profile-avatar-actions">
                <button id="profileChooseAvatarBtn" type="button" className="secondary">
                  Valitse kuva
                </button>
                <button id="profileRemoveAvatarBtn" type="button" className="secondary">
                  Poista kuva
                </button>
              </div>
            </div>
            <label htmlFor="profileBioInput">Lyhyt kuvaus itsestäsi</label>
            <textarea
              id="profileBioInput"
              rows={4}
              maxLength={200}
              placeholder="Esim. tykkään kokata ja siivota sunnuntaisin..."
            />
            <p className="form-note profile-bio-count">
              <span id="profileBioCount">0</span>/200 merkkiä
            </p>
            <button id="profileSaveBtn" type="button">
              Tallenna
            </button>
            <p id="profileFormMessage" className="hint" />
          </section>

          <section id="memberProfileView" className="hidden stack member-profile-view">
            <div className="member-profile-card">
              <img id="memberProfileAvatar" className="profile-avatar-img" alt="" />
              <div>
                <h3 id="memberProfileName" />
                <p id="memberProfileUsername" className="hint" />
              </div>
            </div>
            <div className="family-info">
              <strong>About</strong>
              <p id="memberProfileBio" className="hint" />
            </div>
          </section>

          <section id="familyView" className="hidden stack family-view">
            <div>
              <h3 className="family-section-heading">Family members</h3>
              <div id="familyMemberAvatars" className="family-member-avatars" />
            </div>

            <section className="family-calendar-card" aria-labelledby="familyCalendarTitle">
              <div className="family-calendar-header">
                <button id="familyCalendarPrevBtn" type="button" className="secondary family-calendar-nav">
                  ‹
                </button>
                <div>
                  <h3 id="familyCalendarTitle">Calendar</h3>
                  <p id="familyCalendarMonthLabel" className="hint" />
                </div>
                <button id="familyCalendarNextBtn" type="button" className="secondary family-calendar-nav">
                  ›
                </button>
              </div>
              <div id="familyCalendarGrid" className="family-calendar-grid" />
              <form id="familyCalendarForm" className="stack family-calendar-form">
                <label htmlFor="familyCalendarDate">Date</label>
                <input id="familyCalendarDate" name="calendarDate" type="date" required />
                <label htmlFor="familyCalendarType">Type</label>
                <select id="familyCalendarType" name="calendarType" defaultValue="note">
                  <option value="note">Note</option>
                  <option value="reminder">Reminder</option>
                </select>
                <label htmlFor="familyCalendarText">Note or reminder</label>
                <textarea
                  id="familyCalendarText"
                  name="calendarText"
                  rows={3}
                  placeholder="Add something for the family..."
                  required
                />
                <button type="submit">Add to calendar</button>
                <p id="familyCalendarMessage" className="hint" />
              </form>
              <div id="familyCalendarList" className="family-calendar-list" />
            </section>

            <section className="family-info family-details-card">
              <p>
                <strong>Family name:</strong> <span id="familyNameLabel" />
              </p>
              <p>
                <strong>PIN:</strong> <span id="familyPinLabel" />
              </p>
            </section>
          </section>
        </div>

        <Paper component="footer" className="phone-tabs" elevation={0}>
          <BottomNavigation showLabels>
            <BottomNavigationAction
              className="tab-button active"
              data-tab="recipes"
              label="Recipes"
              icon={<RestaurantMenuIcon />}
            />
            <BottomNavigationAction
              className="tab-button"
              data-tab="chores"
              label="Chores"
              icon={<ChecklistIcon />}
            />
            <BottomNavigationAction
              className="tab-button"
              data-tab="family"
              label="Family"
              icon={<GroupIcon />}
            />
          </BottomNavigation>
        </Paper>
      </section>
    </main>
  );
}
