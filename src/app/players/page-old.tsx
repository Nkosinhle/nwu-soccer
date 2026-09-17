'use client'
import { useCallback } from 'react'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { Search, Plus, User, Edit, Trash2, ChevronRight, Shield } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AddPlayerModal from '@/components/forms/AddPlayerModal'
import { useSession } from 'next-auth/react'
import { useFetch } from '@/lib/use-fetch'

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Striker']
const STATUSES  = ['Fit', 'Injured', 'Recovering', 'Suspended']

const posColors: Record<string, string> = {
  Goalkeeper: 'bg-amber-100 text-amber-800',
  Defender:   'bg-blue-100 text-blue-800',
  Midfielder: 'bg-purple-100 text-purple-800',
  Striker:    'bg-rose-100 text-rose-800',
}

const squadOrder  = ['First Team', 'Regional', 'Junior', 'NFD']
const squadLabels: Record<string, string> = {
  'First Team': 'NWU First XI',
  'Regional':   'NWU Regional Team',
  'Junior':     'NWU Junior Team',
  'NFD':          'NWU NFD Team',
}
const squadColors: Record<string, string> = {
  'First Team': 'from-purple-900 to-purple-700',
  'Regional':   'from-blue-900 to-blue-700',
  'Junior':     'from-emerald-900 to-emerald-700',
}

