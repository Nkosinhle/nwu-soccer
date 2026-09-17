'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import {
  Plus,
  HeartPulse,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const severityColors: Record<string, string> = {
  Minor: 'bg-amber-100 text-amber-800',
  Moderate: 'bg-orange-100 text-orange-800',
  Severe: 'bg-red-100 text-red-800',
}

const recoveryColors: Record<string, string> = {
  Active: 'bg-red-100 text-red-800',
  Recovering: 'bg-amber-100 text-amber-800',
  Cleared: 'bg-emerald-100 text-emerald-800',
}

function AddInjuryModal({
  players,
  onClose,
  onSuccess,
}: {
  players: any[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm()

  const onSubmit = async (data: any) => {
    setLoading(true)

    try {
      const res = await fetch('/api/medical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)

        throw new Error(
          errorData?.error || 'Failed to add record'
        )
      }

      toast.success('Injury record added')
      onSuccess()
    } catch (error: any) {
      toast.error(
        error.message || 'Failed to add record'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse
              size={18}
              className="text-red-500"
            />
            Record Injury
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">
                Player *
              </label>

              <select
                {...register('player', {
                  required: true,
                })}
                className="input-field"
              >
                <option value="">
                  Select player
                </option>

                {players.map((player) => (
                  <option
                    key={player._id}
                    value={player._id}
                  >
                    {player.fullName} — #
                    {player.jerseyNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Injury Type *
              </label>

              <input
                {...register('injuryType', {
                  required: true,
                })}
                placeholder="e.g. Hamstring strain"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Body Part
              </label>

              <input
                {...register('bodyPart')}
                placeholder="e.g. Left hamstring"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Severity
              </label>

              <select
                {...register('severity')}
                className="input-field"
              >
                <option>Minor</option>
                <option>Moderate</option>
                <option>Severe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Date of Injury *
              </label>

              <input
                {...register('dateOfInjury', {
                  required: true,
                })}
                type="date"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Recovery Status
              </label>

              <select
                {...register('recoveryStatus')}
                className="input-field"
              >
                <option>Active</option>
                <option>Recovering</option>
                <option>Cleared</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">
                Est. Recovery Date
              </label>

              <input
                {...register(
                  'estimatedRecoveryDate'
                )}
                type="date"
                className="input-field"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">
                Description *
              </label>

              <textarea
                {...register('description', {
                  required: true,
                })}
                rows={2}
                className="input-field resize-none"
                placeholder="Describe the injury..."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-slate-700 mb-1">
                Medical Notes
              </label>

              <textarea
                {...register('notes')}
                rows={2}
                className="input-field resize-none"
                placeholder="Treatment notes..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center"
              style={{ background: '#4B0082' }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                'Save Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UpdateStatusModal({
  record,
  onClose,
  onSuccess,
}: {
  record: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [status, setStatus] = useState(
    record.recoveryStatus
  )
  const [cleared, setCleared] = useState(
    record.clearedForPlay
  )
  const [notes, setNotes] = useState(
    record.notes || ''
  )
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)

    try {
      const res = await fetch(
        `/api/medical/${record._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recoveryStatus: status,
            clearedForPlay: cleared,
            notes,
          }),
        }
      )

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => null)

        throw new Error(
          errorData?.error ||
            'Failed to update record'
        )
      }

      toast.success('Record updated!')
      onSuccess()
    } catch (error: any) {
      toast.error(
        error.message || 'Failed to update'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-bold text-slate-900">
            Update Recovery Status
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 font-medium">
            {record.player?.fullName} —{' '}
            {record.injuryType}
          </p>

          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Recovery Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="input-field"
            >
              <option>Active</option>
              <option>Recovering</option>
              <option>Cleared</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="cleared"
              checked={Boolean(cleared)}
              onChange={(e) =>
                setCleared(e.target.checked)
              }
              className="w-4 h-4 accent-purple-700"
            />

            <label
              htmlFor="cleared"
              className="text-sm text-slate-700"
            >
              Cleared for play
            </label>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Update Notes
            </label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>

            <button
              onClick={save}
              disabled={loading}
              className="btn-primary flex-1 justify-center"
              style={{ background: '#4B0082' }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MedicalClientProps {
  initialRecords: any[]
  players: any[]
  role: string
}

export default function MedicalClient({
  initialRecords,
  players,
  role,
}: MedicalClientProps) {
  const [records, setRecords] =
    useState<any[]>(initialRecords)

  const [showAdd, setShowAdd] =
    useState(false)

  const [editRecord, setEditRecord] =
    useState<any>(null)

  const [filter, setFilter] =
    useState('')

  // POST and DELETE permissions
  const canCreateDelete = [
    'admin',
    'physio',
  ].includes(role)

  // PUT permissions
  const canUpdate = [
    'admin',
    'coach',
    'physio',
  ].includes(role)

  const refreshRecords = async () => {
    try {
      const res = await fetch('/api/medical', {
        cache: 'no-store',
      })

      if (!res.ok) return

      const data = await res.json()

      setRecords(
        Array.isArray(data) ? data : []
      )
    } catch (error) {
      console.error(
        'Failed to refresh medical records:',
        error
      )
    }
  }

  const deleteRecord = async (
    id: string
  ) => {
    if (
      !confirm(
        'Delete this medical record?'
      )
    ) {
      return
    }

    try {
      const res = await fetch(
        `/api/medical/${id}`,
        {
          method: 'DELETE',
        }
      )

      if (!res.ok) {
        throw new Error(
          'Failed to delete record'
        )
      }

      toast.success('Record deleted')

      setRecords((current) =>
        current.filter(
          (record) => record._id !== id
        )
      )
    } catch {
      toast.error(
        'Failed to delete'
      )
    }
  }

  const active = records.filter(
    (record) =>
      record.recoveryStatus ===
      'Active'
  )

  const recovering = records.filter(
    (record) =>
      record.recoveryStatus ===
      'Recovering'
  )

  const cleared = records.filter(
    (record) =>
      record.recoveryStatus ===
      'Cleared'
  )

  const displayed = filter
    ? records.filter(
        (record) =>
          record.recoveryStatus ===
          filter
      )
    : records

  return (
    <div className="animate-fade-in">
      <Header
        title="Medical & Injuries"
        subtitle="Track player health, injuries and recovery"
      />

      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card border-l-4 border-red-400">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={20}
                className="text-red-500"
              />

              <div>
                <p className="text-2xl font-black text-red-600">
                  {active.length}
                </p>
                <p className="text-xs text-slate-500">
                  Active Injuries
                </p>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-amber-400">
            <div className="flex items-center gap-3">
              <Clock
                size={20}
                className="text-amber-500"
              />

              <div>
                <p className="text-2xl font-black text-amber-600">
                  {recovering.length}
                </p>
                <p className="text-xs text-slate-500">
                  Recovering
                </p>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-emerald-400">
            <div className="flex items-center gap-3">
              <CheckCircle
                size={20}
                className="text-emerald-500"
              />

              <div>
                <p className="text-2xl font-black text-emerald-600">
                  {cleared.length}
                </p>
                <p className="text-xs text-slate-500">
                  Cleared
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5 items-center">
          {[
            '',
            'Active',
            'Recovering',
            'Cleared',
          ].map((value) => (
            <button
              key={value}
              onClick={() =>
                setFilter(value)
              }
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === value
                  ? 'bg-purple-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'
              }`}
            >
              {value || 'All'}
            </button>
          ))}

          <div className="ml-auto flex gap-2">
            <button
              onClick={() =>
                window.open(
                  '/api/export?type=medical',
                  '_blank'
                )
              }
              className="btn-secondary text-sm"
            >
              ⬇ Export CSV
            </button>

            {canCreateDelete && (
              <button
                onClick={() =>
                  setShowAdd(true)
                }
                className="btn-primary"
                style={{
                  background: '#4B0082',
                }}
              >
                <Plus size={16} />
                Record Injury
              </button>
            )}
          </div>
        </div>

        {displayed.length === 0 ? (
          <div className="card text-center py-12">
            <HeartPulse
              size={40}
              className="text-slate-300 mx-auto mb-3"
            />
            <p className="text-slate-500">
              No injury records found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(
              (record: any) => (
                <div
                  key={record._id}
                  className="card hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-700 font-bold text-sm">
                        {record.player?.fullName?.charAt(
                          0
                        )}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {
                              record.player
                                ?.fullName
                            }
                          </h3>

                          <p className="text-xs text-slate-400">
                            {
                              record.player
                                ?.position
                            }{' '}
                            · #
                            {
                              record.player
                                ?.jerseyNumber
                            }
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`badge ${
                              severityColors[
                                record.severity
                              ] ||
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {
                              record.severity
                            }
                          </span>

                          <span
                            className={`badge ${
                              recoveryColors[
                                record
                                  .recoveryStatus
                              ] ||
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {
                              record.recoveryStatus
                            }
                          </span>

                          {record.clearedForPlay && (
                            <span className="badge bg-emerald-100 text-emerald-700">
                              ✓ Cleared
                            </span>
                          )}

                          {(canUpdate ||
                            canCreateDelete) && (
                            <div className="flex gap-1 ml-1">
                              {canUpdate && (
                                <button
                                  onClick={() =>
                                    setEditRecord(
                                      record
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Update recovery status"
                                >
                                  <Edit
                                    size={
                                      13
                                    }
                                  />
                                </button>
                              )}

                              {canCreateDelete && (
                                <button
                                  onClick={() =>
                                    deleteRecord(
                                      record._id
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete record"
                                >
                                  <Trash2
                                    size={
                                      13
                                    }
                                  />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400">
                            Injury
                          </p>
                          <p className="font-medium text-slate-700">
                            {
                              record.injuryType
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400">
                            Body Part
                          </p>
                          <p className="font-medium text-slate-700">
                            {record.bodyPart ||
                              '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400">
                            Date
                          </p>
                          <p className="font-medium text-slate-700">
                            {new Date(
                              record.dateOfInjury
                            ).toLocaleDateString(
                              'en-ZA'
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400">
                            Est. Recovery
                          </p>
                          <p className="font-medium text-slate-700">
                            {record.estimatedRecoveryDate
                              ? new Date(
                                  record.estimatedRecoveryDate
                                ).toLocaleDateString(
                                  'en-ZA'
                                )
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {record.description && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2">
                          {
                            record.description
                          }
                        </p>
                      )}

                      {record.notes && (
                        <p className="text-xs text-blue-600 mt-1 italic">
                          📋 {record.notes}
                        </p>
                      )}

                      <p className="text-xs text-slate-400 mt-2">
                        Recorded by{' '}
                        {record.recordedBy
                          ?.name || '—'}{' '}
                        ·{' '}
                        {new Date(
                          record.createdAt
                        ).toLocaleDateString(
                          'en-ZA'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <AddInjuryModal
          players={players}
          onClose={() =>
            setShowAdd(false)
          }
          onSuccess={() => {
            setShowAdd(false)
            refreshRecords()
          }}
        />
      )}

      {editRecord && (
        <UpdateStatusModal
          record={editRecord}
          onClose={() =>
            setEditRecord(null)
          }
          onSuccess={() => {
            setEditRecord(null)
            refreshRecords()
          }}
        />
      )}
    </div>
  )
}