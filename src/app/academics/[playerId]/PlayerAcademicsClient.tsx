'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ClassSlot {
  day: string
  startTime: string
  endTime: string
  subject: string
  code: string
  venue: string
  lecturer: string
}

interface Assessment {
  type:
    | 'class-test'
    | 'assignment'
    | 'exam'
    | 'practical'

  subject: string
  code: string
  date: string
  startTime: string
  endTime: string
  venue: string
  notes?: string
  weight?: number
}

interface PlayerInfo {
  _id: string
  fullName: string
  jerseyNumber: number
  position: string

  squad?: {
    name?: string
    type?: string
  }
}

interface PlayerAcademicsClientProps {
  playerId: string
  semester: number
  year: number
  player: PlayerInfo
  slots: ClassSlot[]
  assessments: Assessment[]
}

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const TYPE_STYLES:
  Record<string, string> = {
    exam:
      'bg-red-100 text-red-700 border-red-200',

    'class-test':
      'bg-amber-100 text-amber-700 border-amber-200',

    assignment:
      'bg-blue-100 text-blue-700 border-blue-200',

    practical:
      'bg-green-100 text-green-700 border-green-200',
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

      alert('Export failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#4B2D83] text-white text-sm font-medium rounded-lg hover:bg-[#3a2066] transition disabled:opacity-60"
    >
      {loading
        ? 'Exporting…'
        : label}
    </button>
  )
}

export default function PlayerAcademicsClient({
  playerId,
  semester,
  year,
  player,
  slots,
  assessments,
}: PlayerAcademicsClientProps) {
  const byDay:
    Record<
      string,
      ClassSlot[]
    > = {}

  DAYS.forEach((day) => {
    byDay[day] = []
  })

  slots.forEach((slot) => {
    if (byDay[slot.day]) {
      byDay[slot.day].push(
        slot
      )
    }
  })

  Object.values(
    byDay
  ).forEach((items) => {
    items.sort((a, b) =>
      a.startTime.localeCompare(
        b.startTime
      )
    )
  })

  const sortedAssessments = [
    ...assessments,
  ].sort(
    (a, b) =>
      new Date(
        a.date
      ).getTime() -
      new Date(
        b.date
      ).getTime()
  )

  const now = new Date()

  const upcoming =
    sortedAssessments.filter(
      (assessment) =>
        new Date(
          assessment.date
        ) >= now
    )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#4B2D83] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link
            href="/academics"
            className="text-purple-300 text-sm hover:text-white transition inline-flex items-center gap-1 mb-3"
          >
            ← Back to Academics
            Overview
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {player.fullName}
              </h1>

              <p className="text-purple-200 mt-1 text-sm">
                #
                {
                  player.jerseyNumber
                }{' '}
                · {player.position} ·{' '}
                {player.squad
                  ?.name ?? '—'}{' '}
                · Semester{' '}
                {semester}, {year}
              </p>
            </div>

            <div className="flex gap-2">
              <ExportButton
                type="player-schedule"
                payload={{
                  playerId,
                  semester,
                  year,
                }}
                label="Export to PowerPoint"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Weekly Class Schedule */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#4B2D83]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={
                  2
                }
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>

            Weekly Class
            Schedule
          </h2>

          {slots.length ===
          0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
              No class schedule
              submitted for this
              semester.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {DAYS.map(
                (day) => (
                  <div
                    key={day}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div className="bg-[#4B2D83] text-white text-center text-xs font-bold py-2 uppercase tracking-wide">
                      {day.slice(
                        0,
                        3
                      )}
                    </div>

                    <div className="p-2 space-y-2 min-h-[80px]">
                      {byDay[
                        day
                      ].length ===
                      0 ? (
                        <p className="text-xs text-gray-300 text-center py-4">
                          Free
                        </p>
                      ) : (
                        byDay[
                          day
                        ].map(
                          (
                            slot,
                            index
                          ) => (
                            <div
                              key={
                                index
                              }
                              className="bg-purple-50 border border-purple-100 rounded-lg p-2"
                            >
                              <div className="font-bold text-[#4B2D83] text-xs">
                                {
                                  slot.code
                                }
                              </div>

                              <div className="text-xs text-gray-600 truncate">
                                {
                                  slot.subject
                                }
                              </div>

                              <div className="text-xs text-gray-400 mt-1">
                                {
                                  slot.startTime
                                }
                                –
                                {
                                  slot.endTime
                                }
                              </div>

                              <div className="text-xs text-gray-400">
                                {
                                  slot.venue
                                }
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* Assessments */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#4B2D83]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={
                  2
                }
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>

            Assessment &amp; Exam
            Timetable

            {upcoming.length >
              0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                {
                  upcoming.length
                }{' '}
                upcoming
              </span>
            )}
          </h2>

          {sortedAssessments.length ===
          0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
              No assessment
              timetable submitted
              for this semester.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">
                      Module
                    </th>

                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">
                      Type
                    </th>

                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">
                      Time
                    </th>

                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">
                      Venue
                    </th>

                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600">
                      Weight
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedAssessments.map(
                    (
                      assessment,
                      index
                    ) => {
                      const isPast =
                        new Date(
                          assessment.date
                        ) < now

                      return (
                        <tr
                          key={
                            index
                          }
                          className={`border-t border-gray-100 ${
                            isPast
                              ? 'opacity-50'
                              : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            {new Date(
                              assessment.date
                            ).toLocaleDateString(
                              'en-ZA',
                              {
                                weekday:
                                  'short',
                                day:
                                  'numeric',
                                month:
                                  'short',
                              }
                            )}
                          </td>

                          <td className="px-4 py-3 font-medium">
                            {
                              assessment.code
                            }{' '}
                            —{' '}
                            {
                              assessment.subject
                            }
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                                TYPE_STYLES[
                                  assessment
                                    .type
                                ]
                              }`}
                            >
                              {assessment.type.replace(
                                '-',
                                ' '
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {
                              assessment.startTime
                            }
                            –
                            {
                              assessment.endTime
                            }
                          </td>

                          <td className="px-4 py-3 text-gray-500">
                            {
                              assessment.venue
                            }
                          </td>

                          <td className="px-4 py-3 font-semibold text-gray-700">
                            {assessment.weight
                              ? `${assessment.weight}%`
                              : '—'}
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}