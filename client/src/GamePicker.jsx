import { useEffect, useState } from "react";
import gameData from "./data/games.jsx";
import { Link } from "react-router-dom"; // Import Link for navigation
import TeamBuilder from "./TeamBuilder"; // Import the TeamBuilder component

function GamePicker() {
  const [currentGame, setCurrentGame] = useState(null);
  const [currentVersions, setCurrentVersions] = useState([]);
  const [slugs, setSlugs] = useState([]);

  const getScriptParent = () => {
    const src = import.meta.url;
    return src.substring(0, src.lastIndexOf("/") + 1);
  };

  const JS_PATH = getScriptParent();
  const IMG_PATH = JS_PATH + "assets/";

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

  useEffect(() => {
    // Helper function to parse the URL and set state variables
    const parseUrl = () => {
      if (
        window.location.pathname.split("/").includes("plan") &&
        window.location.hash
      ) {
        let slugs = window.location.hash.substring(1).split("+");
        if (slugs[0] in gameData) {
          const game = slugs[0];
          if (!gameData[game].disabled) {
            const versions = gameData[game].versions
              ? gameData[game].versions.map((ver) => ver.slug)
              : [];
            slugs = slugs.slice(1); // Remove hash
            setCurrentGame(game);
            setCurrentVersions(versions);
            setSlugs(slugs);
          }
        }
      }
    };

    // Parse the URL and attach scroll listener on component mount
    parseUrl();
  }, []);

  return (
    <div className="bg-gray-200 flex justify-center items-center min-h-screen overflow-y-auto">
      <article className="team-planner">
        {currentGame ? (
          // If a game is selected, render the TeamBuilder component
          <TeamBuilder gameSlug={currentGame} />
        ) : (
          // If no game is selected, show a list of games to choose from
          <div className="min-h-screen mb-8">
            <img
              src={`${IMG_PATH}pokemon/0258_000_mf_n.png`}
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
                        src={`${IMG_PATH}game/${slug}.png`}
                        className=" mx-auto max-w-full max-h-full transform scale-130"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}

export default GamePicker;
