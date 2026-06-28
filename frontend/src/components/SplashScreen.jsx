import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const LINES = [
  { text: 'PREDICT YOUR',   size: '5rem',   color: '#DFF263' },
  { text: 'FIFA WORLD CUP', size: '5.5rem', color: '#ffffff' },
  { text: 'CHAMPION',       size: '7.5rem', color: '#DFF263' },
]

const CHAR_DELAY = 0.045 // seconds between each letter

// Calculate when each line starts based on previous line lengths
const lineStartTimes = LINES.reduce((acc, line, i) => {
  if (i === 0) return [0.2]
  const prev = acc[i - 1]
  const prevChars = LINES[i - 1].text.length
  return [...acc, prev + prevChars * CHAR_DELAY + 0.15]
}, [])

const totalWriteTime = lineStartTimes[LINES.length - 1] + LINES[LINES.length - 1].text.length * CHAR_DELAY

function AnimatedLine({ text, startDelay, size, color }) {
  return (
    <div className="flex justify-center flex-wrap">
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scaleY: 0.6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scaleY: 1, filter: 'blur(0px)' }}
          transition={{
            delay: startDelay + i * CHAR_DELAY,
            duration: 0.08,
            ease: 'easeOut',
          }}
          className="font-sans font-extrabold inline-block"
          style={{
            fontSize: size,
            color,
            lineHeight: 1.05,
            transformOrigin: 'bottom center',
            whiteSpace: char === ' ' ? 'pre' : undefined,
          }}
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </div>
  )
}

export default function SplashScreen({ onComplete }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const holdMs = (totalWriteTime + 1.6) * 1000
    const t = setTimeout(() => {
      setFading(true)
      setTimeout(onComplete, 700)
    }, holdMs)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.7 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: '#325F85' }}
    >
      {/* Subtle radial glow behind text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(223,242,99,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="flex flex-col items-center gap-1 px-8 text-center">
        {LINES.map((line, i) => (
          <AnimatedLine
            key={i}
            text={line.text}
            startDelay={lineStartTimes[i]}
            size={line.size}
            color={line.color}
          />
        ))}
      </div>

      <button
        onClick={() => { setFading(true); setTimeout(onComplete, 700) }}
        className="absolute bottom-6 right-6 text-xs tracking-wide"
        style={{ color: 'rgba(223,242,99,0.4)' }}
      >
        skip →
      </button>
    </motion.div>
  )
}
