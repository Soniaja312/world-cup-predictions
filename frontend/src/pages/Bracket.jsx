import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PredictionOverlay from '../components/PredictionOverlay'

const glass = {
  background: 'rgba(253, 246, 232, 0.18)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(253, 246, 232, 0.32)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(253,246,232,0.4)',
}

// R32 matchups — hardcoded, never needs Supabase
const R32 = [
  { slot: 1,  a: { name: 'Germany',               flag: '🇩🇪' }, b: { name: 'Paraguay',               flag: '🇵🇾' } },
  { slot: 2,  a: { name: 'France',                flag: '🇫🇷' }, b: { name: 'Sweden',                 flag: '🇸🇪' } },
  { slot: 3,  a: { name: 'South Africa',          flag: '🇿🇦' }, b: { name: 'Canada',                 flag: '🇨🇦' } },
  { slot: 4,  a: { name: 'Netherlands',           flag: '🇳🇱' }, b: { name: 'Morocco',                flag: '🇲🇦' } },
  { slot: 5,  a: { name: 'Portugal',               flag: '🇵🇹' }, b: { name: 'Croatia',                flag: '🇭🇷' } },
  { slot: 6,  a: { name: 'Spain',                 flag: '🇪🇸' }, b: { name: 'Austria',                flag: '🇦🇹' } },
  { slot: 7,  a: { name: 'USA',                   flag: '🇺🇸' }, b: { name: 'Bosnia & Herzegovina',  flag: '🇧🇦' } },
  { slot: 8,  a: { name: 'Belgium',               flag: '🇧🇪' }, b: { name: 'Senegal',                flag: '🇸🇳' } },
  { slot: 9,  a: { name: 'Brazil',                flag: '🇧🇷' }, b: { name: 'Japan',                  flag: '🇯🇵' } },
  { slot: 10, a: { name: "Côte d'Ivoire",         flag: '🇨🇮' }, b: { name: 'Norway',                 flag: '🇳🇴' } },
  { slot: 11, a: { name: 'Mexico',                flag: '🇲🇽' }, b: { name: 'Ecuador',                flag: '🇪🇨' } },
  { slot: 12, a: { name: 'England',               flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, b: { name: 'DR Congo',                flag: '🇨🇩' } },
  { slot: 13, a: { name: 'Argentina',             flag: '🇦🇷' }, b: { name: 'Cabo Verde',             flag: '🇨🇻' } },
  { slot: 14, a: { name: 'Australia',             flag: '🇦🇺' }, b: { name: 'Egypt',                  flag: '🇪🇬' } },
  { slot: 15, a: { name: 'Switzerland',           flag: '🇨🇭' }, b: { name: 'Algeria',                flag: '🇩🇿' } },
  { slot: 16, a: { name: 'Colombia',              flag: '🇨🇴' }, b: { name: 'Ghana',                  flag: '🇬🇭' } },
]

// Build lookup for teamsFor to use (keyed by slot id)
const R32_BY_SLOT = {}
R32.forEach(m => { R32_BY_SLOT[m.slot] = m })

const PARENT_SLOTS = {
  17:[1,2],  18:[3,4],  19:[5,6],  20:[7,8],
  21:[9,10], 22:[11,12],23:[13,14],24:[15,16],
  25:[17,18],26:[19,20],27:[21,22],28:[23,24],
  29:[25,26],30:[27,28],
  31:[29,30],
}

function getTeams(slotId, resultMap, teamsMap, userPickMap) {
  // R32: always from hardcoded data
  if (slotId <= 16) {
    const m = R32_BY_SLOT[slotId]
    return { teamA: m?.a ?? null, teamB: m?.b ?? null }
  }
  // R16+: from DB results
  const res = resultMap[slotId]
  if (res?.team_a_id || res?.team_b_id) {
    return {
      teamA: res.team_a_id ? (teamsMap[res.team_a_id] ?? null) : null,
      teamB: res.team_b_id ? (teamsMap[res.team_b_id] ?? null) : null,
    }
  }
  // Fall back to user's predicted winners
  const [pA, pB] = PARENT_SLOTS[slotId] || []
  return {
    teamA: pA && userPickMap[pA] ? (teamsMap[userPickMap[pA].picked_team_id] ?? null) : null,
    teamB: pB && userPickMap[pB] ? (teamsMap[userPickMap[pB].picked_team_id] ?? null) : null,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TeamRow({ team, isWinner, isPicked, score }) {
  const highlight = isWinner || isPicked
  return (
    <div className={`flex items-center gap-1 px-1.5 py-1 ${isPicked ? 'bg-teal/30' : isWinner ? 'bg-lime/20' : ''}`}>
      <span className="text-sm leading-none flex-shrink-0">{team ? team.flag : '🏳️'}</span>
      <span className={`text-[11px] truncate min-w-0 flex-1 font-medium ${
        highlight ? 'text-lime font-semibold' : team ? 'text-cream' : 'text-cream/40 italic'
      }`}>
        {team ? team.name : 'TBD'}
      </span>
      {isPicked && score != null && score !== '' && (
        <span className="text-[10px] text-lime/70 font-bold flex-shrink-0">{score}</span>
      )}
    </div>
  )
}

function MatchCard({ slotId, teamA, teamB, result, userPick }) {
  const winnerId  = result?.winner_id
  const aId       = result?.team_a_id
  const bId       = result?.team_b_id
  const pickedId  = userPick?.picked_team_id

  const aIsWinner = !!(winnerId && aId && winnerId === aId)
  const bIsWinner = !!(winnerId && bId && winnerId === bId)
  const aIsPicked = !!(pickedId && aId && pickedId === aId)
  const bIsPicked = !!(pickedId && bId && pickedId === bId)

  return (
    <div className="w-full rounded-lg overflow-hidden" style={glass}>
      <TeamRow team={teamA} isWinner={aIsWinner} isPicked={aIsPicked} score={userPick?.score_a} />
      <div className="h-px bg-cream/20" />
      <TeamRow team={teamB} isWinner={bIsWinner} isPicked={bIsPicked} score={userPick?.score_b} />
    </div>
  )
}

function BracketColumn({ slotIds, resultMap, teamsMap, userPickMap, label }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="text-center mb-1 h-5 flex items-center justify-center">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 whitespace-nowrap">{label}</span>
      </div>
      <div className="flex-1 flex flex-col justify-around gap-1 px-0.5">
        {slotIds.map(id => {
          const { teamA, teamB } = getTeams(id, resultMap, teamsMap, userPickMap)
          return (
            <MatchCard
              key={id}
              slotId={id}
              teamA={teamA}
              teamB={teamB}
              result={resultMap[id]}
              userPick={userPickMap[id]}
            />
          )
        })}
      </div>
    </div>
  )
}

function Trophy() {
  return (
    <svg width="88" height="138" viewBox="0 0 88 138" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8"  y="122" width="72" height="9"  rx="2" fill="#2a5c24"/>
      <rect x="4"  y="129" width="80" height="9"  rx="2" fill="#1e4319"/>
      <rect x="16" y="108" width="56" height="16" rx="2" fill="#d4a017"/>
      <rect x="24" y="99"  width="40" height="12" rx="2" fill="#c49010"/>
      <rect x="38" y="78"  width="12" height="23" fill="#d4a017"/>
      <path d="M14 34 C11 16 77 16 74 34 L67 78 L21 78 Z" fill="#d4a017"/>
      <path d="M14 42 C2 48 2 68 14 74" stroke="#c49010" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d="M74 42 C86 48 86 68 74 74" stroke="#c49010" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <circle cx="44" cy="24" r="15" fill="#bf8c0c"/>
      <ellipse cx="44" cy="24" rx="15" ry="6" stroke="#a07010" strokeWidth="1.2" fill="none"/>
      <line x1="44" y1="9" x2="44" y2="39" stroke="#a07010" strokeWidth="1.2"/>
      <path d="M27 44 C32 28 50 22 58 37" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M20 60 C22 53 30 50 33 57" stroke="rgba(255,255,255,0.2)"  strokeWidth="2"   fill="none" strokeLinecap="round"/>
    </svg>
  )
}

function CenterColumn({ resultMap, teamsMap, userPickMap, user, hasPredicted, onPredict, thirdPlaceTeams, onPick3P }) {
  const { teamA, teamB } = getTeams(31, resultMap, teamsMap, userPickMap)
  const canPredict = user && !hasPredicted

  const tpA = thirdPlaceTeams?.teamA ?? null
  const tpB = thirdPlaceTeams?.teamB ?? null
  const tpPickedId = userPickMap[32]?.picked_team_id ?? null

  return (
    <div className="flex-1 min-w-0 flex flex-col items-center justify-center px-1 gap-3">
      <div className="flex flex-col items-center w-full">
        <span className="text-[9px] font-bold uppercase tracking-wider text-lime mb-1">Final</span>
        <MatchCard slotId={31} teamA={teamA} teamB={teamB} result={resultMap[31]} userPick={userPickMap[31]} />
      </div>

      {canPredict ? (
        <button onClick={onPredict} className="flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-transform group">
          <Trophy />
          <span className="text-[10px] font-extrabold text-navy-dark px-3 py-1.5 rounded-xl shadow-lg group-hover:brightness-110 transition-all whitespace-nowrap" style={{ background: '#DFF263' }}>
            MAKE YOUR PREDICTIONS
          </span>
        </button>
      ) : hasPredicted ? (
        <div className="flex flex-col items-center gap-2">
          <Trophy />
          <div className="text-[10px] font-bold text-white/50 px-3 py-1.5 rounded-xl whitespace-nowrap" style={glass}>
            Predictions Locked
          </div>
        </div>
      ) : (
        <a href="/register" className="flex flex-col items-center gap-2 hover:scale-105 transition-transform group">
          <Trophy />
          <span className="text-[10px] font-extrabold text-navy-dark px-3 py-1.5 rounded-xl shadow-lg group-hover:brightness-110 transition-all whitespace-nowrap" style={{ background: '#DFF263' }}>
            JOIN TO PREDICT
          </span>
        </a>
      )}

      <div className="flex flex-col items-center w-full">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1">3rd Place</span>
        <div className="w-full rounded-lg overflow-hidden" style={glass}>
          {tpA && tpB ? (
            <>
              <div className={`flex items-center gap-1 px-1.5 py-1 ${tpPickedId === tpA.id ? 'bg-teal/30' : ''}`}>
                <span className="text-sm leading-none flex-shrink-0">{tpA.flag || tpA.flag_emoji}</span>
                <span className={`text-[11px] truncate min-w-0 flex-1 font-medium ${tpPickedId === tpA.id ? 'text-lime font-semibold' : 'text-cream'}`}>{tpA.name}</span>
                {tpPickedId === tpA.id && <span className="text-lime text-[9px] flex-shrink-0 mr-0.5">✓</span>}
              </div>
              <div className="h-px bg-cream/20" />
              <div className={`flex items-center gap-1 px-1.5 py-1 ${tpPickedId === tpB.id ? 'bg-teal/30' : ''}`}>
                <span className="text-sm leading-none flex-shrink-0">{tpB.flag || tpB.flag_emoji}</span>
                <span className={`text-[11px] truncate min-w-0 flex-1 font-medium ${tpPickedId === tpB.id ? 'text-lime font-semibold' : 'text-cream'}`}>{tpB.name}</span>
                {tpPickedId === tpB.id && <span className="text-lime text-[9px] flex-shrink-0 mr-0.5">✓</span>}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 px-1.5 py-1"><span className="text-sm">🏳️</span><span className="text-[11px] text-cream/40 italic flex-1">TBD</span></div>
              <div className="h-px bg-cream/20" />
              <div className="flex items-center gap-1 px-1.5 py-1"><span className="text-sm">🏳️</span><span className="text-[11px] text-cream/40 italic flex-1">TBD</span></div>
            </>
          )}
        </div>
        {hasPredicted && !tpPickedId && tpA && tpB && (
          <button
            onClick={onPick3P}
            className="mt-1 text-[9px] font-bold text-lime hover:text-lime/70 transition-colors"
          >
            + Pick 3rd place →
          </button>
        )}
      </div>
    </div>
  )
}

function SoccerField() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div style={{ position:'absolute', inset:-20, background:'repeating-linear-gradient(to right,#1a5c1a 0px,#1a5c1a 80px,#1e6e1e 80px,#1e6e1e 160px)', filter:'blur(4px)' }} />
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ filter:'blur(1px)' }}>
        <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="white" strokeWidth="2"/>
        <circle cx="50%" cy="50%" r="12%" stroke="white" strokeWidth="2" fill="none"/>
        <circle cx="50%" cy="50%" r="1%" fill="white"/>
        <rect x="0" y="25%" width="10%" height="50%" stroke="white" strokeWidth="2" fill="none"/>
        <rect x="90%" y="25%" width="10%" height="50%" stroke="white" strokeWidth="2" fill="none"/>
        <rect x="2%" y="4%" width="96%" height="92%" stroke="white" strokeWidth="2" fill="none"/>
      </svg>
      <div className="absolute inset-0" style={{ background:'rgba(0,0,0,0.22)' }} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Bracket() {
  const { user, hasPredicted, setHasPredicted } = useAuth()
  const [resultMap, setResultMap]     = useState({})
  const [teamsMap, setTeamsMap]       = useState({})
  const [userPickMap, setUserPickMap] = useState({})
  const [loading, setLoading]         = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [isPicking3P, setIsPicking3P]   = useState(false)
  const [pick3P, setPick3P]             = useState({ teamId: null, scoreA: '', scoreB: '' })
  const [saving3P, setSaving3P]         = useState(false)
  const [save3PError, setSave3PError]   = useState(null)

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent'
    return () => { document.body.style.backgroundColor = '' }
  }, [])

  useEffect(() => { load() }, [user, hasPredicted])

  async function load() {
    try {
      const { data: slots } = await supabase
        .from('bracket_slots')
        .select('id, winner_id, score_a, score_b, team_a_id, team_b_id')

      if (slots && slots.length > 0) {
        const rMap = {}
        const tMap = {}
        slots.forEach(s => {
          rMap[s.id] = s
          // For R32 slots, map DB team IDs → hardcoded objects so later rounds resolve
          if (s.id <= 16) {
            const m = R32_BY_SLOT[s.id]
            if (m?.a && s.team_a_id) tMap[s.team_a_id] = m.a
            if (m?.b && s.team_b_id) tMap[s.team_b_id] = m.b
          }
        })
        setResultMap(rMap)
        setTeamsMap(tMap)
      }

      if (user && hasPredicted) {
        const { data: preds } = await supabase
          .from('predictions')
          .select('bracket_slot_id, picked_team_id, score_a, score_b')
          .eq('user_id', user.id)
        if (preds) {
          const pMap = {}
          preds.forEach(p => { pMap[p.bracket_slot_id] = p })
          setUserPickMap(pMap)
        }
      }
    } catch (err) {
      console.error('Bracket load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function save3P() {
    if (!pick3P.teamId) return
    setSaving3P(true)
    setSave3PError(null)
    const { error } = await supabase.from('predictions').upsert({
      user_id: user.id,
      bracket_slot_id: 32,
      picked_team_id: pick3P.teamId,
      score_a: parseInt(pick3P.scoreA) || 0,
      score_b: parseInt(pick3P.scoreB) || 0,
    }, { onConflict: 'user_id,bracket_slot_id' })
    if (error) {
      setSave3PError(error.message)
      setSaving3P(false)
      return
    }
    await load()
    setIsPicking3P(false)
    setSaving3P(false)
  }

  // Build the slotMap shape that PredictionOverlay expects
  function buildOverlayMaps() {
    const slotMapForOverlay = {}
    const teamsMapForOverlay = {}

    // Cover all R32 slots — use DB id if available, else slot-based integer synthetic id
    R32.forEach(({ slot, a, b }) => {
      const res  = resultMap[slot] ?? {}
      const aId  = res.team_a_id ?? (slot * 10000 + 1)
      const bId  = res.team_b_id ?? (slot * 10000 + 2)
      const teamA = a ? { ...a, id: aId, flag_emoji: a.flag } : null
      const teamB = b ? { ...b, id: bId, flag_emoji: b.flag } : null
      slotMapForOverlay[slot] = {
        id: slot,
        winner_id:  res.winner_id  ?? null,
        score_a:    res.score_a    ?? null,
        score_b:    res.score_b    ?? null,
        team_a_id:  aId,
        team_b_id:  bId,
        team_a:     teamA,
        team_b:     teamB,
      }
      if (teamA) teamsMapForOverlay[aId] = teamA
      if (teamB) teamsMapForOverlay[bId] = teamB
    })

    // Also cover later-round slots from the DB
    Object.entries(resultMap).forEach(([id, res]) => {
      const sid = Number(id)
      if (sid > 16) slotMapForOverlay[sid] = res
    })

    // Merge in any real DB team entries (for winner advancement across rounds)
    Object.entries(teamsMap).forEach(([id, t]) => {
      teamsMapForOverlay[id] = { ...t, id, flag_emoji: t.flag }
    })

    return { slotMapForOverlay, teamsMapForOverlay }
  }

  if (loading) {
    return (
      <>
        <SoccerField />
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
          <p className="text-white/60">Loading bracket…</p>
        </div>
      </>
    )
  }

  const leftCols = [
    { slotIds: [1, 2, 3, 4, 5, 6, 7, 8],        label: '32s'   },
    { slotIds: [17, 18, 19, 20],                  label: '16s'   },
    { slotIds: [25, 26],                          label: 'Top 8' },
    { slotIds: [29],                              label: 'Top 4' },
  ]
  const rightCols = [
    { slotIds: [30],                              label: 'Top 4' },
    { slotIds: [27, 28],                          label: 'Top 8' },
    { slotIds: [21, 22, 23, 24],                  label: '16s'   },
    { slotIds: [9, 10, 11, 12, 13, 14, 15, 16],  label: '32s'   },
  ]

  const { slotMapForOverlay, teamsMapForOverlay } = buildOverlayMaps()

  // Derive 3P teams from user's SF picks: SF losers go to 3rd place
  const _qf1w = userPickMap[25]?.picked_team_id
  const _qf2w = userPickMap[26]?.picked_team_id
  const _qf3w = userPickMap[27]?.picked_team_id
  const _qf4w = userPickMap[28]?.picked_team_id
  const _sf1w = userPickMap[29]?.picked_team_id
  const _sf2w = userPickMap[30]?.picked_team_id
  const _sf1A = _qf1w != null ? teamsMapForOverlay[_qf1w] : null
  const _sf1B = _qf2w != null ? teamsMapForOverlay[_qf2w] : null
  const _sf2A = _qf3w != null ? teamsMapForOverlay[_qf3w] : null
  const _sf2B = _qf4w != null ? teamsMapForOverlay[_qf4w] : null
  const tp3Teams = {
    teamA: _sf1w != null ? (_sf1w === _sf1A?.id ? _sf1B : _sf1A) : null,
    teamB: _sf2w != null ? (_sf2w === _sf2A?.id ? _sf2B : _sf2A) : null,
  }

  return (
    <>
      <SoccerField />
      <div className="fixed inset-0 flex flex-col" style={{ zIndex: 1 }}>
        <div className="text-center pt-3 pb-1 flex-shrink-0">
          <h1 className="font-sans text-lg font-bold text-white/90 leading-tight">
            {hasPredicted ? 'Your Bracket' : 'FIFA World Cup 2026'}
          </h1>
          <p className="text-white/40 text-[9px] uppercase tracking-widest">
            {hasPredicted ? 'Your predictions' : 'Knockout Stage'}
          </p>
        </div>

        <div className={`flex-1 flex items-stretch px-2 pb-3 gap-1 min-h-0 transition-all duration-300 ${isPredicting ? 'blur-sm pointer-events-none select-none' : ''}`}>
          {leftCols.map(c => (
            <BracketColumn key={c.label} slotIds={c.slotIds} resultMap={resultMap} teamsMap={teamsMap} userPickMap={userPickMap} label={c.label} />
          ))}

          <CenterColumn
            resultMap={resultMap}
            teamsMap={teamsMap}
            userPickMap={userPickMap}
            user={user}
            hasPredicted={hasPredicted}
            onPredict={() => setIsPredicting(true)}
            thirdPlaceTeams={tp3Teams}
            onPick3P={() => { setPick3P({ teamId: null, scoreA: '', scoreB: '' }); setSave3PError(null); setIsPicking3P(true) }}
          />

          {rightCols.map(c => (
            <BracketColumn key={c.label} slotIds={c.slotIds} resultMap={resultMap} teamsMap={teamsMap} userPickMap={userPickMap} label={c.label} />
          ))}
        </div>

        <AnimatePresence>
          {isPredicting && (
            <PredictionOverlay
              bracketSlots={slotMapForOverlay}
              teamsMap={teamsMapForOverlay}
              onClose={() => setIsPredicting(false)}
              onSubmitted={() => {
                setIsPredicting(false)
                setHasPredicted(true)
              }}
            />
          )}
        </AnimatePresence>

        {isPicking3P && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div onClick={e => e.stopPropagation()} className="bg-[#f5efdf] border-2 border-[#1e3d57]/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
              <div className="text-center mb-4">
                <div className="text-3xl mb-1">🥉</div>
                <h2 className="font-sans text-xl font-bold text-[#1e3d57]">3rd Place Match</h2>
                <p className="text-[#1e3d57]/60 text-sm mt-1">Who wins the bronze?</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[tp3Teams.teamA, tp3Teams.teamB].map((team, i) => team && (
                  <button key={i}
                    onClick={() => setPick3P(p => ({ ...p, teamId: team.id }))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      pick3P.teamId === team.id
                        ? 'border-[#1e3d57] bg-[#1e3d57]/10 scale-[1.02]'
                        : 'border-[#1e3d57]/25 hover:border-[#1e3d57] hover:bg-[#1e3d57]/5 active:scale-95'
                    }`}
                  >
                    <span className="text-4xl">{team.flag_emoji || team.flag}</span>
                    <span className="text-xs font-semibold text-[#1e3d57] text-center leading-tight">{team.name}</span>
                  </button>
                ))}
              </div>

              {pick3P.teamId && (
                <div className="flex items-center gap-3 justify-center mb-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[#1e3d57]/40">{tp3Teams.teamA?.name?.split(' ')[0]}</span>
                    <input type="number" min="0" max="20"
                      value={pick3P.scoreA}
                      onChange={e => setPick3P(p => ({ ...p, scoreA: e.target.value }))}
                      className="w-12 h-10 text-center text-lg font-bold rounded-xl border-2 bg-[#f5efdf] border-[#1e3d57]/25 text-[#1e3d57] focus:border-[#1e3d57] focus:outline-none"
                    />
                  </div>
                  <span className="text-lg font-bold text-[#1e3d57]/30 mt-4">–</span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[#1e3d57]/40">{tp3Teams.teamB?.name?.split(' ')[0]}</span>
                    <input type="number" min="0" max="20"
                      value={pick3P.scoreB}
                      onChange={e => setPick3P(p => ({ ...p, scoreB: e.target.value }))}
                      className="w-12 h-10 text-center text-lg font-bold rounded-xl border-2 bg-[#f5efdf] border-[#1e3d57]/25 text-[#1e3d57] focus:border-[#1e3d57] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {save3PError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">
                  <p className="text-red-700 text-xs">{save3PError}</p>
                </div>
              )}

              <button
                onClick={save3P}
                disabled={saving3P || !pick3P.teamId || pick3P.scoreA === '' || pick3P.scoreB === ''}
                className="w-full py-3 bg-[#1e3d57] text-[#f5efdf] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving3P ? 'Saving…' : 'Save Pick 🔒'}
              </button>
              <button
                onClick={() => { setIsPicking3P(false); setSave3PError(null) }}
                className="w-full mt-2 py-2 text-xs text-[#1e3d57]/40 hover:text-[#1e3d57]/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