function PlayerCard({ p, canEdit, onDelete }: {
  p: any; canEdit: boolean; onDelete: (id: string, name: string) => void
}) {
  const [imgError, setImgError] = useState(false)
  return (
    <div className="card hover:shadow-md transition-all group relative flex flex-col">
      <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-purple-900 flex items-center justify-center">
        <span className="text-white text-xs font-black">#{p.jerseyNumber}</span>
      </div>
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden flex-shrink-0">
        {p.profileImage && !imgError ? (
          <img src={p.profileImage} alt={p.fullName} className="w-full h-full object-cover rounded-full"
            onError={() => setImgError(true)} />
        ) : (
          <span className="text-white text-xl font-bold">{p.fullName.charAt(0)}</span>
        )}
      </div>
      <h3 className="font-semibold text-slate-900 text-center text-sm mb-0.5 leading-tight">{p.fullName}</h3>
      {p.nickname && <p className="text-purple-600 text-xs text-center mb-1">"{p.nickname}"</p>}
      <p className="text-slate-400 text-xs text-center mb-3">{p.studentNumber}</p>
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className={`badge ${posColors[p.position] || 'bg-slate-100 text-slate-700'}`}>{p.position}</span>
        <span className={`badge badge-${(p.fitnessStatus || 'fit').toLowerCase()}`}>{p.fitnessStatus}</span>
      </div>
      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link href={`/players/${p._id}`} className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
          View <ChevronRight size={11} />
        </Link>
        {canEdit && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/players/${p._id}/edit`}
              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
              <Edit size={12} />
            </Link>
            <button onClick={() => onDelete(p._id, p.fullName)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayersPage() {
  const { data: session } = useSession()
  const role    = (session?.user as any)?.role
  const canEdit = ['admin', 'coach'].includes(role)

  const [search,      setSearch]      = useState('')
  const [position,    setPosition]    = useState('')
  const [status,      setStatus]      = useState('')
  const [showAdd,     setShowAdd]     = useState(false)
  const [activeSquad, setActiveSquad] = useState<string>('all')

  // ── useFetch replaces useState + useEffect + fetchAll ────────────────────
  // Players are cached for 20s — navigating away and back is instant.
  // refetchPlayers() clears the cache and re-fetches (used after add/delete).
  const {
    data: playersData,
    loading: playersLoading,
    refetch: refetchPlayers,
  } = useFetch<{ players: any[] }>('/api/players?limit=200', { ttlMs: 20_000 })

  const {
    data: teamsData,
    loading: teamsLoading,
  } = useFetch<any[]>('/api/teams', { ttlMs: 300_000 }) // teams change rarely — 5 min cache

  const allPlayers = playersData?.players ?? []
  // /api/teams returns { teams: [...] } from the optimised route
  const teams      = (teamsData as any)?.teams ?? (Array.isArray(teamsData) ? teamsData : [])
  const loading    = playersLoading || teamsLoading

  const deletePlayer = useCallback(async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    const res = await fetch(`/api/players/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Player deleted'); refetchPlayers() }
    else toast.error('Failed to delete player')
  }, [refetchPlayers])

  // Client-side filtering — no extra API call needed
  const filtered = allPlayers.filter(p => {
    const matchSearch   = !search   || p.fullName.toLowerCase().includes(search.toLowerCase()) || (p.nickname && p.nickname.toLowerCase().includes(search.toLowerCase()))
    const matchPosition = !position || p.position === position
    const matchStatus   = !status   || p.fitnessStatus === status
    return matchSearch && matchPosition && matchStatus
  })

  // Group by squad type
  const grouped: Record<string, any[]> = { 'First Team': [], 'Regional': [], 'Junior': [], 'Unassigned': [] }
  filtered.forEach(p => {
    const squad = teams.find((t: any) => t._id === (p.squad?._id || p.squad))
    const type  = squad?.type || 'Unassigned'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(p)
  })

  const totalBySquad: Record<string, number> = {}
  squadOrder.forEach(t => { totalBySquad[t] = (grouped[t] || []).length })

  const displaySquads = activeSquad === 'all' ? squadOrder : [activeSquad]

  return (
    <div className="animate-fade-in">
      <Header title="Players" subtitle={`${filtered.length} players across all squads`} />
      <div className="p-8">

        {/* Squad tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveSquad('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeSquad === 'all' ? 'bg-purple-900 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
            <Shield size={14} /> All Squads
            <span className="text-xs opacity-70">({filtered.length})</span>
          </button>
          {squadOrder.map(type => (
            <button key={type} onClick={() => setActiveSquad(type)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeSquad === type ? 'bg-purple-900 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
              {squadLabels[type] || type}
              <span className="text-xs opacity-70">({totalBySquad[type] || 0})</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or nickname..."
              className="input-field pl-9" />
          </div>
          <select value={position} onChange={e => setPosition(e.target.value)} className="input-field w-full sm:w-44">
            <option value="">All positions</option>
            {POSITIONS.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input-field w-full sm:w-44">
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {canEdit && (
            <button onClick={() => setShowAdd(true)} className="btn-primary whitespace-nowrap" style={{ background: '#4B0082' }}>
              <Plus size={16} /> Add Player
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-10">
            {displaySquads.map(squadType => {
              const squadPlayers = grouped[squadType] || []
              if (squadPlayers.length === 0 && activeSquad !== 'all') return (
                <div key={squadType} className="card text-center py-12">
                  <User size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No players found matching your filters</p>
                </div>
              )
              if (squadPlayers.length === 0) return null
              const squad = teams.find((t: any) => t.type === squadType)
              return (
                <div key={squadType}>
                  <div className={`bg-gradient-to-r ${squadColors[squadType] || 'from-slate-800 to-slate-600'} rounded-2xl p-5 mb-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Shield size={18} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-white font-black text-lg">{squad?.name || squadLabels[squadType]}</h2>
                        <p className="text-white/70 text-sm">{squadPlayers.length} players · Season 2025</p>
                      </div>
                    </div>
                    {squad && (
                      <Link href={`/teams/${squad._id}`}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1">
                        Manage <ChevronRight size={14} />
                      </Link>
                    )}
                  </div>

                  {['Goalkeeper', 'Defender', 'Midfielder', 'Striker'].map(pos => {
                    const posPlayers = squadPlayers.filter(p => p.position === pos)
                    if (posPlayers.length === 0) return null
                    return (
                      <div key={pos} className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`badge ${posColors[pos]}`}>{pos}s</span>
                          <span className="text-slate-400 text-xs">({posPlayers.length})</span>
                          <div className="flex-1 h-px bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {posPlayers.map(p => (
                            <PlayerCard key={p._id} p={p} canEdit={canEdit} onDelete={deletePlayer} />
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {squadPlayers.filter(p => !['Goalkeeper','Defender','Midfielder','Striker'].includes(p.position)).length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="badge bg-slate-100 text-slate-700">Other</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {squadPlayers.filter(p => !['Goalkeeper','Defender','Midfielder','Striker'].includes(p.position)).map(p => (
                          <PlayerCard key={p._id} p={p} canEdit={canEdit} onDelete={deletePlayer} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="card text-center py-16">
                <User size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No players found</p>
                <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>
      {showAdd && (
        <AddPlayerModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); refetchPlayers() }}
        />
      )}
    </div>
  )
}
