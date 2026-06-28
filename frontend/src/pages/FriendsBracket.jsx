import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const glass = {
  background: 'rgba(253, 246, 232, 0.18)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(253, 246, 232, 0.32)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(253,246,232,0.4)',
}

const PARENT_SLOTS = {
  17:[1,2],  18:[3,4],  19:[5,6],  20:[7,8],
  21:[9,10], 22:[11,12],23:[13,14],24:[15,16],
  25:[17,18],26:[19,20],27:[21,22],28:[23,24],
  29:[25,26],30:[27,28],
  31:[29,30],
}

function SoccerField() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div style={{ position:'absolute', inset:-20, background:`repeating-linear-gradient(to right,#1a5c1a 0px,#1a5c1a 80px,#1e6e1e 80px,#1e6e1e 160px)`, filter:'blur(4px)' }} />
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

function TeamRow({ team, isWinner }) {
  return (
    <div className={`flex items-center gap-1 px-1.5 py-1 ${isWinner ? 'bg-lime/25' : ''}`}>
      <span className="text-sm leading-none flex-shrink-0">{team?.flag_emoji ?? '🏳️'}</span>
      <span className={`text-[11px] truncate min-w-0 flex-1 font-medium ${isWinner ? 'text-lime font-semibold' : team ? 'text-cream' : 'text-cream/40 italic'}`}>
        {team?.name ?? 'TBD'}
      </span>
    </div>
  )
}

function MatchCard({ slot, onClick }) {
  const teamA = slot?.team_a ?? null
  const teamB = slot?.team_b ?? null
  const winnerId = slot?.winner_id ?? null

  return (
    <button
      className="w-full rounded-lg overflow-hidden text-left hover:brightness-125 transition-all active:scale-95"
      style={glass}
      onClick={onClick}
    >
      <TeamRow team={teamA} isWinner={winnerId && winnerId === teamA?.id} />
      <div className="h-px bg-cream/20" />
      <TeamRow team={teamB} isWinner={winnerId && winnerId === teamB?.id} />
    </button>
  )
}

function BracketColumn({ slotIds, slotMap, label, onMatchClick }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="text-center mb-1 h-5 flex items-center justify-center">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 whitespace-nowrap">{label}</span>
      </div>
      <div className="flex-1 flex flex-col justify-around gap-1 px-0.5">
        {slotIds.map(id => (
          <MatchCard key={id} slot={slotMap[id]} onClick={() => onMatchClick(id)} />
        ))}
      </div>
    </div>
  )
}

function FinalColumn({ slot, onMatchClick }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center justify-center px-1 gap-3">
      <div className="flex flex-col items-center w-full">
        <span className="text-[9px] font-bold uppercase tracking-wider text-lime mb-1">Final</span>
        <MatchCard slot={slot} onClick={() => onMatchClick(31)} />
      </div>
      <div className="text-5xl select-none opacity-70">🏆</div>
      <div className="flex flex-col items-center w-full">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1">3rd Place</span>
        <div className="w-full rounded-lg overflow-hidden" style={glass}>
          <div className="flex items-center gap-1 px-1.5 py-1"><span className="text-sm">🏳️</span><span className="text-[11px] text-cream/40 italic flex-1">TBD</span></div>
          <div className="h-px bg-cream/20" />
          <div className="flex items-center gap-1 px-1.5 py-1"><span className="text-sm">🏳️</span><span className="text-[11px] text-cream/40 italic flex-1">TBD</span></div>
        </div>
      </div>
    </div>
  )
}

