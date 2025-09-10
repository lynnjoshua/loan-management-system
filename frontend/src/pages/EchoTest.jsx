import { useState } from "react";
import API from "../api/axios";

function EchoTest() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/echo/", { message: input });
      setResponse(res.data);
    } catch (err) {
      console.error("Error calling backend:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Frontend Echo Test</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          className="border p-2 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something..."
        />
        <button className="bg-blue-500 text-white px-4 py-2">Send</button>
      </form>

      {response && (
        <div className="mt-4 bg-gray-100 p-3 rounded">
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default EchoTest;
