import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNumber, setUserData } from "../features/numberSlice";

export function RateStream() {
  const dispatch = useDispatch();
  const numbers = useSelector((state) => state.number.numbers);
  const [getAllUserData, setGetAllUserData] = useState([]);

  // useEffect(() => {
  //   const socket = new WebSocket("ws://localhost:8080/rawsocket");
  //   socket.onopen = () => {
  //     console.log("✅ WebSocket connected");
  //   };

  //   socket.onmessage = (event) => {
  //     dispatch(addNumber(event.data)); // store received value
  //   };

  //   socket.onerror = (error) => {
  //     console.error("❌ WebSocket error:", error);
  //   };

  //   socket.onclose = () => {
  //     console.warn("⚠️ WebSocket closed");
  //   };

  //   return () => socket.close(); // cleanup on unmount
  // }, [dispatch]);

  useEffect(() => {
    const fetchUsers = async () => {
      const reqObj = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: null,
      };
      const data = await fetch("http://localhost:8081/users", reqObj);
      const parsedData = await data.json();
      console.log(parsedData);
      setGetAllUserData(parsedData);
      dispatch(setUserData(parsedData));
    };
    fetchUsers();
  }, [dispatch]);
  return (
    <div style={{ padding: "20px" }}>
      <h2>🔁 Live Number Stream</h2>
      <ul>
        {/* {numbers.map((num, index) => (
          <li key={index}>{num}</li>
        ))} */}
      </ul>
    </div>
  );
}
