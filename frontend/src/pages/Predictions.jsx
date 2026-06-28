import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCards } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-cards'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ALL_SLOT_IDS = [
  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
  17,18,19,20,21,22,23,24,
  25,26,27,28,
  29,30,
  31,
]

const SLOT_ROUNDS = {
  1:'R32',2:'R32',3:'R32',4:'R32',5:'R32',6:'R32',7:'R32',8:'R32',
  9:'R32',10:'R32',11:'R32',12:'R32',13:'R32',14:'R32',15:'R32',16:'R32',
  17:'R16',18:'R16',19:'R16',20:'R16',21:'R16',22:'R16',23:'R16',24:'R16',
  25:'QF',26:'QF',27:'QF',28:'QF',
  29:'SF',30:'SF',
  31:'F',
}

const ROUND_LABELS = {
  R32:'Round of 32', R16:'Round of 16', QF:'Quarter-finals', SF:'Semi-finals', F:'Final',
}

const ROUND_TRANSITIONS = {
  R16: { emoji:'🔥', title:"Round of 32 done!", sub:"Now let's pick the Round of 16" },
  QF:  { emoji:'⚡', title:'Round of 16 locked in!', sub:'Time for the Quarter-finals' },
  SF:  { emoji:'🏟️', title:'Quarter-finals done!', sub:'On to the Semi-finals' },
  F:   { emoji:'🌟', title:'Almost there!', sub:'Time to pick the Final' },
}

const PARENT_SLOTS = {
  17:[1,2], 18:[3,4], 19:[5,6], 20:[7,8],
  21:[9,10], 22:[11,12], 23:[13,14], 24:[15,16],
  25:[17,18], 26:[19,20], 27:[21,22], 28:[23,24],
  29:[25,26], 30:[27,28],
  31:[29,30],
}

