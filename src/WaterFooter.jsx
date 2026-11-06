import { useLayoutEffect, useRef } from 'react'
import { createWaterSim } from './waterSim'

const BOTTLES = [
  { id: 1, start: 0.12, rotate: -13, color: '#f6d267' },
  { id: 2, start: 0.31, rotate: 9, color: '#ff8f70' },
  { id: 3, start: 0.52, rotate: -5, color: '#72d5aa' },
  { id: 4, start: 0.72, rotate: 14, color: '#e4a4ff' },
  { id: 5, start: 0.89, rotate: -10, color: '#82cfff' },
]

const NUDGES = {
  ArrowLeft: [-3.5, 0],
  ArrowRight: [3.5, 0],
  ArrowUp: [0, -10],
  ArrowDown: [0, 7],
}

function WaterFooter() {
  const sectionRef = useRef(null)
  const backCanvasRef = useRef(null)
  const frontCanvasRef = useRef(null)
  const bottleRefs = useRef([])
  const simRef = useRef(null)

  useLayoutEffect(() => {
    const sim = createWaterSim({
      section: sectionRef.current,
      backCanvas: backCanvasRef.current,
      frontCanvas: frontCanvasRef.current,
      bottleEls: bottleRefs.current,
      bottleConfig: BOTTLES,
    })
    simRef.current = sim
    return () => {
      sim.destroy()
      simRef.current = null
    }
  }, [])

  function onBottlePointerDown(event, index) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    simRef.current?.grab(index, event.clientX, event.clientY)
  }

  function onBottleKeyDown(event, index) {
    const nudge = NUDGES[event.key]
    if (!nudge) return
    event.preventDefault()
    simRef.current?.nudge(index, nudge[0], nudge[1])
  }

  function onWaterPointerMove(event) {
    if (event.pointerType !== 'mouse') return
    const speed = Math.hypot(event.movementX, event.movementY)
    if (speed > 0) simRef.current?.ripple(event.clientX, event.clientY, speed)
  }

  return (
    <section
      ref={sectionRef}
      className="water-footer"
      aria-label="Water with floating bottles"
      onPointerDown={(event) => simRef.current?.splash(event.clientX, event.clientY)}
      onPointerMove={onWaterPointerMove}
    >
      <canvas ref={backCanvasRef} className="water-canvas water-canvas-back" aria-hidden="true" />
      {BOTTLES.map((bottle, index) => (
        <button
          key={bottle.id}
          ref={(element) => { bottleRefs.current[index] = element }}
          type="button"
          className="floating-bottle"
          aria-label={`Floating bottle ${bottle.id}. Drag it or use the arrow keys to move it.`}
          style={{ '--bottle-color': bottle.color }}
          onPointerDown={(event) => onBottlePointerDown(event, index)}
          onPointerMove={(event) => simRef.current?.drag(index, event.clientX, event.clientY)}
          onPointerUp={() => simRef.current?.release(index)}
          onPointerCancel={() => simRef.current?.release(index)}
          onKeyDown={(event) => onBottleKeyDown(event, index)}
        >
          <svg viewBox="0 0 58 126" aria-hidden="true">
            <path className="bottle-cap" d="M20 4h18v13H20z" />
            <path className="bottle-neck" d="M22 16h14v15c0 5 10 8 12 17 3 15 5 47 3 60-2 10-9 14-22 14S9 118 7 108c-2-13 0-45 3-60 2-9 12-12 12-17V16Z" />
            <path className="bottle-shine" d="M18 40c-5 14-6 49-3 65" />
            <path className="bottle-label" d="M10 65h40v31H10z" />
            <path className="bottle-mark" d="m25 73 10 7-10 8Z" />
          </svg>
        </button>
      ))}
      <canvas ref={frontCanvasRef} className="water-canvas water-canvas-front" aria-hidden="true" />
      <footer className="water-footer-copy">
        <span>Bottle Back, San Francisco</span>
        <span>Drag a bottle or make some waves</span>
        <span>Small returns. Big ripples.</span>
      </footer>
    </section>
  )
}

export default WaterFooter
