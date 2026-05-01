import React, { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "sf-recycles-leaderboard";

function loadLeaderboard() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Unable to load leaderboard", error);
    return [];
  }
}

function formatReceiptDate(isoDate) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

function App() {
  const [userName, setUserName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [weight, setWeight] = useState("");
  const [file, setFile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [receiptResult, setReceiptResult] = useState(null);
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEntries(loadLeaderboard());
  }, []);

  function handleUserNameChange(event) { setUserName(event.target.value); setError(""); }
  function handleNeighborhoodChange(event) { setNeighborhood(event.target.value); setError(""); }
  function handleFileChange(event) { setFile(event.target.files?.[0] ?? null); setError(""); }

  async function handleReceiptUpload({ user, neighborhood, weight, file }) {
    const formData = new FormData();
    formData.append("user", user);
    formData.append("neighborhood", neighborhood);
    formData.append("weight", weight);
    formData.append("receipt", file);

    const response = await fetch("http://localhost:4000/api/receipts", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  }

  async function fetchLeaderboard() {
    const response = await fetch("http://localhost:4000/api/leaderboard");
    return response.json();
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setUploadResult(null);
    if (!userName || !neighborhood || !weight || !file) {
      setError("Please fill out all fields and select a receipt image.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await handleReceiptUpload({ user: userName, neighborhood, weight, file });
      setUploadResult(data);
      const lb = await fetchLeaderboard();
      setLeaderboard(lb);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const normalizedUserName = userName.trim().toLowerCase();
  const userEntries = normalizedUserName
    ? entries.filter((entry) => entry.userName.toLowerCase() === normalizedUserName)
    : [];

  const totalPoints = userEntries.reduce((sum, entry) => sum + entry.points, 0);
  const sortedEntries = [...entries].sort((a, b) => b.points - a.points);

  return (
    <div className="app-shell">
      <header className="site-banner">
        <div className="brand-tag">[ digital recycle ]</div>
        <div className="site-links">
          <a href="#upload">home</a><span>∣</span>
          <a href="#upload">upload</a><span>∣</span>
          <a href="#leaderboard">leaderboard</a><span>∣</span>
          <a href="#about">about</a>
        </div>
      </header>

      <section className="intro-panel" id="about">
        <span className="eyebrow">SF Recycles</span>
        <h1>Upload receipts to earn bottle points</h1>
        <p>Snap or upload recycling receipts and watch your ranking move up the leaderboard.</p>
      </section>

      <div className="main-layout">
        <section className="panel upload-panel">
          <div className="panel-header">
            <h2>Receipt upload</h2>
            <p>Submit a receipt image to earn points.</p>
          </div>

          <form className="upload-form" onSubmit={onSubmit}>
            <label>
              Your name
              <input type="text" placeholder="What's your recycling name?" onChange={handleUserNameChange} />
            </label>
            <label>
              Neighborhood
              <input type="text" placeholder="Enter your neighborhood" onChange={handleNeighborhoodChange} />
            </label>
            <label>
              Total weight (lbs)
              <input type="number" step="0.1" placeholder="Enter total lbs from receipt" onChange={(e) => setWeight(e.target.value)} />
            </label>
            <label>
              Receipt image
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
            <button type="submit" className="button" disabled={isLoading}>
              {isLoading ? "Processing..." : "Process receipt"}
            </button>
            {error && <p className="form-error">{error}</p>}
          </form>

          {uploadResult && (
            <div className="upload-result">
              <h2>Receipt Processed!</h2>
              <p><strong>Points:</strong> {uploadResult.points}</p>
              <p><strong>Weight:</strong> {uploadResult.weight} lbs</p>
              <p><strong>Receipt #:</strong> {uploadResult.receiptNumber}</p>
            </div>
          )}
        </section>

        <section className="panel leaderboard-panel">
          <div className="panel-header">
            <h2>Leaderboard</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Your total points</p>
              <h3>{totalPoints}</h3>
            </div>
            <div className="stat-card">
              <p className="stat-label">Submissions</p>
              <h3>{entries.length}</h3>
            </div>
          </div>
          <div className="leaderboard-list">
            {sortedEntries.length > 0 ? (
              sortedEntries.map((entry, index) => (
                <div key={entry.id} className="leaderboard-row">
                  <span className="rank">#{index + 1}</span>
                  <span className="entry-user">{entry.userName}</span>
                  <span className="entry-points">{entry.points} pts</span>
                </div>
              ))
            ) : (
              <p className="empty-state">No receipts submitted yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;