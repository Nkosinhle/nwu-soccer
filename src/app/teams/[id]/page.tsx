'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, UserPlus, UserMinus, Shield, Users, Search } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

const posColors: Record<string, string> = {
  Goalkeeper: 'bg-amber-100 text-amber-800',
  Defender:   'bg-blue-100 text-blue-800',
  Midfielder: 'bg-purple-100 text-purple-800',
  Striker:    'bg-rose-100 text-rose-800',
}

export default function TeamDetailPage() {
  const { id }   = useParams()
  const { data: session } = useSession()
  const role     = (session?.user as any)?.role
  const canEdit  = ['admin', 'coach'].includes(role)

  const [team, setTeam]           = useState<any>(null)
  const [allPlayers, setAllPlayers] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState<'roster'|'add'>('roster')

  const fetchAll = async () => {
    const [teamRes, playersRes] = await Promise.all([
      fetch(`/api/teams/${id}`).then(r => r.json()),
      fetch('/api/players').then(r => r.json()),
    ])
    setTeam(teamRes)
    setAllPlayers(playersRes.players || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [id])

  const addPlayer = async (playerId: string) => {
    const res = await fetch(`/api/teams/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addPlayer: playerId }),
    })
    if (res.ok) { toast.success('Player added to squad'); fetchAll() }
    else toast.error('Failed to add player')
  }

  const removePlayer = async (playerId: string, name: string) => {
    if (!confirm(`Remove ${name} from this squad?`)) return
    const res = await fetch(`/api/teams/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removePlayer: playerId }),
    })
    if (res.ok) { toast.success('Player removed from squad'); fetchAll() }
    else toast.error('Failed to remove player')
  }

  if (loading || !team) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const rosterIds      = (team.players || []).map((p: any) => p._id.toString())
  const availablePlayers = allPlayers.filter(p =>
    !rosterIds.includes(p._id.toString()) &&
    (search === '' || p.fullName.toLowerCase().includes(search.toLowerCase()) || p.position.toLowerCase().includes(search.toLowerCase()))
  )

  const positionGroups: Record<string, any[]> = { Goalkeeper: [], Defender: [], Midfielder: [], Striker: [] }
  ;(team.players || []).forEach((p: any) => { if (positionGroups[p.position]) positionGroups[p.position].push(p) })

  return (
    <div className="animate-fade-in">
      <Header title={team.name} subtitle={`${team.type} · Season ${team.season}`} />
      <div className="p-8">
        <Link href="/teams" className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-700 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Squads
        </Link>

        {/* Squad summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Players', value: team.players?.length || 0 },
            { label: 'Goalkeepers',   value: positionGroups.Goalkeeper.length },
            { label: 'Defenders',     value: positionGroups.Defender.length },
            { label: 'Midfielders + Strikers', value: positionGroups.Midfielder.length + positionGroups.Striker.length },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <p className="text-2xl font-black text-purple-700">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Staff */}
        {(team.coaches?.length > 0 || team.physios?.length > 0 || team.supportStaff?.length > 0) && (
          <div className="card mb-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Shield size={15} className="text-purple-600" /> Staff</h3>
            <div className="flex flex-wrap gap-2">
              {team.coaches?.map((c: any)      => <span key={c._id} className="badge bg-blue-100 text-blue-800">👔 {c.name} (Coach)</span>)}
              {team.physios?.map((p: any)      => <span key={p._id} className="badge bg-green-100 text-green-800">🏥 {p.name} (Physio)</span>)}
              {team.supportStaff?.map((s: any) => <span key={s._id} className="badge bg-amber-100 text-amber-800">🤝 {s.name} (Support)</span>)}
            </div>
          </div>
        )}

        {/* Tabs */}
        {canEdit && (
          <div className="flex gap-2 mb-5">
            <button onClick={() => setTab('roster')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'roster' ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
              <span className="flex items-center gap-2"><Users size={14} /> Current Roster ({team.players?.length || 0})</span>
            </button>
            <button onClick={() => setTab('add')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'add' ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
              <span className="flex items-center gap-2"><UserPlus size={14} /> Add Players</span>
            </button>
          </div>
        )}

        {/* Roster by position */}
        {tab === 'roster' && (
          <div className="space-y-4">
            {Object.entries(positionGroups).map(([pos, players]) => (
              players.length > 0 && (
                <div key={pos} className="card">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className={`badge ${posColors[pos]}`}>{pos}s</span>
                    <span className="text-slate-400 text-sm">({players.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {players.map((p: any) => (
                      <div key={p._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          {p.profileImage
                            ? <img src={p.profileImage} className="w-full h-full rounded-full object-cover" alt={p.fullName} />
                            : <span className="text-purple-700 font-bold text-sm">{p.fullName?.charAt(0)}</span>
                          }
                        </div>
                        <div className="w-8 h-8 bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-black">#{p.jerseyNumber}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm">{p.fullName}</p>
                          <p className="text-xs text-slate-400">{p.studentNumber}</p>
                        </div>
                        <span className={`badge badge-${(p.fitnessStatus || 'fit').toLowerCase()}`}>{p.fitnessStatus}</span>
                        <Link href={`/players/${p._id}`} className="text-xs text-purple-600 hover:underline">Profile</Link>
                        {canEdit && (
                          <button onClick={() => removePlayer(p._id, p.fullName)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
            {team.players?.length === 0 && (
              <div className="card text-center py-10">
                <Users size={36} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No players in this squad yet</p>
                {canEdit && <button onClick={() => setTab('add')} className="btn-primary mx-auto mt-3" style={{ background: '#4B0082' }}><UserPlus size={15} /> Add Players</button>}
              </div>
            )}
          </div>
        )}

        {/* Add players panel */}
        {tab === 'add' && canEdit && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-semibold text-slate-900">Available Players</h3>
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search players..." className="input-field pl-8 py-2 text-sm" />
              </div>
            </div>
            {availablePlayers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">All players are already in this squad, or no results match your search.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availablePlayers.map(p => (
                  <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-700 font-bold text-sm">{p.fullName?.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{p.fullName}</p>
                      <p className="text-xs text-slate-400">#{p.jerseyNumber} · {p.position}</p>
                    </div>
                    <span className={`badge ${posColors[p.position]}`}>{p.position}</span>
                    <span className={`badge badge-${(p.fitnessStatus || 'fit').toLowerCase()}`}>{p.fitnessStatus}</span>
                    <button onClick={() => addPlayer(p._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900 text-white text-xs font-medium rounded-lg hover:bg-purple-800 transition-colors">
                      <UserPlus size={12} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
