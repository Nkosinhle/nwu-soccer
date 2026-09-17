'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { Plus, Calendar, MapPin, Clock, X, Loader2, ChevronRight, FileText, Trophy } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { downloadPptx } from '@/lib/pptx-client'

const statusColors: Record<string, string> = {
  Upcoming:  'bg-amber-100 text-amber-800',
  Played:    'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-800',
  Postponed: 'bg-slate-100 text-slate-800',
}

// ── Add Fixture Modal (upcoming game) ─────────────────────────────────────────
function AddFixtureModal({ teams, onClose, onSuccess }: {
  teams: any[]; onClose: () => void; onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, status: 'Upcoming', score: { home: 0, away: 0 } }),
    })
    setLoading(false)
    if (res.ok) { toast.success('Fixture added!'); onSuccess() }
    else toast.error('Failed to add fixture')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={18} className="text-amber-500" /> Add Fixture
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Opponent *</label>
              <input {...register('opponent', { required: true })} placeholder="e.g. TUT FC" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Date & Time *</label>
              <input {...register('date', { required: true })} type="datetime-local" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Location</label>
              <select {...register('location')} className="input-field">
                <option>Home</option><option>Away</option><option>Neutral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Venue *</label>
              <input {...register('venue', { required: true })} placeholder="e.g. Fanie du Toit Stadium" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Competition</label>
              <input {...register('competition')} defaultValue="USSA League" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Squad *</label>
              <select {...register('squad', { required: true })} className="input-field">
                <option value="">Select squad</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Notes</label>
              <textarea {...register('notes')} rows={2} className="input-field resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Adding...</> : 'Add Fixture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Result Modal (already played game) ────────────────────────────────────
type ResultForm = {
  opponent: string
  date: string
  venue: string
  location: string
  competition: string
  squad: string
  notes: string
  homeScore: number
  awayScore: number
}

