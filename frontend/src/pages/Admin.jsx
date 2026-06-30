import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ADMIN_EMAIL = 'sofochka.j@gmail.com'

// Winner of slotId feeds into this child slot
const CHILD_SLOT = {
   1: { parent: 17, side: 0 },  2: { parent: 17, side: 1 },
   3: { parent: 18, side: 0 },  4: { parent: 18, side: 1 },
   5: { parent: 19, side: 0 },  6: { parent: 19, side: 1 },
   7: { parent: 20, side: 0 },  8: { parent: 20, side: 1 },
   9: { parent: 21, side: 0 }, 10: { parent: 21, side: 1 },
  11: { parent: 22, side: 0 }, 12: { parent: 22, side: 1 },
  13: { parent: 23, side: 0 }, 14: { parent: 23, side: 1 },
  15: { parent: 24, side: 0 }, 16: { parent: 24, side: 1 },
  17: { parent: 25, side: 0 }, 18: { parent: 25, side: 1 },
  19: { parent: 26, side: 0 }, 20: { parent: 26, side: 1 },
  21: { parent: 27, side: 0 }, 22: { parent: 27, side: 1 },
  23: { parent: 28, side: 0 }, 24: { parent: 28, side: 1 },
  25: { parent: 29, side: 0 }, 26: { parent: 29, side: 1 },
  27: { parent: 30, side: 0 }, 28: { parent: 30, side: 1 },
  29: { parent: 31, side: 0 }, 30: { parent: 31, side: 1 },
}

// Loser of SF slots goes to the 3rd place match (slot 32)
const LOSER_SLOT = {
  29: { parent: 32, side: 0 },
  30: { parent: 32, side: 1 },
}

const ROUNDS = [
  { label: 'Round of 32',    slots: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] },
  { label: 'Round of 16',    slots: [17,18,19,20,21,22,23,24] },
  { label: 'Quarter-finals', slots: [25,26,27,28] },
  { label: 'Semi-finals',    slots: [29,30] },
  { label: '3rd Place',      slots: [32] },
  { label: 'Final',          slots: [31] },
]

