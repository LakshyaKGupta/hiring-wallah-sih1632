import type { Transition, Variants } from 'framer-motion'

/** Emil Kowalski & Apple out easing — cubic-bezier(0.16, 1, 0.3, 1) */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Smooth Snappy curve for responsive UI triggers — cubic-bezier(0.2, 0, 0, 1) */
export const EASE_SNAPPY: [number, number, number, number] = [0.2, 0, 0, 1]

/** Spring-like exaggerated bounce easing */
export const EASE_SPRING_BOUNCE: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

/** Kore.ai elegant transition easing — Power 3 */
export const EASE_KORE: [number, number, number, number] = [0.22, 0.6, 0.36, 1]

/** Kore.ai fast transition easing — Expo out */
export const EASE_KORE_FAST: [number, number, number, number] = [0.165, 0.84, 0.44, 1]

/** Standard spring configs */
export const SPRING_GENTLE = { type: 'spring', stiffness: 120, damping: 20, mass: 1 } as const
export const SPRING_SNAPPY = { type: 'spring', stiffness: 260, damping: 24, mass: 0.8 } as const
export const SPRING_BOUNCY = { type: 'spring', stiffness: 320, damping: 18, mass: 0.7 } as const
export const SPRING_SUBTLE = { type: 'spring', stiffness: 80, damping: 18, mass: 1.2 } as const

/** Staggered container variants */
export const fadeUpContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

export const fadeUpItemVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: EASE_OUT,
    },
  },
}

export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASE_OUT,
    },
  },
}

export const cardHoverVariants: Variants = {
  initial: { y: 0, scale: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  hover: {
    y: -4,
    scale: 1.012,
    boxShadow: '0 16px 32px -8px rgba(124, 58, 237, 0.12), 0 4px 12px rgba(0,0,0,0.04)',
    transition: {
      duration: 0.28,
      ease: EASE_OUT,
    },
  },
  tap: {
    scale: 0.985,
    y: -1,
    transition: {
      duration: 0.1,
      ease: EASE_SNAPPY,
    },
  },
}

export const buttonGlowVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.025,
    y: -1,
    transition: {
      duration: 0.2,
      ease: EASE_OUT,
    },
  },
  tap: {
    scale: 0.97,
    y: 0,
    transition: {
      duration: 0.1,
      ease: EASE_SNAPPY,
    },
  },
}

export function appleTransition(duration = 0.4, delay = 0): Transition {
  return { duration, delay, ease: EASE_OUT }
}

export function koreTransition(duration = 0.6, delay = 0): Transition {
  return { duration, delay, ease: EASE_KORE }
}

export function snappyTransition(duration = 0.25, delay = 0): Transition {
  return { duration, delay, ease: EASE_SNAPPY }
}
