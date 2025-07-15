import { useState } from "react";

function Input() {
  const [name, setName] = useState("");
  const changeName = (e) => {
    setName(e.target.value);
  };
  return (
    <div>
      <input
        onChange={(e) => {
          return changeName(e);
        }}
        value={name}
      ></input>
    </div>
  );
}

export default Input;
