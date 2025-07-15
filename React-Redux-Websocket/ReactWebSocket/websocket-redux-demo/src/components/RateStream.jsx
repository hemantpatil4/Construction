import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNumber } from "../features/numberSlice";

export function RateStream() {
  const dispatch = useDispatch();
  const numbers = useSelector((state) => state.number.numbers);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/rawsocket");
    socket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socket.onmessage = (event) => {
      dispatch(addNumber(event.data)); // store received value
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket closed");
    };

    return () => socket.close(); // cleanup on unmount
  }, [dispatch]);
  return (
    <div style={{ padding: "20px" }}>
      <h2>🔁 Live Number Stream</h2>
      <ul>
        {numbers.map((num, index) => (
          <li key={index}>{num}</li>
        ))}
      </ul>
    </div>
  );
}
