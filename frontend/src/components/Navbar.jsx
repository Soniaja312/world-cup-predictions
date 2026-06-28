import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { label: 'Your Bracket',     sub: 'your predictions',        to: '/bracket'         },
  { label: "Friends' Bracket", sub: 'submit yours to unlock',  to: '/friends-bracket', needsPredicted: true },
  { label: 'Leaderboard',      sub: 'rankings & points',       to: '/leaderboard'     },
  { label: 'Team Stats',       sub: 'strengths & weaknesses',  to: '/teams'           },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.5 } },
}

export default function Navbar() {
  const { user, profile, hasPredicted, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function go(to) {
    setOpen(false)
    navigate(to)
  }

  function handleSignOut() {
    signOut()
    setOpen(false)
  }

  return (
    <>
      {/* Floating soccer ball button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed top-4 right-4 z-[110] text-3xl leading-none drop-shadow-lg hover:scale-110 transition-transform duration-200 select-none"
        aria-label="Open menu"
      >
        ⚽
      </button>

      {/* Full-page overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex flex-col"
            style={{ background: '#1e3d57' }}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-5 right-5 text-cream/30 hover:text-cream transition-colors text-2xl leading-none font-light"
            >
              ✕
            </button>

            {/* Main nav list */}
            <div className="flex-1 flex flex-col justify-center px-10 md:px-20">
              {/* Greeting */}
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-cream/30 mb-10">
                {user ? `Hey, ${profile?.display_name ?? 'friend'}` : 'FIFA World Cup 2026'}
              </p>

              <motion.nav
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-1"
              >
                {NAV_ITEMS.map(item => {
                  const locked = item.needsPredicted && (!user || !hasPredicted)
                  return (
                    <motion.div key={item.label} variants={itemVariants}>
                      <button
                        onClick={locked ? undefined : () => go(item.to)}
                        className={`group flex items-baseline gap-4 text-left w-full py-3 border-b transition-all duration-200
                          ${locked
                            ? 'border-cream/5 cursor-not-allowed'
                            : 'border-cream/10 hover:border-cream/30'
                          }`}
                      >
                        <span className={`font-sans font-extrabold leading-none transition-colors duration-200
                          ${locked
                            ? 'text-cream/20'
                            : 'text-cream group-hover:text-lime'
                          }`}
                          style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}
                        >
                          {item.label}
                        </span>
                        <span className={`font-sans text-xs font-medium uppercase tracking-widest hidden sm:block
                          ${locked ? 'text-cream/15' : 'text-cream/30 group-hover:text-cream/50'}`}>
                          {locked ? 'locked' : item.sub}
                        </span>
                      </button>
                    </motion.div>
                  )
                })}
              </motion.nav>
            </div>

            {/* Auth footer */}
            <div className="px-10 md:px-20 pb-10">
              <div className="border-t border-cream/10 pt-6 flex items-center justify-between">
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="font-sans text-xs font-semibold uppercase tracking-widest text-cream/30 hover:text-cream/60 transition-colors"
                  >
                    Log out
                  </button>
                ) : (
                  <div className="flex gap-6">
                    <button onClick={() => go('/login')} className="font-sans text-xs font-semibold uppercase tracking-widest text-cream/40 hover:text-cream transition-colors">
                      Log in
                    </button>
                    <button onClick={() => go('/register')} className="font-sans text-xs font-semibold uppercase tracking-widest text-lime hover:text-lime/70 transition-colors">
                      Join
                    </button>
                  </div>
                )}
                <span className="font-sans text-[10px] uppercase tracking-widest text-cream/15">
                  World Cup 2026
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
