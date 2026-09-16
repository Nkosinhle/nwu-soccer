'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerOverview {
  player: {
    _id: string
    name: string          // Player.fullName
    jerseyNumber: number
    position: string
    squad: string          // Team.name (display label)
    squadType: string | null  // 'First Team' | 'Reserves' | 'U21'
  }
  classSchedule: {
    submitted: boolean
    submittedAt: string | null
    slotCount: number
  }
  assessmentTimetable: {
    submitted: boolean
    submittedAt: string | null
    assessmentCount: number
    nextAssessment?: { subject: string; date: string; type: string } | null
  }
  status: 'complete' | 'partial' | 'none'
}

interface Summary {
  total: number
  complete: number
  partial: number
  none: number
}

interface TeamOption {
  _id: string
  name: string
  type: string
}

const STAFF_ROLES = ['admin', 'coach', 'physio', 'support_staff']
const SEMESTERS = [1, 2]
const YEAR = new Date().getFullYear()

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    complete: 'bg-green-100 text-green-800 border border-green-200',
    partial:  'bg-amber-100  text-amber-800  border border-amber-200',
    none:     'bg-red-100   text-red-800   border border-red-200',
  }[status] ?? 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${cfg}`}>
      {status === 'complete' ? '✓ Complete' : status === 'partial' ? '⚠ Partial' : '✗ Missing'}
    </span>
  )
}

// ─── Export Button ────────────────────────────────────────────────────────────

function ExportButton({
  type, payload, label,
}: { type: string; payload: Record<string, unknown>; label: string }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...payload }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? 'export.pptx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#4B2D83] text-white text-sm font-medium rounded-lg hover:bg-[#3a2066] transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      )}
      {loading ? 'Exporting…' : label}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AcademicsPage() {
  const { data: session } = useSession()
  const [semester,  setSemester]  = useState(1)
  const [year,      setYear]      = useState(YEAR)
  const [squad,     setSquad]     = useState('')          // Team ObjectId, '' = all
  const [teams,     setTeams]     = useState<TeamOption[]>([])
  const [overview,  setOverview]  = useState<PlayerOverview[]>([])
  const [summary,   setSummary]   = useState<Summary | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<'all' | 'complete' | 'partial' | 'none'>('all')
  const [sendingReminders, setSendingReminders] = useState(false)

  const isStaff = STAFF_ROLES.includes((session?.user as { role?: string })?.role ?? '')

  // Fetch the list of squads/teams for the filter dropdown.
  // Adjust the endpoint below if your existing squad management page uses a
  // different route — this assumes a conventional /api/teams GET list.
  useEffect(() => {
    fetch('/api/teams')
      .then(res => res.ok ? res.json() : { teams: [] })
      .then(data => setTeams(data.teams ?? []))
      .catch(() => setTeams([]))
  }, [])

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ semester: String(semester), year: String(year) })
      if (squad) params.set('squad', squad)
      const res  = await fetch(`/api/academics/overview?${params}`)
      const data = await res.json()
      setOverview(data.overview ?? [])
      setSummary(data.summary ?? null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [semester, year, squad])

  useEffect(() => { fetchOverview() }, [fetchOverview])

  const filtered = overview
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => !search || o.player.name.toLowerCase().includes(search.toLowerCase()))

  async function sendReminders() {
    setSendingReminders(true)
    try {
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + 7)
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'academics-reminder', semester, year, deadline: deadline.toISOString() }),
      })
      alert('Reminders sent to players with missing submissions.')
    } finally {
      setSendingReminders(false)
    }
  }

  const pct = summary ? Math.round((summary.complete / summary.total) * 100) || 0 : 0

 return (
  <div className="animate-fade-in">
    <Header
      title="Academics"
      subtitle="Player timetable submissions & academic tracking"
    />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Players', value: summary.total, color: 'border-purple-200 bg-purple-50',  num: 'text-[#4B2D83]' },
              { label: 'Fully Submitted', value: summary.complete, color: 'border-green-200 bg-green-50', num: 'text-green-700' },
              { label: 'Partial',        value: summary.partial,  color: 'border-amber-200 bg-amber-50', num: 'text-amber-700' },
              { label: 'Not Submitted',  value: summary.none,     color: 'border-red-200 bg-red-50',     num: 'text-red-700'   },
            ].map(c => (
              <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
                <div className={`text-4xl font-bold ${c.num}`}>{c.value}</div>
                <div className="text-gray-600 text-sm mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {summary && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Submission Progress</span>
              <span className="text-sm font-bold text-[#4B2D83]">{pct}% complete</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search players…"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83] w-48"
            />
            {(['all', 'complete', 'partial', 'none'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === f ? 'bg-[#4B2D83] text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <ExportButton
              type="academics-overview"
              payload={{ semester, year, squad: squad || undefined }}
              label="Export Overview"
            />
            <ExportButton
              type="exam-timetable"
              payload={{ semester, year, squad: squad || undefined }}
              label="Export Exam Schedule"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-[#4B2D83] border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-sm">No players found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#4B2D83] text-white">
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Player</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Squad</th>
                  <th className="text-left px-4 py-3 font-semibold">Class Timetable</th>
                  <th className="text-left px-4 py-3 font-semibold">Assessments</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Next Assessment</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3"/>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.player._id} className={`border-t border-gray-100 hover:bg-purple-50/30 transition ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{row.player.jerseyNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{row.player.name}</div>
                      <div className="text-xs text-gray-400">{row.player.position}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-medium">
                        {row.player.squad}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.classSchedule.submitted ? (
                        <div>
                          <span className="text-green-600 font-semibold text-xs">✓ Submitted</span>
                          <div className="text-xs text-gray-400">{row.classSchedule.slotCount} time slots</div>
                        </div>
                      ) : (
                        <span className="text-red-500 font-semibold text-xs">✗ Missing</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.assessmentTimetable.submitted ? (
                        <div>
                          <span className="text-green-600 font-semibold text-xs">✓ Submitted</span>
                          <div className="text-xs text-gray-400">{row.assessmentTimetable.assessmentCount} assessments</div>
                        </div>
                      ) : (
                        <span className="text-red-500 font-semibold text-xs">✗ Missing</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {row.assessmentTimetable.nextAssessment ? (
                        <div>
                          <div className="text-xs font-medium text-gray-700">{row.assessmentTimetable.nextAssessment.subject}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(row.assessmentTimetable.nextAssessment.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/academics/${row.player._id}?semester=${semester}&year=${year}`}
                        className="text-[#4B2D83] hover:text-[#E8A020] text-xs font-medium transition"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
