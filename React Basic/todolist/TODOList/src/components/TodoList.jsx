import { useState } from "react";
import { ToDoItem } from "./ToDoItem";

export function TodoList() {
  const [toDoItemInput, setToDoItemInput] = useState("");
  const [toDoList, setToDoList] = useState([]);

  const AddItemToTheList = () => {
    setToDoList([...toDoList, toDoItemInput]);
    setToDoItemInput("");
  };

  return (
    <>
      <input
        onChange={(e) => {
          setToDoItemInput(e.target.value);
        }}
        type="text"
        name=""
        id=""
        value={toDoItemInput}
      />

      <button onClick={AddItemToTheList}>submit</button>

      {toDoList.map((val) => {
        return <ToDoItem content={val}></ToDoItem>;
      })}
    </>
  );
}
