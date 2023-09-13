import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import gameData from "./data/games.jsx";
import typeData from "./data/types.jsx";
import pokemonData from "./data/pokemon.jsx";
import dexData from "./data/pokedexes.jsx";
import versionData from "./data/versions.jsx";
import "../styles.css";

const getScriptParent = () => {
  const src = import.meta.url;
  return src.substring(0, src.lastIndexOf("/") + 1);
};

const JS_PATH = getScriptParent();
const IMG_PATH = JS_PATH + "assets/";
const BASE_IMG = IMG_PATH + "pokemon/";
const SV_BASE_IMG = IMG_PATH + "sv-pokemon/";
const UNKNOWN_IMG = IMG_PATH + "type_unknown.png";
const UNKNOWN_NAME = "???";

const TeamBuilder = () => {
  const { providedGameSlug } = useParams();
  const gameSlug = providedGameSlug.includes("+")
    ? providedGameSlug.split("+")[0]
    : providedGameSlug;

  const [hashSlugs, setHashSlugs] = useState([]);

  useEffect(() => {
    // Helper function to parse the URL and set state variables
    const parseUrl = () => {
      if (
        window.location.hash &&
        window.location.hash.split("/").includes("plan")
      ) {
        let slugs = window.location.hash.substring(1).split("+");
        setHashSlugs(slugs);
      }
    };
    console.log(hashSlugs);
    populateDexes();
    // Parse the URL and attach scroll listener on component mount
    parseUrl();
  }, []);

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const getCurrentTypeData = () => {
    const currentGen = gameData[gameSlug].gen;
    return typeData.filter((data) => data.generation <= currentGen)[0]
      .type_data;
  };

  const typeData2 = getCurrentTypeData();

  const completeTypeData = () => {
    Object.keys(typeData2).forEach((attackingType) => {
      typeData2[attackingType].weakens = [];
      Object.keys(typeData2).forEach((defendingType) => {
        if (
          typeData2[defendingType].weak2 &&
          typeData2[defendingType].weak2.includes(attackingType)
        ) {
          typeData2[attackingType].weakens.push(defendingType);
        }
      });
    });
  };

  completeTypeData();

  const isInDex = (base_id, form_id) => {
    var result = false;
    gameData[gameSlug].dex_slugs.forEach((slug) => {
      Object.values(dexData[slug].order)
        .flat()
        .forEach((id) => {
          if (id[0] === base_id && id[1] === form_id) {
            result = true;
            return;
          }
        });
      if (result) {
        return;
      }
    });
    return result;
  };

  const getPokemonType = (pokemon) => {
    if (
      pokemon.past_type == null ||
      gameData[gameSlug].gen >= pokemon.past_type.generation
    ) {
      return pokemon.pokemon_type;
    }
    return pokemon.past_type.pokemon_type;
  };

  const difference = (a, b) => {
    const setA = new Set(a);
    const setB = new Set(b);
    const diff = new Set([...setA].filter((x) => !setB.has(x)));
    return Array.from(diff); // Convert the result back to an array
  };

  const union = (a, b) => {
    const setA = new Set(a);
    const setB = new Set(b);
    const united = new Set([...setA, ...setB]);
    return Array.from(united); // Convert the result back to an array
  };

  const completePokemonData = () => {
    Object.values(pokemonData)
      .filter((pokemon) => isInDex(pokemon.base_id, pokemon.form_id))
      .forEach((pokemon) => {
        const type = getPokemonType(pokemon);
        const type1 = type[0];
        const type2 = type.length === 1 ? null : type[1];
        if (type2 == null) {
          // If there is no secondary type, use data from primary type
          pokemon.weaknesses = typeData2[type1].weak2 || [];
          pokemon.immunities = typeData2[type1].immune2 || [];
          pokemon.resistances = typeData2[type1].resists || [];
          pokemon.coverage = typeData2[type1].weakens || [];
        } else {
          // Union of immunities
          pokemon.immunities = union(
            typeData2[type1].immune2,
            typeData2[type2].immune2
          );
          // Union of differences (resists minus weakneses)
          pokemon.resistances = union(
            difference(typeData2[type1].resists, typeData2[type2].weak2),
            difference(typeData2[type2].resists, typeData2[type1].weak2)
          );
          // Union of differences (weaknesses minus resists) minus immunities
          pokemon.weaknesses = difference(
            union(
              difference(typeData2[type1].weak2, typeData2[type2].resists),
              difference(typeData2[type2].weak2, typeData2[type1].resists)
            ),
            pokemon.immunities
          );
          // Union of weakened types
          pokemon.coverage = union(
            typeData2[type1].weakens,
            typeData2[type2].weakens
          );
        }
      });
  };

  completePokemonData();

  const tallies = Object.keys(typeData2).map((type) => {
    return (
      <li key={type} className={`tally tally_${type}`}>
        <span className="tally__type-symbol" title={type}>
          {capitalize(type)}
        </span>
        <ol className="tally__marks">
          {[...Array(6)].map((_, index) => (
            <li key={index} className="tally__mark" data-slug="">
              0
            </li>
          ))}
        </ol>
      </li>
    );
  });

  const analyzeTeam = (element, button) => {
    const selector = "type-analysis_hidden";
    if (element.classList.contains(selector)) {
      button.innerHTML = "Hide Team Analysis";
      element.classList.remove(selector);
    } else {
      button.innerHTML = "Show Team Analysis";
      element.classList.add(selector);
    }
  };

  const toggleEmptyDex = () => {
    document.querySelectorAll(".picker__pokedex").forEach((ol) => {
      if (
        ol.children.length ===
        ol.querySelectorAll(":where(.pokedex-entry_picked)").length
      ) {
        ol.parentNode.classList.add("picker__pokedex-container_hidden");
      } else {
        ol.parentNode.classList.remove("picker__pokedex-container_hidden");
      }
    });
  };

  const getCurrentUrl = () => {
    const url = window.location.href;
    const i = url.indexOf(window.location.hash) || url.length;
    return url.substring(0, i);
  };

  const updateTeamHash = () => {
    const slugs = ["plan", gameSlug]; // "plan" is added as a fixed part
    document.querySelectorAll(".slot_populated").forEach((li) => {
      slugs.push(li.dataset.slug.replace(/\s/g, "+"));
    });

    const hash = slugs.join("+");
    if (window.history.replaceState) {
      const url = getCurrentUrl() + "#/" + hash;
      window.history.replaceState(url, "", url);
    } else {
      window.location.hash = hash;
    }
  };

  const updateTeamAnalysis = () => {};

  // Function to clear a team slot
  const clearTeamSlot = (event_or_slug) => {
    const slot =
      typeof event_or_slug === "string"
        ? document.querySelector(".slot[data-slug='" + slug + "']")
        : event_or_slug.currentTarget;
    // event_or_slug.currentTarget.parentNode;

    const slug = slot.dataset.slug;
    if (slug === "") return;

    const type = slot.dataset.type.split(",");
    const tera = slot.dataset.tera;

    // Empty data
    slot.classList.add("slot_empty");
    slot.classList.remove("slot_hover", "slot_populated");
    slot.dataset.slug = "";
    slot.dataset.type = "";
    slot.dataset.tera = "";

    slot
      .querySelector(".slot__bg-type-1")
      .classList.remove(
        "slot__bg-type-1_" + type[0],
        "slot__bg-type-1_" + tera
      );
    slot
      .querySelector(".slot__bg-type-2")
      .classList.remove(
        "slot__bg-type-2_" + type.slice(-1),
        "slot__bg-type-2_" + tera
      );
    slot
      .querySelector(".slot__info")
      .classList.remove("slot__info_" + type[0], "slot__info_" + tera);

    const img = slot.querySelector(".slot__pokemon-render");
    img.classList.remove("slot__pokemon-render_gmax");
    img.setAttribute("src", UNKNOWN_IMG);
    img.setAttribute("alt", "");

    slot.querySelector(".slot__name").innerHTML = "???";
    const span = slot.querySelector(".slot__form");
    span.innerHTML = "";
    span.classList.add("slot__form_none");
    slot.querySelectorAll(".slot__type").forEach((span) => {
      span.setAttribute("class", "slot__type");
      span.innerHTML = "";
    });
    slot.parentNode.append(slot);
    const li = document.querySelector(
      ".pokedex-entry[data-slug='" + slug + "']"
    );
    if (li) {
      li.classList.remove("pokedex-entry_picked");
      toggleEmptyDex();
    }

    updateTeamAnalysis();
    updateTeamHash();
  };

  const getPokemonRenderUrl = (pokemon, gmax = false) => {
    return (
      BASE_IMG +
      [
        String(pokemon.base_id).padStart(4, "0"),
        String(pokemon.form_id).padStart(3, "0"),
        gmax && pokemon.gender.length > 1 ? "mf" : pokemon.gender[0],
        gmax ? "g" : "n",
      ].join("_") +
      ".png"
    );
  };

  const populateTeamSlot = (event_or_slug) => {
    const slug =
      typeof event_or_slug === "string"
        ? event_or_slug
        : event_or_slug.currentTarget.parentNode.dataset.slug;

    // Validate Pokémon exists in database
    if (!(slug in pokemonData)) {
      return;
    }

    // Validate Pokémon is not duplicated
    const slugs = Array.from(document.querySelectorAll(".slot_populated")).map(
      (li) => li.dataset.slug
    );
    if (slugs.includes(slug)) {
      return;
    }

    const slot = document.querySelector(".slot_empty");
    var gmax = slug.endsWith("-gmax");

    const pokemon =
      pokemonData[gmax ? slug.substring(0, slug.length - 5) : slug];
    const type = getPokemonType(pokemon);
    slot.dataset.type = type;
    slot.classList.add("slot_populated");
    slot.classList.remove("slot_empty", "slot_hover");
    slot.dataset.slug = slug;
    slot.dataset.tera = "";

    slot
      .querySelector(".slot__bg-type-1")
      .classList.add("slot__bg-type-1_" + type[0]);
    slot
      .querySelector(".slot__bg-type-2")
      .classList.add("slot__bg-type-2_" + type.slice(-1));
    slot.querySelector(".slot__info").classList.add("slot__info_" + type[0]);

    const img = slot.querySelector(".slot__pokemon-render");
    if (gmax) img.classList.add("slot__pokemon-render_gmax");
    img.setAttribute("src", getPokemonRenderUrl(pokemon, gmax));
    img.setAttribute("alt", pokemon.name);

    slot.querySelector(".slot__name").innerHTML = pokemon.name;

    const form = gmax ? "Gigantamax" : pokemon.form_name;
    var span = slot.querySelector(".slot__form");
    if (form) {
      span.innerHTML = form;
      span.classList.remove("slot__form_none");
    } else {
      span.classList.add("slot__form_none");
    }

    span = slot.querySelectorAll(".slot__type");
    span.forEach((span, i) => {
      span.classList.add("slot__type_" + type[i]);
      span.innerHTML = type[i] ? capitalize(type[i]) : "";
    });

    const li = document.querySelector(
      ".pokedex-entry[data-slug='" + slug + "']"
    );
    if (li) {
      li.classList.add("pokedex-entry_picked");
      toggleEmptyDex();
    }

    updateTeamAnalysis();
    updateTeamHash();
  };

  const populateDexes = () => {
    const container = document.querySelector(".team-planner");
    const tail = document.createElement("div");
    tail.classList.add("tail");
    const section = document.createElement("section");
    const ol = document.createElement("ol");
    container.append(tail);
    tail.append(section);
    section.append(ol);
    tail.classList.add("flex", "justify-center", "items-center");
    const game = gameData[gameSlug];
    game.dex_slugs.forEach((slug, i) => {
      let li = document.createElement("li");
      let heading = document.createElement("h3");
      let pokedex = document.createElement("ol");
      pokedex.classList.add("grid", "grid-cols-12", "gap-4");
      li.classList.add("picker__pokedex-container");

      ol.append(li);
      li.append(heading);
      heading.innerHTML = dexData[slug].name;
      heading.classList.add("picker__pokedex-name");
      li.append(pokedex);
      pokedex.id = slug;
      pokedex.classList.add("picker__pokedex");

      populateDex(pokedex, dexData[slug]);
    });
  };

  const sortIds = (a, b) => a[0] - b[0] || a[1] - b[1];

  const populateDex = (ol, dexEntry) => {
    ol.classList.add("pokedex-entry-grid");
    const order = Object.keys(dexEntry.order).sort((a, b) => a - b);
    const entries = Object.entries(pokemonData);
    order.forEach((num) => {
      const ids = dexEntry.order[num].sort(sortIds);
      ids.forEach((id) => {
        const [base_id, form_id] = id;
        const [slug, pokemon] = entries.find(
          (tup) => tup[1].base_id === base_id && tup[1].form_id === form_id
        );
        createPokemonEntry(slug, pokemon).forEach((li) => {
          ol.append(li);
        });
      });
    });
  };

  const createPokemonEntry = (slug, pokemon) => {
    const img = document.createElement("img");
    const button = document.createElement("button");
    const li = document.createElement("li");

    li.append(button);
    button.append(img);

    // Create a new div for the Pokémon's details
    const detailsDiv = document.createElement("div");

    // Create an element for the Pokémon's name
    const nameElement = document.createElement("p");
    nameElement.textContent = pokemon.name;

    // Create an element for the Pokémon's typing
    const typingElement = document.createElement("p");

    pokemon.pokemon_type.forEach((type, index) => {
      const typeElement = document.createElement("span");
      typeElement.textContent = type;
      switch (type) {
        case "grass":
          typeElement.classList.add("text-[#7AC74C]");
          break;
        case "normal":
          typeElement.classList.add("text-[#A8A77A]");
          break;
        case "water":
          typeElement.classList.add("text-[#6390F0]");
          break;
        case "fire":
          typeElement.classList.add("text-[#EE8130]");
          break;
        case "electric":
          typeElement.classList.add("text-[#F7D02C]");
          break;
        case "ice":
          typeElement.classList.add("text-[#96D9D6]");
          break;
        case "fighting":
          typeElement.classList.add("text-[#C22E28]");
          break;
        case "poison":
          typeElement.classList.add("text-[#A33EA1]");
          break;
        case "ground":
          typeElement.classList.add("text-[#E2BF65]");
          break;
        case "flying":
          typeElement.classList.add("text-[#A98FF3]");
          break;
        case "psychic":
          typeElement.classList.add("text-[#F95587]");
          break;
        case "bug":
          typeElement.classList.add("text-[#A6B91A]");
          break;
        case "rock":
          typeElement.classList.add("text-[#B6A136]");
          break;
        case "ghost":
          typeElement.classList.add("text-[#735797]");
          break;
        case "dragon":
          typeElement.classList.add("text-[#6F35FC]");
          break;
        case "dark":
          typeElement.classList.add("text-[#705746]");
          break;
        case "steel":
          typeElement.classList.add("text-[#B7B7CE]");
          break;
        case "fairy":
          typeElement.classList.add("text-[#D685AD]");
          break;
        default:
          // Default text color if type is not recognized
          typeElement.classList.add("text-black");
          break;
      }
      if (index < pokemon.pokemon_type.length - 1) {
        typingElement.appendChild(typeElement);
        typingElement.appendChild(document.createTextNode(" ")); // Add a space
      } else {
        typingElement.appendChild(typeElement);
      }
    });

    // Append the details to the div
    detailsDiv.append(nameElement, typingElement);

    // Append the details div to the li
    li.append(detailsDiv);

    button.addEventListener("click", populateTeamSlot);
    button.classList.add("pokedex-entry__button");

    li.dataset.slug = slug;
    li.dataset.id = pokemon.base_id;
    li.dataset.formId = pokemon.form_id;
    li.setAttribute("title", pokemon.name);
    li.classList.add("pokedex-entry");

    img.setAttribute("alt", pokemon.name);
    img.setAttribute("src", getPokemonRenderUrl(pokemon));
    img.setAttribute("loading", "lazy");
    img.classList.add("pokedex-entry__thumb");

    // If Pokémon can Gigantamax, duplicate its entry
    if (
      gameData[gameSlug].gmax &&
      pokemon.has_gigantamax &&
      !pokemon.is_cosmetic
    ) {
      const clone = li.cloneNode(true);
      clone.dataset.slug = slug + "-gmax";
      clone.querySelector("button").addEventListener("click", populateTeamSlot);
      clone
        .querySelector("img")
        .setAttribute("src", getPokemonRenderUrl(pokemon, true));

      // Clone and append the details div to the clone
      const clonedDetailsDiv = detailsDiv.cloneNode(true);
      clone.append(clonedDetailsDiv);

      return [li, clone];
    }
    return [li];
  };

  hashSlugs.forEach((slug) => populateTeamSlot(slug));

  return (
    <div>
      <article className="team-planner">
        <div className="head">
          <header className="head__header">
            <h1 className="head__heading">
              <img
                alt={gameSlug}
                src={`${IMG_PATH}game/${gameSlug}.png`}
                className=" mx-auto max-w-full max-h-full transform scale-130"
              />
              <a href="../">
                <span className="head__game-name">Pokémon</span> Team Planner
              </a>
            </h1>
            <p>
              Use this tool to plan your team for an in-game run. Click on a
              Pokémon below to add it to your team, and click on it again to
              remove it. Have fun and share with your friends and neighbors!
            </p>
          </header>
        </div>
        <div className="head__team">
          <section className="team">
            <h2 className="team__heading">Your Team</h2>
            <ul className="flex justify-center items-center gap-2 team__slots">
              {/* Generate team slots */}
              {[...Array(6)].map((_, index) => (
                <li
                  key={index}
                  className="slot slot_empty team__slot" // Add the "slot" class here
                  data-slug=""
                  data-type=""
                  data-tera=""
                  onClick={clearTeamSlot}
                  onMouseEnter={(event) => {
                    event.target.classList.add(
                      "animate-shake",
                      "animate-infinite"
                    );
                  }}
                  onMouseLeave={(event) => {
                    event.target.classList.remove(
                      "animate-shake",
                      "animate-infinite"
                    );
                    console.log("left");
                  }}
                >
                  <div className="slot__remove-button slot__bg-type-1">
                    <figure className="slot__bg-type-2">
                      <img
                        className="slot__pokemon-render"
                        src={UNKNOWN_IMG}
                        alt=""
                      />
                    </figure>
                  </div>
                  <div className="slot__info bg-emerald-500">
                    <div className="slot__name-container">
                      <span className="slot__name">{UNKNOWN_NAME}</span>
                      <span className="slot__form slot__form_none"></span>
                    </div>
                    <ol className="slot__type-container">
                      <li className="slot__type"></li>
                      <li className="slot__type"></li>
                    </ol>
                  </div>
                  <div className="slot__toggle-container">
                    {/* You can add toggle buttons here if needed */}
                  </div>
                </li>
              ))}
            </ul>
            <div className="team__type-analysis type-analysis_hidden flex flex-col gap-4 justify-stretch items-center bg-white border border-gray-300 rounded p-4">
              <h3 className="type-analysis__heading">Team Defense</h3>
              <ol className="grid gap-4 grid-cols-6 justify-evenly list-none m-0 p-0 type-analysis__grid type-analysis__grid_defense">
                {tallies}
              </ol>
              <h3 className="type-analysis__heading">Team Coverage</h3>
              <ol className="grid gap-4 grid-cols-6 justify-evenly list-none m-0 p-0 type-analysis__grid type-analysis__grid_attack">
                {tallies}
              </ol>
            </div>
            <div className="team__buttons">
              <button
                className="team__button"
                onClick={() =>
                  analyzeTeam(
                    document.querySelector(".team__type-analysis"),
                    document.querySelector(".team__button")
                  )
                }
              >
                Show Team Analysis
              </button>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
};

export default TeamBuilder;
