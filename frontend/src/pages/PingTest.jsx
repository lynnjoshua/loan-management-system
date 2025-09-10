import { useEffect, useState } from "react";
import API from "../api/axios";

function PingTest() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    API.get("/ping/")
      .then((res) => setMsg(res.data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Ping Test</h1>
      <p>Response from backend: {msg}</p>
    </div>
  );
}

export default PingTest;
