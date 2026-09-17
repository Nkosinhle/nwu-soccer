'use client'

import {
  useState,
  useCallback,
} from 'react'
import Header from '@/components/layout/Header'
import Link from 'next/link'

interface PlayerOverview {
  player: {
    _id: string
    name: string
    jerseyNumber: number
    position: string
    squad: string
    squadType: string | null
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
    nextAssessment?: {
      subject: string
      date: string
      type: string
    } | null
  }

  status:
    | 'complete'
    | 'partial'
    | 'none'
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

interface AcademicsClientProps {
  initialOverview: PlayerOverview[]
  initialSummary: Summary
  teams: TeamOption[]
  initialSemester: number
  initialYear: number
  role: string
}

function StatusBadge({
  status,
}: {
  status: string
}) {
  const cfg =
    {
      complete:
        'bg-green-100 text-green-800 border border-green-200',

      partial:
        'bg-amber-100 text-amber-800 border border-amber-200',

      none:
        'bg-red-100 text-red-800 border border-red-200',
    }[status] ??
    'bg-gray-100 text-gray-600'

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${cfg}`}
    >
      {status === 'complete'
        ? '✓ Complete'
        : status === 'partial'
          ? '⚠ Partial'
          : '✗ Missing'}
    </span>
  )
}

function ExportButton({
  type,
  payload,
  label,
}: {
  type: string
  payload: Record<
    string,
    unknown
  >
  label: string
}) {
  const [loading, setLoading] =
    useState(false)

  async function handleExport() {
    setLoading(true)

    try {
      const res = await fetch(
        '/api/export/pptx',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            type,
            ...payload,
          }),
        }
      )

      if (!res.ok) {
        throw new Error(
          'Export failed'
        )
      }

      const blob =
        await res.blob()

      const url =
        URL.createObjectURL(blob)

      const a =
        document.createElement('a')

      a.href = url

      a.download =
        res.headers
          .get(
            'Content-Disposition'
          )
          ?.match(
            /filename="(.+)"/
          )?.[1] ??
        'export.pptx'

      a.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)

      alert(
        'Export failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-[#4B2D83] text-white text-sm font-medium rounded-lg hover:bg-[#3a2066] transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />

          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}

      {loading
        ? 'Exporting…'
        : label}
    </button>
  )
}

export default function AcademicsClient({
  initialOverview,
  initialSummary,
  teams,
  initialSemester,
  initialYear,
}: AcademicsClientProps) {
  const [semester, setSemester] =
    useState(initialSemester)

  const [year, setYear] =
    useState(initialYear)

  const [squad, setSquad] =
    useState('')

  const [overview, setOverview] =
    useState<PlayerOverview[]>(
      initialOverview
    )

  const [summary, setSummary] =
    useState<Summary>(
      initialSummary
    )

  const [loading, setLoading] =
    useState(false)

  const [search, setSearch] =
    useState('')

  const [filter, setFilter] =
    useState<
      | 'all'
      | 'complete'
      | 'partial'
      | 'none'
    >('all')

  const [
    sendingReminders,
    setSendingReminders,
  ] = useState(false)

  const loadOverview =
    useCallback(
      async (
        nextSemester: number,
        nextYear: number,
        nextSquad: string
      ) => {
        setLoading(true)

        try {
          const params =
            new URLSearchParams({
              semester:
                String(
                  nextSemester
                ),
              year: String(
                nextYear
              ),
            })

          if (nextSquad) {
            params.set(
              'squad',
              nextSquad
            )
          }

          const res =
            await fetch(
              `/api/academics/overview?${params.toString()}`,
              {
                cache:
                  'no-store',
              }
            )

          if (!res.ok) {
            throw new Error(
              'Failed to load academic overview'
            )
          }

          const data =
            await res.json()

          setOverview(
            data.overview ?? []
          )

          setSummary(
            data.summary ?? {
              total: 0,
              complete: 0,
              partial: 0,
              none: 0,
            }
          )
        } catch (error) {
          console.error(
            'Failed to load academics:',
            error
          )
        } finally {
          setLoading(false)
        }
      },
      []
    )

  const changeSemester = (
    value: number
  ) => {
    setSemester(value)

    loadOverview(
      value,
      year,
      squad
    )
  }

  const changeYear = (
    value: number
  ) => {
    setYear(value)

    loadOverview(
      semester,
      value,
      squad
    )
  }

  const changeSquad = (
    value: string
  ) => {
    setSquad(value)

    loadOverview(
      semester,
      year,
      value
    )
  }

  const filtered = overview
    .filter(
      (item) =>
        filter === 'all' ||
        item.status === filter
    )
    .filter(
      (item) =>
        !search ||
        item.player.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    )

  async function sendReminders() {
    setSendingReminders(true)

    try {
      const deadline =
        new Date()

      deadline.setDate(
        deadline.getDate() + 7
      )

      const res = await fetch(
        '/api/notifications/send',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            type:
              'academics-reminder',
            semester,
            year,
            deadline:
              deadline.toISOString(),
          }),
        }
      )

      if (!res.ok) {
        throw new Error(
          'Failed to send reminders'
        )
      }

      alert(
        'Reminders sent to players with missing submissions.'
      )
    } catch (error) {
      console.error(error)

      alert(
        'Failed to send reminders.'
      )
    } finally {
      setSendingReminders(
        false
      )
    }
  }

  const pct =
    summary.total > 0
      ? Math.round(
          (summary.complete /
            summary.total) *
            100
        )
      : 0

  return (
    <div className="animate-fade-in">
      <Header
        title="Academics"
        subtitle="Player timetable submissions & academic tracking"
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-8">
          {[
            {
              label:
                'Total Players',
              value:
                summary.total,
              color:
                'border-purple-200 bg-purple-50',
              num:
                'text-[#4B2D83]',
            },
            {
              label:
                'Fully Submitted',
              value:
                summary.complete,
              color:
                'border-green-200 bg-green-50',
              num:
                'text-green-700',
            },
            {
              label: 'Partial',
              value:
                summary.partial,
              color:
                'border-amber-200 bg-amber-50',
              num:
                'text-amber-700',
            },
            {
              label:
                'Not Submitted',
              value:
                summary.none,
              color:
                'border-red-200 bg-red-50',
              num:
                'text-red-700',
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border p-3 sm:p-5 min-w-0 ${card.color}`}
            >
              <div
                className={`text-2xl sm:text-4xl font-bold ${card.num}`}
              >
                {card.value}
              </div>

