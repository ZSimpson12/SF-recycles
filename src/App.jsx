import { useEffect, useRef, useState } from 'react'
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
}

const BOTTLES = [
  { id: 1, left: 10, top: 30, rotate: -13, color: '#f6d267', delay: '0s' },
  { id: 2, left: 30, top: 48, rotate: 9, color: '#ff8f70', delay: '-1.2s' },
  { id: 3, left: 53, top: 24, rotate: -5, color: '#72d5aa', delay: '-2.4s' },
  { id: 4, left: 73, top: 52, rotate: 14, color: '#e4a4ff', delay: '-.7s' },
  { id: 5, left: 89, top: 28, rotate: -10, color: '#82cfff', delay: '-1.8s' },
]

function Bottle({ bottle, offset, isDragging, onPointerDown, onPointerMove, onPointerUp, onKeyDown }) {
  return (
    <button
      type="button"
      className={`floating-bottle${isDragging ? ' is-dragging' : ''}`}
      aria-label={`Floating bottle ${bottle.id}. Drag it or use the arrow keys to move it.`}
      style={{
        left: `${bottle.left}%`,
        top: `${bottle.top}%`,
        translate: `${offset.x}px ${offset.y}px`,
        '--bottle-angle': `${bottle.rotate}deg`,
        '--bottle-color': bottle.color,
        '--float-delay': bottle.delay,
      }}
      onPointerDown={(event) => onPointerDown(event, bottle.id)}
      onPointerMove={(event) => onPointerMove(event, bottle.id)}
      onPointerUp={(event) => onPointerUp(event, bottle.id)}
      onPointerCancel={(event) => onPointerUp(event, bottle.id)}
      onKeyDown={(event) => onKeyDown(event, bottle.id)}
    >
      <span className="bottle-float">
        <svg viewBox="0 0 58 126" aria-hidden="true">
          <path className="bottle-cap" d="M20 4h18v13H20z" />
          <path className="bottle-neck" d="M22 16h14v15c0 5 10 8 12 17 3 15 5 47 3 60-2 10-9 14-22 14S9 118 7 108c-2-13 0-45 3-60 2-9 12-12 12-17V16Z" />
          <path className="bottle-shine" d="M18 40c-5 14-6 49-3 65" />
          <path className="bottle-label" d="M10 65h40v31H10z" />
          <path className="bottle-mark" d="m25 73 10 7-10 8Z" />
        </svg>
      </span>
    </button>
  )
}

function WaterPlayground() {
  const initialOffsets = Object.fromEntries(BOTTLES.map(({ id }) => [id, { x: 0, y: 0 }]))
  const [offsets, setOffsets] = useState(initialOffsets)
  const [dragging, setDragging] = useState(null)
  const dragRef = useRef(null)

  function onPointerDown(event, id) {
    event.currentTarget.setPointerCapture(event.pointerId)
    const origin = offsets[id]
    dragRef.current = { id, startX: event.clientX, startY: event.clientY, origin }
    setDragging(id)
  }

  function onPointerMove(event, id) {
    const drag = dragRef.current
    if (!drag || drag.id !== id) return
    setOffsets((current) => ({
      ...current,
      [id]: {
        x: drag.origin.x + event.clientX - drag.startX,
        y: drag.origin.y + event.clientY - drag.startY,
      },
    }))
  }

  function onPointerUp(event, id) {
    if (dragRef.current?.id !== id) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setDragging(null)
  }

  function onKeyDown(event, id) {
    const directions = {
      ArrowLeft: [-12, 0],
      ArrowRight: [12, 0],
      ArrowUp: [0, -12],
      ArrowDown: [0, 12],
    }
    const movement = directions[event.key]
    if (!movement) return
    event.preventDefault()
    setOffsets((current) => ({
      ...current,
      [id]: {
        x: current[id].x + movement[0],
        y: current[id].y + movement[1],
      },
    }))
  }

  return (
    <section className="water-playground" aria-labelledby="water-title">
      <div className="water-copy">
        <div>
          <span className="section-kicker">Bottle break</span>
          <h2 id="water-title">Make a little splash</h2>
          <p>Drag the bottles through the tide, or focus one and use your arrow keys.</p>
        </div>
        <button type="button" className="reset-button" onClick={() => setOffsets(initialOffsets)}>
          Reset bottles
        </button>
      </div>
      <div className="water-scene">
        <div className="wave wave-back" />
        <div className="wave wave-front" />
        <span className="bubble bubble-1" />
        <span className="bubble bubble-2" />
        <span className="bubble bubble-3" />
        <span className="bubble bubble-4" />
        {BOTTLES.map((bottle) => (
          <Bottle
            key={bottle.id}
            bottle={bottle}
            offset={offsets[bottle.id]}
            isDragging={dragging === bottle.id}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={onKeyDown}
          />
        ))}
      </div>
    </section>
  )
}