function AddResultModal({ teams, players, onClose, onSuccess }: {
  teams: any[]; players: any[]; onClose: () => void; onSuccess: () => void
}) {
  const [loading,       setLoading]       = useState(false)
  const [selectedSquad, setSelectedSquad] = useState('')
  const [lineup,        setLineup]        = useState<string[]>([])
  const { register, handleSubmit, watch } = useForm<ResultForm>({
    defaultValues: { homeScore: 0, awayScore: 0, location: 'Home' },
  })

  const squadPlayers = players.filter(p => {
    const pSquad = p.squad?._id || p.squad
    return pSquad && pSquad.toString() === selectedSquad
  })

  const toggleLineup = (id: string) => {
    setLineup(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const onSubmit = async (data: any) => {
    setLoading(true)
    const payload = {
      opponent:    data.opponent,
      date:        data.date,
      venue:       data.venue,
      location:    data.location,
      competition: data.competition || 'USSA League',
      squad:       data.squad,
      notes:       data.notes,
      status:      'Played',
      score: {
        home: parseInt(data.homeScore) || 0,
        away: parseInt(data.awayScore) || 0,
      },
      lineup,
    }
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (res.ok) { toast.success('Result recorded!'); onSuccess() }
    else toast.error('Failed to record result')
  }

  const location  = watch('location')
  const homeScore = Number(watch('homeScore') ?? 0)
  const awayScore = Number(watch('awayScore') ?? 0)

  const us   = location === 'Away' ? awayScore : homeScore
  const them = location === 'Away' ? homeScore : awayScore
  const resultLabel = us > them ? '✅ Win' : us < them ? '❌ Loss' : '🤝 Draw'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Trophy size={18} className="text-emerald-500" /> Record Result
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Match info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Opponent *</label>
              <input {...register('opponent', { required: true })} placeholder="e.g. TUT FC" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Date Played *</label>
              <input {...register('date', { required: true })} type="datetime-local" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Location</label>
              <select {...register('location')} className="input-field">
                <option>Home</option><option>Away</option><option>Neutral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Venue *</label>
              <input {...register('venue', { required: true })} placeholder="Stadium name" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Competition</label>
              <input {...register('competition')} defaultValue="USSA League" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Squad *</label>
              <select
                {...register('squad', { required: true,
                  onChange: (e) => { setSelectedSquad(e.target.value); setLineup([]) }
                })}
                className="input-field"
              >
                <option value="">Select squad</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Score */}
          <div className="bg-slate-900 rounded-2xl p-4">
            <p className="text-slate-400 text-xs text-center mb-3 uppercase tracking-wide">Final Score</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center flex-1">
                <p className="text-white text-xs mb-2 opacity-70">NWU (Home score)</p>
                <input
                  {...register('homeScore')}
                  type="number" min="0" max="99"
                  className="w-full text-center text-3xl font-black bg-white/10 text-white rounded-xl border-0 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  defaultValue={0}
                />
              </div>
              <span className="text-white text-2xl font-black opacity-40">—</span>
              <div className="text-center flex-1">
                <p className="text-white text-xs mb-2 opacity-70">Opponent (Away score)</p>
                <input
                  {...register('awayScore')}
                  type="number" min="0" max="99"
                  className="w-full text-center text-3xl font-black bg-white/10 text-white rounded-xl border-0 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  defaultValue={0}
                />
              </div>
            </div>
            <p className="text-center mt-3 text-sm font-semibold text-white/80">{resultLabel}</p>
          </div>

          {/* Lineup selection */}
          {selectedSquad && squadPlayers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Starting Lineup <span className="text-slate-400 text-xs">({lineup.length} selected)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setLineup(squadPlayers.slice(0, 11).map(p => p._id))}
                  className="text-xs text-purple-600 hover:underline"
                >
                  Auto-select 11
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {squadPlayers.map(p => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => toggleLineup(p._id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                      lineup.includes(p._id)
                        ? 'bg-purple-900 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-purple-50'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs flex-shrink-0">
                      {p.jerseyNumber}
                    </span>
                    <span className="truncate">{p.fullName.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="input-field resize-none"
              placeholder="Match notes, scorers, key moments..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Saving...</> : 'Record Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
interface MatchesClientProps {
  initialMatches: any[]
  teams: any[]
  players: any[]
  role: string
}

export default function MatchesClient({
  initialMatches,
  teams,
  players,
  role,
}: MatchesClientProps) {
  const [matches, setMatches] =
    useState<any[]>(initialMatches)

  const [filter, setFilter] = useState('')
  const [showFixture, setShowFixture] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const [exportingPptx, setExportingPptx] =
    useState(false)

  const canEdit =
    ['admin', 'coach'].includes(role)

  const filtered = filter ? matches.filter((m: any) => m.status === filter) : matches
  const played   = matches.filter((m: any) => m.status === 'Played')
  const upcoming = matches.filter((m: any) => m.status === 'Upcoming')
  const wins     = played.filter((m: any) => m.score?.home > m.score?.away).length

  const exportPptx = async () => {
    setExportingPptx(true)
    try {
      await downloadPptx('match-summary', { season: String(new Date().getFullYear()) }, 'Match Summary')
    } catch {
      toast.error('Failed to export')
    } finally {
      setExportingPptx(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <Header title="Matches" subtitle="Fixtures, results & scorelines" />
      <div className="p-4 md:p-8">

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Upcoming', value: upcoming.length, color: 'text-amber-600' },
            { label: 'Played',   value: played.length,   color: 'text-emerald-600' },
            { label: 'Wins',     value: wins,             color: 'text-purple-700' },
            { label: 'Win Rate', value: played.length ? `${Math.round(wins / played.length * 100)}%` : '—', color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="space-y-3 mb-5">
          {/* Status filters */}
          <div className="flex flex-wrap gap-2">
            {['', 'Upcoming', 'Played', 'Cancelled', 'Postponed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'}`}>
                {f || 'All'}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => window.open('/api/export?type=matches', '_blank')} className="btn-secondary text-sm">
              ⬇ CSV
            </button>
            <button onClick={exportPptx} disabled={exportingPptx} className="btn-secondary text-sm gap-1.5 disabled:opacity-60">
              <FileText size={13} /> {exportingPptx ? 'Exporting…' : 'PPT'}
            </button>
            {canEdit && (
              <>
                <button onClick={() => setShowFixture(true)} className="btn-secondary text-sm gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Calendar size={14} /> Add Fixture
                </button>
                <button onClick={() => setShowResult(true)} className="btn-primary text-sm gap-1.5" style={{ background: '#4B0082' }}>
                  <Trophy size={14} /> Add Result
                </button>
              </>
            )}
          </div>
        </div>

        {/* Matches list */}
        <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="card text-center py-12">
                <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No matches found</p>
                {canEdit && (
                  <div className="flex gap-2 justify-center mt-4">
                    <button onClick={() => setShowFixture(true)} className="text-sm text-amber-600 hover:underline">Add fixture →</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => setShowResult(true)} className="text-sm text-purple-600 hover:underline">Record result →</button>
                  </div>
                )}
              </div>
            ) : filtered.map((m: any) => (
              <div key={m._id} className="card hover:shadow-md transition-all">
                {/* Mobile layout */}
                <div className="flex items-center gap-3">
                  {/* Date */}
                  <div className="text-center w-12 flex-shrink-0">
                    <p className="text-xl font-black text-purple-900">{new Date(m.date).getDate()}</p>
                    <p className="text-xs text-slate-400 uppercase">{new Date(m.date).toLocaleString('default', { month: 'short' })}</p>
                    <p className="text-xs text-slate-400">{new Date(m.date).getFullYear()}</p>
                  </div>

                  <div className="w-px h-10 bg-slate-100 flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className={`badge text-xs ${statusColors[m.status]}`}>{m.status}</span>
                      <span className="badge bg-purple-100 text-purple-700 text-xs">{m.location}</span>
                    </div>
                    <p className="font-semibold text-slate-900 text-sm truncate">vs {m.opponent}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-0.5"><MapPin size={10} />{m.venue}</span>
                      <span className="flex items-center gap-0.5"><Clock size={10} />{new Date(m.date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Score or time */}
                  {m.status === 'Played' && (
                    <div className="text-center flex-shrink-0">
                      <p className="text-xl font-black text-slate-900 tabular-nums">{m.score.home}–{m.score.away}</p>
                      <p className="text-xs text-slate-400">
                        {m.score.home > m.score.away ? '✅' : m.score.home < m.score.away ? '❌' : '🤝'}
                      </p>
                    </div>
                  )}
                  {m.status === 'Upcoming' && (
                    <div className="text-center flex-shrink-0">
                      <p className="text-sm font-bold text-amber-600">
                        {new Date(m.date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-slate-400">KO</p>
                    </div>
                  )}

                  <Link href={`/matches/${m._id}`}
                    className="flex items-center justify-center w-8 h-8 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors flex-shrink-0">
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
      </div>

      {showFixture && (
        <AddFixtureModal
          teams={teams}
          onClose={() => setShowFixture(false)}
          onSuccess={() => {
            setShowFixture(false)
            window.location.reload()
            }}
        />
      )}
      {showResult && (
        <AddResultModal
          teams={teams}
          players={players}
          onClose={() => setShowResult(false)}
          onSuccess={() => {
            setShowResult(false)
            window.location.reload()
            }}
        />
      )}
    </div>
  )
}
