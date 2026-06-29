import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCards } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-cards'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ROUNDS = ['R32', 'R16', 'QF', 'SF', '3P', 'F']

const ROUND_SLOTS = {
  R32: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
  R16: [17,18,19,20,21,22,23,24],
  QF:  [25,26,27,28],
  SF:  [29,30],
  '3P': [32],
  F:   [31],
}

const ROUND_LABELS = {
  R32:'Round of 32', R16:'Round of 16', QF:'Quarter-finals', SF:'Semi-finals', '3P':'3rd Place', F:'Final',
}

const SUMMARY_CONFIG = {
  R32: { emoji:'🔥', title:'Round of 32 locked in!',    button:'Fill in your Round of 16 →' },
  R16: { emoji:'⚡', title:'Round of 16 done!',         button:'Fill in your Quarter-finals →' },
  QF:  { emoji:'🏟️', title:'Quarter-finals locked!',   button:'Fill in your Semi-finals →' },
  SF:  { emoji:'🌟', title:'Semi-finals done!',         button:'Predict the 3rd Place Match →' },
  '3P':{ emoji:'🥉', title:'3rd Place locked in!',      button:'Choose the World Champion →' },
}

const PARENT_SLOTS = {
  17:[1,2],  18:[3,4],  19:[5,6],  20:[7,8],
  21:[9,10], 22:[11,12],23:[13,14],24:[15,16],
  25:[17,18],26:[19,20],27:[21,22],28:[23,24],
  29:[25,26],30:[27,28],
  31:[29,30],
}

