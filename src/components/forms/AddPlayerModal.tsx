'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Loader2, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { onClose: () => void; onSuccess: () => void }

export default function AddPlayerModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [teams, setTeams]     = useState<any[]>([])
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(setTeams)
  }, [])

  const onSubmit = async (data: any) => {
    setLoading(true)
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, age: parseInt(data.age), jerseyNumber: parseInt(data.jerseyNumber) }),
    })
    setLoading(false)
    if (res.ok) { toast.success('Player registered!'); onSuccess() }
    else { const err = await res.json(); toast.error(err.error || 'Failed to add player') }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <User size={16} className="text-purple-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Register Player</h2>
              <p className="text-xs text-slate-500">Add a new player to the system</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Personal Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Full Name *</label>
                <input {...register('fullName', { required: true })} placeholder="e.g. Lethabo Mokoena" className="input-field" />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">Full name is required</p>}
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Student Number *</label>
                <input {...register('studentNumber', { required: true })} placeholder="e.g. 30123456" className="input-field" />
                {errors.studentNumber && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Date of Birth *</label>
                <input {...register('dateOfBirth', { required: true })} type="date" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Age *</label>
                <input {...register('age', { required: true })} type="number" min="15" max="35" placeholder="e.g. 20" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Gender</label>
                <select {...register('gender')} className="input-field">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Nationality</label>
                <input {...register('nationality')} defaultValue="South African" className="input-field" />
              </div>
            </div>
          </div>

          {/* Soccer Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Soccer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Position *</label>
                <select {...register('position', { required: true })} className="input-field">
                  <option value="">Select position</option>
                  <option>Goalkeeper</option>
                  <option>Defender</option>
                  <option>Midfielder</option>
                  <option>Striker</option>
                </select>
                {errors.position && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Jersey Number *</label>
                <input {...register('jerseyNumber', { required: true })} type="number" min="1" max="99" placeholder="1–99" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Squad</label>
                <select {...register('squad')} className="input-field">
                  <option value="">Unassigned</option>
                  {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Email *</label>
                <input {...register('contactEmail', { required: true })} type="email" placeholder="student@nwu.ac.za" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Phone *</label>
                <input {...register('contactPhone', { required: true })} placeholder="+27 ..." className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Emergency Contact Name</label>
                <input {...register('emergencyContact.name')} placeholder="Parent/Guardian name" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Emergency Contact Phone</label>
                <input {...register('emergencyContact.phone')} placeholder="+27 ..." className="input-field" />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-slate-700 mb-1">Bio / Notes</label>
            <textarea {...register('bio')} rows={3} placeholder="Optional notes about the player..." className="input-field resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Registering...</> : 'Register Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
