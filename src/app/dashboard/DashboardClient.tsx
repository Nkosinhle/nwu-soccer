'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import {
  Users, Shield, Calendar, AlertTriangle, Trophy, Activity,
  HeartPulse, Download, GraduationCap, FileText,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'
import { downloadPptx } from '@/lib/pptx-client'

const FITNESS_COLORS: Record<string, string> = {
  Fit: '#10b981', Injured: '#ef4444', Recovering: '#f59e0b', Suspended: '#6b7280',
}
const RESULT_COLORS: Record<string, string> = {
  Win: '#10b981', Draw: '#f59e0b', Loss: '#ef4444',
}
const POS_COLORS = ['#4B0082', '#7c3aed', '#0891b2', '#059669']

function PptxExportButton({ type, payload, label }: {
  type: string; payload: Record<string, unknown>; label: string
}) {
  const [loading, setLoading] = useState(false)
  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        await downloadPptx(type, payload, label).catch(() => alert(`Failed to export ${label}`))
        setLoading(false)
      }}
      className="btn-secondary text-sm gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <FileText size={13} />
      {loading ? 'Exporting…' : `${label} PPT`}
    </button>
  )
}

interface DashData {
  stats?: { totalPlayers?: number; totalTeams?: number; upcomingMatches?: number; injuredPlayers?: number; fitPlayers?: number; totalMatches?: number }
  fitnessBreakdown?: { _id: string; count: number }[]
  positionBreakdown?: { _id: string; count: number }[]
  matchResults?: { _id: string; count: number }[]
  topScorers?: { _id: string; totalGoals: number; totalAssists: number; matches: number; player?: { fullName?: string; position?: string } }[]
  recentMatches?: { _id: string; opponent: string; date: string; status: string; score: { home: number; away: number } }[]
  recentInjuries?: { _id: string; injuryType: string; player?: { fullName?: string } }[]
  academicsSummary?: { semester: number; year: number; total: number; complete: number; partial: number; none: number }
}

interface DashboardClientProps {
  initialData: DashData
  user: {
    name: string
    role: string
  }
}

