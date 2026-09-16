'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { Plus, ClipboardList, Users, Clock, X, Loader2, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useFetch } from '@/lib/use-fetch'

const typeColors: Record<string, string> = {
  Technical:  'bg-blue-100 text-blue-800',
  Tactical:   'bg-purple-100 text-purple-800',
  Physical:   'bg-orange-100 text-orange-800',
  Recovery:   'bg-emerald-100 text-emerald-800',
  'Match Prep': 'bg-amber-100 text-amber-800',
}

function AddSessionModal({ teams, onClose, onSuccess }: {
  teams: any[]; onClose: () => void; onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setLoading(false)
    if (res.ok) { toast.success('Session created!'); onSuccess() }
    else toast.error('Failed to create session')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList size={18} className="text-purple-600" /> Create Training Session
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Session Title *</label>
              <input {...register('title', { required: true })} placeholder="e.g. Tuesday Tactical Drill" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Date *</label>
              <input {...register('date', { required: true })} type="datetime-local" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Duration (mins)</label>
              <input {...register('duration')} type="number" defaultValue={90} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Type</label>
              <select {...register('type')} className="input-field">
                <option>Technical</option>
                <option>Tactical</option>
                <option>Physical</option>
                <option>Recovery</option>
                <option>Match Prep</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Squad *</label>
              <select {...register('squad', { required: true })} className="input-field">
                <option value="">Select squad</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Location</label>
              <input {...register('location')} placeholder="e.g. NWU Main Pitch" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Notes</label>
              <textarea {...register('notes')} rows={2} className="input-field resize-none" placeholder="Session objectives..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Creating...</> : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TrainingPage() {
  const { data: session } = useSession()
  const role    = (session?.user as any)?.role
  const canEdit = ['admin', 'coach'].includes(role)

  const [showAdd,  setShowAdd]  = useState(false)
  const [typeFilter, setTypeFilter] = useState('')

  // ── useFetch replaces useState + fetchAll + useEffect ────────────────────
  const {
    data: sessionsData,
    loading,
    refetch: refetchSessions,
  } = useFetch<any[]>('/api/attendance', { ttlMs: 20_000 })
  const sessions = sessionsData ?? []

  const { data: teamsData } = useFetch<any>('/api/teams', { ttlMs: 300_000 })
  const teams = teamsData?.teams ?? (Array.isArray(teamsData) ? teamsData : [])

  const displayed = typeFilter
    ? sessions.filter((s: any) => s.type === typeFilter)
    : sessions

  const totalSessions  = sessions.length
  const avgAttendance  = sessions.length
    ? Math.round(
        sessions.reduce((acc: number, s: any) => {
          const present = (s.attendance ?? []).filter((a: any) => a.status === 'Present').length
          const total   = s.attendance?.length || 1
          return acc + (present / total) * 100
        }, 0) / sessions.length
      )
    : 0

  return (
    <div className="animate-fade-in">
      <Header title="Training" subtitle="Sessions, attendance & drills" />
      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-black text-purple-700">{totalSessions}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Sessions</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-black text-emerald-600">{avgAttendance}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg Attendance</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-black text-blue-600">
              {sessions.filter((s: any) => new Date(s.date) > new Date()).length}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Upcoming</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          {['', 'Technical', 'Tactical', 'Physical', 'Recovery', 'Match Prep'].map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${typeFilter === f ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
              {f || 'All'}
            </button>
          ))}
          <div className="ml-auto">
            {canEdit && (
              <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ background: '#4B0082' }}>
                <Plus size={16} /> Add Session
              </button>
            )}
          </div>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="card text-center py-12">
            <ClipboardList size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No training sessions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((s: any) => {
              const present = (s.attendance ?? []).filter((a: any) => a.status === 'Present').length
              const absent  = (s.attendance ?? []).filter((a: any) => a.status === 'Absent').length
              const total   = s.attendance?.length ?? 0
              const rate    = total > 0 ? Math.round((present / total) * 100) : 0

              return (
                <div key={s._id} className="card hover:shadow-md transition-all flex items-center gap-5">
                  {/* Date block */}
                  <div className="text-center w-14 flex-shrink-0">
                    <p className="text-2xl font-black text-purple-900">{new Date(s.date).getDate()}</p>
                    <p className="text-xs text-slate-400 uppercase">{new Date(s.date).toLocaleString('default', { month: 'short' })}</p>
                    <p className="text-xs text-slate-400">{new Date(s.date).getFullYear()}</p>
                  </div>

                  <div className="w-px h-12 bg-slate-100" />

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${typeColors[s.type] || 'bg-slate-100 text-slate-700'}`}>{s.type}</span>
                      {s.squad?.name && <span className="text-xs text-slate-400">{s.squad.name}</span>}
                    </div>
                    <h3 className="font-semibold text-slate-900">{s.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={11} />{s.duration} mins</span>
                      {s.location && <span>{s.location}</span>}
                    </div>
                  </div>

                  {/* Attendance summary */}
                  {total > 0 && (
                    <div className="text-center flex-shrink-0">
                      <p className="text-lg font-black text-slate-900">{rate}%</p>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        <span className="flex items-center gap-0.5 text-emerald-600">
                          <CheckCircle size={10} />{present}
                        </span>
                        <span className="flex items-center gap-0.5 text-red-500">
                          <XCircle size={10} />{absent}
                        </span>
                        <span className="text-slate-400 flex items-center gap-0.5">
                          <Users size={10} />{total}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link href={`/training/${s._id}`}
                    className="flex items-center gap-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap">
                    View <ChevronRight size={12} />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <AddSessionModal
          teams={teams}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); refetchSessions() }}
        />
      )}
    </div>
  )
}
