import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATS = {
  'Argentina': {
    rating: 5,
    style: 'Counter-attack & individual brilliance',
    strengths: ['World-class forward line led by Messi', 'Battle-hardened WC winning experience', 'Elite pressing and transitions'],
    weaknesses: ['Over-reliance on Messi', 'Struggles against deep defensive blocks'],
    players: ['Lionel Messi', 'Julián Álvarez', 'Rodrigo De Paul', 'Emiliano Martínez'],
  },
  'France': {
    rating: 5,
    style: 'High-tempo, physical, devastating on the break',
    strengths: ['Incredible squad depth', 'Explosive pace through Mbappé', 'Dominant set-piece threat'],
    weaknesses: ['Dressing room tensions', 'Can underperform in group stage'],
    players: ['Kylian Mbappé', 'Antoine Griezmann', 'Aurélien Tchouaméni', 'Mike Maignan'],
  },
  'Brazil': {
    rating: 5,
    style: 'Attacking flair with defensive solidity',
    strengths: ['Most technically gifted squad', 'Creative midfield options', 'Experience across all lines'],
    weaknesses: ['Historical pressure of expectation', 'Disorganised when chasing games'],
    players: ['Vinicius Jr.', 'Rodrygo', 'Lucas Paquetá', 'Casemiro'],
  },
  'Spain': {
    rating: 5,
    style: 'Tiki-taka possession football',
    strengths: ['Dominant ball retention', 'Young core with La Liga pedigree', 'Tactical flexibility'],
    weaknesses: ['Can lack a clinical striker', 'Too patient in the final third'],
    players: ['Pedri', 'Lamine Yamal', 'Rodri', 'Alvaro Morata'],
  },
  'England': {
    rating: 4,
    style: 'Possession-based with direct transitions',
    strengths: ['Elite Premier League core', 'World-class goalkeeper', 'Strong set-piece execution'],
    weaknesses: ['Freeze under knockout pressure', 'No true deep-lying playmaker'],
    players: ['Jude Bellingham', 'Harry Kane', 'Phil Foden', 'Bukayo Saka'],
  },
  'Germany': {
    rating: 4,
    style: 'Gegenpressing with organised structure',
    strengths: ['Intense high press', 'Strong team unity', 'Well-drilled defensive shape'],
    weaknesses: ['Reduced individual quality vs peak years', 'Vulnerable to pace on counter'],
    players: ['Florian Wirtz', 'Jamal Musiala', 'Toni Kroos', 'Manuel Neuer'],
  },
  'Portugal': {
    rating: 4,
    style: 'Direct and physical with creative freedom',
    strengths: ['Generational talent emerging', 'Lethal from set pieces', 'Deep experienced squad'],
    weaknesses: ['Ronaldo era transition still settling', 'Exposed defensively wide'],
    players: ['Cristiano Ronaldo', 'Bruno Fernandes', 'Rafael Leão', 'Bernardo Silva'],
  },
  'Netherlands': {
    rating: 4,
    style: 'Structured pressing with attacking width',
    strengths: ['Physical aggressive midfield', 'Dangerous from wide', 'Van Dijk commanding at back'],
    weaknesses: ['Struggles against fast starters', 'Inconsistent creative output'],
    players: ['Virgil van Dijk', 'Memphis Depay', 'Xavi Simons', 'Frenkie de Jong'],
  },
  'Morocco': {
    rating: 4,
    style: 'Defensive shape with lethal counter-attacks',
    strengths: ['Extraordinary defensive organisation', '2022 semi-final pedigree', 'Home continent advantage'],
    weaknesses: ['Goal threat relies on set pieces', 'Top possession teams can pin them back'],
    players: ['Achraf Hakimi', 'Hakim Ziyech', 'Yassine Bounou', 'Sofyan Amrabat'],
  },
  'Belgium': {
    rating: 3,
    style: 'Counter-attacking, direct play',
    strengths: ['Premier League steel throughout', 'Clinical in front of goal', 'High individual ceiling'],
    weaknesses: ['Golden generation in twilight', 'Defensive solidity inconsistent'],
    players: ['Kevin De Bruyne', 'Romelu Lukaku', 'Thibaut Courtois', 'Axel Witsel'],
  },
  'Uruguay': {
    rating: 3,
    style: 'Compact and combative — hard to beat',
    strengths: ['Fierce defensive organisation', 'Physical game management', 'Darwin Núñez explosive threat'],
    weaknesses: ['Limited creative midfield', 'Exposed by quick passing teams'],
    players: ['Darwin Núñez', 'Rodrigo Bentancur', 'Federico Valverde', 'Sergio Rochet'],
  },
  'Croatia': {
    rating: 3,
    style: 'Technical midfield dominance',
    strengths: ['World class midfield engine', 'Penalty shootout composure', '2018 final mentality'],
    weaknesses: ['Ageing squad — fitness over 90 mins', 'Limited pace in attack'],
    players: ['Luka Modrić', 'Mateo Kovačić', 'Ivan Perišić', 'Dominik Livaković'],
  },
  'USA': {
    rating: 3,
    style: 'Athletic, high-energy pressing',
    strengths: ['Elite athleticism', 'MLS and European balance', 'Home tournament boost'],
    weaknesses: ['Lack of elite tournament experience', 'Creativity in final third limited'],
    players: ['Christian Pulisic', 'Weston McKennie', 'Tyler Adams', 'Matt Turner'],
  },
  'Mexico': {
    rating: 3,
    style: 'Technical and organised',
    strengths: ['Strong CONCACAF experience', 'Disciplined defensive blocks', 'Co-host crowd support'],
    weaknesses: ['Historically exit at Round of 16', 'Ageing creative core'],
    players: ['Hirving Lozano', 'Raúl Jiménez', 'Guillermo Ochoa', 'Edson Álvarez'],
  },
  'Canada': {
    rating: 3,
    style: 'Athletic pressing with direct play',
    strengths: ['Youthful energy and hunger', 'Davies is world-class pace', 'Co-host momentum'],
    weaknesses: ['Lack of major tournament experience', 'Lose composure in pressure moments'],
    players: ['Alphonso Davies', 'Jonathan David', 'Tajon Buchanan', 'Milan Borjan'],
  },
  'Japan': {
    rating: 3,
    style: 'Disciplined pressing, fluid passing',
    strengths: ['High work rate and tactical discipline', 'Beat Germany & Spain 2022', 'Excellent pressing triggers'],
    weaknesses: ['Physical size disadvantage vs Europeans', 'Set-piece vulnerability'],
    players: ['Takefusa Kubo', 'Ritsu Doan', 'Wataru Endo', 'Shuichi Gonda'],
  },
  'South Korea': {
    rating: 3,
    style: 'Energetic and direct',
    strengths: ['Boundless stamina', 'Son Heung-min world class', 'Quick transitions'],
    weaknesses: ['Heavily reliant on Son', 'Exposed by patient possession teams'],
    players: ['Son Heung-min', 'Hwang Hee-chan', 'Kim Min-jae', 'Jo Hyeon-woo'],
  },
  'Senegal': {
    rating: 3,
    style: 'Physical and direct',
    strengths: ['Imposing athleticism throughout', 'Mané the focal point', 'African champions confidence'],
    weaknesses: ['Over-dependence on Mané', 'Struggle against disciplined sides'],
    players: ['Sadio Mané', 'Edouard Mendy', 'Kalidou Koulibaly', 'Idrissa Gueye'],
  },
  'Colombia': {
    rating: 3,
    style: 'Fast, attacking and expressive',
    strengths: ['Explosive attacking talent', 'High energy pressing', 'James can unlock any defence'],
    weaknesses: ['Defensive fragility on the break', 'Inconsistent performances'],
    players: ['James Rodríguez', 'Luis Díaz', 'Falcao', 'Davinson Sánchez'],
  },
  'Switzerland': {
    rating: 3,
    style: 'Defensively sound, hard to break down',
    strengths: ['Well-drilled structure', 'Consistent tournament performers', 'Sommer elite in goal'],
    weaknesses: ['Lack of game-changing individual quality', 'Tends to exit at QF stage'],
    players: ['Granit Xhaka', 'Xherdan Shaqiri', 'Yann Sommer', 'Breel Embolo'],
  },
  'Australia': {
    rating: 2,
    style: 'Physical, direct and resilient',
    strengths: ['Excellent team spirit', 'Strong goalkeeper', 'Tactical setup works in knockouts'],
    weaknesses: ['Limited technical quality vs elite', 'Struggle in possession games'],
    players: ['Mathew Ryan', 'Mitchell Duke', 'Aziz Behich', 'Aaron Mooy'],
  },
  'Ecuador': {
    rating: 2,
    style: 'Direct and physical',
    strengths: ['Strong South American qualifying form', 'Dangerous from set pieces', 'Team cohesion'],
    weaknesses: ['Limited top-level experience', 'Struggle vs possession-heavy teams'],
    players: ['Enner Valencia', 'Piero Hincapié', 'Moisés Caicedo', 'Alexander Domínguez'],
  },
  'Nigeria': {
    rating: 2,
    style: 'Fast and physical on the break',
    strengths: ['Raw athleticism and speed', 'Osimhen is a clinical finisher', 'African pedigree'],
    weaknesses: ['Inconsistency and tactical disorganisation', 'Can lose focus in tight games'],
    players: ['Victor Osimhen', 'Alex Iwobi', 'Samuel Chukwueze', 'Francis Uzoho'],
  },
  'Poland': {
    rating: 2,
    style: 'Defensive and direct',
    strengths: ['Lewandowski one of the world\'s best', 'Organised defensive structure', 'Strong set pieces'],
    weaknesses: ['Over-reliant on Lewandowski', 'Limited creativity outside the striker'],
    players: ['Robert Lewandowski', 'Piotr Zieliński', 'Wojciech Szczęsny', 'Kamil Grosicki'],
  },
  'Serbia': {
    rating: 2,
    style: 'Physical and combative',
    strengths: ['Strong defensive unit', 'Mitrović lethal in the air', 'Excellent organisation'],
    weaknesses: ['Lack of creativity in midfield', 'Loses discipline under pressure'],
    players: ['Aleksandar Mitrović', 'Dušan Tadić', 'Sergej Milinković-Savić', 'Vanja Milinković-Savić'],
  },
  'Iran': {
    rating: 2,
    style: 'Compact and counter-attacking',
    strengths: ['Defensive discipline and resilience', 'Capable of upsets', 'Taremi creative outlet'],
    weaknesses: ['Limited quality vs top opposition', 'Narrow tactical setup'],
    players: ['Mehdi Taremi', 'Alireza Jahanbakhsh', 'Ali Beiranvand', 'Sardar Azmoun'],
  },
  'Saudi Arabia': {
    rating: 2,
    style: 'Compact and direct',
    strengths: ['Beat Argentina 2022', 'Disciplined defensive shape', 'Capable of a big upset'],
    weaknesses: ['Limited quality to sustain over tournaments', 'Exposed by pace on flanks'],
    players: ['Salem Al-Dawsari', 'Mohammed Al-Owais', 'Saleh Al-Shehri', 'Abdulelah Al-Malki'],
  },
  'Ivory Coast': {
    rating: 4,
    style: 'Powerful, athletic, direct football',
    strengths: ['Elite athleticism', 'Dangerous wingers', 'Strong transition attack'],
    weaknesses: ['Can lose midfield control', 'Defensive lapses'],
    players: ['Sébastien Haller', 'Simon Adingra', 'Franck Kessié', 'Ousmane Diomandé'],
  },
  "Côte d'Ivoire": {
    rating: 4,
    style: 'Powerful, athletic, direct football',
    strengths: ['Elite athleticism', 'Dangerous wingers', 'Strong transition attack'],
    weaknesses: ['Can lose midfield control', 'Defensive lapses'],
    players: ['Sébastien Haller', 'Simon Adingra', 'Franck Kessié', 'Ousmane Diomandé'],
  },
  'Ghana': {
    rating: 2,
    style: 'Energetic pressing',
    strengths: ['Youthful energy and athleticism', 'Ayew family leadership', 'Tactically flexible'],
    weaknesses: ['Inconsistent defensive shape', 'Can go missing in biggest games'],
    players: ['Jordan Ayew', 'André Ayew', 'Thomas Partey', 'Lawrence Ati-Zigi'],
  },
  'South Africa': {
    rating: 3,
    style: 'Physical and direct with flair on the break',
    strengths: ['Strong African continental form', 'Hard to break down defensively', 'Home continent advantage and crowd support'],
    weaknesses: ['Lack of top-level knockout stage experience', 'Inconsistent final third creativity'],
    players: ['Percy Tau', 'Ronwen Williams', 'Themba Zwane', 'Bongani Zungu'],
  },
  'Paraguay': {
    rating: 2,
    style: 'Defensive and resolute',
    strengths: ['Difficult to beat — tournament mentality', 'Well-organised defensive unit', 'Physical and combative throughout'],
    weaknesses: ['Limited attacking quality against elite sides', 'Over-reliant on set pieces to create chances'],
    players: ['Miguel Almirón', 'Julio Enciso', 'Antony Silva', 'Gustavo Gómez'],
  },
  'Sweden': {
    rating: 3,
    style: 'Organised pressing with direct attacking play',
    strengths: ['Excellent team structure and discipline', 'Strong physical presence throughout', 'Isak provides a world-class focal point'],
    weaknesses: ['Post-Ibrahimović era — lacks a true superstar', 'Can be ponderous in possession'],
    players: ['Alexander Isak', 'Dejan Kulusevski', 'Victor Nilsson Lindelöf', 'Robin Olsen'],
  },
  'Bosnia and Herzegovina': {
    rating: 2,
    style: 'Direct and physically imposing',
    strengths: ['Džeko brings elite experience and physicality', 'Strong team spirit', 'Dangerous from long balls and set pieces'],
    weaknesses: ['Limited depth beyond key players', 'Inconsistent performances under pressure'],
    players: ['Edin Džeko', 'Miralem Pjanić', 'Sead Kolašinac', 'Asmir Begović'],
  },
  'Austria': {
    rating: 3,
    style: 'High-press, technical European football',
    strengths: ['Well-drilled pressing system under Rangnick', 'Technically gifted squad', 'Alaba commands the backline'],
    weaknesses: ['Lack of tournament pedigree at this level', 'Limited goal threat without Alaba pushing forward'],
    players: ['David Alaba', 'Marcel Sabitzer', 'Marko Arnautović', 'Patrick Pentz'],
  },
  'Norway': {
    rating: 3,
    style: 'Direct and explosive — built around Haaland',
    strengths: ['Haaland is arguably the world\'s most dangerous striker', 'Excellent set-piece delivery', 'Physical and energetic pressing'],
    weaknesses: ['Overly reliant on Haaland — if he\'s marked out of the game, creativity drops', 'Defensive shape can be stretched'],
    players: ['Erling Haaland', 'Martin Ødegaard', 'Sander Berge', 'Ørjan Nyland'],
  },
  'Algeria': {
    rating: 2,
    style: 'Counter-attacking and compact',
    strengths: ['Strong African experience and continental pedigree', 'Disciplined defensive organisation', 'Capable of upsetting stronger teams'],
    weaknesses: ['Limited individual quality vs top European sides', 'Struggle to sustain pressure for full 90 minutes'],
    players: ['Riyad Mahrez', 'Islam Slimani', 'Youcef Atal', 'Raïs M\'Bolhi'],
  },
  'DR Congo': {
    rating: 2,
    style: 'Athletic and direct',
    strengths: ['Exceptional raw athleticism', 'Powerful and combative in midfield', 'Strong African continental performances'],
    weaknesses: ['Tactical disorganisation under pressure', 'Limited experience at the World Cup level'],
    players: ['Cédric Bakambu', 'Arthur Masuaku', 'Chancel Mbemba', 'Elia Meschack'],
  },
  'Egypt': {
    rating: 3,
    style: 'Compact with explosive transition through Salah',
    strengths: ['Mohamed Salah is a genuine world-class match-winner', 'Disciplined defensive shape', 'Experience under pressure'],
    weaknesses: ['Overly reliant on Salah — team is built around one player', 'Limited creativity when Salah is quiet'],
    players: ['Mohamed Salah', 'Mostafa Mohamed', 'Mahmoud Trezeguet', 'Mohamed El-Shenawy'],
  },
  'Cabo Verde': {
    rating: 1,
    style: 'Compact underdog mentality',
    strengths: ['Nothing to lose — fearless mentality', 'Capable of an early upset against a complacent opponent', 'Strong African qualifying run'],
    weaknesses: ['Significant quality gap vs top sides', 'Limited squad depth and top-flight experience'],
    players: ['Garry Rodrigues', 'Júnior Andrade', 'Patrick Andrade', 'Vozinha'],
  },
}

