import { useState } from "react";
import "./App.css";
import { RateStream } from "./components/RateStream";

function App() {
  const [count, setCount] = useState(0);

  return <RateStream></RateStream>;
}

export default App;
