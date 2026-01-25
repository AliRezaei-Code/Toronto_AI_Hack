type ParticleBurstOptions = {
  intensity?: number
  color?: string
}

type ParticleBurstDetail = ParticleBurstOptions & {
  clientX: number
  clientY: number
}

const EVENT_NAME = 'particle-burst'

const emitParticleEvent = (detail: ParticleBurstDetail) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }))
}

export const emitParticleBurst = (
  clientX: number,
  clientY: number,
  options: ParticleBurstOptions = {}
) => {
  emitParticleEvent({ clientX, clientY, ...options })
}

export const emitParticleBurstFromEvent = (
  event: MouseEvent | React.MouseEvent,
  options: ParticleBurstOptions = {}
) => {
  emitParticleBurst(event.clientX, event.clientY, options)
}

export const emitParticleBurstFromElement = (
  element: HTMLElement | null,
  options: ParticleBurstOptions = {}
) => {
  if (!element) return
  const rect = element.getBoundingClientRect()
  const clientX = rect.left + rect.width / 2
  const clientY = rect.top + rect.height / 2
  emitParticleBurst(clientX, clientY, options)
}

export const particleEventName = EVENT_NAME