function App() {
  const [userName, setUserName] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [weight, setWeight] = useState("")
  const [file, setFile] = useState(null)
  const [error, setError] = useState("")
  const [uploadResult, setUploadResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('global')

  async function requestLeaderboard() {
    try {
      const response = await fetch("http://localhost:4000/api/leaderboard")
      if (!response.ok) return []
      const data = await response.json()
      return data.users || []
    } catch {
      return []
    }
  }

  async function fetchLeaderboard() {
    setLeaderboard(await requestLeaderboard())
  }

  useEffect(() => {
    let ignore = false
    requestLeaderboard().then((entries) => {
      if (!ignore) setLeaderboard(entries)
    })
    return () => {
      ignore = true
    }
  }, [])

  function handleUserNameChange(event) { setUserName(event.target.value); setError('') }
  function handleFileChange(event) { setFile(event.target.files?.[0] ?? null); setError('') }
  function handleZipChange(event) { setZipCode(event.target.value); setError('') }

  async function onSubmit(event) {
    event.preventDefault()
    if (isLoading) return
    setError("")
    setUploadResult(null)
    if (!userName || !zipCode || !weight || !file) {
      setError("Please fill out all fields and select a receipt image.")
      return
    }
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("user", userName)
      formData.append("neighborhood", zipCode)
      formData.append("weight", weight)
      formData.append("receipt", file)
      const response = await fetch("http://localhost:4000/api/receipts", { method: "POST", body: formData })
      if (!response.ok) {
        const responseError = await response.json()
        throw new Error(responseError.error || "Upload failed")
      }
      const data = await response.json()
      setUploadResult(data)
      await fetchLeaderboard()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resolvedNeighborhood = SF_ZIP_CODES[zipCode.trim()] || ''
  const normalizedUserName = userName.trim().toLowerCase()
  const userEntries = normalizedUserName
    ? leaderboard.filter((entry) => entry.user?.toLowerCase() === normalizedUserName)
    : []
  const totalPoints = userEntries.reduce((sum, entry) => sum + entry.points, 0)
  const totalWeight = userEntries.reduce((sum, entry) => sum + (entry.weight || 0), 0)
  const sortedEntries = [...leaderboard].sort((a, b) => b.points - a.points)
  const localEntries = resolvedNeighborhood
    ? leaderboard.filter((entry) => entry.neighborhood?.toLowerCase() === resolvedNeighborhood.toLowerCase())
    : []
  const neighborhoodTotals = Object.entries(
    leaderboard.reduce((totals, entry) => {
      const neighborhood = entry.neighborhood || 'Unknown'
      totals[neighborhood] = (totals[neighborhood] || 0) + entry.points
      return totals
    }, {})
  ).sort((a, b) => b[1] - a[1])
  const visibleEntries = activeTab === 'global' ? sortedEntries : localEntries

  return (
    <div className="site-wrap">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Bottle Back home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M9 2h6v4l2 3v10c0 2-1 3-5 3s-5-1-5-3V9l2-3V2Z" /></svg>
          </span>
          Bottle Back
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#leaderboard">Leaderboard</a>
          <a className="nav-action" href="#upload">Log a receipt</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" id="how-it-works">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> San Francisco recycling club</span>
            <h1>Turn empties into <span>neighborhood wins.</span></h1>
            <p>Log your recycling receipt, collect bottle points, and help your corner of San Francisco rise through the ranks.</p>
            <div className="hero-actions">
              <a className="primary-action" href="#upload">
                Upload a receipt
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>
              </a>
              <span className="hero-note">It takes less than a minute</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="sun-disc" />
            <div className="hero-bottle hero-bottle-one"><BottleIcon label="REUSE" color="#f6d267" /></div>
            <div className="hero-bottle hero-bottle-two"><BottleIcon label="RETURN" color="#72d5aa" /></div>
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <div className="points-sticker"><strong>+10</strong><span>points / $1</span></div>
          </div>
        </section>

        <section className="dashboard" id="upload">
          <div className="upload-card card">
            <div className="card-heading">
              <span className="step-number">01</span>
              <div>
                <span className="section-kicker">Your turn</span>
                <h2>Log a receipt</h2>
              </div>
            </div>
            <form className="upload-form" onSubmit={onSubmit}>
              <div className="form-row">
                <label>
                  Your name
                  <input type="text" value={userName} placeholder="Recycling name" onChange={handleUserNameChange} />
                </label>
                <label>
                  SF zip code
                  <input type="text" value={zipCode} inputMode="numeric" placeholder="94110" onChange={handleZipChange} />
                  {resolvedNeighborhood && <span className="field-note">{resolvedNeighborhood}</span>}
                </label>
              </div>
              <label>
                Total recycled weight
                <div className="input-with-unit">
                  <input type="number" value={weight} min="0" step="0.1" placeholder="0.0" onChange={(event) => setWeight(event.target.value)} />
                  <span>lbs</span>
                </div>
              </label>
              <label className="file-drop">
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <span className="file-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4h14v-4" /></svg>
                </span>
                <span><strong>{file ? file.name : 'Choose a receipt image'}</strong><small>JPG, PNG, or WEBP</small></span>
              </label>
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? "Processing receipt..." : "Turn receipt into points"}
                {!isLoading && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>}
              </button>
              {error && <p className="form-error" role="alert">{error}</p>}
            </form>
            {uploadResult && (
              <div className="upload-result" role="status">
                <p className="upload-result-title">Receipt processed!</p>
                <div><span>Points earned</span><strong>+{uploadResult.points}</strong></div>
                <div><span>Payout</span><strong>${uploadResult.payout}</strong></div>
                <div><span>Weight</span><strong>{uploadResult.weight} lbs</strong></div>
                <div><span>Receipt #</span><strong>{uploadResult.receiptNumber || '—'}</strong></div>
              </div>
            )}
          </div>

          <section className="leaderboard-card card" id="leaderboard">
            <div className="card-heading leaderboard-heading">
              <div>
                <span className="section-kicker">Friendly competition</span>
                <h2>Leaderboard</h2>
              </div>
              <div className="tab-bar" aria-label="Leaderboard view">
                <button type="button" className={activeTab === 'global' ? 'tab-button active' : 'tab-button'} onClick={() => setActiveTab('global')}>All SF</button>
                <button type="button" className={activeTab === 'local' ? 'tab-button active' : 'tab-button'} onClick={() => setActiveTab('local')}>My area</button>
              </div>
            </div>
            <div className="mini-stats">
              <div><span>Your points</span><strong>{totalPoints}</strong></div>
              <div><span>Your impact</span><strong>{totalWeight.toFixed(1)} <small>lbs</small></strong></div>
              <div><span>Community logs</span><strong>{leaderboard.length}</strong></div>
            </div>
            <div className="leaderboard-list">
              {visibleEntries.length > 0 ? visibleEntries.map((entry, index) => (
                <div key={`${entry.user}-${index}`} className="leaderboard-row">
                  <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                  <span className="avatar" aria-hidden="true">{entry.user?.slice(0, 1).toUpperCase()}</span>
                  <span className="entry-user">{entry.user}<small>{entry.neighborhood || 'San Francisco'}</small></span>
                  <span className="entry-points">{entry.points}<small>pts</small></span>
                </div>
              )) : (
                <div className="empty-state">
                  <span className="empty-icon" aria-hidden="true"><BottleIcon label="" color="#72d5aa" /></span>
                  <strong>{activeTab === 'local' && resolvedNeighborhood ? `No logs in ${resolvedNeighborhood} yet` : 'The leaderboard is wide open'}</strong>
                  <p>{activeTab === 'local' && !resolvedNeighborhood ? 'Enter your zip code to see your neighborhood.' : 'Log a receipt and claim the first spot.'}</p>
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="neighborhood-section">
          <div className="section-heading">
            <div><span className="section-kicker">Citywide impact</span><h2>Neighborhood race</h2></div>
            <p>Every pound moves your neighborhood closer to the top.</p>
          </div>
          <div className="neighborhood-list">
            {neighborhoodTotals.length > 0 ? neighborhoodTotals.map(([neighborhood, points], index) => {
              const max = neighborhoodTotals[0][1]
              const percent = Math.round((points / max) * 100)
              const isUser = neighborhood.toLowerCase() === resolvedNeighborhood.toLowerCase()
              return (
                <div key={neighborhood} className={`neighborhood-row${isUser ? ' is-yours' : ''}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{neighborhood}{isUser && <small>Your area</small>}</strong>
                  <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
                  <b>{points} pts</b>
                </div>
              )
            }) : (
              <div className="neighborhood-placeholder">
                <span>01</span>
                <strong>Your neighborhood could lead the first wave.</strong>
                <div className="progress-track"><span style={{ width: '34%' }} /></div>
                <b>Start now</b>
              </div>
            )}
          </div>
        </section>

        <WaterPlayground />
      </main>
      <footer><span>Bottle Back, San Francisco</span><span>Small returns. Big ripples.</span></footer>
    </div>
  )
}

function BottleIcon({ label, color }) {
  return (
    <svg viewBox="0 0 140 270" aria-hidden="true">
      <path fill="#153c46" d="M50 5h40v28H50z" />
      <path fill={color} stroke="#153c46" strokeWidth="6" d="M53 31h34v32c0 10 28 19 32 41 7 37 12 104 7 133-4 21-20 28-56 28s-52-7-56-28c-5-29 0-96 7-133 4-22 32-31 32-41V31Z" />
      <path fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="8" opacity=".65" d="M42 92c-10 38-12 105-6 133" />
      <path fill="#fff" stroke="#153c46" strokeWidth="5" d="M18 136h104v68H18z" />
      {label && <text x="70" y="176" textAnchor="middle" fill="#153c46" fontSize="17" fontWeight="900">{label}</text>}
    </svg>
  )
}

export default App
