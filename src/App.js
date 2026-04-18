import React, { useState, useEffect, useRef } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import "chart.js/auto";

function App() {
  console.log("Upload function called");
  // Backend URL
  const API = "https://ai-data-analyst-backend-paiz.onrender.com";

  // 🧠 States
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [chartData, setChartData] = useState(null);

  const chatRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  // SEND QUERY (FIXED VERSION)
  const sendQuery = async () => {
    if (!query) return;

    setChartData(null);

    const userMessage = { type: "user", text: query };
    const thinkingMessage = { type: "bot", text: "Thinking..." };

    setMessages(prev => [...prev, userMessage, thinkingMessage]);

    try {
      const res = await fetch(
        `${API}/ai-query?q=${encodeURIComponent(query)}`
      );

      const data = await res.json();

      const reply =
        data?.insight ||
        data?.message ||
        data?.error ||
        "No response";

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: "bot", text: reply };
        return updated;
      });

      // CHART
      if (data?.parsed?.operation === "groupby") {

        const chartRes = await fetch(
          `${API}/chart?group_col=${data.parsed.group_col}&value_col=${data.parsed.value_col}`
        );

        const chartJson = await chartRes.json();

        if (!chartJson?.error) {

          setChartData({
            type: data.parsed.chart_type || "bar",
            data: {
              labels: chartJson?.labels || [],
              datasets: [{
                label: data.parsed.value_col,
                data: chartJson?.values || [],
                backgroundColor: [
                  "#36A2EB",
                  "#FF6384",
                  "#FFCE56",
                  "#4BC0C0",
                  "#9966FF"
                ]
              }]
            }
          });

        } else {
          console.log("Chart error:", chartJson.error);
        }
      }

    } catch (err) {

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: "bot", text: "Server error" };
        return updated;
      });
    }

    setQuery("");
  };

  //  FILE UPLOAD 
  const uploadFile = async (file) => {
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log("Uploading to:", `${API}/upload`);

    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: formData,
    });

    console.log("STATUS:", res.status);

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Not JSON response:", text);
      alert("Upload failed (invalid response)");
      return;
    }

    if (!res.ok) {
      console.error("Backend error:", data);
      alert("Upload failed");
      return;
    }

    alert("File uploaded successfully!");
    console.log("Columns:", data?.data?.columns);

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    alert("Upload failed (network error)");
  }
};

  return (
    <div style={{ padding: "20px" }}>

      <h1>AI Data Analyst Dashboard</h1>

      {/* FILE UPLOAD */}
      <input
        type="file"
        onChange={(e) => uploadFile(e.target.files[0])}
      />

      {/* CHAT BOX */}
      <div
        ref={chatRef}
        style={{
          border: "1px solid gray",
          height: "400px",
          overflowY: "scroll",
          padding: "10px",
          marginTop: "10px"
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.type === "user" ? "right" : "left",
              margin: "10px"
            }}
          >
            <b>{msg.type === "user" ? "You" : "AI"}:</b>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      {/*  INPUT */}
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files[0];
          console.log("Selected file:", file);
          if (file) {
            uploadFile(file);
          } else {
            console.log("No file selected");
          }
        }}
      />

      <button onClick={sendQuery}>Send</button>

      {/* CHARTS */}

      {chartData && chartData.type === "bar" && (
        <div style={{ marginTop: "20px" }}>
          <Bar data={chartData.data} />
        </div>
      )}

      {chartData && chartData.type === "pie" && (
        <div style={{ marginTop: "20px" }}>
          <Pie data={chartData.data} />
        </div>
      )}

      {chartData && chartData.type === "line" && (
        <div style={{ marginTop: "20px" }}>
          <Line data={chartData.data} />
        </div>
      )}

    </div>
  );
}

export default App;