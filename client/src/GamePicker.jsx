import gameData from "./data/games.jsx";
import { Link } from "react-router-dom"; // Import Link for navigation

const GamePicker = () => {
  const getPokemonUrl = (pokemon) => {
    return new URL(`./assets/pokemon/${pokemon}.png`, import.meta.url).href;
  };

  const getGameUrl = (game) => {
    return new URL(`./assets/game/${game}.png`, import.meta.url).href;
  };

  const getGameName = (game) => {
    if (game.name == null) {
      const versions = game.versions.map((ver) => "Pokémon " + ver.name);
      if (game.versions.length > 2) {
        versions[versions.length - 1] = "and " + versions[versions.length - 1];
        return versions.join(", ");
      }
      return versions.join(" and ");
    }
    return game.name;
  };

  return (
    <div className="bg-gray-200 flex justify-center items-center min-h-screen overflow-y-auto">
      <article className="team-planner">
        <div className="min-h-screen mb-8">
          <img
            src={getPokemonUrl("0258_000_mf_n")}
            alt="mudkip"
            className="absolute top-0 left-0 hidden xl:block transition-opacity duration-500 ease-in-out opacity-0 hover:opacity-100"
          />
          <div className="flex justify-center items-center mb-8 mt-8">
            <h1 className="font-bold text-xl">Select a Game</h1>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-16">
            {Object.entries(gameData).map(([slug, game]) => (
              <li key={slug}>
                <Link to={`/plan/${slug}`} title={getGameName(game)}>
                  <div className="bg-white w-64 h-32 rounded-lg border border-gray-400 p-4">
                    <img
                      alt={getGameName(game)}
                      src={getGameUrl(slug)}
                      className=" mx-auto max-w-full max-h-full transform scale-130"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </div>
  );
};

export default GamePicker;
