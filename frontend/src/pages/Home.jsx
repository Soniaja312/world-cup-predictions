import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="font-serif text-5xl font-bold tracking-tight text-brown">
          World Cup <span className="text-gold">Predictor</span>
        </h1>
        <p className="mt-4 text-lg text-brown-light max-w-md mx-auto">
          Pick every knockout match, save your predictions, and compete with friends on the leaderboard.
        </p>
      </motion.div>

      <motion.div
        className="flex gap-4 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Link
          to="/register"
          className="px-6 py-3 rounded-lg bg-gold text-brown-dark font-bold text-base hover:bg-gold-light transition-colors"
        >
          Get Started
        </Link>
        <Link
          to="/leaderboard"
          className="px-6 py-3 rounded-lg border-2 border-pitch text-pitch font-semibold text-base hover:bg-pitch hover:text-cream transition-colors"
        >
          View Leaderboard
        </Link>
      </motion.div>
    </div>
  )
}
