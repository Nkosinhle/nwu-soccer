'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { Settings, Users, Plus, Shield, X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const roleColors: Record<string, string> = {
  admin:         'bg-purple-100 text-purple-800',
  coach:         'bg-blue-100 text-blue-800',
  physio:        'bg-emerald-100 text-emerald-800',
  support_staff: 'bg-amber-100 text-amber-800',
  player:        'bg-rose-100 text-rose-800',
}
const roleLabels: Record<string, string> = {
  admin: 'Administrator', coach: 'Coach', physio: 'Physiotherapist',
  support_staff: 'Support Staff', player: 'Player',
}

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    setLoading(false)
    if (res.ok) { toast.success('User created!'); onSuccess() }
    else { const err = await res.json(); toast.error(err.error || 'Failed to create user') }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-slate-900">Create User Account</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Full Name *</label>
            <input {...register('name', { required: true })} placeholder="e.g. Coach Dlamini" className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Email *</label>
            <input {...register('email', { required: true })} type="email" placeholder="user@nwu.ac.za" className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Role *</label>
            <select {...register('role', { required: true })} className="input-field">
              <option value="">Select role</option>
              <option value="coach">Coach</option>
              <option value="physio">Physiotherapist</option>
              <option value="support_staff">Support Staff</option>
              <option value="player">Player</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Password *</label>
            <input {...register('password', { required: true, minLength: { value: 8, message: 'Min 8 characters' } })}
              type="password" placeholder="••••••••" className="input-field" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center" style={{ background: '#4B0082' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Creating...</> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [users, setUsers]     = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    if (res.ok) { const data = await res.json(); setUsers(data) }
  }
  useEffect(() => { fetchUsers() }, [])

  return (
    <div className="animate-fade-in">
      <Header title="Settings" subtitle="System configuration and user management" />
      <div className="p-8">
        {/* System info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card border-l-4 border-purple-600">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-purple-600" />
              <div><p className="font-semibold text-slate-900">NWU Soccer Institute</p><p className="text-xs text-slate-500">Player Management System v1.0</p></div>
            </div>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-black text-purple-700">{users.length}</p>
            <p className="text-xs text-slate-500">System Users</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-black text-blue-600">2025</p>
            <p className="text-xs text-slate-500">Active Season</p>
          </div>
        </div>

        {/* Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-purple-600" /> User Accounts
            </h2>
            <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ background: '#4B0082' }}>
              <Plus size={15} /> Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['User', 'Email', 'Role', 'Joined'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u._id} className="table-row">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${roleColors[u.role] || 'bg-slate-100 text-slate-600'}`}>
                          {u.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`badge ${roleColors[u.role] || 'bg-slate-100 text-slate-700'}`}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-ZA') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RBAC info card */}
        <div className="card mt-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield size={16} className="text-purple-600" /> Role Permissions Overview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-2 text-slate-500">Permission</th>
                  {['Admin','Coach','Physio','Support','Player'].map(r => (
                    <th key={r} className="text-center py-2 px-2 text-slate-500">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { perm: 'Full system access',    vals: ['✅','—','—','—','—'] },
                  { perm: 'Manage players',         vals: ['✅','✅','👁','👁','👁 own'] },
                  { perm: 'Manage squads',          vals: ['✅','✅','—','👁','👁'] },
                  { perm: 'Record match results',   vals: ['✅','✅','—','—','👁'] },
                  { perm: 'Medical records',        vals: ['✅','👁','✅','—','👁 own'] },
                  { perm: 'Training & attendance',  vals: ['✅','✅','👁','✅','👁'] },
                  { perm: 'View performance',       vals: ['✅','✅','—','—','👁 own'] },
                  { perm: 'User management',        vals: ['✅','—','—','—','—'] },
                ].map(row => (
                  <tr key={row.perm} className="table-row">
                    <td className="py-2 px-2 font-medium text-slate-700">{row.perm}</td>
                    {row.vals.map((v, i) => (
                      <td key={i} className="py-2 px-2 text-center">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetchUsers() }} />}
    </div>
  )
}
