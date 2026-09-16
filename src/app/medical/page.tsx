'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { Plus, HeartPulse, AlertTriangle, CheckCircle, Clock, X, Loader2, Edit, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useFetch } from '@/lib/use-fetch'

const severityColors: Record<string, string> = {
  Minor:    'bg-amber-100 text-amber-800',
  Moderate: 'bg-orange-100 text-orange-800',
  Severe:   'bg-red-100 text-red-800',
}
const recoveryColors: Record<string, string> = {
  Active:     'bg-red-100 text-red-800',
  Recovering: 'bg-amber-100 text-amber-800',
  Cleared:    'bg-emerald-100 text-emerald-800',
}

function AddInjuryModal({ players, onClose, onSuccess }: {
  players: any[]; onClose: () => void; onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    const res = await fetch('/api/medical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setLoading(false)
    if (res.ok) { toast.success('Injury record added'); onSuccess() }
    else toast.error('Failed to add record')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse size={18} className="text-red-500" /> Record Injury
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Player *</label>
              <select {...register('player', { required: true })} className="input-field">
                <option value="">Select player</option>
                {players.map(p => (
                  <option key={p._id} value={p._id}>{p.fullName} — #{p.jerseyNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Injury Type *</label>
              <input {...register('injuryType', { required: true })} placeholder="e.g. Hamstring strain" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Body Part</label>
              <input {...register('bodyPart')} placeholder="e.g. Left hamstring" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Severity</label>
              <select {...register('severity')} className="input-field">
                <option>Minor</option><option>Moderate</option><option>Severe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Date of Injury *</label>
              <input {...register('dateOfInjury', { required: true })} type="date" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Recovery Status</label>
              <select {...register('recoveryStatus')} className="input-field">
                <option>Active</option><option>Recovering</option><option>Cleared</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Est. Recovery Date</label>
              <input {...register('estimatedRecoveryDate')} type="date" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Description *</label>
              <textarea {...register('description', { required: true })} rows={2} className="input-field resize-none" placeholder="Describe the injury..." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">Medical Notes</label>
              <textarea {...register('notes')} rows={2} className="input-field resize-none" placeholder="Treatment notes..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Saving...</> : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UpdateStatusModal({ record, onClose, onSuccess }: {
  record: any; onClose: () => void; onSuccess: () => void
}) {
  const [status,  setStatus]  = useState(record.recoveryStatus)
  const [cleared, setCleared] = useState(record.clearedForPlay)
  const [notes,   setNotes]   = useState(record.notes || '')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    const res = await fetch(`/api/medical/${record._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recoveryStatus: status, clearedForPlay: cleared, notes }),
    })
    setLoading(false)
    if (res.ok) { toast.success('Record updated!'); onSuccess() }
    else toast.error('Failed to update')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-slate-900">Update Recovery Status</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 font-medium">{record.player?.fullName} — {record.injuryType}</p>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Recovery Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
              <option>Active</option><option>Recovering</option><option>Cleared</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="cleared" checked={cleared}
              onChange={e => setCleared(e.target.checked)} className="w-4 h-4 accent-purple-700" />
            <label htmlFor="cleared" className="text-sm text-slate-700">Cleared for play</label>
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Update Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-field resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={save} disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Saving...</> : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MedicalPage() {
  const { data: session } = useSession()
  const role    = (session?.user as any)?.role
  const canEdit = ['admin', 'physio'].includes(role)

  const [showAdd,    setShowAdd]    = useState(false)
  const [editRecord, setEditRecord] = useState<any>(null)
  const [filter,     setFilter]     = useState('')

  // ── useFetch replaces useState + fetchAll + useEffect ────────────────────
  const {
    data: recordsData,
    loading,
    refetch: refetchRecords,
  } = useFetch<any[]>('/api/medical', { ttlMs: 20_000 })
  const records = recordsData ?? []

  // Players list for the add-injury dropdown — long cache, changes rarely
  const { data: playersData } = useFetch<{ players: any[] }>('/api/players?limit=200', { ttlMs: 60_000 })
  const players = playersData?.players ?? []

  const deleteRecord = async (id: string) => {
    if (!confirm('Delete this medical record?')) return
    const res = await fetch(`/api/medical/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Record deleted'); refetchRecords() }
    else toast.error('Failed to delete')
  }

  const active     = records.filter((r: any) => r.recoveryStatus === 'Active')
  const recovering = records.filter((r: any) => r.recoveryStatus === 'Recovering')
  const cleared    = records.filter((r: any) => r.recoveryStatus === 'Cleared')
  const displayed  = filter ? records.filter((r: any) => r.recoveryStatus === filter) : records

  return (
    <div className="animate-fade-in">
      <Header title="Medical & Injuries" subtitle="Track player health, injuries and recovery" />
      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card border-l-4 border-red-400">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-500" />
              <div><p className="text-2xl font-black text-red-600">{active.length}</p><p className="text-xs text-slate-500">Active Injuries</p></div>
            </div>
          </div>
          <div className="card border-l-4 border-amber-400">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-amber-500" />
              <div><p className="text-2xl font-black text-amber-600">{recovering.length}</p><p className="text-xs text-slate-500">Recovering</p></div>
            </div>
          </div>
          <div className="card border-l-4 border-emerald-400">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-emerald-500" />
              <div><p className="text-2xl font-black text-emerald-600">{cleared.length}</p><p className="text-xs text-slate-500">Cleared</p></div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          {['', 'Active', 'Recovering', 'Cleared'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
              {f || 'All'}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => window.open('/api/export?type=medical', '_blank')} className="btn-secondary text-sm">
              ⬇ Export CSV
            </button>
            {canEdit && (
              <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ background: '#4B0082' }}>
                <Plus size={16} /> Record Injury
              </button>
            )}
          </div>
        </div>

        {/* Records */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="card text-center py-12">
            <HeartPulse size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No injury records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((r: any) => (
              <div key={r._id} className="card hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-700 font-bold text-sm">{r.player?.fullName?.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{r.player?.fullName}</h3>
                        <p className="text-xs text-slate-400">{r.player?.position} · #{r.player?.jerseyNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${severityColors[r.severity]}`}>{r.severity}</span>
                        <span className={`badge ${recoveryColors[r.recoveryStatus]}`}>{r.recoveryStatus}</span>
                        {r.clearedForPlay && <span className="badge bg-emerald-100 text-emerald-700">✓ Cleared</span>}
                        {canEdit && (
                          <div className="flex gap-1 ml-1">
                            <button onClick={() => setEditRecord(r)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                              <Edit size={13} />
                            </button>
                            <button onClick={() => deleteRecord(r._id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div><p className="text-slate-400">Injury</p><p className="font-medium text-slate-700">{r.injuryType}</p></div>
                      <div><p className="text-slate-400">Body Part</p><p className="font-medium text-slate-700">{r.bodyPart || '—'}</p></div>
                      <div><p className="text-slate-400">Date</p><p className="font-medium text-slate-700">{new Date(r.dateOfInjury).toLocaleDateString('en-ZA')}</p></div>
                      <div><p className="text-slate-400">Est. Recovery</p><p className="font-medium text-slate-700">{r.estimatedRecoveryDate ? new Date(r.estimatedRecoveryDate).toLocaleDateString('en-ZA') : '—'}</p></div>
                    </div>
                    {r.description && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2">{r.description}</p>}
                    {r.notes && <p className="text-xs text-blue-600 mt-1 italic">📋 {r.notes}</p>}
                    <p className="text-xs text-slate-400 mt-2">
                      Recorded by {r.recordedBy?.name} · {new Date(r.createdAt).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddInjuryModal
          players={players}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); refetchRecords() }}
        />
      )}
      {editRecord && (
        <UpdateStatusModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSuccess={() => { setEditRecord(null); refetchRecords() }}
        />
      )}
    </div>
  )
}
