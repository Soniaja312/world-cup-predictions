import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Leaderboard() {
  const { user } = useAuth()
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [matchesPlayed, setMatchesPlayed] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    // Fetch all settled bracket slots (have a winner)
    const { data: slots } = await supabase
      .from('bracket_slots')
      .select('id, winner_id, score_a, score_b')
      .not('winner_id', 'is', null)

    // Fetch all predictions
    const { data: preds } = await supabase
      .from('predictions')
      .select('user_id, bracket_slot_id, picked_team_id, score_a, score_b')

    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')

    if (!slots || !preds || !profiles) { setLoading(false); return }

    setMatchesPlayed(slots.length)

    // Build a lookup: slotId → slot result
    const slotResult = {}
    slots.forEach(s => { slotResult[s.id] = s })

    // Score each user
    const userScores = {}
    preds.forEach(p => {
      const result = slotResult[p.bracket_slot_id]
      if (!result) return // match not yet played

      if (!userScores[p.user_id]) {
        userScores[p.user_id] = { points: 0, correct: 0, exact: 0 }
      }

      const correctWinner = p.picked_team_id === result.winner_id
      const exactScore    = correctWinner &&
                            p.score_a === result.score_a &&
                            p.score_b === result.score_b

      if (correctWinner) {
        userScores[p.user_id].points  += 2
        userScores[p.user_id].correct += 1
      }
      if (exactScore) {
        userScores[p.user_id].points += 3
        userScores[p.user_id].exact  += 1
      }
    })

    // Build ranked rows
    const ranked = profiles
      .map(p => ({
        userId:  p.id,
        name:    p.display_name ?? 'Unknown',
        points:  userScores[p.id]?.points  ?? 0,
        correct: userScores[p.id]?.correct ?? 0,
        exact:   userScores[p.id]?.exact   ?? 0,
      }))
      .sort((a, b) => b.points - a.points || b.correct - a.correct)

    setRows(ranked)
    setLoading(false)
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-[#1e3d57] px-6 py-10">
      <div className="max-w-lg mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cream/30 mb-1">Live</p>
        <h1 className="font-sans font-extrabold text-cream mb-1" style={{ fontSize: '2.5rem' }}>
          Leaderboard
        </h1>
        <p className="text-cream/30 text-xs mb-8">
          {matchesPlayed === 0
            ? 'No results yet — check back after the first matches'
            : `Based on ${matchesPlayed} completed match${matchesPlayed === 1 ? '' : 'es'}`}
        </p>

        {/* Scoring key */}
        <div className="flex gap-4 mb-8">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(223,242,99,0.08)', border: '1px solid rgba(223,242,99,0.15)' }}>
            <span className="text-lime font-extrabold text-sm">+2</span>
            <span className="text-cream/40 text-xs">correct winner</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(223,242,99,0.08)', border: '1px solid rgba(223,242,99,0.15)' }}>
            <span className="text-lime font-extrabold text-sm">+3</span>
            <span className="text-cream/40 text-xs">exact score</span>
          </div>
        </div>

        {loading ? (
          <p className="text-cream/30 text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-cream/30 text-sm">No predictions submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row, i) => {
              const isMe = row.userId === user?.id
              const rank = i + 1

              return (
                <div
                  key={row.userId}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl transition-all"
                  style={{
                    background: isMe
                      ? 'rgba(223,242,99,0.1)'
                      : 'rgba(253,246,232,0.05)',
                    border: isMe
                      ? '1px solid rgba(223,242,99,0.25)'
                      : '1px solid rgba(253,246,232,0.08)',
                  }}
                >
                  {/* Rank */}
                  <span className="text-xl w-8 text-center flex-shrink-0">
                    {rank <= 3 ? medals[rank - 1] : <span className="text-cream/30 font-bold text-sm">#{rank}</span>}
                  </span>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-sans font-bold truncate ${isMe ? 'text-lime' : 'text-cream'}`}>
                      {row.name}{isMe && <span className="text-lime/50 font-normal text-xs ml-2">you</span>}
                    </p>
                    <p className="text-cream/30 text-xs mt-0.5">
                      {row.correct} correct winner{row.correct !== 1 ? 's' : ''}
                      {row.exact > 0 && ` · ${row.exact} exact score${row.exact !== 1 ? 's' : ''}`}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    <span className={`font-extrabold text-2xl ${isMe ? 'text-lime' : 'text-cream'}`}>
                      {row.points}
                    </span>
                    <span className="text-cream/30 text-xs ml-1">pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
