'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Shield, Calendar, Activity,
  HeartPulse, ClipboardList, Settings, LogOut, ChevronRight,
  Bell, User, GraduationCap,
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',    icon: LayoutDashboard, roles: ['admin','coach','physio','support_staff','player'] },
  { href: '/players',        label: 'Players',      icon: Users,            roles: ['admin','coach','physio','support_staff'] },
  { href: '/teams',          label: 'Squads',       icon: Shield,           roles: ['admin','coach','physio','support_staff'] },
  { href: '/matches',        label: 'Matches',      icon: Calendar,         roles: ['admin','coach','physio','support_staff','player'] },
  { href: '/training',       label: 'Training',     icon: ClipboardList,    roles: ['admin','coach','physio','support_staff','player'] },
  { href: '/medical',        label: 'Medical',      icon: HeartPulse,       roles: ['admin','coach','physio'] },
  { href: '/performance',    label: 'Performance',  icon: Activity,         roles: ['admin','coach','player'] },
  // ── NEW: Academics ────────────────────────────────────────────────────────
  // admin/coach/support_staff see the overview (submission grid, exports, reminders)
  // player sees /academics/submit (their own timetable form)
  { href: '/academics',      label: 'Academics',    icon: GraduationCap,    roles: ['admin','coach','support_staff','player'] },
  { href: '/notifications',  label: 'Notifications',icon: Bell,             roles: ['admin','coach','physio','support_staff','player'] },
  { href: '/settings',       label: 'Settings',     icon: Settings,         roles: ['admin'] },
]

const roleColors: Record<string, string> = {
  admin: 'bg-purple-500', coach: 'bg-blue-500',
  physio: 'bg-green-500', support_staff: 'bg-amber-500', player: 'bg-rose-500',
}
const roleLabels: Record<string, string> = {
  admin: 'Administrator', coach: 'Coach',
  physio: 'Physiotherapist', support_staff: 'Support Staff', player: 'Player',
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role || 'player'
  const [unread, setUnread] = useState(0)

  const visibleItems = navItems.filter(item => item.roles.includes(role))

  // Players clicking /academics get redirected to /academics/submit
  // (their own form, not the admin overview) — handled in page.tsx via
  // role check, so the href here is the same for all roles.

  // Fetch unread notification count — unchanged from your original
  useEffect(() => {
    const fetchUnread = () => {
      fetch('/api/notifications')
        .then(r => r.json())
        .then(d => setUnread(d.unreadCount || 0))
        .catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950 flex flex-col z-40 shadow-2xl">
      {/* Logo */}
      <div className="p-5 border-b border-purple-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl overflow-hidden shadow-lg flex-shrink-0 flex items-center justify-center">
            <img
              src="/images/soccer-logo.jpg"
              alt="NWU"
              className="w-full h-full object-cover"
              onError={(e) => {
                const t = e.currentTarget
                t.style.display = 'none'
                const parent = t.parentElement
                if (parent && !parent.querySelector('span')) {
                  const span = document.createElement('span')
                  span.className = 'text-purple-900 font-black text-base'
                  span.textContent = 'N'
                  parent.appendChild(span)
                }
              }}
            />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">NWU Soccer</p>
            <p className="text-purple-300 text-xs">Institute PMS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest px-4 mb-3">Menu</p>
        {visibleItems.map(item => {
          const Icon     = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const isNotif  = item.href === '/notifications'
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                'text-purple-200 hover:bg-purple-800 hover:text-white',
                isActive && 'bg-purple-700 text-white shadow-sm'
              )}>
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isNotif && unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              {isActive && !isNotif && <ChevronRight size={14} className="opacity-60 flex-shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-purple-800/50 space-y-1">
        <Link href="/profile"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
            'text-purple-200 hover:bg-purple-800 hover:text-white',
            pathname === '/profile' && 'bg-purple-700 text-white'
          )}>
          <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', roleColors[role])}>
            {session?.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs truncate">{session?.user?.name}</p>
            <p className="text-purple-300 text-xs">{roleLabels[role]}</p>
          </div>
          <User size={13} className="opacity-50 flex-shrink-0" />
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 text-purple-300 hover:text-white hover:bg-purple-800 rounded-lg text-sm transition-all">
          <LogOut size={14} className="flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
