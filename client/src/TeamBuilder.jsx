import { useState } from "react";
import { useParams } from "react-router-dom";
import gameData from "./data/games.jsx";
import typeData from "./data/types.jsx";
import pokemonData from "./data/pokemon.jsx";
import dexData from "./data/pokedexes.jsx";
import versionData from "./data/versions.jsx";

function TeamBuilder() {
  const { gameSlug } = useParams();
  const [teamSlots, setTeamSlots] = useState(Array(6).fill(null));

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

  const getScriptParent = () => {
    const src = import.meta.url;
    return src.substring(0, src.lastIndexOf("/") + 1);
  };

  const JS_PATH = getScriptParent();
  const IMG_PATH = JS_PATH + "assets/";

  // Function to clear a team slot
  const clearTeamSlot = (event_or_slug) => {
    const slot =
      typeof event_or_slug === "string"
        ? document.querySelector(".slot[data-slug='" + slug + "']")
        : event_or_slug.currentTarget.parentNode;

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
  };

  const BASE_IMG = IMG_PATH + "pokemon/";
  const SV_BASE_IMG = IMG_PATH + "sv-pokemon/";
  const UNKNOWN_IMG = IMG_PATH + "type_unknown.png";
  const UNKNOWN_NAME = "???";

  return (
    <div>
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
      <article className="team-planner">
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
            <div className="team__buttons">
              <div className="flex justify-center items-center">
                <h3 className="type-analysis__heading">Team Defense</h3>
              </div>
              <div className="team__type-analysis type-analysis_hidden">
                <ol className="flex justify-center items-center">{tallies}</ol>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}

export default TeamBuilder;
