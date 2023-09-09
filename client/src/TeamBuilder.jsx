import { useEffect } from "react";
import { useParams } from "react-router-dom";

function TeamBuilder() {
  const { gameSlug } = useParams();
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "../static/js/main.js"; // Replace with the correct path
    script.type = "module";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up the script when the component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <article className="team-planner">
      <template id="team-slot">{/* Slot template content */}</template>
      <template id="tally">{/* Tally template content */}</template>
      <div className="head">
        <header className="head__header">
          <h1 className="head__heading">
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
    </article>
  );
}

export default TeamBuilder;
