import { testGemini } from "./gemini";
import { useEffect, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'sf-recycles-leaderboard'

// Load the local leaderboard saved in browser localStorage.
function loadLeaderboard() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Unable to load leaderboard', error)
    return []
  }
}

// Mock receipt parsing: use filename digits or a hash to approximate bottle count.
function mockExtractBottleCount(file) {
  const digits = file.name.match(/\d+/g)
  if (digits) {
    return Math.min(60, Math.max(4, Number(digits.join('').slice(0, 2))))
  }

  const hash = [...file.name].reduce((sum, char) => sum + char.charCodeAt(0), 0) + file.size
  return Math.min(48, Math.max(4, Math.floor((hash % 36) + 4)))
}

function calculatePoints(bottleCount) {
  return bottleCount * 2 + (bottleCount >= 25 ? 10 : 0)
}

// Format a timestamp into a compact readable date string.
function formatReceiptDate(isoDate) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

function App() {
  const [userName, setUserName] = useState('')
  const [file, setFile] = useState(null)
  const [entries, setEntries] = useState([])
  const [receiptResult, setReceiptResult] = useState(null)
  const [error, setError] = useState('')

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

  const normalizedUserName = userName.trim().toLowerCase()
  const userEntries = normalizedUserName
    ? entries.filter((entry) => entry.userName.toLowerCase() === normalizedUserName)
    : []

  const totalBottles = userEntries.reduce((sum, entry) => sum + entry.bottleCount, 0)
  const totalPoints = userEntries.reduce((sum, entry) => sum + entry.points, 0)
  const sortedEntries = [...entries].sort((a, b) => b.points - a.points)

  return (
    <div className="app-shell">
      <header className="site-banner">
        <div className="brand-tag">[ digital recycle ]</div>
        <div className="site-links">
          <a href="#upload">home</a>
          <span>∣</span>
          <a href="#upload">upload</a>
          <span>∣</span>
          <a href="#leaderboard">leaderboard</a>
          <span>∣</span>
          <a href="#about">about</a>
        </div>
      </header>

      {/* Intro section with app headline and description */}
      <section className="intro-panel" id="about">
        <span className="eyebrow">SF Recycles</span>
        <h1>Upload receipts to earn bottle points</h1>
        <p>
          Snap or upload recycling receipts, estimate donated bottles, and watch your
          ranking move up the leaderboard.
        </p>
      </section>

      {/* Main content grid for the upload form and leaderboard panels */}
      <div className="main-layout">
        {/* Receipt upload panel */}
        <section className="panel upload-panel">
          <div className="panel-header">
            <h2>Receipt upload</h2>
            <p>Submit a receipt image and let the app estimate bottles donated.</p>
          </div>

          <form className="upload-form" onSubmit={handleUpload}>
            <label>
              Your name
              <input
                type="text"
                placeholder="What's your recycling name?"
                onChange={handleUserNameChange}
              />
            </label>

            <label>
              Receipt image
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>

            <button type="submit" className="button">
              Process receipt
            </button>

            {error && <p className="form-error">{error}</p>}
          </form>

          {receiptResult && (
            <div className="receipt-summary">
              <p className="summary-label">Recent receipt result</p>
              <div className="summary-row">
                <span>Name</span>
                <strong>{receiptResult.userName}</strong>
              </div>
              <div className="summary-row">
                <span>Receipt</span>
                <strong>{receiptResult.receiptName}</strong>
              </div>
              <div className="summary-row">
                <span>Bottles</span>
                <strong>{receiptResult.bottleCount}</strong>
              </div>
              <div className="summary-row">
                <span>Points</span>
                <strong>{receiptResult.points}</strong>
              </div>
              <div className="summary-row">
                <span>Processed</span>
                <strong>{formatReceiptDate(receiptResult.date)}</strong>
              </div>
            </div>
          )}
        </section>

        {/* Leaderboard panel with top users and totals */}
        <section className="panel leaderboard-panel">
          <div className="panel-header">
            <h2>Leaderboard</h2>
            <p>Top recyclers and user totals are stored locally in your browser.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Your total points</p>
              <h3>{totalPoints}</h3>
              <p>{totalBottles} bottles donated</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Submissions</p>
              <h3>{entries.length}</h3>
              <p>Receipt uploads saved</p>
            </div>
          </div>

          <div className="leaderboard-list">
            {sortedEntries.length > 0 ? (
              sortedEntries.map((entry, index) => (
                <div key={entry.id} className="leaderboard-row">
                  <span className="rank">#{index + 1}</span>
                  <span className="entry-user">{entry.userName}</span>
                  <span className="entry-bottles">{entry.bottleCount} bottles</span>
                  <span className="entry-points">{entry.points} pts</span>
                </div>
              ))
            ) : (
              <p className="empty-state">No receipts submitted yet. Upload one to start the leaderboard.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App;