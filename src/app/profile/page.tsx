'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import { User, Lock, Save, Loader2, Shield, Mail, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'

const roleLabels: Record<string, string> = {
  admin: 'Administrator', coach: 'Coach', physio: 'Physiotherapist',
  support_staff: 'Support Staff', player: 'Player',
}
const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800', coach: 'bg-blue-100 text-blue-800',
  physio: 'bg-emerald-100 text-emerald-800', support_staff: 'bg-amber-100 text-amber-800',
  player: 'bg-rose-100 text-rose-800',
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const role = (session?.user as any)?.role || ''

  const [profile, setProfile]   = useState<any>(null)
  const [tab, setTab]           = useState<'info'|'password'>('info')
  const [saving, setSaving]     = useState(false)

  const infoForm = useForm()
  const passForm = useForm()

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      setProfile(data)
      infoForm.reset({ name: data.name, email: data.email })
    })
  }, [])

  const saveInfo = async (data: any) => {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, email: data.email }),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setProfile(updated)
      await update({ name: updated.name, email: updated.email })
      toast.success('Profile updated!')
    } else toast.error('Failed to update profile')
  }

  const savePassword = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Password changed successfully!')
      passForm.reset()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to change password')
    }
  }

  if (!profile) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-in">
      <Header title="My Profile" subtitle="Manage your account settings" />
      <div className="p-8 max-w-2xl">
        {/* Profile header */}
        <div className="card mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white text-2xl font-black">{profile.name?.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-900">{profile.name}</h2>
            <p className="text-slate-400 text-sm">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${roleColors[role] || 'bg-slate-100 text-slate-700'}`}>
                <Shield size={10} className="mr-1" />
                {roleLabels[role] || role}
              </span>
              <span className="text-xs text-slate-400">
                Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setTab('info')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'info' ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
            <Edit3 size={14} /> Account Info
          </button>
          <button onClick={() => setTab('password')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'password' ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
            <Lock size={14} /> Change Password
          </button>
        </div>

        {tab === 'info' && (
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <User size={16} className="text-purple-600" /> Personal Information
            </h3>
            <form onSubmit={infoForm.handleSubmit(saveInfo)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input {...infoForm.register('name', { required: true })} className="input-field" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input {...infoForm.register('email', { required: true })} type="email" className="input-field pl-9" />
                </div>
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Role</label>
                <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${roleColors[role] || 'bg-slate-100 text-slate-700'}`}>
                  <Shield size={13} /> {roleLabels[role] || role} — cannot be changed here
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={saving}
                  className="btn-primary" style={{ background: '#4B0082' }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Save size={14} />Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'password' && (
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <Lock size={16} className="text-purple-600" /> Change Password
            </h3>
            <form onSubmit={passForm.handleSubmit(savePassword)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                <input {...passForm.register('currentPassword', { required: true })}
                  type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <input {...passForm.register('newPassword', { required: true, minLength: { value: 8, message: 'At least 8 characters' } })}
                  type="password" className="input-field" placeholder="••••••••" />
                {passForm.formState.errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{passForm.formState.errors.newPassword.message as string}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                <input {...passForm.register('confirmPassword', { required: true })}
                  type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={saving}
                  className="btn-primary" style={{ background: '#4B0082' }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" />Changing...</> : <><Lock size={14} />Change Password</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