function MatchCard({ slotId, teamA, teamB, pick, onPick, onScoreChange }) {
  const isTBD = !teamA || !teamB

  return (
    <div className="h-full bg-cream-dark border-2 border-parchment rounded-3xl p-5 flex flex-col">
      <div className="text-center mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brown-light">
          {ROUND_LABELS[SLOT_ROUNDS[slotId]]}
        </span>
      </div>

      {isTBD ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-brown-light text-center italic px-4">
            This match hasn't been confirmed yet.<br />Check back tonight!
          </p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-3 mb-3">
          {[teamA, teamB].map((team, i) => (
            <button
              key={i}
              onClick={() => onPick(team.id)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 ${
                pick?.teamId === team?.id
                  ? 'border-gold bg-gold/20 shadow-sm scale-[1.02]'
                  : 'border-parchment hover:border-brown-light hover:bg-cream active:scale-95'
              }`}
            >
              <span className="text-5xl leading-none">{team.flag_emoji}</span>
              <span className="text-[11px] font-semibold text-brown text-center leading-tight">
                {team.name}
              </span>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {pick?.teamId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-parchment pt-3"
          >
            <p className="text-[10px] text-center text-brown-light font-bold uppercase tracking-widest mb-2">
              Predicted Score
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-brown-light truncate w-14 text-center">
                  {teamA?.name?.split(' ')[0]}
                </span>
                <input
                  type="number" min="0" max="20"
                  value={pick?.scoreA ?? ''}
                  onChange={e => onScoreChange('scoreA', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  placeholder="0"
                  className="w-12 h-10 text-center text-lg font-bold bg-cream border-2 border-parchment rounded-xl text-brown focus:outline-none focus:border-gold"
                />
              </div>
              <span className="text-lg font-bold text-brown-light mt-4">–</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-brown-light truncate w-14 text-center">
                  {teamB?.name?.split(' ')[0]}
                </span>
                <input
                  type="number" min="0" max="20"
                  value={pick?.scoreB ?? ''}
                  onChange={e => onScoreChange('scoreB', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  placeholder="0"
                  className="w-12 h-10 text-center text-lg font-bold bg-cream border-2 border-parchment rounded-xl text-brown focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Predictions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const swiperRef = useRef(null)

  const [bracketSlots, setBracketSlots] = useState({})
  const [teamsMap, setTeamsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [picks, setPicks] = useState({})
  const [roundTransition, setRoundTransition] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confidence, setConfidence] = useState(null)
  const [prizeOptIn, setPrizeOptIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/register'); return }
    async function load() {
      const { data: entry } = await supabase
        .from('bracket_entries')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (entry) { setAlreadySubmitted(true); setLoading(false); return }

      const [{ data: slots }, { data: teams }] = await Promise.all([
        supabase.from('bracket_slots').select('id, round, team_a:team_a_id(id, name, flag_emoji), team_b:team_b_id(id, name, flag_emoji)'),
        supabase.from('teams').select('id, name, flag_emoji'),
      ])

      if (slots) {
        const map = {}
        slots.forEach(s => { map[s.id] = s })
        setBracketSlots(map)
      }
      if (teams) {
        const map = {}
        teams.forEach(t => { map[t.id] = t })
        setTeamsMap(map)
      }
      setLoading(false)
    }
    load()
  }, [user])

  useEffect(() => {
    if (swiperRef.current) swiperRef.current.slideTo(currentIndex)
  }, [currentIndex])

  function getMatchTeams(slotId) {
    const slot = bracketSlots[slotId]
    if (!slot) return { teamA: null, teamB: null }
    if (slot.team_a || slot.team_b) return { teamA: slot.team_a, teamB: slot.team_b }
    const [parentA, parentB] = PARENT_SLOTS[slotId] || []
    return {
      teamA: parentA && picks[parentA] ? teamsMap[picks[parentA].teamId] : null,
      teamB: parentB && picks[parentB] ? teamsMap[picks[parentB].teamId] : null,
    }
  }

  const currentSlotId = ALL_SLOT_IDS[currentIndex]
  const currentPick = picks[currentSlotId]
  const { teamA, teamB } = getMatchTeams(currentSlotId)
  const isTBD = !teamA || !teamB
  const canAdvance = !isTBD &&
    currentPick?.teamId &&
    currentPick?.scoreA !== '' && Number(currentPick?.scoreA) >= 0 &&
    currentPick?.scoreB !== '' && Number(currentPick?.scoreB) >= 0

  function handleNext() {
    const isLast = currentIndex === ALL_SLOT_IDS.length - 1
    if (isLast) { setShowConfirm(true); return }

    const nextRound = SLOT_ROUNDS[ALL_SLOT_IDS[currentIndex + 1]]
    const currentRound = SLOT_ROUNDS[currentSlotId]

    if (currentRound !== nextRound && ROUND_TRANSITIONS[nextRound]) {
      setRoundTransition(nextRound)
      setTimeout(() => {
        setRoundTransition(null)
        setCurrentIndex(i => i + 1)
      }, 2400)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    const rows = ALL_SLOT_IDS.map(id => ({
      user_id: user.id,
      bracket_slot_id: id,
      picked_team_id: picks[id].teamId,
      score_a: parseInt(picks[id].scoreA) || 0,
      score_b: parseInt(picks[id].scoreB) || 0,
    }))
    const { error: predErr } = await supabase.from('predictions').insert(rows)
    if (predErr) { console.error(predErr); setSubmitting(false); return }
    const { error: entryErr } = await supabase.from('bracket_entries').insert({
      user_id: user.id, confidence, prize_opt_in: prizeOptIn,
    })
    if (entryErr) { console.error(entryErr); setSubmitting(false); return }
    navigate('/bracket')
  }

  const completedCount = Object.values(picks).filter(p => p?.teamId).length

  if (loading) return <div className="text-center py-20 text-brown-light">Loading…</div>

  if (alreadySubmitted) {
    return (
      <div className="max-w-sm mx-auto py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-serif text-2xl font-bold text-brown mb-2">Predictions locked in</h2>
        <p className="text-brown-light mb-6">You've already submitted your bracket. Good luck!</p>
        <Link to="/bracket" className="px-6 py-3 bg-gold text-brown-dark font-bold rounded-lg hover:bg-gold-light transition-colors">
          View Bracket
        </Link>
      </div>
    )
  }

  if (showConfirm) {
    return (
      <motion.div className="max-w-md mx-auto py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-serif text-3xl font-bold text-brown mb-2">Ready to lock in?</h2>
        <p className="text-brown-light mb-8">Once you submit, your predictions are final — no changes allowed.</p>

        <div className="bg-cream-dark border border-parchment rounded-2xl p-6 mb-4">
          <p className="text-sm font-semibold text-brown mb-3">How confident are you feeling?</p>
          <div className="flex gap-3">
            {['low', 'medium', 'high'].map(level => (
              <button
                key={level}
                onClick={() => setConfidence(level)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize border-2 transition-colors ${
                  confidence === level ? 'bg-pitch text-cream border-pitch' : 'border-parchment text-brown-light hover:border-brown-light'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-cream-dark border border-parchment rounded-2xl p-6 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={prizeOptIn} onChange={e => setPrizeOptIn(e.target.checked)} className="mt-0.5 w-4 h-4 accent-gold" />
            <div>
              <p className="text-sm font-semibold text-brown">I'm in for the $5 prize pool 🏆</p>
              <p className="text-xs text-brown-light mt-0.5">Sophia will collect cash from you separately.</p>
            </div>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-gold text-brown-dark font-bold rounded-xl hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Lock In My Predictions 🔒'}
        </button>
        <button onClick={() => setShowConfirm(false)} className="w-full mt-3 py-2 text-sm text-brown-light hover:text-brown transition-colors">
          ← Go back and review
        </button>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col items-center py-8 relative">

      {/* Round transition overlay */}
      <AnimatePresence>
        {roundTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-pitch/95 flex flex-col items-center justify-center text-center px-6"
          >
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
              <div className="text-7xl mb-4">{ROUND_TRANSITIONS[roundTransition]?.emoji}</div>
              <h2 className="font-serif text-4xl font-bold text-cream mb-2">{ROUND_TRANSITIONS[roundTransition]?.title}</h2>
              <p className="text-gold text-lg">{ROUND_TRANSITIONS[roundTransition]?.sub}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex justify-between items-center text-xs text-brown-light mb-2">
          <span className="font-bold uppercase tracking-wider">{ROUND_LABELS[SLOT_ROUNDS[currentSlotId]]}</span>
          <span>{completedCount} / {ALL_SLOT_IDS.length} picked</span>
        </div>
        <div className="h-1.5 bg-parchment rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gold rounded-full"
            animate={{ width: `${(completedCount / ALL_SLOT_IDS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card stack */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <Swiper
          onSwiper={swiper => { swiperRef.current = swiper }}
          effect="cards"
          grabCursor={false}
          allowTouchMove={false}
          loop={false}
          modules={[EffectCards]}
          className="w-[300px] h-[380px]"
        >
          {ALL_SLOT_IDS.map(slotId => {
            const { teamA: tA, teamB: tB } = getMatchTeams(slotId)
            return (
              <SwiperSlide key={slotId} className="rounded-3xl">
                <MatchCard
                  slotId={slotId}
                  teamA={tA}
                  teamB={tB}
                  pick={picks[slotId]}
                  onPick={teamId => setPicks(prev => ({
                    ...prev,
                    [slotId]: { teamId, scoreA: prev[slotId]?.scoreA ?? '', scoreB: prev[slotId]?.scoreB ?? '' }
                  }))}
                  onScoreChange={(field, val) => setPicks(prev => ({
                    ...prev,
                    [slotId]: { ...prev[slotId], [field]: val }
                  }))}
                />
              </SwiperSlide>
            )
          })}
        </Swiper>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-8 w-full max-w-sm">
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(i => i - 1)}
            className="px-4 py-3 border border-parchment text-brown-light text-sm font-semibold rounded-xl hover:border-brown-light hover:text-brown transition-colors"
          >
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canAdvance}
          className="flex-1 py-3 bg-gold text-brown-dark font-bold rounded-xl hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {currentIndex === ALL_SLOT_IDS.length - 1 ? 'Review & Submit →' : 'Next →'}
        </button>
      </div>

      <p className="mt-4 text-xs text-brown-light">Match {currentIndex + 1} of {ALL_SLOT_IDS.length}</p>
    </div>
  )
}