              <div className="text-gray-600 text-sm mt-1">
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Submission
              Progress
            </span>

            <span className="text-sm font-bold text-[#4B2D83]">
              {pct}% complete
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                pct >= 80
                  ? 'bg-green-500'
                  : pct >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{
                width: `${pct}%`,
              }}
            />
          </div>
        </div>

        {/* Academic period */}
<div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
    <div className="w-full">
      <label className="block text-xs text-gray-500 mb-1">
        Semester
      </label>

      <select
        value={semester}
        onChange={(e) =>
          changeSemester(Number(e.target.value))
        }
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
      >
        <option value={1}>Semester 1</option>
        <option value={2}>Semester 2</option>
      </select>
    </div>

    <div className="w-full">
      <label className="block text-xs text-gray-500 mb-1">
        Year
      </label>

      <input
        type="number"
        value={year}
        onChange={(e) =>
          changeYear(Number(e.target.value))
        }
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
      />
    </div>

    <div className="w-full">
      <label className="block text-xs text-gray-500 mb-1">
        Squad
      </label>

      <select
        value={squad}
        onChange={(e) =>
          changeSquad(e.target.value)
        }
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
      >
        <option value="">All Squads</option>

        {teams.map((team) => (
          <option
            key={team._id}
            value={team._id}
          >
            {team.name}
          </option>
        ))}
      </select>
    </div>

    <button
      onClick={sendReminders}
      disabled={sendingReminders}
      className="w-full px-3 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-60 transition"
    >
      {sendingReminders
        ? 'Sending…'
        : 'Send Reminders'}
    </button>
  </div>
</div>

        {/* Toolbar */}