const CARD_W   = 420
const CARD_GAP = 20

export default function TeamStats() {
  const [teams, setTeams]     = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const containerRef          = useRef(null)

  useEffect(() => {
    supabase.from('teams').select('id, name, flag_emoji').order('name')
      .then(({ data }) => { setTeams(data ?? []); setLoading(false) })
  }, [])

  const goTo   = (i) => setCurrent(Math.max(0, Math.min(teams.length - 1, i)))
  const goPrev = () => goTo(current - 1)
  const goNext = () => goTo(current + 1)

  // Offset from center: each step moves one card width + gap to the left
  const trackX = -(current * (CARD_W + CARD_GAP))

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -50) goNext()
    else if (info.offset.x > 50) goPrev()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e3d57] flex items-center justify-center">
        <p className="text-cream/30 text-sm">Loading teams…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1e3d57] flex flex-col py-10 overflow-hidden">
      {/* Header */}
      <div className="px-8 mb-8 flex-shrink-0">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cream/30 mb-1">Scouting Report</p>
        <h1 className="font-sans font-extrabold text-cream" style={{ fontSize: '2.5rem' }}>Team Stats</h1>
      </div>

      {/* Carousel track */}
      <div ref={containerRef} className="relative flex-shrink-0 overflow-hidden" style={{ height: 620 }}>
        <motion.div
          className="absolute top-0 flex"
          style={{ gap: CARD_GAP, left: '50%', marginLeft: -(CARD_W / 2) }}
          animate={{ x: trackX }}
          transition={{ type: 'spring', stiffness: 280, damping: 34 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
        >
          {teams.map((team, i) => {
            const stats    = STATS[team.name]
            const isActive = i === current

            return (
              <motion.div
                key={team.id}
                style={{ width: CARD_W, height: 600, flexShrink: 0, cursor: isActive ? 'default' : 'pointer' }}
                animate={{
                  clipPath: isActive
                    ? 'inset(0% 0% 0% 0% round 1.5rem)'
                    : 'inset(12% 0% 12% 0% round 1.5rem)',
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 34 }}
                onClick={() => !isActive && goTo(i)}
              >
                <div
                  className="w-full h-full rounded-3xl overflow-hidden"
                  style={{
                    background: isActive
                      ? 'linear-gradient(160deg, rgba(70,175,142,0.25) 0%, rgba(50,95,133,0.9) 100%)'
                      : 'rgba(253,246,232,0.05)',
                    border: isActive
                      ? '1px solid rgba(223,242,99,0.25)'
                      : '1px solid rgba(253,246,232,0.08)',
                  }}
                >
                  {/* Inactive: flag + name perfectly centered */}
                  {!isActive && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-4">
                      <span style={{ fontSize: '4rem', lineHeight: 1 }}>{team.flag_emoji}</span>
                      <p className="font-sans font-extrabold text-center text-cream/60 leading-tight"
                        style={{ fontSize: '1.1rem' }}>
                        {team.name}
                      </p>
                    </div>
                  )}

                  {/* Active: full layout */}
                  {isActive && (
                    <div className="w-full h-full flex flex-col">
                      {/* Flag */}
                      <div className="flex-shrink-0 flex items-center justify-center pt-14 pb-5">
                        <span style={{ fontSize: '7rem', lineHeight: 1 }}>{team.flag_emoji}</span>
                      </div>

                      {/* Name + stars */}
                      <div className="px-7 flex-shrink-0">
                        <p className="font-sans font-extrabold text-center text-cream leading-tight"
                          style={{ fontSize: '1.9rem' }}>
                          {team.name}
                        </p>
                        {stats && (
                          <p className="text-center mt-2 text-xl" style={{ color: '#DFF263', letterSpacing: '0.08em' }}>
                            {'★'.repeat(stats.rating)}{'☆'.repeat(5 - stats.rating)}
                          </p>
                        )}
                      </div>

                      {/* Stats content */}
                      <AnimatePresence>
                        {stats && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            className="flex-1 overflow-hidden px-7 pt-5 pb-7 flex flex-col gap-4 min-h-0"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wider text-center text-cream/40">
                              {stats.style}
                            </p>

                            <div className="flex gap-4 flex-1 min-h-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-lime mb-2">Strengths</p>
                                <ul className="space-y-2">
                                  {stats.strengths.map((s, j) => (
                                    <li key={j} className="text-xs text-cream/60 flex gap-2 leading-snug">
                                      <span className="text-lime flex-shrink-0 mt-px">+</span>{s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-rust mb-2">Weaknesses</p>
                                <ul className="space-y-2">
                                  {stats.weaknesses.map((w, j) => (
                                    <li key={j} className="text-xs text-cream/60 flex gap-2 leading-snug">
                                      <span className="text-rust flex-shrink-0 mt-px">−</span>{w}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center">
                              {stats.players.map(p => (
                                <span key={p} className="text-xs font-semibold px-3 py-1 rounded-full text-cream/80"
                                  style={{ background: 'rgba(253,246,232,0.08)', border: '1px solid rgba(253,246,232,0.15)' }}>
                                  {p}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Team name label below active card */}
      <div className="text-center mt-4 flex-shrink-0 h-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={current}
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.3 }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-cream/30"
          >
            {teams[current]?.name}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 mt-6 flex-shrink-0">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="p-2 rounded-full transition-all disabled:opacity-20"
          style={{ background: 'rgba(253,246,232,0.08)' }}
        >
          <ChevronLeft className="text-cream" size={20} />
        </button>

        {/* Dots */}
        <div className="flex gap-1.5 items-center">
          {teams.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width:  i === current ? 20 : 6,
                height: 6,
                background: i === current ? '#DFF263' : 'rgba(253,246,232,0.2)',
              }}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={current === teams.length - 1}
          className="p-2 rounded-full transition-all disabled:opacity-20"
          style={{ background: 'rgba(253,246,246,0.08)' }}
        >
          <ChevronRight className="text-cream" size={20} />
        </button>
      </div>
    </div>
  )
}
