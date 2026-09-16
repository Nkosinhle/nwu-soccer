'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { Shield, Users, ChevronRight, Plus, X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useFetch } from '@/lib/use-fetch'

const typeColors: Record<string, string> = {
  'First Team': 'from-purple-900 to-purple-700',
  'Reserves':   'from-blue-900 to-blue-700',
  'U21':        'from-emerald-900 to-emerald-700',
}
const typeLabels: Record<string, string> = {
  'First Team': 'NWU First XI',
  'Reserves':   'NWU Regional Team',
  'U21':        'NWU Junior Team',
}

function AddTeamModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setLoading(false)
    if (res.ok) { toast.success('Squad created!'); onSuccess() }
    else toast.error('Failed to create squad')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Shield size={18} className="text-purple-600" /> Create Squad
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Squad Name *</label>
            <input {...register('name', { required: true })} placeholder="e.g. NWU First XI" className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Type</label>
            <select {...register('type')} className="input-field">
              <option>First Team</option>
              <option>Reserves</option>
              <option>U21</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Season</label>
            <input {...register('season')} defaultValue={new Date().getFullYear().toString()} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Description</label>
            <textarea {...register('description')} rows={2} className="input-field resize-none" placeholder="Optional description..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Creating...</> : 'Create Squad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TeamsPage() {
  const { data: session } = useSession()
  const role    = (session?.user as any)?.role
  const canEdit = ['admin', 'coach'].includes(role)

  const [showAdd, setShowAdd] = useState(false)

  // ── useFetch replaces useState + fetchAll + useEffect ────────────────────
  // Teams change very rarely — 5-minute cache
  const {
    data: teamsData,
    loading,
    refetch: refetchTeams,
  } = useFetch<any>('/api/teams', { ttlMs: 300_000 })

  const teams: any[] = teamsData?.teams ?? (Array.isArray(teamsData) ? teamsData : [])

  return (
    <div className="animate-fade-in">
      <Header title="Squads" subtitle="Manage NWU Soccer Institute squads" />
      <div className="p-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 text-sm">{teams.length} squad{teams.length !== 1 ? 's' : ''}</p>
          {canEdit && (
            <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ background: '#4B0082' }}>
              <Plus size={16} /> Create Squad
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <div className="card text-center py-16">
            <Shield size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No squads yet</p>
            {canEdit && (
              <button onClick={() => setShowAdd(true)} className="mt-3 text-sm text-purple-600 hover:underline">
                Create your first squad →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((team: any) => {
              const gradient = typeColors[team.type] || 'from-slate-800 to-slate-600'
              const label    = typeLabels[team.type]  || team.name

              return (
                <Link key={team._id} href={`/teams/${team._id}`}
                  className="card hover:shadow-lg transition-all group overflow-hidden p-0">
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-r ${gradient} p-5`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Shield size={18} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-white font-black text-base leading-tight">{label}</h2>
                        <p className="text-white/70 text-xs">{team.type} · {team.season}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Users size={14} className="text-purple-500" />
                        <span className="font-semibold">{team.players?.length ?? 0}</span>
                        <span className="text-slate-400 text-xs">players</span>
                      </div>
                      {team.coaches?.length > 0 && (
                        <div className="text-xs text-slate-400">
                          {team.coaches.length} coach{team.coaches.length !== 1 ? 'es' : ''}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-purple-500 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {team.description && (
                    <p className="px-4 pb-4 text-xs text-slate-400 truncate">{team.description}</p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <AddTeamModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); refetchTeams() }}
        />
      )}
    </div>
  )
}
