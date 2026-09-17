'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import {
  ArrowLeft,
  Save,
  Loader2,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const statusOptions = [
  'Present',
  'Absent',
  'Excused',
] as const

type AttendanceStatus =
  (typeof statusOptions)[number]

const statusColors: Record<
  AttendanceStatus,
  string
> = {
  Present:
    'bg-emerald-100 text-emerald-700 border-emerald-200',
  Absent:
    'bg-red-100 text-red-700 border-red-200',
  Excused:
    'bg-amber-100 text-amber-700 border-amber-200',
}

interface TrainingSessionClientProps {
  initialTraining: any
  initialSquadPlayers: any[]
  role: string
}

export default function TrainingSessionClient({
  initialTraining,
  initialSquadPlayers,
  role,
}: TrainingSessionClientProps) {
  const [training, setTraining] =
    useState<any>(initialTraining)

  const [squadPlayers] = useState<any[]>(
    initialSquadPlayers
  )

  const [attendance, setAttendance] =
    useState<
      Record<string, AttendanceStatus>
    >(() => {
      const map: Record<
        string,
        AttendanceStatus
      > = {}

      // Existing saved attendance
      ;(
        initialTraining.attendance || []
      ).forEach((item: any) => {
        const playerId =
          item.player?._id ??
          item.player

        if (playerId) {
          map[String(playerId)] =
            item.status
        }
      })

      // Players without a saved status
      // default to Present.
      initialSquadPlayers.forEach(
        (player: any) => {
          if (!map[player._id]) {
            map[player._id] =
              'Present'
          }
        }
      )

      return map
    })

  const [saving, setSaving] =
    useState(false)

  /*
   * Your PUT /api/attendance/[id]
   * permits admin + coach.
   *
   * support_staff can CREATE sessions,
   * but the current API does NOT permit
   * support_staff to update attendance.
   */
  const canEdit = [
    'admin',
    'coach',
  ].includes(role)

  const toggle = (
    playerId: string
  ) => {
    setAttendance((previous) => {
      const current =
        previous[playerId] ||
        'Present'

      const next: AttendanceStatus =
        current === 'Present'
          ? 'Absent'
          : current === 'Absent'
            ? 'Excused'
            : 'Present'

      return {
        ...previous,
        [playerId]: next,
      }
    })
  }

  const saveAttendance =
    async () => {
      setSaving(true)

      try {
        const attendanceArray =
          squadPlayers.map(
            (player: any) => ({
              player: player._id,
              status:
                attendance[
                  player._id
                ] || 'Present',
            })
          )

        const res = await fetch(
          `/api/attendance/${training._id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              attendance:
                attendanceArray,
            }),
          }
        )

        if (!res.ok) {
          const errorData =
            await res
              .json()
              .catch(() => null)

          throw new Error(
            errorData?.error ||
              'Failed to save attendance'
          )
        }

        const updated =
          await res.json()

        setTraining(
          (previous: any) => ({
            ...previous,
            ...updated,
          })
        )

        toast.success(
          'Attendance saved!'
        )
      } catch (error: any) {
        toast.error(
          error.message ||
            'Failed to save attendance'
        )
      } finally {
        setSaving(false)
      }
    }

  const present =
    Object.values(
      attendance
    ).filter(
      (status) =>
        status === 'Present'
    ).length

  const absent =
    Object.values(
      attendance
    ).filter(
      (status) =>
        status === 'Absent'
    ).length

  const excused =
    Object.values(
      attendance
    ).filter(
      (status) =>
        status === 'Excused'
    ).length

  const total =
    squadPlayers.length

  const rate = total
    ? Math.round(
        (present / total) * 100
      )
    : 0

  return (
    <div className="animate-fade-in">
      <Header
        title={training.title}
        subtitle={`${training.type} · ${
          training.location || ''
        }`}
      />

      <div className="p-8">

        <Link
          href="/training"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-700 mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Training
        </Link>

        {/* Attendance summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <div className="card text-center py-4 border-l-4 border-purple-500">
            <p className="text-2xl font-black text-purple-700">
              {present}
            </p>
            <p className="text-xs text-slate-500">
              Present
            </p>
          </div>

          <div className="card text-center py-4 border-l-4 border-red-400">
            <p className="text-2xl font-black text-red-600">
              {absent}
            </p>
            <p className="text-xs text-slate-500">
              Absent
            </p>
          </div>

          <div className="card text-center py-4 border-l-4 border-amber-400">
            <p className="text-2xl font-black text-amber-600">
              {excused}
            </p>
            <p className="text-xs text-slate-500">
              Excused
            </p>
          </div>

          <div className="card text-center py-4 border-l-4 border-emerald-400">
            <p
              className={`text-2xl font-black ${
                rate >= 80
                  ? 'text-emerald-600'
                  : rate >= 60
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            >
              {rate}%
            </p>

            <p className="text-xs text-slate-500">
              Attendance Rate
            </p>
          </div>

        </div>

        {/* Session details */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

            <div>
              <p className="text-slate-400 text-xs">
                Date
              </p>

              <p className="font-medium">
                {new Date(
                  training.date
                ).toLocaleDateString(
                  'en-ZA',
                  {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-xs">
                Time
              </p>

              <p className="font-medium">
                {new Date(
                  training.date
                ).toLocaleTimeString(
                  'en-ZA',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )}
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-xs">
                Duration
              </p>

              <p className="font-medium">
                {training.duration}{' '}
                minutes
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-xs">
                Type
              </p>

              <p className="font-medium">
                {training.type}
              </p>
            </div>

          </div>

          {training.notes && (
            <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100 italic">
              {training.notes}
            </p>
          )}
        </div>

        {/* Attendance */}
        <div className="card">

          <div className="flex items-center justify-between mb-4">

            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users
                size={16}
                className="text-purple-600"
              />

              Attendance ({total}{' '}
              players)
            </h3>

            {canEdit && (
              <button
                onClick={
                  saveAttendance
                }
                disabled={saving}
                className="btn-primary"
                style={{
                  background:
                    '#4B0082',
                }}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Attendance
                  </>
                )}
              </button>
            )}
          </div>

          {canEdit && (
            <p className="text-xs text-slate-400 mb-4 bg-slate-50 rounded-lg p-2">
              Click a player's
              status badge to cycle
              through:{' '}
              <span className="text-emerald-600 font-medium">
                Present
              </span>{' '}
              →{' '}
              <span className="text-red-600 font-medium">
                Absent
              </span>{' '}
              →{' '}
              <span className="text-amber-600 font-medium">
                Excused
              </span>
            </p>
          )}

          {squadPlayers.length ===
          0 ? (
            <p className="text-slate-400 text-sm text-center py-8">
              No players in this
              squad's roster.
            </p>
          ) : (
            <div className="space-y-2">

              {squadPlayers.map(
                (player: any) => {
                  const status =
                    attendance[
                      player._id
                    ] || 'Present'

                  return (
                    <div
                      key={
                        player._id
                      }
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        status ===
                        'Present'
                          ? 'bg-emerald-50'
                          : status ===
                              'Absent'
                            ? 'bg-red-50'
                            : 'bg-amber-50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-700 font-bold text-sm">
                          {player.fullName?.charAt(
                            0
                          )}
                        </span>
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {
                            player.fullName
                          }
                        </p>

                        <p className="text-xs text-slate-400">
                          #
                          {
                            player.jerseyNumber
                          }{' '}
                          ·{' '}
                          {
                            player.position
                          }
                        </p>
                      </div>

                      {canEdit ? (
                        <button
                          onClick={() =>
                            toggle(
                              player._id
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${statusColors[status]}`}
                        >
                          {status ===
                          'Present'
                            ? '✓ Present'
                            : status ===
                                'Absent'
                              ? '✗ Absent'
                              : '~ Excused'}
                        </button>
                      ) : (
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[status]}`}
                        >
                          {status}
                        </span>
                      )}
                    </div>
                  )
                }
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}