export default function Admin() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [slotMap, setSlotMap]   = useState({})
  const [editing, setEditing]   = useState(null)
  const [scoreA, setScoreA]     = useState('')
  const [scoreB, setScoreB]     = useState('')
  const [penSide, setPenSide]   = useState(null) // 'a' | 'b' | null
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(null)

  useEffect(() => {
    if (loading) return
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate('/', { replace: true })
      return
    }
    load()
  }, [user, loading])

  async function load() {
    const [{ data: slots }, { data: allTeams }] = await Promise.all([
      supabase.from('bracket_slots').select('id, winner_id, score_a, score_b, team_a_id, team_b_id'),
      supabase.from('teams').select('id, name, flag_emoji'),
    ])
    if (slots && allTeams) {
      const tMap = {}
      allTeams.forEach(t => { tMap[t.id] = t })
      const m = {}
      slots.forEach(s => {
        m[s.id] = {
          ...s,
          team_a: s.team_a_id ? tMap[s.team_a_id] ?? null : null,
          team_b: s.team_b_id ? tMap[s.team_b_id] ?? null : null,
        }
      })
      setSlotMap(m)
    }
  }

  function openEdit(slotId) {
    const slot = slotMap[slotId]
    if (!slot?.team_a || !slot?.team_b) return
    setEditing(slotId)
    setScoreA(slot.score_a ?? '')
    setScoreB(slot.score_b ?? '')
    setPenSide(null)
  }

  async function save() {
    if (editing === null) return
    const a = parseInt(scoreA, 10)
    const b = parseInt(scoreB, 10)
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return
    const isTied = a === b
    if (isTied && !penSide) return // must select penalty winner

    setSaving(true)
    const slot = slotMap[editing]
    const winnerId = a > b
      ? slot.team_a.id
      : b > a
      ? slot.team_b.id
      : penSide === 'a' ? slot.team_a.id : slot.team_b.id

    // 1. Update the current slot result
    await supabase.from('bracket_slots').update({
      score_a: a,
      score_b: b,
      winner_id: winnerId,
    }).eq('id', editing)

    // 2. Advance winner into the next round slot
    const child = CHILD_SLOT[editing]
    if (child && winnerId) {
      const col = child.side === 0 ? 'team_a_id' : 'team_b_id'
      await supabase.from('bracket_slots').update({ [col]: winnerId }).eq('id', child.parent)
    }

    // 3. For SF matches: advance loser to the 3rd place slot (slot 32)
    const loserChild = LOSER_SLOT[editing]
    if (loserChild && winnerId) {
      const loserId = winnerId === slot.team_a.id ? slot.team_b.id : slot.team_a.id
      const col = loserChild.side === 0 ? 'team_a_id' : 'team_b_id'
      await supabase.from('bracket_slots').update({ [col]: loserId }).eq('id', loserChild.parent)
    }

    await load()
    setSaving(false)
    setSaved(editing)
    setEditing(null)
    setTimeout(() => setSaved(null), 2000)
  }

  async function clearResult(slotId) {
    const child = CHILD_SLOT[slotId]
    const slot  = slotMap[slotId]

    if (child && slot?.winner_id) {
      const col = child.side === 0 ? 'team_a_id' : 'team_b_id'
      await supabase.from('bracket_slots').update({ [col]: null }).eq('id', child.parent)
    }

    // Also clear the loser from slot 32 when clearing a SF result
    const loserChild = LOSER_SLOT[slotId]
    if (loserChild && slot?.winner_id) {
      const col = loserChild.side === 0 ? 'team_a_id' : 'team_b_id'
      await supabase.from('bracket_slots').update({ [col]: null }).eq('id', loserChild.parent)
    }

    await supabase.from('bracket_slots').update({ score_a: null, score_b: null, winner_id: null }).eq('id', slotId)
    await load()
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-[#1e3d57] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cream/30 mb-1">Admin</p>
        <h1 className="font-sans font-extrabold text-cream mb-8" style={{ fontSize: '2.5rem' }}>
          Match Results
        </h1>

        <div className="space-y-10">
          {ROUNDS.map(round => (
            <section key={round.label}>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-lime mb-3">
                {round.label}
              </h2>
              <div className="space-y-2">
                {round.slots.map(slotId => {
                  const slot    = slotMap[slotId]
                  const teamA   = slot?.team_a
                  const teamB   = slot?.team_b
                  const hasResult = slot?.winner_id != null || (slot?.score_a != null && slot?.score_b != null)
                  const tbd     = !teamA || !teamB
                  const isEditing = editing === slotId

                  return (
                    <div key={slotId}
                      className="rounded-xl overflow-hidden"
                      style={{ background: 'rgba(253,246,232,0.06)', border: '1px solid rgba(253,246,232,0.1)' }}
                    >
                      {/* Match header */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {tbd ? (
                            <span className="text-cream/25 text-sm italic">TBD vs TBD</span>
                          ) : (
                            <span className="text-cream text-sm font-semibold truncate">
                              {teamA.flag_emoji} {teamA.name}
                              {hasResult && (
                                <span className="text-lime font-bold mx-2">
                                  {slot.score_a} – {slot.score_b}
                                </span>
                              )}
                              {!hasResult && <span className="text-cream/30 mx-2">vs</span>}
                              {teamB.flag_emoji} {teamB.name}
                            </span>
                          )}
                          {saved === slotId && (
                            <span className="text-lime text-xs font-bold ml-2">Saved ✓</span>
                          )}
                        </div>

                        {!tbd && !isEditing && (
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {hasResult && (
                              <button
                                onClick={() => clearResult(slotId)}
                                className="text-[10px] uppercase tracking-wider text-cream/25 hover:text-rust transition-colors"
                              >
                                Clear
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(slotId)}
                              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                              style={{ background: hasResult ? 'rgba(253,246,232,0.08)' : '#DFF263', color: hasResult ? 'rgba(253,246,232,0.5)' : '#1e3d57' }}
                            >
                              {hasResult ? 'Edit' : 'Enter result'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inline score editor */}
                      {isEditing && (
                        <div className="px-4 pb-4 pt-1 border-t border-cream/10">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-cream/60 text-xs w-20 truncate text-right">{teamA?.flag_emoji} {teamA?.name}</span>
                              <input
                                type="number" min="0"
                                value={scoreA}
                                onChange={e => setScoreA(e.target.value)}
                                className="w-14 text-center text-cream font-bold text-lg rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-lime"
                                style={{ background: 'rgba(253,246,232,0.1)', border: '1px solid rgba(253,246,232,0.2)' }}
                                autoFocus
                              />
                              <span className="text-cream/30 font-bold">–</span>
                              <input
                                type="number" min="0"
                                value={scoreB}
                                onChange={e => setScoreB(e.target.value)}
                                className="w-14 text-center text-cream font-bold text-lg rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-lime"
                                style={{ background: 'rgba(253,246,232,0.1)', border: '1px solid rgba(253,246,232,0.2)' }}
                              />
                              <span className="text-cream/60 text-xs w-20 truncate">{teamB?.flag_emoji} {teamB?.name}</span>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setEditing(null)}
                                className="text-xs text-cream/30 hover:text-cream/60 transition-colors px-2"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={save}
                                disabled={saving || scoreA === '' || scoreB === '' || (parseInt(scoreA) === parseInt(scoreB) && !penSide)}
                                className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-lg transition-all disabled:opacity-40"
                                style={{ background: '#DFF263', color: '#1e3d57' }}
                              >
                                {saving ? '…' : 'Save'}
                              </button>
                            </div>
                          </div>
                          {scoreA !== '' && scoreB !== '' && parseInt(scoreA) === parseInt(scoreB) && (
                            <div className="mt-3">
                              <p className="text-cream/50 text-xs mb-2">Tied — who won on penalties?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setPenSide('a')}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                                  style={{ background: penSide === 'a' ? '#DFF263' : 'rgba(253,246,232,0.1)', color: penSide === 'a' ? '#1e3d57' : 'rgba(253,246,232,0.5)' }}
                                >
                                  {teamA?.flag_emoji} {teamA?.name}
                                </button>
                                <button
                                  onClick={() => setPenSide('b')}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                                  style={{ background: penSide === 'b' ? '#DFF263' : 'rgba(253,246,232,0.1)', color: penSide === 'b' ? '#1e3d57' : 'rgba(253,246,232,0.5)' }}
                                >
                                  {teamB?.flag_emoji} {teamB?.name}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
