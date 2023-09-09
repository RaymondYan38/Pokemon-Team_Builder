import { HashRouter as Router, Route, Routes } from "react-router-dom";
import GamePicker from "./GamePicker";
import TeamBuilder from "./TeamBuilder";

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<GamePicker />} />
        <Route path="/plan/:gameSlug" element={<TeamBuilder />} />
      </Routes>
    </Router>
  );
}

export default App;
