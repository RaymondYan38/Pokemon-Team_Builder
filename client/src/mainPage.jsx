import gameData from "./data/games.jsx";
import pokemonData from "./data/pokemon.jsx";
import pokedexData from "./data/pokedexes.jsx";
import typeData from "./data/types.jsx";
import versionData from "./data/versions.jsx";

const getCurrentUrl = () => {
  const url = window.location.href;
  const i = url.indexOf(window.location.hash) || url.length;
  return url.substring(0, i);
};

const getScriptParent = () => {
  const src = import.meta.url;
  return src.substring(0, src.lastIndexOf("/") + 1);
};

let currentGame;
let currentVersions;

const JS_PATH = getScriptParent();
const IMG_PATH = JS_PATH + "assets/";

window.onload = buildPage;

function buildPage() {
  let slugs;
  [currentGame, currentVersions, slugs] = parseUrl();
  if (!currentGame) {
    // Redirect to game select if already in planner
    if (window.location.pathname.split("/").includes("plan")) {
      window.location.href = "../";
      return;
    }
    populateGameList(document.querySelector(".head"));
    return;
  }
  completeTypeData();
  completePokemonData();
  populateTeam(document.querySelector(".head"));
  populateTeraPicker(document.querySelector(".slot__toggle-container"));
  populateDexes(document.querySelector(".tail"));
  // populateFilters(); // delete potentially
  slugs.forEach(populateTeamSlot);
  window.onscroll = shrinkHead;
}

/**
 * Shrink header when scrolling
 */
function shrinkHead() {
  const head = document.querySelector(".head");
  const target = document
    .querySelector(".picker__pokedexes")
    .getBoundingClientRect().top;
  const analysis = document.querySelector(".team__type-analysis");
  // const activeFilters = document.querySelectorAll(".filter_active"); // delete potentially
  if (
    // target < 0 &&
    // analysis.classList.contains("type-analysis_hidden") &&
    // activeFilters.length === 0
    target < 0 &&
    analysis.classList.contains("type-analysis_hidden")
  ) {
    head.classList.add("head_sticky");
  } else {
    head.classList.remove("head_sticky");
  }
}

const GAME_PATH = IMG_PATH + "game/";
const GAME_TEXT =
  "Welcome! Select a game and start planning your Pokémon team!";

/**
 * Populate the list of games with the available planners.
 * @param {HTMLElement} container
 */
function populateGameList(container) {
  const section = document.createElement("section");
  const h2 = document.createElement("h2");
  const p = document.createElement("p");
  const ol = document.createElement("ol");

  container.querySelector("header").after(section);
  section.append(h2, p, ol);
  section.classList.add("head__game-picker");
  h2.innerHTML = "Games";
  p.innerHTML = GAME_TEXT;
  ol.classList.add("game-picker");

  const games = Object.entries(gameData);
  games.forEach((tup) => {
    const [slug, game] = tup;
    const name = getGameName(game);
    const li = document.createElement("li");
    const a = document.createElement("a");
    const img = document.createElement("img");
    // const url = game.disabled ? "#" : JS_PATH + "../../plan/#" + slug;
    const url = JS_PATH + "../../plan/#" + slug;

    ol.append(li);
    li.append(a);
    a.append(img);

    li.classList.add("game-picker__game");
    a.classList.add("game-picker__button");
    a.setAttribute("title", name);
    a.setAttribute("href", url);
    img.classList.add(
      "game-picker__game-logo",
      "game-picker__game-logo_" + slug
    );
    img.setAttribute("alt", name);
    img.setAttribute("src", GAME_PATH + slug + ".png");

    // if (game.disabled) li.classList.add("game-picker__game_disabled");
  });
}

/**
 * Returns formatted name of given game.
 * @param {Object} game
 * @returns {string}
 */
function getGameName(game) {
  if (game.name == null) {
    const versions = game.versions.map((ver) => "Pokémon " + ver.name);
    if (game.versions.length > 2) {
      versions[versions.length - 1] = "and " + versions[versions.length - 1];
      return versions.join(", ");
    }
    return versions.join(" and ");
  }
  return game.name;
}

/**
 * Returns the type chart corresponding to the current generation.
 * @returns {Object}
 */
function getCurrentTypeData() {
  const currentGeneration = gameData[currentGame].gen;
  return typeData.filter((data) => data.generation <= currentGeneration)[0]
    .type_data;
}

const BASE_IMG = IMG_PATH + "pokemon/";
const SV_BASE_IMG = IMG_PATH + "sv-pokemon/";
const UNKNOWN_IMG = BASE_IMG + "0000_000_uk_n.png";

/**
 * Reads the hash from the current URL and parses current game and Pokémon.
 * @returns {Array} array containing current game, versions, and slugs
 */
function parseUrl() {
  // Make sure location is planner and hash exists
  if (
    window.location.pathname.split("/").includes("plan") &&
    window.location.hash
  ) {
    let slugs = window.location.hash.substring(1).split("+");
    // Check game is valid and not disabled
    if (slugs[0] in gameData) {
      const game = slugs[0];
      if (!gameData[game].disabled) {
        const versions = gameData[game].versions
          ? gameData[game].versions.map((ver) => ver.slug)
          : [];
        slugs = slugs.slice(1); // Remove hash
        return [game, versions, slugs];
      }
    }
  }
  return [null, [], []];
}

/**
 * Updates the URL's hash based on the current Pokémon team.
 */
function updateTeamHash() {
  const slugs = [currentGame];
  document.querySelectorAll(".slot_populated").forEach((li) => {
    slugs.push(li.dataset.slug);
  });
  const hash = slugs.join("+");
  if (window.history.replaceState) {
    const url = `${getCurrentUrl()}#${hash}`;
    window.history.replaceState(url, "", url);
  } else {
    window.location.hash = hash;
  }
}