export default function DashboardClient({
  initialData,
  user,
}: DashboardClientProps) {
  const dashData = initialData
  const role = user.role
  

  const [greeting] = useState(() => {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'

  return 'Good evening'
})


  const userName =
  user.name?.split(' ')[0] || 'there'
  const isStaff       = ['admin', 'coach', 'support_staff'].includes(role ?? '')
  const isAdminCoach  = ['admin', 'coach'].includes(role ?? '')
  const acSummary     = dashData?.academicsSummary
  const acMissing     = acSummary ? acSummary.none + acSummary.partial : 0
  const semester      = acSummary?.semester ?? 1
  const year          = acSummary?.year ?? new Date().getFullYear()

  const fitnessChart  = (dashData?.fitnessBreakdown  || []).map(f => ({ name: f._id, value: f.count }))
  const positionChart = (dashData?.positionBreakdown || []).map(p => ({ name: p._id, count: p.count }))
  const resultsChart  = (dashData?.matchResults      || []).map(r => ({ name: r._id, value: r.count }))

  const statCards = [
    { label: 'Total Players',     value: dashData?.stats?.totalPlayers,   icon: Users,         color: 'bg-purple-50 text-purple-700',   href: '/players' },
    { label: 'Active Squads',     value: dashData?.stats?.totalTeams,      icon: Shield,        color: 'bg-blue-50 text-blue-700',       href: '/teams' },
    { label: 'Upcoming Fixtures', value: dashData?.stats?.upcomingMatches, icon: Calendar,      color: 'bg-amber-50 text-amber-700',     href: '/matches' },
    { label: 'Injured Players',   value: dashData?.stats?.injuredPlayers,  icon: AlertTriangle, color: 'bg-red-50 text-red-700',         href: '/medical' },
    { label: 'Fit Players',       value: dashData?.stats?.fitPlayers,      icon: Activity,      color: 'bg-emerald-50 text-emerald-700', href: '/players' },
    { label: 'Matches Played',    value: dashData?.stats?.totalMatches,    icon: Trophy,        color: 'bg-indigo-50 text-indigo-700',   href: '/matches' },
  ]

  return (
    <div className="animate-fade-in">
      <Header title="Dashboard" subtitle="NWU Soccer Institute Overview" />
      <div className="p-8">

        {/* Greeting */}
        <div className="mb-6 p-5 bg-gradient-to-r from-purple-900 to-purple-700 rounded-2xl text-white">
          <p className="text-purple-200 text-sm">{greeting},</p>
          <h2 className="text-xl font-black">
            {user.name?.split(' ')[0] || 'there'}
            </h2>
          <p className="text-purple-300 text-xs mt-1 capitalize">
            {role?.replace('_', ' ')} &middot; {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Academics alert — staff only */}
        {isStaff && acSummary && acMissing > 0 && (
          <div className="mb-6 flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <GraduationCap size={16} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">{acMissing} player{acMissing !== 1 ? 's' : ''} missing academic timetable</p>
              <p className="text-xs text-amber-600 mt-0.5">Semester {acSummary.semester} · {acSummary.year} — {acSummary.complete} of {acSummary.total} fully submitted</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/academics" className="text-xs font-medium px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">View →</Link>
              <button
                className="text-xs font-medium px-3 py-1.5 bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition"
                onClick={async () => {
                  const deadline = new Date()
                  deadline.setDate(deadline.getDate() + 7)
                  await fetch('/api/notifications/send', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'academics-reminder', semester: acSummary.semester, year: acSummary.year, deadline: deadline.toISOString() }),
                  })
                  alert('Reminders sent.')
                }}
              >Send Reminders</button>
            </div>
          </div>
        )}

        {/* Player CTA */}
        {role === 'player' && (
          <div className="mb-6 flex items-center gap-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={16} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-800">Academic Timetable</p>
              <p className="text-xs text-purple-500 mt-0.5">Submit your class schedule and assessments for the current semester</p>
            </div>
            <Link href="/academics/submit" className="text-xs font-semibold px-3 py-1.5 bg-[#4B2D83] text-white rounded-lg hover:bg-purple-800 transition flex-shrink-0">Submit →</Link>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <Link key={card.label} href={card.href} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center mb-3`}><Icon size={16} /></div>
                <p className="text-2xl font-bold text-slate-900">{card.value ?? 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
              </Link>
            )
          })}
        </div>

        {/* Academics progress — staff */}
        {isStaff && acSummary && (
          <div className="mb-6 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                <GraduationCap size={16} className="text-purple-600" />
                Academic Submissions — S{acSummary.semester} {acSummary.year}
              </h2>
              <Link href="/academics" className="text-xs text-purple-600 hover:underline">Full overview →</Link>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: 'Complete', value: acSummary.complete, color: 'bg-green-50 text-green-700 border-green-100' },
                { label: 'Partial',  value: acSummary.partial,  color: 'bg-amber-50 text-amber-700 border-amber-100' },
                { label: 'Missing',  value: acSummary.none,     color: 'bg-red-50 text-red-700 border-red-100' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-3 ${s.color}`}>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="h-2 rounded-full bg-purple-600 transition-all duration-500" style={{ width: `${acSummary.total > 0 ? Math.round((acSummary.complete / acSummary.total) * 100) : 0}%` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Scorers */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> Top Scorers</h2>
              <Link href="/performance" className="text-xs text-purple-600 hover:underline">Full stats →</Link>
            </div>
            {!dashData?.topScorers?.length ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No match stats recorded yet.</p>
                <Link href="/matches" className="text-xs text-purple-600 hover:underline mt-1 block">Record match results →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {dashData.topScorers.map((s, i) => (
                  <div key={s._id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'}`}>{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-sm flex-shrink-0">{s.player?.fullName?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.player?.fullName}</p>
                      <p className="text-xs text-slate-400">{s.player?.position} &middot; {s.matches} matches</p>
                    </div>
                    <div className="flex gap-4 text-right flex-shrink-0">
                      <div><p className="text-sm font-bold text-purple-700">{s.totalGoals}</p><p className="text-xs text-slate-400">Goals</p></div>
                      <div><p className="text-sm font-bold text-blue-600">{s.totalAssists}</p><p className="text-xs text-slate-400">Assists</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fitness donut */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Activity size={16} className="text-emerald-500" /> Squad Fitness</h2>
            {fitnessChart.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">No players yet</p> : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={fitnessChart} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {fitnessChart.map((entry, i) => <Cell key={i} fill={FITNESS_COLORS[entry.name] || '#8b5cf6'} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {fitnessChart.map(f => (
                    <div key={f.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: FITNESS_COLORS[f.name] || '#8b5cf6' }} />
                        <span className="text-slate-600 text-xs">{f.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800 text-xs">{f.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Position chart */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Users size={16} className="text-purple-600" /> Players by Position</h2>
            {positionChart.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">No players yet</p> : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={positionChart} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {positionChart.map((_, i) => <Cell key={i} fill={POS_COLORS[i % POS_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Match results */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Trophy size={16} className="text-purple-600" /> Match Results</h2>
            {resultsChart.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">No matches played yet</p> : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={resultsChart} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {resultsChart.map((entry, i) => <Cell key={i} fill={RESULT_COLORS[entry.name] || '#8b5cf6'} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent fixtures + injuries */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Calendar size={16} className="text-blue-500" /> Recent Fixtures</h2>
              <Link href="/matches" className="text-xs text-purple-600 hover:underline">All →</Link>
            </div>
            {!dashData?.recentMatches?.length ? (
              <p className="text-slate-400 text-sm text-center py-4">No matches yet</p>
            ) : (
              <div className="space-y-2 mb-4">
                {dashData.recentMatches.slice(0, 3).map(m => (
                  <Link key={m._id} href={`/matches/${m._id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors block">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.status === 'Played' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">vs {m.opponent}</p>
                      <p className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString('en-ZA')}</p>
                    </div>
                    {m.status === 'Played' && <span className="text-xs font-bold text-slate-900">{m.score.home}–{m.score.away}</span>}
                  </Link>
                ))}
              </div>
            )}
            {(dashData?.recentInjuries?.length ?? 0) > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-2"><HeartPulse size={11} className="text-red-500" /> Active Injuries</p>
                {dashData!.recentInjuries!.slice(0, 3).map(r => (
                  <div key={r._id} className="flex items-center gap-2 py-1">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs font-bold">{r.player?.fullName?.charAt(0)}</span>
                    </div>
                    <span className="text-xs text-slate-700 flex-1 truncate">{r.player?.fullName}</span>
                    <span className="text-xs text-red-500 flex-shrink-0">{r.injuryType}</span>
                  </div>
                ))}
                <Link href="/medical" className="text-xs text-purple-600 hover:underline mt-1 block">View all →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick exports */}
        {isAdminCoach && (
          <div className="mt-6 card">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Download size={15} className="text-slate-500" /> Quick Exports</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Players', type: 'players' },
                { label: 'Matches', type: 'matches' },
                { label: 'Stats',   type: 'stats' },
                { label: 'Medical', type: 'medical' },
              ].map(e => (
                <button key={e.type} onClick={() => window.open(`/api/export?type=${e.type}`, '_blank')} className="btn-secondary text-sm gap-1.5">
                  <Download size={13} /> Export {e.label}
                </button>
              ))}
              <PptxExportButton type="academics-overview" payload={{ semester, year }} label="Academics" />
              <PptxExportButton type="player-stats" payload={{ season: String(year) }} label="Player Stats" />
              <PptxExportButton type="match-summary" payload={{ season: String(year) }} label="Match Summary" />
              <PptxExportButton type="analytics" payload={{ analyticsType: 'attendance' }} label="Attendance" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
