import { useState } from "react";

import Input from "./components/Input";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <Input></Input>
    </div>
  );
}

export default App;