function MatchCard({ slotId, round, teamA, teamB, pick, onPick, onScoreChange, onPenaltiesChange }) {
  const isFinal = round === 'F'
  const isTBD = !teamA || !teamB

  const sA = parseInt(pick?.scoreA)
  const sB = parseInt(pick?.scoreB)
  const scoresEntered = pick?.scoreA !== '' && pick?.scoreB !== '' && !isNaN(sA) && !isNaN(sB)
  const isTied = scoresEntered && sA === sB
  const pickedIsA = pick?.teamId === teamA?.id
  const pickedWins = scoresEntered && !isTied && (pickedIsA ? sA > sB : sB > sA)
  const pickedLoses = scoresEntered && !isTied && !pickedWins && pick?.teamId

  return (
    <div className={`h-full rounded-3xl p-5 flex flex-col ${
      isFinal
        ? 'bg-navy border-2 border-lime'
        : 'bg-cream-dark border-2 border-navy/20'
    }`}>
      <div className="text-center mb-3">
        {isFinal ? (
          <div>
            <div className="text-3xl mb-1">🏆</div>
            <span className="text-xs font-bold uppercase tracking-widest text-lime">
              Choose the FIFA World Champion
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-navy/50">
            {ROUND_LABELS[round]}
          </span>
        )}
      </div>

      {isTBD ? (
        <div className="flex-1 flex items-center justify-center">
          <p className={`text-sm text-center italic px-4 ${isFinal ? 'text-cream/60' : 'text-navy/40'}`}>
            Awaiting previous results...
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
                  ? isFinal
                    ? 'border-lime bg-lime/20 shadow-sm scale-[1.02]'
                    : 'border-navy bg-navy/10 shadow-sm scale-[1.02]'
                  : isFinal
                  ? 'border-lime/30 hover:border-lime hover:bg-lime/10 active:scale-95'
                  : 'border-navy/25 hover:border-navy hover:bg-navy/5 active:scale-95'
              }`}
            >
              <span className="text-5xl leading-none">{team.flag_emoji}</span>
              <span className={`text-[11px] font-semibold text-center leading-tight ${isFinal ? 'text-cream' : 'text-navy'}`}>
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
            className={`border-t pt-3 ${isFinal ? 'border-lime/30' : 'border-navy/15'}`}
          >
            <p className={`text-[10px] text-center font-bold uppercase tracking-widest mb-2 ${isFinal ? 'text-lime' : 'text-navy/50'}`}>
              Predicted Score
            </p>
            <div className="flex items-center justify-center gap-3">
              {[{ label: teamA?.name?.split(' ')[0], field: 'scoreA' }, { label: teamB?.name?.split(' ')[0], field: 'scoreB' }].map(({ label, field }, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] truncate w-14 text-center ${isFinal ? 'text-cream/60' : 'text-navy/40'}`}>{label}</span>
                  <input
                    type="number" min="0" max="20"
                    value={pick?.[field] ?? ''}
                    onChange={e => onScoreChange(field, e.target.value)}
                    onClick={e => e.stopPropagation()}
                    placeholder="0"
                    className={`w-12 h-10 text-center text-lg font-bold rounded-xl border-2 focus:outline-none ${
                      isFinal
                        ? 'bg-navy-light/30 border-lime/40 text-cream focus:border-lime'
                        : 'bg-cream border-navy/25 text-navy focus:border-navy'
                    }`}
                  />
                </div>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key="sep" className={`text-lg font-bold mt-4 ${isFinal ? 'text-lime/60' : 'text-navy/30'}`}>–</span>, el], [])}
            </div>

            {pickedLoses && (
              <p className={`text-xs text-center mt-2 font-medium ${isFinal ? 'text-red-400' : 'text-red-500'}`}>
                Score must show {pickedIsA ? teamA?.name : teamB?.name} winning
              </p>
            )}

            {isTied && (
              <button
                onClick={onPenaltiesChange}
                className={`w-full mt-2 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                  pick?.penalties
                    ? isFinal ? 'bg-lime border-lime text-navy' : 'bg-navy border-navy text-cream'
                    : isFinal ? 'border-lime/40 text-lime/70 hover:border-lime hover:text-lime' : 'border-navy/30 text-navy/60 hover:border-navy hover:text-navy'
                }`}
              >
                {pick?.penalties ? '✓ Win on penalties' : 'Win on penalties?'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PredictionOverlay({ bracketSlots, teamsMap, onClose, onSubmitted }) {
  const { user } = useAuth()
  const swiperRef = useRef(null)

  const [phase, setPhase] = useState('intro')
  const [roundIdx, setRoundIdx] = useState(0)
  const [matchIdx, setMatchIdx] = useState(0)
  const [picks, setPicks] = useState({})
  const [confidence, setConfidence] = useState(null)
  const [prizeOptIn, setPrizeOptIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const isLocked = (slotId) => bracketSlots[slotId]?.winner_id != null

  useEffect(() => {
    if (swiperRef.current) swiperRef.current.slideTo(matchIdx)
  }, [matchIdx])

  // Auto-skip rounds where all games are already decided
  useEffect(() => {
    if (phase !== 'picking') return
    const slots = (ROUND_SLOTS[ROUNDS[roundIdx]] ?? []).filter(id => !isLocked(id))
    if (slots.length === 0) {
      if (roundIdx < ROUNDS.length - 1) {
        setRoundIdx(i => i + 1)
        setMatchIdx(0)
      } else {
        setPhase('confirm')
      }
    }
  }, [phase, roundIdx])

  function getMatchTeams(slotId) {
    // 3rd place: teams are the losers of the two semi-finals
    if (slotId === 32) {
      const slot32 = bracketSlots[32]
      if (slot32?.team_a || slot32?.team_b) return { teamA: slot32.team_a, teamB: slot32.team_b }

      // Derive SF teams (from DB if available, else from user's QF picks)
      function sfTeamPair(sfId) {
        const sfSlot = bracketSlots[sfId]
        if (sfSlot?.team_a || sfSlot?.team_b) return [sfSlot.team_a, sfSlot.team_b]
        const [pa, pb] = PARENT_SLOTS[sfId] || []
        return [
          pa && picks[pa] ? teamsMap[picks[pa].teamId] : null,
          pb && picks[pb] ? teamsMap[picks[pb].teamId] : null,
        ]
      }
      const [sf1A, sf1B] = sfTeamPair(29)
      const [sf2A, sf2B] = sfTeamPair(30)
      const p29 = picks[29], p30 = picks[30]
      return {
        teamA: p29 ? (p29.teamId === sf1A?.id ? sf1B : sf1A) : null,
        teamB: p30 ? (p30.teamId === sf2A?.id ? sf2B : sf2A) : null,
      }
    }

    const slot = bracketSlots[slotId]
    if (!slot) return { teamA: null, teamB: null }

    // R32 slots have embedded team objects from buildOverlayMaps
    if (slot.team_a || slot.team_b) return { teamA: slot.team_a, teamB: slot.team_b }

    // For each side: use DB team ID if already set, else locked parent winner, else user pick
    const [parentA, parentB] = PARENT_SLOTS[slotId] || []
    function resolveTeam(teamId, parentId) {
      if (teamId) return teamsMap[teamId] ?? null
      if (!parentId) return null
      if (isLocked(parentId)) {
        const winnerId = bracketSlots[parentId]?.winner_id
        return winnerId != null ? teamsMap[winnerId] ?? null : null
      }
      return picks[parentId] ? teamsMap[picks[parentId].teamId] ?? null : null
    }
    return {
      teamA: resolveTeam(slot.team_a_id, parentA),
      teamB: resolveTeam(slot.team_b_id, parentB),
    }
  }

  const currentRound = ROUNDS[roundIdx]
  const currentSlots = (ROUND_SLOTS[currentRound] ?? []).filter(id => !isLocked(id))
  const currentSlotId = currentSlots[matchIdx]
  const currentPick = picks[currentSlotId]
  const { teamA, teamB } = getMatchTeams(currentSlotId)
  const isTBD = !teamA || !teamB
  const isLastInRound = matchIdx === currentSlots.length - 1
  const _sA = parseInt(currentPick?.scoreA)
  const _sB = parseInt(currentPick?.scoreB)
  const _scoresEntered = currentPick?.scoreA !== '' && currentPick?.scoreB !== '' && _sA >= 0 && _sB >= 0
  const _tied = _scoresEntered && _sA === _sB
  const _pickedIsA = currentPick?.teamId === teamA?.id
  const _pickedWins = _scoresEntered && !_tied && (_pickedIsA ? _sA > _sB : _sB > _sA)
  const canAdvance = !isTBD &&
    currentPick?.teamId &&
    _scoresEntered &&
    (_pickedWins || (_tied && currentPick?.penalties))

  function handleNext() {
    if (isLastInRound) setPhase(currentRound === 'F' ? 'confirm' : 'summary')
    else setMatchIdx(i => i + 1)
  }

  function handleContinue() {
    let nextIdx = roundIdx + 1
    while (nextIdx < ROUNDS.length - 1) {
      const slots = (ROUND_SLOTS[ROUNDS[nextIdx]] ?? []).filter(id => !isLocked(id))
      if (slots.length > 0) break
      nextIdx++
    }
    setRoundIdx(nextIdx)
    setMatchIdx(0)
    setPhase('picking')
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    const allSlotIds = Object.values(ROUND_SLOTS).flat()
    const rows = allSlotIds.map(id => ({
      user_id: user.id,
      bracket_slot_id: id,
      picked_team_id: picks[id]?.teamId,
      score_a: parseInt(picks[id]?.scoreA) || 0,
      score_b: parseInt(picks[id]?.scoreB) || 0,
    })).filter(r => r.picked_team_id)

    const { error: predErr } = await supabase.from('predictions').upsert(rows, {
      onConflict: 'user_id,bracket_slot_id',
    })
    if (predErr) {
      console.error('predictions insert error:', predErr)
      setSubmitError(predErr.message || 'Failed to save predictions. Please try again.')
      setSubmitting(false)
      return
    }
    const { error: entryErr } = await supabase.from('bracket_entries').upsert({
      user_id: user.id, confidence, prize_opt_in: prizeOptIn,
    }, { onConflict: 'user_id' })
    if (entryErr) {
      console.error('bracket_entries insert error:', entryErr)
      setSubmitError(entryErr.message || 'Failed to save entry. Please try again.')
      setSubmitting(false)
      return
    }
    onSubmitted()
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <Backdrop onClose={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-cream-dark border-2 border-navy/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
        >
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">⚽</div>
            <h2 className="font-sans text-2xl font-bold text-navy">Before you begin</h2>
          </div>
          <ul className="text-sm text-navy/70 space-y-3 mb-8">
            <li className="flex gap-2"><span className="text-navy font-bold shrink-0">→</span><span>You can only submit predictions <strong className="text-navy">once</strong> — they cannot be changed.</span></li>
            <li className="flex gap-2"><span className="text-navy font-bold shrink-0">→</span><span>You must predict <strong className="text-navy">all the way to the Final</strong>, including a champion.</span></li>
            <li className="flex gap-2"><span className="text-navy font-bold shrink-0">→</span><span>Pick the winning team for <strong className="text-navy">2 points</strong>.</span></li>
            <li className="flex gap-2"><span className="text-navy font-bold shrink-0">→</span><span>Guess the exact score for a <strong className="text-navy">bonus 4 points</strong>.</span></li>
          </ul>
          <button
            onClick={() => setPhase('picking')}
            className="w-full py-3 bg-navy text-cream font-bold rounded-xl hover:bg-navy-dark transition-colors"
          >
            Got it — Let's Predict! →
          </button>
          <button onClick={onClose} className="w-full mt-3 py-2 text-xs text-navy/40 hover:text-navy/70 transition-colors">
            Cancel
          </button>
        </motion.div>
      </Backdrop>
    )
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const cfg = SUMMARY_CONFIG[currentRound]
    const nextRound = ROUNDS[roundIdx + 1]
    const nextSlots = ROUND_SLOTS[nextRound] ?? []

    return (
      <Backdrop>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream-dark border-2 border-navy/20 rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          <div className="text-center mb-5">
            <div className="text-5xl mb-2">{cfg.emoji}</div>
            <h2 className="font-sans text-2xl font-bold text-navy">{cfg.title}</h2>
            <p className="text-navy/60 text-sm mt-1">Your {ROUND_LABELS[nextRound]} matchups:</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {nextSlots.map(slotId => {
              const { teamA: tA, teamB: tB } = getMatchTeams(slotId)
              return (
                <div key={slotId} className="bg-cream border border-navy/15 rounded-2xl p-3 text-center">
                  <div className="text-2xl">{tA?.flag_emoji ?? '🏳️'}</div>
                  <div className="text-xs font-semibold text-navy truncate mt-0.5">{tA?.name ?? 'TBD'}</div>
                  <div className="text-[10px] text-navy/40 my-1.5 font-medium">vs</div>
                  <div className="text-2xl">{tB?.flag_emoji ?? '🏳️'}</div>
                  <div className="text-xs font-semibold text-navy truncate mt-0.5">{tB?.name ?? 'TBD'}</div>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-3 bg-navy text-cream font-bold rounded-xl hover:bg-navy-dark transition-colors"
          >
            {cfg.button}
          </button>
        </motion.div>
      </Backdrop>
    )
  }

  // ── Confirm ────────────────────────────────────────────────────────────────
  if (phase === 'confirm') {
    return (
      <Backdrop>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream-dark border-2 border-navy/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
        >
          <h2 className="font-sans text-2xl font-bold text-navy mb-2">Ready to lock in?</h2>
          <p className="text-navy/60 text-sm mb-6">Once you submit, your predictions are final — no changes allowed.</p>

          <div className="bg-cream border border-navy/15 rounded-2xl p-5 mb-4">
            <p className="text-sm font-semibold text-navy mb-3">How confident are you feeling?</p>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map(level => (
                <button key={level} onClick={() => setConfidence(level)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize border-2 transition-colors ${
                    confidence === level
                      ? 'bg-navy text-cream border-navy'
                      : 'border-navy/25 text-navy/60 hover:border-navy hover:text-navy'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-cream border border-navy/15 rounded-2xl p-5 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={prizeOptIn} onChange={e => setPrizeOptIn(e.target.checked)} className="mt-0.5 w-4 h-4 accent-navy" />
              <div>
                <p className="text-sm font-semibold text-navy">I'm in for the $5 prize pool 🏆</p>
                <p className="text-xs text-navy/50 mt-0.5">Sophia will collect cash separately.</p>
              </div>
            </label>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-red-700 text-sm font-medium">{submitError}</p>
            </div>
          )}

          <button
            onClick={handleSubmit} disabled={submitting}
            className="w-full py-3 bg-navy text-cream font-bold rounded-xl hover:bg-navy-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Lock In My Predictions 🔒'}
          </button>
          <button onClick={() => { setPhase('picking'); setRoundIdx(4); setMatchIdx(0) }}
            className="w-full mt-3 py-2 text-xs text-navy/40 hover:text-navy/70 transition-colors"
          >
            ← Go back
          </button>
        </motion.div>
      </Backdrop>
    )
  }

  // ── Picking ────────────────────────────────────────────────────────────────
  return (
    <Backdrop>
      <div className="flex flex-col items-center gap-5">
        {/* Round header */}
        <div className="text-center">
          <h2 className="font-sans text-xl font-bold text-cream">
            {currentRound === 'F' ? '🏆 The Final' : ROUND_LABELS[currentRound]}
          </h2>
          <p className="text-cream/60 text-xs mt-1">
            Match {matchIdx + 1} of {currentSlots.length}
          </p>
          <div className="flex gap-1 justify-center mt-2">
            {currentSlots.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${
                i === matchIdx ? 'w-4 bg-lime' : i < matchIdx ? 'w-2 bg-lime/50' : 'w-2 bg-cream/20'
              }`} />
            ))}
          </div>
        </div>

        {/* Swiper */}
        <Swiper
          onSwiper={s => { swiperRef.current = s }}
          effect="cards"
          grabCursor={false}
          allowTouchMove={false}
          loop={false}
          modules={[EffectCards]}
          className="w-[300px] h-[380px]"
        >
          {currentSlots.map(slotId => {
            const { teamA: tA, teamB: tB } = getMatchTeams(slotId)
            return (
              <SwiperSlide key={slotId} className="rounded-3xl">
                <MatchCard
                  slotId={slotId}
                  round={currentRound}
                  teamA={tA} teamB={tB}
                  pick={picks[slotId]}
                  onPick={teamId => setPicks(prev => ({
                    ...prev,
                    [slotId]: { teamId, scoreA: prev[slotId]?.scoreA ?? '', scoreB: prev[slotId]?.scoreB ?? '', penalties: false }
                  }))}
                  onScoreChange={(field, val) => setPicks(prev => ({
                    ...prev,
                    [slotId]: { ...prev[slotId], [field]: val, penalties: false }
                  }))}
                  onPenaltiesChange={() => setPicks(prev => ({
                    ...prev,
                    [slotId]: { ...prev[slotId], penalties: !prev[slotId]?.penalties }
                  }))}
                />
              </SwiperSlide>
            )
          })}
        </Swiper>

        {/* Navigation */}
        <div className="flex gap-3 w-[300px]">
          {matchIdx > 0 && (
            <button
              onClick={() => setMatchIdx(i => i - 1)}
              className="px-4 py-3 border-2 border-cream/30 bg-cream/10 text-cream text-sm font-semibold rounded-xl hover:border-cream/60 hover:bg-cream/20 transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext} disabled={!canAdvance}
            className="flex-1 py-3 bg-navy text-cream font-bold rounded-xl hover:bg-navy-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLastInRound
              ? (currentRound === 'F' ? 'Review & Submit →' : 'Done with this round →')
              : 'Next →'
            }
          </button>
        </div>
      </div>
    </Backdrop>
  )
}

function Backdrop({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose ? () => onClose() : undefined}
    >
      <div onClick={e => e.stopPropagation()} className="w-full flex justify-center">
        {children}
      </div>
    </motion.div>
  )
}