function FriendPicksPanel({ slotId, slotMap, allPicks, profiles, onClose }) {
  const slot = slotMap[slotId]
  const teamA = slot?.team_a
  const teamB = slot?.team_b
  const picks = allPicks[slotId] ?? []

  const aPickerIds = picks.filter(p => p.picked_team_id === teamA?.id)
  const bPickerIds = picks.filter(p => p.picked_team_id === teamB?.id)

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 h-full w-72 flex flex-col"
      style={{ zIndex: 20, background: 'rgba(20,45,65,0.97)', backdropFilter: 'blur(12px)', borderLeft: '1px solid rgba(253,246,232,0.1)' }}
    >
      <div className="flex items-center justify-between p-4 border-b border-cream/10">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-cream/40">Friends picked</p>
          <p className="text-cream font-bold text-sm mt-0.5">
            {teamA?.flag_emoji} {teamA?.name ?? 'TBD'} vs {teamB?.flag_emoji} {teamB?.name ?? 'TBD'}
          </p>
        </div>
        <button onClick={onClose} className="text-cream/40 hover:text-cream text-xl leading-none ml-2">✕</button>
      </div>

      {picks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-cream/40 text-sm text-center px-6">No predictions submitted yet for this match.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-0 h-full">
            {/* Team A pickers */}
            <div className="border-r border-cream/10 p-3">
              <div className="text-center mb-3">
                <div className="text-2xl">{teamA?.flag_emoji ?? '🏳️'}</div>
                <p className="text-[10px] font-bold text-cream/60 uppercase tracking-wide mt-1">{teamA?.name ?? 'TBD'}</p>
                <p className="text-lime text-xs font-bold">{aPickerIds.length}</p>
              </div>
              <div className="space-y-2">
                {aPickerIds.map(pick => {
                  const name = profiles[pick.user_id]?.display_name ?? 'Friend'
                  return (
                    <div key={pick.user_id} className="rounded-lg p-2" style={{ background: 'rgba(70,175,142,0.15)', border: '1px solid rgba(70,175,142,0.25)' }}>
                      <p className="text-cream text-xs font-semibold truncate">{name}</p>
                      <p className="text-teal text-[10px] font-bold">{pick.score_a} – {pick.score_b}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Team B pickers */}
            <div className="p-3">
              <div className="text-center mb-3">
                <div className="text-2xl">{teamB?.flag_emoji ?? '🏳️'}</div>
                <p className="text-[10px] font-bold text-cream/60 uppercase tracking-wide mt-1">{teamB?.name ?? 'TBD'}</p>
                <p className="text-lime text-xs font-bold">{bPickerIds.length}</p>
              </div>
              <div className="space-y-2">
                {bPickerIds.map(pick => {
                  const name = profiles[pick.user_id]?.display_name ?? 'Friend'
                  return (
                    <div key={pick.user_id} className="rounded-lg p-2" style={{ background: 'rgba(70,175,142,0.15)', border: '1px solid rgba(70,175,142,0.25)' }}>
                      <p className="text-cream text-xs font-semibold truncate">{name}</p>
                      <p className="text-teal text-[10px] font-bold">{pick.score_a} – {pick.score_b}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function FriendsBracket() {
  const { user, hasPredicted } = useAuth()
  const [slotMap, setSlotMap]   = useState({})
  const [allPicks, setAllPicks] = useState({})   // slotId → [{ user_id, picked_team_id, score_a, score_b }]
  const [profiles, setProfiles] = useState({})   // userId → { display_name }
  const [loading, setLoading]   = useState(true)
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent'
    return () => { document.body.style.backgroundColor = '' }
  }, [])

  useEffect(() => {
    if (!user || !hasPredicted) { setLoading(false); return }
    load()
  }, [user, hasPredicted])

  async function load() {
    const [{ data: slots }, { data: allTeams }, { data: preds }, { data: profileList }] = await Promise.all([
      supabase.from('bracket_slots').select('id, round, slot_number, winner_id, team_a_id, team_b_id'),
      supabase.from('teams').select('id, name, flag_emoji'),
      supabase.from('predictions').select('user_id, bracket_slot_id, picked_team_id, score_a, score_b'),
      supabase.from('profiles').select('id, display_name'),
    ])

    if (slots && allTeams) {
      const tMap = {}
      allTeams.forEach(t => { tMap[t.id] = t })
      const sMap = {}
      slots.forEach(s => {
        sMap[s.id] = {
          ...s,
          team_a: s.team_a_id ? tMap[s.team_a_id] ?? null : null,
          team_b: s.team_b_id ? tMap[s.team_b_id] ?? null : null,
        }
      })
      setSlotMap(sMap)
    }

    if (preds) {
      const pMap = {}
      preds.forEach(p => {
        if (!pMap[p.bracket_slot_id]) pMap[p.bracket_slot_id] = []
        pMap[p.bracket_slot_id].push(p)
      })
      setAllPicks(pMap)
    }

    if (profileList) {
      const prMap = {}
      profileList.forEach(pr => { prMap[pr.id] = pr })
      setProfiles(prMap)
    }

    setLoading(false)
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <SoccerField />
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
          <div className="rounded-2xl p-8 max-w-sm text-center" style={glass}>
            <p className="text-4xl mb-3">🔒</p>
            <h2 className="font-sans font-bold text-cream text-xl mb-2">Log in to view</h2>
            <p className="text-cream/60 text-sm mb-5">You need an account to see friends' picks.</p>
            <a href="/register" className="block w-full py-3 rounded-xl font-bold text-navy-dark text-sm" style={{ background: '#DFF263' }}>Join →</a>
          </div>
        </div>
      </>
    )
  }

  // Has account but hasn't predicted yet
  if (!hasPredicted) {
    return (
      <>
        <SoccerField />
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
          <div className="rounded-2xl p-8 max-w-sm text-center" style={glass}>
            <p className="text-4xl mb-3">🔒</p>
            <h2 className="font-sans font-bold text-cream text-xl mb-2">Submit your bracket first</h2>
            <p className="text-cream/60 text-sm mb-5">Make your predictions before you can see what your friends picked.</p>
            <a href="/bracket" className="block w-full py-3 rounded-xl font-bold text-navy-dark text-sm" style={{ background: '#DFF263' }}>Make Your Predictions →</a>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <SoccerField />
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
          <p className="text-white/60">Loading friends' picks…</p>
        </div>
      </>
    )
  }

  const leftCols  = [
    { slotIds:[1,2,3,4,5,6,7,8],       label:'Round of 32'    },
    { slotIds:[17,18,19,20],            label:'Round of 16'    },
    { slotIds:[25,26],                  label:'Quarter-finals' },
    { slotIds:[29],                     label:'Semi-finals'    },
  ]
  const rightCols = [
    { slotIds:[30],                     label:'Semi-finals'    },
    { slotIds:[27,28],                  label:'Quarter-finals' },
    { slotIds:[21,22,23,24],            label:'Round of 16'    },
    { slotIds:[9,10,11,12,13,14,15,16], label:'Round of 32'   },
  ]

  return (
    <>
      <SoccerField />

      <div className="fixed inset-0 flex flex-col" style={{ zIndex: 1 }}>
        <div className="text-center pt-3 pb-1 flex-shrink-0">
          <h1 className="font-sans text-lg font-bold text-white/90">Friends' Bracket</h1>
          <p className="text-white/40 text-[9px] uppercase tracking-widest">Tap any match to see who picked what</p>
        </div>

        <div className="flex-1 flex items-stretch px-2 pb-3 gap-1 min-h-0">
          {leftCols.map(c => (
            <BracketColumn key={c.label} slotIds={c.slotIds} slotMap={slotMap} label={c.label} onMatchClick={setSelectedSlot} />
          ))}
          <FinalColumn slot={slotMap[31]} onMatchClick={setSelectedSlot} />
          {rightCols.map(c => (
            <BracketColumn key={c.label} slotIds={c.slotIds} slotMap={slotMap} label={c.label} onMatchClick={setSelectedSlot} />
          ))}
        </div>
      </div>

      {/* Friend picks slide-out panel */}
      <AnimatePresence>
        {selectedSlot && (
          <>
            <div
              className="fixed inset-0"
              style={{ zIndex: 15 }}
              onClick={() => setSelectedSlot(null)}
            />
            <FriendPicksPanel
              slotId={selectedSlot}
              slotMap={slotMap}
              allPicks={allPicks}
              profiles={profiles}
              onClose={() => setSelectedSlot(null)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  )
}
