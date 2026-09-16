'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Edit, Save, Loader2, Plus, Users, BarChart2, Trash2, X, Check } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

const posColors: Record<string, string> = {
  Goalkeeper: 'bg-amber-100 text-amber-800',
  Defender:   'bg-blue-100 text-blue-800',
  Midfielder: 'bg-purple-100 text-purple-800',
  Striker:    'bg-rose-100 text-rose-800',
}

function ResultModal({ match, onClose, onSuccess }: { match: any; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading]  = useState(false)
  const [home, setHome]        = useState(match.score?.home ?? 0)
  const [away, setAway]        = useState(match.score?.away ?? 0)
  const [status, setStatus]    = useState(match.status || 'Played')

  const save = async () => {
    setLoading(true)
    const res = await fetch(`/api/matches/${match._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: { home: Number(home), away: Number(away) }, status }),
    })
    setLoading(false)
    if (res.ok) { toast.success('Result recorded!'); onSuccess() }
    else toast.error('Failed to save result')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-slate-900">Record Result</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-2">Match Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
              <option>Upcoming</option><option>Played</option><option>Postponed</option><option>Cancelled</option>
            </select>
          </div>
          {status === 'Played' && (
            <div>
              <label className="block text-sm text-slate-700 mb-2">Score</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-500 mb-1">NWU (Home)</p>
                  <input type="number" min="0" value={home} onChange={e => setHome(Number(e.target.value))}
                    className="input-field text-center text-2xl font-black py-3" />
                </div>
                <span className="text-2xl font-black text-slate-300">–</span>
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-500 mb-1">Opponent</p>
                  <input type="number" min="0" value={away} onChange={e => setAway(Number(e.target.value))}
                    className="input-field text-center text-2xl font-black py-3" />
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={save} disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Saving...</> : 'Save Result'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsModal({ player, matchId, existing, onClose, onSuccess }: { player: any; matchId: string; existing: any; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    goals: existing?.goals ?? 0,
    assists: existing?.assists ?? 0,
    minutesPlayed: existing?.minutesPlayed ?? 90,
    yellowCards: existing?.yellowCards ?? 0,
    redCards: existing?.redCards ?? 0,
    saves: existing?.saves ?? 0,
    tackles: existing?.tackles ?? 0,
    rating: existing?.rating ?? '',
  })

  const save = async () => {
    setLoading(true)
    const res = await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: player._id, match: matchId, ...form }),
    })
    setLoading(false)
    if (res.ok) { toast.success(`Stats saved for ${player.fullName}`); onSuccess() }
    else toast.error('Failed to save stats')
  }

  const field = (label: string, key: string, max?: number) => (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input type="number" min="0" max={max} value={(form as any)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
        className="input-field text-center py-2" />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="font-bold text-slate-900">Player Stats</h2>
            <p className="text-sm text-slate-500">{player.fullName} · {player.position}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {field('Goals', 'goals')}
            {field('Assists', 'assists')}
            {field('Minutes', 'minutesPlayed', 120)}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {field('Yellow Cards', 'yellowCards', 2)}
            {field('Red Cards', 'redCards', 1)}
            {field('Rating (1-10)', 'rating', 10)}
          </div>
          {player.position === 'Goalkeeper' && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              {field('Saves', 'saves')}
              {field('Tackles', 'tackles')}
            </div>
          )}
          {player.position !== 'Goalkeeper' && (
            <div className="mb-3">
              {field('Tackles', 'tackles')}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={save} disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Saving...</> : 'Save Stats'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MatchDetailPage() {
  const { id }   = useParams()
  const { data: session } = useSession()
  const role     = (session?.user as any)?.role
  const canEdit  = ['admin', 'coach'].includes(role)

  const [match, setMatch]         = useState<any>(null)
  const [stats, setStats]         = useState<any[]>([])
  const [squadPlayers, setSquadPlayers] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showResult, setShowResult]     = useState(false)
  const [statsPlayer, setStatsPlayer]   = useState<any>(null)

  const fetchAll = async () => {
    const matchRes = await fetch(`/api/matches/${id}`).then(r => r.json())
    setMatch(matchRes)
    const statsRes = await fetch(`/api/stats?match=${id}`).then(r => r.json())
    setStats(statsRes)
    if (matchRes.squad?._id) {
      const teamRes = await fetch(`/api/teams/${matchRes.squad._id}`).then(r => r.json())
      setSquadPlayers(teamRes.players || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [id])

  const toggleLineup = async (playerId: string) => {
    const current = match.lineup?.map((l: any) => l._id || l) || []
    const isIn    = current.some((lid: string) => lid.toString() === playerId)
    const newLineup = isIn ? current.filter((lid: string) => lid.toString() !== playerId) : [...current, playerId]
    await fetch(`/api/matches/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineup: newLineup }),
    })
    fetchAll()
  }

  const deleteMatch = async () => {
    if (!confirm('Delete this match? This cannot be undone.')) return
    await fetch(`/api/matches/${id}`, { method: 'DELETE' })
    toast.success('Match deleted')
    window.location.href = '/matches'
  }

  if (loading || !match) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const lineupIds = (match.lineup || []).map((l: any) => (l._id || l).toString())
  const result    = match.status === 'Played'
    ? (match.score.home > match.score.away ? 'Win' : match.score.home < match.score.away ? 'Loss' : 'Draw')
    : null
  const resultColor = result === 'Win' ? 'text-emerald-600' : result === 'Loss' ? 'text-red-600' : 'text-amber-600'

  return (
    <div className="animate-fade-in">
      <Header title={`vs ${match.opponent}`} subtitle={`${match.competition} · ${match.location}`} />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/matches" className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-700 transition-colors">
            <ArrowLeft size={14} /> Back to Matches
          </Link>
          {canEdit && (
            <div className="flex gap-2">
              <button onClick={() => setShowResult(true)} className="btn-primary" style={{ background: '#4B0082' }}>
                <Edit size={14} /> {match.status === 'Played' ? 'Update Result' : 'Record Result'}
              </button>
              <button onClick={deleteMatch} className="btn-secondary text-red-600 hover:bg-red-50">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card text-center">
              <span className={`badge ${match.status === 'Played' ? 'bg-emerald-100 text-emerald-700' : match.status === 'Upcoming' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'} mb-3`}>
                {match.status}
              </span>
              <h2 className="font-black text-slate-900 text-lg mb-1">NWU Soccer Institute</h2>
              <p className="text-slate-400 text-sm mb-4">vs</p>
              <h2 className="font-black text-slate-900 text-lg mb-4">{match.opponent}</h2>

              {match.status === 'Played' && (
                <div className="bg-purple-900 rounded-2xl p-4 mb-4">
                  <p className="text-5xl font-black text-white tabular-nums">{match.score.home} – {match.score.away}</p>
                  <p className={`font-bold mt-1 ${resultColor}`}>{result}</p>
                </div>
              )}

              <div className="space-y-2 text-sm text-left">
                {[
                  ['📅 Date', new Date(match.date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
                  ['⏰ Kick-off', new Date(match.date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })],
                  ['📍 Venue', match.venue],
                  ['🏠 Location', match.location],
                  ['🏆 Competition', match.competition],
                  ['🛡 Squad', match.squad?.name],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex gap-2">
                    <span className="text-slate-400 w-28 flex-shrink-0">{label}</span>
                    <span className="font-medium text-slate-700">{value || '—'}</span>
                  </div>
                ))}
              </div>
              {match.notes && <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg p-2 italic">{match.notes}</p>}
            </div>
          </div>

          {/* Lineup + Stats */}
          <div className="lg:col-span-2 space-y-5">
            {/* Lineup */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users size={16} className="text-purple-600" /> Squad Lineup ({lineupIds.length} players)
              </h3>
              {squadPlayers.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No squad assigned to this match</p>
              ) : (
                <div className="space-y-2">
                  {squadPlayers.map((p: any) => {
                    const inLineup = lineupIds.includes(p._id.toString())
                    return (
                      <div key={p._id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${inLineup ? 'bg-purple-50 border border-purple-100' : 'hover:bg-slate-50'}`}>
                        <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-700 text-xs font-bold">{p.fullName?.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{p.fullName}</p>
                          <p className="text-xs text-slate-400">#{p.jerseyNumber} · {p.position}</p>
                        </div>
                        <span className={`badge ${posColors[p.position] || 'bg-slate-100 text-slate-700'}`}>{p.position}</span>
                        {canEdit && (
                          <button onClick={() => toggleLineup(p._id)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${inLineup ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-purple-100'}`}>
                            {inLineup ? <Check size={13} /> : <Plus size={13} />}
                          </button>
                        )}
                        {canEdit && inLineup && (
                          <button onClick={() => setStatsPlayer(p)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Enter stats">
                            <BarChart2 size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Player Stats Table */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-emerald-600" /> Match Performance Stats
              </h3>
              {stats.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  No stats recorded yet.{canEdit ? ' Click the chart icon next to a player in the lineup to add stats.' : ''}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Player', 'Pos', 'Mins', 'Goals', 'Assists', 'YC', 'RC', 'Rating'].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((s: any) => (
                        <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">{s.player?.fullName?.charAt(0)}</div>
                              <span className="font-medium text-slate-800 text-xs">{s.player?.fullName}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-xs text-slate-500">{s.player?.position?.charAt(0)}</td>
                          <td className="py-2 px-2 text-slate-600">{s.minutesPlayed}'</td>
                          <td className="py-2 px-2 font-bold text-purple-700">{s.goals}</td>
                          <td className="py-2 px-2 font-bold text-blue-600">{s.assists}</td>
                          <td className="py-2 px-2"><span className={s.yellowCards > 0 ? 'text-amber-600 font-bold' : 'text-slate-300'}>{s.yellowCards}</span></td>
                          <td className="py-2 px-2"><span className={s.redCards > 0 ? 'text-red-600 font-bold' : 'text-slate-300'}>{s.redCards}</span></td>
                          <td className="py-2 px-2">
                            {s.rating ? (
                              <span className={`font-bold ${s.rating >= 8 ? 'text-emerald-600' : s.rating >= 6 ? 'text-amber-600' : 'text-red-600'}`}>{s.rating}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showResult && <ResultModal match={match} onClose={() => setShowResult(false)} onSuccess={() => { setShowResult(false); fetchAll() }} />}
      {statsPlayer && <StatsModal player={statsPlayer} matchId={id as string} existing={stats.find(s => s.player?._id === statsPlayer._id)} onClose={() => setStatsPlayer(null)} onSuccess={() => { setStatsPlayer(null); fetchAll() }} />}
    </div>
  )
}
