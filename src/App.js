import React, { useState, useEffect, useRef } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import "chart.js/auto";

function App() {
  const API = "https://ai-data-analyst-backend-paiz.onrender.com";
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [chartData, setChartData] = useState(null);

  const chatRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  // 🚀 SEND QUERY
  const sendQuery = async () => {

    if (!query) return;

    // clear chart
    setChartData(null);

    // Add user message
    setMessages(prev => [...prev, { type: "user", text: query }]);

    // Add "Thinking..."
    setMessages(prev => [...prev, { type: "bot", text: "Thinking..." }]);

    try {

      const res = await fetch(
        `${API}/ai-query?q=${encodeURIComponent(query)}`
      );

      const data = await res.json();

      // AI response
      let reply =
        data.insight ||
        data.message ||
        data.error ||
        "No response";

      setMessages(prev => {
        const updated = [...prev];
        updated.pop(); // remove "Thinking..."
        return [...updated, { type: "bot", text: reply }];
      });

      // CHART
      if (data.parsed?.operation === "groupby") {

        const chartRes = await fetch(
          `${API}/chart?group_col=${data.parsed.group_col}&value_col=${data.parsed.value_col}`
        );

        const chartJson = await chartRes.json();

        if (!chartJson.error) {

          setChartData({
            type: data.parsed.chart_type || "bar",
            data: {
              labels: chartJson.labels,
              datasets: [{
                label: data.parsed.value_col,
                data: chartJson.values,
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

      // remove "Thinking..." and show error
      setMessages(prev => {
        const updated = [...prev];
        updated.pop();
        return [...updated, { type: "bot", text: "Server error" }];
      });
    }

    setQuery("");
  };

  // FILE UPLOAD
  const uploadFile = async (file) => {

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {

      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      alert("File uploaded successfully!");
      console.log("Columns:", data.data.columns);

    } catch (err) {
      alert("Upload failed");
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

      {/* 💬 CHAT BOX */}
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
          <div key={i} style={{
            textAlign: msg.type === "user" ? "right" : "left",
            margin: "10px"
          }}>
            <b>{msg.type === "user" ? "You" : "AI"}:</b>
            <p>{msg.text}</p>
          </div>
        ))}

      </div>

      {/*  INPUT */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask something..."
        style={{ width: "80%", padding: "10px" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendQuery();
        }}
      />

      <button onClick={sendQuery}>Send</button>

      {/* CHART */}

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