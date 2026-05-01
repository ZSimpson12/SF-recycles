import { useEffect } from "react";
import { testGemini } from "./gemini";

function App() {
  useEffect(() => {
    testGemini();
  }, []);

  return <div>Recycling App</div>;
}

export default App;