<div className="mb-4 space-y-3">
  <input
    type="text"
    value={search}
    onChange={(e) =>
      setSearch(e.target.value)
    }
    placeholder="Search players…"
    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2D83]"
  />

  <div className="flex gap-2 overflow-x-auto pb-1">
    {(
      [
        'all',
        'complete',
        'partial',
        'none',
      ] as const
    ).map((value) => (
      <button
        key={value}
        onClick={() => setFilter(value)}
        className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition ${
          filter === value
            ? 'bg-[#4B2D83] text-white'
            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        {value === 'all'
          ? 'All'
          : value.charAt(0).toUpperCase() +
            value.slice(1)}
      </button>
    ))}
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    <ExportButton
      type="academics-overview"
      payload={{
        semester,
        year,
        squad: squad || undefined,
      }}
      label="Export Overview"
    />

    <ExportButton
      type="exam-timetable"
      payload={{
        semester,
        year,
        squad: squad || undefined,
      }}
      label="Export Exam Schedule"
    />
  </div>
</div>

{/* Mobile player cards */}
<div className="md:hidden space-y-3">
  {loading ? (
    <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-[#4B2D83] border-t-transparent rounded-full animate-spin" />
    </div>
  ) : filtered.length === 0 ? (
    <div className="bg-white rounded-xl border border-gray-200 text-center py-12 text-gray-400">
      <p className="text-sm">No players found</p>
    </div>
  ) : (
    filtered.map((row) => (
      <div
        key={row.player._id}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 flex-shrink-0 rounded-full bg-purple-100 text-[#4B2D83] text-xs font-bold flex items-center justify-center">
                {row.player.jerseyNumber || '—'}
              </span>

              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  {row.player.name}
                </p>

                <p className="text-xs text-gray-400">
                  {row.player.position}
                </p>
              </div>
            </div>
          </div>

          <StatusBadge status={row.status} />
        </div>

        <div className="mb-4">
          <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-medium">
            {row.player.squad || 'No squad'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">
              Class Timetable
            </p>

            {row.classSchedule.submitted ? (
              <>
                <p className="text-green-600 font-semibold text-xs">
                  ✓ Submitted
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {row.classSchedule.slotCount} time slots
                </p>
              </>
            ) : (
              <p className="text-red-500 font-semibold text-xs">
                ✗ Missing
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">
              Assessments
            </p>

            {row.assessmentTimetable.submitted ? (
              <>
                <p className="text-green-600 font-semibold text-xs">
                  ✓ Submitted
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {row.assessmentTimetable.assessmentCount} assessments
                </p>
              </>
            ) : (
              <p className="text-red-500 font-semibold text-xs">
                ✗ Missing
              </p>
            )}
          </div>
        </div>

        {row.assessmentTimetable.nextAssessment && (
          <div className="border-t border-gray-100 pt-3 mb-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
              Next Assessment
            </p>

            <p className="text-sm font-medium text-gray-700 mt-1">
              {row.assessmentTimetable.nextAssessment.subject}
            </p>

            <p className="text-xs text-gray-400">
              {new Date(
                row.assessmentTimetable.nextAssessment.date
              ).toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
        )}

        <Link
          href={`/academics/${row.player._id}?semester=${semester}&year=${year}`}
          className="flex items-center justify-center w-full rounded-lg bg-purple-50 text-[#4B2D83] font-semibold text-sm py-2.5 hover:bg-purple-100 transition"
        >
          View Academic Details →
        </Link>
      </div>
    ))
  )}
</div>

        {/* Desktop / tablet table */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-[#4B2D83] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length ===
            0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={
                    1.5
                  }
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>

              <p className="text-sm">
                No players found
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#4B2D83] text-white">
                  <th className="text-left px-4 py-3 font-semibold">
                    #
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Player
                  </th>

                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">
                    Squad
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Class
                    Timetable
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Assessments
                  </th>

                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">
                    Next
                    Assessment
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Status
                  </th>

                  <th className="px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (
                    row,
                    index
                  ) => (
                    <tr
                      key={
                        row
                          .player
                          ._id
                      }
                      className={`border-t border-gray-100 hover:bg-purple-50/30 transition ${
                        index %
                          2 ===
                        0
                          ? ''
                          : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {row
                          .player
                          .jerseyNumber ||
                          '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">
                          {
                            row
                              .player
                              .name
                          }
                        </div>

                        <div className="text-xs text-gray-400">
                          {
                            row
                              .player
                              .position
                          }
                        </div>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-medium">
                          {
                            row
                              .player
                              .squad
                          }
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {row
                          .classSchedule
                          .submitted ? (
                          <div>
                            <span className="text-green-600 font-semibold text-xs">
                              ✓
                              Submitted
                            </span>

                            <div className="text-xs text-gray-400">
                              {
                                row
                                  .classSchedule
                                  .slotCount
                              }{' '}
                              time
                              slots
                            </div>
                          </div>
                        ) : (
                          <span className="text-red-500 font-semibold text-xs">
                            ✗
                            Missing
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {row
                          .assessmentTimetable
                          .submitted ? (
                          <div>
                            <span className="text-green-600 font-semibold text-xs">
                              ✓
                              Submitted
                            </span>

                            <div className="text-xs text-gray-400">
                              {
                                row
                                  .assessmentTimetable
                                  .assessmentCount
                              }{' '}
                              assessments
                            </div>
                          </div>
                        ) : (
                          <span className="text-red-500 font-semibold text-xs">
                            ✗
                            Missing
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 hidden lg:table-cell">
                        {row
                          .assessmentTimetable
                          .nextAssessment ? (
                          <div>
                            <div className="text-xs font-medium text-gray-700">
                              {
                                row
                                  .assessmentTimetable
                                  .nextAssessment
                                  .subject
                              }
                            </div>

                            <div className="text-xs text-gray-400">
                              {new Date(
                                row.assessmentTimetable.nextAssessment.date
                              ).toLocaleDateString(
                                'en-ZA',
                                {
                                  day:
                                    'numeric',
                                  month:
                                    'short',
                                }
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            row.status
                          }
                        />
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
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}