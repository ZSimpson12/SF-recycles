// Cheap 2D water: a 1D chain of springs drawn on canvas, plus a few buoyant
// bottles. It lives outside React so animation never triggers a re-render.

const STEP = 1 / 60
const MIN_SPACING = 8
const MAX_COLUMNS = 180
const SUBSTEPS = 2
const TENSION = 0.3
const RESTORE = 0.004
const DAMPING = 0.996
const MAX_DISPLACEMENT = 70

const BOTTLE_W = 54
const BOTTLE_H = 118
const GRAVITY = 0.3
const FLOAT_LEVEL = 0.55 // Fraction of the bottle underwater at rest.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function createWaterSim({ section, backCanvas, frontCanvas, bottleEls, bottleConfig }) {
  const back = backCanvas.getContext('2d')
  const front = frontCanvas.getContext('2d')
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  let width = 0
  let height = 0
  let base = 0
  let spacing = MIN_SPACING
  let columns = 0
  let heights = new Float32Array(0)
  let velocities = new Float32Array(0)
  let surface = new Float32Array(0)
  let backSurface = new Float32Array(0)
  let backFill = null
  let frontFill = null

  let time = 0
  let accumulator = 0
  let lastFrame = 0
  let frameId = null
  let visible = true
  let moving = false

  const bottles = bottleConfig.map((config, index) => ({
    el: bottleEls[index],
    start: config.start,
    rest: (config.rotate * Math.PI) / 180,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: (config.rotate * Math.PI) / 180,
    spin: 0,
    submerged: FLOAT_LEVEL,
    held: false,
    targetX: 0,
    targetY: 0,
    grabX: 0,
    grabY: 0,
  }))

  function surfaceAt(x) {
    const position = clamp(x / spacing, 0, columns - 1)
    const left = Math.floor(position)
    const right = Math.min(left + 1, columns - 1)
    return surface[left] + (surface[right] - surface[left]) * (position - left)
  }

  function disturb(x, amount) {
    const center = Math.round(x / spacing)
    for (let offset = -4; offset <= 4; offset += 1) {
      const index = center + offset
      if (index >= 0 && index < columns) {
        const falloff = 0.5 + 0.5 * Math.cos((offset / 5) * Math.PI)
        velocities[index] += amount * 0.7 * falloff
      }
    }
    wake()
  }

  function updateSurfaces() {
    const swell = motionQuery.matches ? 0 : 1
    for (let i = 0; i < columns; i += 1) {
      const x = i * spacing
      const ambient = swell * (6 * Math.sin(x * 0.008 + time * 0.9) + 3 * Math.sin(x * 0.019 - time * 1.3))
      const backAmbient = swell * (7 * Math.sin(x * 0.006 - time * 0.7) + 3 * Math.sin(x * 0.015 + time))
      surface[i] = base + heights[i] + ambient
      backSurface[i] = base - 14 + heights[i] * 0.55 + backAmbient
    }
  }

  function stepWater() {
    for (let pass = 0; pass < SUBSTEPS; pass += 1) {
      for (let i = 0; i < columns; i += 1) {
        const left = heights[i > 0 ? i - 1 : 0]
        const right = heights[i < columns - 1 ? i + 1 : i]
        const force = TENSION * (left + right - 2 * heights[i]) - RESTORE * heights[i]
        velocities[i] = (velocities[i] + force) * DAMPING
      }
      for (let i = 0; i < columns; i += 1) {
        heights[i] = clamp(heights[i] + velocities[i], -MAX_DISPLACEMENT, MAX_DISPLACEMENT)
      }
    }
  }

  function stepBottle(bottle) {
    const waterline = surfaceAt(bottle.x)
    const slope = (surfaceAt(bottle.x + 12) - surfaceAt(bottle.x - 12)) / 24
    const submerged = clamp((bottle.y + BOTTLE_H / 2 - waterline) / BOTTLE_H, 0, 1)

    if (bottle.held) {
      bottle.vx = (bottle.targetX - bottle.x) * 0.3
      bottle.vy = (bottle.targetY - bottle.y) * 0.3
    } else {
      bottle.vy += GRAVITY * (1 - submerged / FLOAT_LEVEL)
      bottle.vy *= 1 - 0.07 * submerged
      bottle.vx += slope * 0.35 * submerged
      bottle.vx *= 1 - 0.008 - 0.02 * submerged
    }

    bottle.x += bottle.vx
    bottle.y += bottle.vy

    const minX = BOTTLE_W / 2
    const maxX = Math.max(minX, width - BOTTLE_W / 2)
    if (bottle.x < minX || bottle.x > maxX) {
      bottle.x = clamp(bottle.x, minX, maxX)
      bottle.vx *= -0.5
    }
    const minY = BOTTLE_H / 2
    const maxY = Math.max(minY, height - BOTTLE_H / 2)
    if (bottle.y < minY || bottle.y > maxY) {
      bottle.y = clamp(bottle.y, minY, maxY)
      bottle.vy *= -0.3
    }

    if (bottle.submerged === 0 && submerged > 0 && bottle.vy > 1) {
      disturb(bottle.x, Math.min(bottle.vy * 1.6, 14))
    } else if (submerged > 0 && Math.abs(bottle.vy) + Math.abs(bottle.vx) > 2) {
      disturb(bottle.x, clamp(bottle.vy * 0.12 + Math.abs(bottle.vx) * 0.04, -1.5, 1.5))
    }
    bottle.submerged = submerged

    const target = bottle.held
      ? clamp(bottle.vx * 0.04, -0.7, 0.7)
      : bottle.rest + Math.atan(slope) * 0.9 + clamp(bottle.vx * 0.02, -0.3, 0.3)
    bottle.spin += (target - bottle.angle) * (submerged > 0 || bottle.held ? 0.03 : 0.004)
    bottle.spin *= 0.9
    bottle.angle += bottle.spin
  }

  function separateBottles() {
    for (let i = 0; i < bottles.length; i += 1) {
      for (let j = i + 1; j < bottles.length; j += 1) {
        const a = bottles[i]
        const b = bottles[j]
        const dx = b.x - a.x
        if (Math.abs(dx) >= BOTTLE_W || Math.abs(b.y - a.y) >= BOTTLE_H * 0.7) continue
        const direction = dx >= 0 ? 1 : -1
        const overlap = BOTTLE_W - Math.abs(dx)
        if (!a.held) {
          a.x -= (direction * overlap) / 2
          a.vx -= direction * 0.1
        }
        if (!b.held) {
          b.x += (direction * overlap) / 2
          b.vx += direction * 0.1
        }
      }
    }
  }

  function step() {
    time += STEP
    stepWater()
    updateSurfaces()
    bottles.forEach(stepBottle)
    separateBottles()
  }

  function isMoving() {
    for (const bottle of bottles) {
      if (bottle.held || Math.abs(bottle.vx) > 0.05 || Math.abs(bottle.vy) > 0.05) return true
    }
    for (let i = 0; i < columns; i += 1) {
      if (Math.abs(velocities[i]) > 0.03) return true
    }
    return false
  }

  function fillWater(ctx, line, fill) {
    ctx.clearRect(0, 0, width, height)
    ctx.beginPath()
    ctx.moveTo(0, line[0])
    for (let i = 1; i < columns; i += 1) ctx.lineTo(i * spacing, line[i])
    ctx.lineTo(width, line[columns - 1])
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
  }

  function render() {
    fillWater(back, backSurface, backFill)
    fillWater(front, surface, frontFill)

    front.beginPath()
    front.moveTo(0, surface[0])
    for (let i = 1; i < columns; i += 1) front.lineTo(i * spacing, surface[i])
    front.lineTo(width, surface[columns - 1])
    front.strokeStyle = 'rgba(255, 255, 255, .65)'
    front.lineWidth = 2
    front.stroke()

    for (const bottle of bottles) {
      bottle.el.style.transform =
        `translate3d(${bottle.x - BOTTLE_W / 2}px, ${bottle.y - BOTTLE_H / 2}px, 0) rotate(${bottle.angle}rad)`
    }
  }

  function frame(now) {
    frameId = null
    accumulator += Math.min(0.05, (now - lastFrame) / 1000)
    lastFrame = now

    let stepped = false
    // The small slack avoids skipped frames from timer jitter on 60 Hz displays,
    // while faster displays still simulate and draw at about 60 Hz.
    while (accumulator >= STEP - 0.002) {
      step()
      accumulator -= STEP
      stepped = true
    }
    if (stepped) {
      render()
      moving = isMoving()
    }

    // With reduced motion there is no ambient swell, so the loop can fully sleep.
    if (visible && (moving || !motionQuery.matches)) {
      frameId = requestAnimationFrame(frame)
    }
  }

  function wake() {
    moving = true
    if (frameId === null && visible) {
      lastFrame = performance.now()
      frameId = requestAnimationFrame(frame)
    }
  }

  function resize() {
    const rect = section.getBoundingClientRect()
    const previousWidth = width
    width = rect.width
    height = rect.height
    base = Math.round(height * 0.4)
    spacing = Math.max(MIN_SPACING, width / MAX_COLUMNS)

    const nextColumns = Math.ceil(width / spacing) + 1
    if (nextColumns !== columns) {
      columns = nextColumns
      heights = new Float32Array(columns)
      velocities = new Float32Array(columns)
      surface = new Float32Array(columns)
      backSurface = new Float32Array(columns)
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
    for (const [canvas, ctx] of [[backCanvas, back], [frontCanvas, front]]) {
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    backFill = back.createLinearGradient(0, base - 30, 0, height)
    backFill.addColorStop(0, '#8adbe0')
    backFill.addColorStop(1, '#2a9db6')
    frontFill = front.createLinearGradient(0, base - 20, 0, height)
    frontFill.addColorStop(0, 'rgba(70, 188, 206, .62)')
    frontFill.addColorStop(0.45, 'rgba(32, 144, 174, .9)')
    frontFill.addColorStop(1, 'rgba(14, 92, 118, 1)')

    updateSurfaces()
    for (const bottle of bottles) {
      if (previousWidth === 0) {
        bottle.x = bottle.start * width
        bottle.y = surfaceAt(bottle.x) + BOTTLE_H * (FLOAT_LEVEL - 0.5)
      } else {
        bottle.x *= width / previousWidth
        bottle.y = Math.min(bottle.y, height - BOTTLE_H / 2)
      }
    }
    render()
    wake()
  }

  const resizeObserver = new ResizeObserver(resize)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) {
      wake()
    } else if (frameId !== null) {
      cancelAnimationFrame(frameId)
      frameId = null
    }
  })

  function toLocal(clientX, clientY) {
    const rect = section.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  resize()
  resizeObserver.observe(section)
  visibilityObserver.observe(section)
  motionQuery.addEventListener('change', wake)

  return {
    grab(index, clientX, clientY) {
      const bottle = bottles[index]
      const point = toLocal(clientX, clientY)
      bottle.held = true
      bottle.grabX = bottle.x - point.x
      bottle.grabY = bottle.y - point.y
      bottle.targetX = bottle.x
      bottle.targetY = bottle.y
      bottle.el.classList.add('is-dragging')
      wake()
    },
    drag(index, clientX, clientY) {
      const bottle = bottles[index]
      if (!bottle.held) return
      const point = toLocal(clientX, clientY)
      bottle.targetX = point.x + bottle.grabX
      bottle.targetY = point.y + bottle.grabY
    },
    release(index) {
      const bottle = bottles[index]
      if (!bottle.held) return
      bottle.held = false
      bottle.vx = clamp(bottle.vx, -16, 16)
      bottle.vy = clamp(bottle.vy, -22, 22)
      bottle.el.classList.remove('is-dragging')
      wake()
    },
    nudge(index, vx, vy) {
      const bottle = bottles[index]
      bottle.vx += vx
      bottle.vy += vy
      wake()
    },
    splash(clientX, clientY) {
      const { x, y } = toLocal(clientX, clientY)
      if (y >= surfaceAt(x) - 20) disturb(x, 9)
    },
    ripple(clientX, clientY, speed) {
      if (bottles.some((bottle) => bottle.held)) return
      const { x, y } = toLocal(clientX, clientY)
      if (y >= surfaceAt(x)) disturb(x, Math.min(speed * 0.06, 2.5))
    },
    destroy() {
      if (frameId !== null) cancelAnimationFrame(frameId)
      frameId = null
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      motionQuery.removeEventListener('change', wake)
    },
  }
}
