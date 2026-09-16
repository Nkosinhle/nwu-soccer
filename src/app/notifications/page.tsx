'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { Bell, CheckCheck, Trash2, AlertCircle, Trophy, HeartPulse, ClipboardList, Info } from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useFetch } from '@/lib/use-fetch'

const typeIcons: Record<string, React.ReactNode> = {
  match:    <Trophy    size={15} className="text-amber-500" />,
  medical:  <HeartPulse size={15} className="text-red-500" />,
  training: <ClipboardList size={15} className="text-blue-500" />,
  warning:  <AlertCircle size={15} className="text-amber-500" />,
  success:  <CheckCheck  size={15} className="text-emerald-500" />,
  error:    <AlertCircle size={15} className="text-red-500" />,
  general:  <Info        size={15} className="text-purple-500" />,
  info:     <Info        size={15} className="text-purple-500" />,
}

const typeBg: Record<string, string> = {
  match:    'bg-amber-50  border-amber-100',
  medical:  'bg-red-50    border-red-100',
  training: 'bg-blue-50   border-blue-100',
  warning:  'bg-amber-50  border-amber-100',
  success:  'bg-emerald-50 border-emerald-100',
  error:    'bg-red-50    border-red-100',
  general:  'bg-purple-50 border-purple-100',
  info:     'bg-purple-50 border-purple-100',
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const role    = (session?.user as any)?.role
  const isAdmin = ['admin', 'coach'].includes(role)

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // ── useFetch with ttlMs: 0 — notifications must always be fresh ──────────
  // No cache here: the sidebar badge and this page need to agree on read state.
  const {
    data,
    loading,
    refetch,
  } = useFetch<{ notifications: any[]; unreadCount: number }>('/api/notifications', { ttlMs: 0 })

  const all        = data?.notifications ?? []
  const unreadCount = data?.unreadCount  ?? 0
  const displayed  = filter === 'unread' ? all.filter(n => !n.isRead) : all

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    refetch()
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    refetch()
    toast.success('All marked as read')
  }

  // Admin: create a broadcast notification
  const [showCompose, setShowCompose] = useState(false)
  const [composing,   setComposing]   = useState(false)
  const [title,    setTitle]    = useState('')
  const [message,  setMessage]  = useState('')
  const [notifType, setNotifType] = useState('general')
  const [forRoles, setForRoles] = useState<string[]>([])

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) { toast.error('Title and message are required'); return }
    setComposing(true)
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, type: notifType, forRoles }),
    })
    setComposing(false)
    if (res.ok) {
      toast.success('Notification sent')
      setShowCompose(false)
      setTitle(''); setMessage(''); setForRoles([])
      refetch()
    } else {
      toast.error('Failed to send notification')
    }
  }

  return (
    <div className="animate-fade-in">
      <Header title="Notifications" subtitle="Stay up to date with squad activity" />
      <div className="p-8">

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === 'all' ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
            All
          </button>
          <button onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${filter === 'unread' ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
            Unread
            {unreadCount > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${filter === 'unread' ? 'bg-white text-purple-900' : 'bg-red-500 text-white'}`}>
                {unreadCount}
              </span>
            )}
          </button>

          <div className="ml-auto flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="btn-secondary text-sm flex items-center gap-1.5">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowCompose(!showCompose)}
                className="btn-primary text-sm" style={{ background: '#4B0082' }}>
                <Bell size={14} /> Send Notification
              </button>
            )}
          </div>
        </div>

        {/* Compose panel — admin only */}
        {showCompose && isAdmin && (
          <div className="card mb-5 border border-purple-100">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Bell size={15} className="text-purple-600" /> New Notification
            </h3>
            <div className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title *"
                className="input-field"
              />
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Message *"
                className="input-field resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select value={notifType} onChange={e => setNotifType(e.target.value)} className="input-field">
                    <option value="general">General</option>
                    <option value="match">Match</option>
                    <option value="training">Training</option>
                    <option value="medical">Medical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Send to roles (empty = all)</label>
                  <select
                    multiple
                    value={forRoles}
                    onChange={e => setForRoles(Array.from(e.target.selectedOptions, o => o.value))}
                    className="input-field h-[38px]"
                  >
                    <option value="admin">Admin</option>
                    <option value="coach">Coach</option>
                    <option value="physio">Physio</option>
                    <option value="support_staff">Support Staff</option>
                    <option value="player">Player</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCompose(false)} className="btn-secondary text-sm">Cancel</button>
                <button onClick={sendNotification} disabled={composing} className="btn-primary text-sm" style={{ background: '#4B0082' }}>
                  {composing ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="card text-center py-16">
            <Bell size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((n: any) => {
              const bg   = typeBg[n.type]   || typeBg.general
              const icon = typeIcons[n.type] || typeIcons.general

              return (
                <div
                  key={n._id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${bg} ${!n.isRead ? 'shadow-sm' : 'opacity-75'}`}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-0.5 relative">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      {icon}
                    </div>
                    {!n.isRead && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold text-slate-900 ${!n.isRead ? '' : 'font-medium'}`}>
                        {n.title}
                      </p>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {new Date(n.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                    {n.link && (
                      <a href={n.link} className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                        View details →
                      </a>
                    )}
                    {n.createdBy?.name && (
                      <p className="text-xs text-slate-400 mt-1">From: {n.createdBy.name}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n._id)}
                      className="flex-shrink-0 p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
