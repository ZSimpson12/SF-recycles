import { useEffect, useState } from 'react'
import './App.css'

const SF_ZIP_CODES = {
  "94102": "Civic Center", "94103": "SoMa", "94104": "Financial District",
  "94105": "South Beach", "94107": "Potrero Hill", "94108": "Chinatown",
  "94109": "Nob Hill", "94110": "Mission District", "94111": "Financial District",
  "94112": "Excelsior", "94114": "Castro", "94115": "Western Addition",
  "94116": "Inner Sunset", "94117": "Haight-Ashbury", "94118": "Inner Richmond",
  "94119": "West Portal", "94121": "Outer Richmond", "94122": "Outer Sunset",
  "94123": "Marina", "94124": "Bayview", "94127": "West Portal",
  "94129": "Presidio", "94130": "Treasure Island", "94131": "Glen Park",
  "94132": "Ocean View", "94133": "North Beach", "94134": "Visitacion Valley",
  "94158": "Mission Bay"
};

function App() {
  const [userName, setUserName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [weight, setWeight] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('global');

  async function fetchLeaderboard() {
    const response = await fetch("http://localhost:4000/api/leaderboard");
    const data = await response.json();
    setLeaderboard(data.users || []);
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  function handleUserNameChange(event) { setUserName(event.target.value); setError(''); }
  function handleFileChange(event) { setFile(event.target.files?.[0] ?? null); setError(''); }
  function handleZipChange(event) { setZipCode(event.target.value); setError(''); }

  async function onSubmit(e) {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setUploadResult(null);
    if (!userName || !zipCode || !weight || !file) {
      setError("Please fill out all fields and select a receipt image.");
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("user", userName);
      formData.append("neighborhood", zipCode);
      formData.append("weight", weight);
      formData.append("receipt", file);

      const response = await fetch("http://localhost:4000/api/receipts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await response.json();
      setUploadResult(data);
      await fetchLeaderboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const resolvedNeighborhood = SF_ZIP_CODES[zipCode.trim()] || '';
  const normalizedUserName = userName.trim().toLowerCase();

  const userEntries = normalizedUserName
    ? leaderboard.filter(e => e.user?.toLowerCase() === normalizedUserName)
    : [];

  const totalPoints = userEntries.reduce((sum, e) => sum + e.points, 0);
  const totalWeight = userEntries.reduce((sum, e) => sum + (e.weight || 0), 0);
  const sortedEntries = [...leaderboard].sort((a, b) => b.points - a.points);
  const localEntries = resolvedNeighborhood
    ? leaderboard.filter(e => e.neighborhood?.toLowerCase() === resolvedNeighborhood.toLowerCase())
    : [];

  const neighborhoodTotals = Object.entries(
    leaderboard.reduce((acc, entry) => {
      const hood = entry.neighborhood || 'Unknown';
      acc[hood] = (acc[hood] || 0) + entry.points;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

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
              Zip code
              <input type="text" placeholder="Enter your SF zip code (e.g. 94110)" onChange={handleZipChange} />
              {resolvedNeighborhood && (
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-2)', fontWeight: 700 }}>
                  → {resolvedNeighborhood}
                </span>
              )}
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
              <p><strong>Payout:</strong> ${uploadResult.payout}</p>
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
              <p>{totalWeight.toFixed(1)} lbs donated</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Submissions</p>
              <h3>{leaderboard.length}</h3>
            </div>
          </div>

          <div className="tab-bar">
            <button className={activeTab === 'global' ? 'tab-btn tab-btn--active' : 'tab-btn'} onClick={() => setActiveTab('global')}>Global</button>
            <button className={activeTab === 'local' ? 'tab-btn tab-btn--active' : 'tab-btn'} onClick={() => setActiveTab('local')}>Local</button>
          </div>

          <div className="leaderboard-list">
            {activeTab === 'global' ? (
              sortedEntries.length > 0 ? (
                sortedEntries.map((entry, index) => (
                  <div key={index} className="leaderboard-row">
                    <span className="rank">#{index + 1}</span>
                    <span className="entry-user">{entry.user}</span>
                    <span className="entry-points">{entry.points} pts</span>
                  </div>
                ))
              ) : (
                <p className="empty-state">No receipts submitted yet.</p>
              )
            ) : (
              localEntries.length > 0 ? (
                localEntries.map((entry, index) => (
                  <div key={index} className="leaderboard-row">
                    <span className="rank">#{index + 1}</span>
                    <span className="entry-user">{entry.user}</span>
                    <span className="entry-points">{entry.points} pts</span>
                  </div>
                ))
              ) : (
                <p className="empty-state">
                  {resolvedNeighborhood ? `No entries for ${resolvedNeighborhood} yet.` : 'Enter your zip code above to see local rankings.'}
                </p>
              )
            )}
          </div>
        </section>
      </div>

      <section className="panel neighborhood-panel">
        <div className="panel-header">
          <h2>Neighborhood Battle</h2>
          <p>Total points earned by every SF neighborhood.</p>
        </div>

        <div className="neighborhood-list">
          {neighborhoodTotals.length > 0 ? (
            neighborhoodTotals.map(([hood, pts], index) => {
              const max = neighborhoodTotals[0][1];
              const pct = Math.round((pts / max) * 100);
              const isUser = hood.toLowerCase() === resolvedNeighborhood.toLowerCase();
              return (
                <div key={hood} className={`neighborhood-row${isUser ? ' neighborhood-row--you' : ''}`}>
                  <span className="rank">#{index + 1}</span>
                  <span className="neighborhood-name">{hood}</span>
                  <div className="neighborhood-bar-wrap">
                    <div className="neighborhood-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="neighborhood-pts">{pts} pts</span>
                </div>
              );
            })
          ) : (
            <p className="empty-state">No submissions yet. Be the first to represent your neighborhood!</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;