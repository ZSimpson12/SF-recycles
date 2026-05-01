import { testGemini } from "./gemini";
import { act, useEffect, useState } from 'react'
import './App.css'

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
    setEntries(loadLeaderboard())
  }, [])

  function saveEntries(nextEntries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries))
    } catch (err) {
      console.error('Unable to save leaderboard', err)
    }
  }

  function handleUserNameChange(event) {
    setUserName(event.target.value)
    setError('')
  }

  function handleFileChange(event) {
    setFile(event.target.files?.[0] ?? null)
    setError('')
  }

  function handleNeighborhoodChange(event) {
    setNeighborhood(event.target.value)
    setError('')
  }

  function handleUpload(event) {
    event.preventDefault()
    if (!userName.trim()) {
      setError('Enter your name so your points appear on the leaderboard.')
      return
    }

    if (!file) {
      setError('Select a receipt image to process.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.')
      return
    }

    const bottleCount = mockExtractBottleCount(file)
    const points = calculatePoints(bottleCount)
    const nextEntry = {
      id: `${Date.now()}-${file.name}`,
      userName: userName.trim(),
      neighborhood: neighborhood.trim(),
      receiptName: file.name,
      bottleCount,
      points,
      date: new Date().toISOString(),
    }

    const nextEntries = [nextEntry, ...entries].sort((a, b) => b.points - a.points)
    setEntries(nextEntries)
    setReceiptResult(nextEntry)
    setFile(null)
    saveEntries(nextEntries)
    event.currentTarget.reset()
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
              Neighborhood
              <input
                type="text"
                placeholder="Which neighborhood are you in?"
                onChange={handleNeighborhoodChange}
              />
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
              <p>{totalBottles} lb donated</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Submissions</p>
              <h3>{entries.length}</h3>
            </div>
          </div>

          <div className="tab-bar">
            <button
              className={activeTab === 'global' ? 'tab-btn tab-btn--active' : 'tab-btn'}
              onClick={() => setActiveTab('global')}
            >
              Global
            </button>
            <button
              className={activeTab === 'local' ? 'tab-btn tab-btn--active' : 'tab-btn'}
              onClick={() => setActiveTab('local')}
            >
              Local
            </button>
          </div>


          <div className="leaderboard-list">
            {activeTab === 'global' ? (
              sortedEntries.length > 0 ? (
                sortedEntries.map((entry, index) => (
                  <div key={entry.id} className="leaderboard-row">
                    <span className="rank">#{index + 1}</span>
                    <span className="entry-user">{entry.userName}</span>
                    <span className="entry-bottles">{entry.bottleCount} bottles</span>
                    <span className="entry-points">{entry.points} pts</span>
                  </div>
                ))
              ) : (
                <p className="empty-state">No receipts submitted yet.</p>
              )
            ) : (
              (() => {
                const localEntries = sortedEntries.filter(
                  e => e.neighborhood?.toLowerCase() === neighborhood.trim().toLowerCase()
                )
                return localEntries.length > 0 ? (
                  localEntries.map((entry, index) => (
                    <div key={entry.id} className="leaderboard-row">
                      <span className="rank">#{index + 1}</span>
                      <span className="entry-user">{entry.userName}</span>
                      <span className="entry-bottles">{entry.bottleCount} bottles</span>
                      <span className="entry-points">{entry.points} pts</span>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">
                    {neighborhood.trim()
                      ? `No entries for ${neighborhood.trim()} yet.`
                      : 'Enter your neighborhood above to see local rankings.'}
                  </p>
                )
              })()
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;