'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  User,
  Edit,
  Trash2,
  ChevronRight,
  Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AddPlayerModal from '@/components/forms/AddPlayerModal'

const POSITIONS = [
  'Goalkeeper',
  'Defender',
  'Midfielder',
  'Striker',
]

const STATUSES = [
  'Fit',
  'Injured',
  'Recovering',
  'Suspended',
]

const squadOrder = [
  'First Team',
  'Regional',
  'Junior',
  'NFD',
]

const squadLabels: Record<string, string> = {
  'First Team': 'NWU First XI',
  Regional: 'NWU Regional Team',
  Junior: 'NWU Junior Team',
  NFD: 'NWU NFD Team',
}

const squadColors: Record<string, string> = {
  'First Team': 'from-purple-900 to-purple-700',
  Regional: 'from-blue-900 to-blue-700',
  Junior: 'from-emerald-900 to-emerald-700',
  NFD: 'from-orange-900 to-orange-700',
}

const posColors: Record<string, string> = {
  Goalkeeper: 'bg-amber-100 text-amber-800',
  Defender: 'bg-blue-100 text-blue-800',
  Midfielder: 'bg-purple-100 text-purple-800',
  Striker: 'bg-rose-100 text-rose-800',
}

interface Player {
  _id: string
  fullName: string
  nickname?: string
  studentNumber?: string
  jerseyNumber?: number
  position?: string
  fitnessStatus?: string
  profileImage?: string
  squad?: {
    _id: string
    name: string
    type: string
  } | string | null
}

interface PlayerListProps {
  initialPlayers: Player[]
  role: string
}

function PlayerCard({
  player,
  canEdit,
  onDelete,
}: {
  player: Player
  canEdit: boolean
  onDelete: (id: string, name: string) => void
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="card hover:shadow-md transition-all group relative flex flex-col">
      <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-purple-900 flex items-center justify-center">
        <span className="text-white text-xs font-black">
          #{player.jerseyNumber ?? '-'}
        </span>
      </div>

      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden flex-shrink-0">
        {player.profileImage && !imgError ? (
          <img
            src={player.profileImage}
            alt={player.fullName}
            className="w-full h-full object-cover rounded-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-white text-xl font-bold">
            {player.fullName?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-slate-900 text-center text-sm mb-0.5 leading-tight">
        {player.fullName}
      </h3>

      {player.nickname && (
        <p className="text-purple-600 text-xs text-center mb-1">
          "{player.nickname}"
        </p>
      )}

      <p className="text-slate-400 text-xs text-center mb-3">
        {player.studentNumber || 'No student number'}
      </p>

      <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
        <span
          className={`badge ${
            posColors[player.position || ''] ||
            'bg-slate-100 text-slate-700'
          }`}
        >
          {player.position || 'Unknown'}
        </span>

        <span
          className={`badge badge-${(
            player.fitnessStatus || 'fit'
          ).toLowerCase()}`}
        >
          {player.fitnessStatus || 'Fit'}
        </span>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          href={`/players/${player._id}`}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
        >
          View
          <ChevronRight size={11} />
        </Link>

        {canEdit && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/players/${player._id}/edit`}
              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Edit size={12} />
            </Link>

            <button
              type="button"
              onClick={() =>
                onDelete(player._id, player.fullName)
              }
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayerList({
  initialPlayers,
  role,
}: PlayerListProps) {
  const [players, setPlayers] =
    useState<Player[]>(initialPlayers)

  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('')
  const [status, setStatus] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [activeSquad, setActiveSquad] =
    useState<string>('all')
  const [deleting, setDeleting] = useState(false)

  const canEdit = ['admin', 'coach'].includes(role)

  const teams = useMemo(() => {
    const map = new Map<string, any>()

    players.forEach((player) => {
      if (
        player.squad &&
        typeof player.squad === 'object'
      ) {
        map.set(player.squad._id, player.squad)
      }
    })

    return Array.from(map.values())
  }, [players])

  const filtered = useMemo(() => {
    const searchTerm = search.toLowerCase().trim()

    return players.filter((player) => {
      const matchSearch =
        !searchTerm ||
        player.fullName
          ?.toLowerCase()
          .includes(searchTerm) ||
        player.nickname
          ?.toLowerCase()
          .includes(searchTerm)

      const matchPosition =
        !position || player.position === position

      const matchStatus =
        !status || player.fitnessStatus === status

      return (
        matchSearch &&
        matchPosition &&
        matchStatus
      )
    })
  }, [players, search, position, status])

  const grouped = useMemo(() => {
    const result: Record<string, Player[]> = {
      'First Team': [],
      Regional: [],
      Junior: [],
      NFD: [],
      Unassigned: [],
    }

    filtered.forEach((player) => {
      let type = 'Unassigned'

      if (
        player.squad &&
        typeof player.squad === 'object'
      ) {
        type = player.squad.type || 'Unassigned'
      }

      if (!result[type]) {
        result[type] = []
      }

      result[type].push(player)
    })

    return result
  }, [filtered])

  const totalBySquad = useMemo(() => {
    const totals: Record<string, number> = {}

    squadOrder.forEach((type) => {
      totals[type] =
        grouped[type]?.length || 0
    })

    return totals
  }, [grouped])

  const displaySquads =
    activeSquad === 'all'
      ? squadOrder
      : [activeSquad]

  const deletePlayer = useCallback(
    async (id: string, name: string) => {
      if (deleting) return

      const confirmed = window.confirm(
        `Delete ${name}? This cannot be undone.`
      )

      if (!confirmed) return

      try {
        setDeleting(true)

        const response = await fetch(
          `/api/players/${id}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          throw new Error('Failed to delete player')
        }

        setPlayers((current) =>
          current.filter(
            (player) => player._id !== id
          )
        )

        toast.success('Player deleted')
      } catch (error) {
        console.error(error)
        toast.error('Failed to delete player')
      } finally {
        setDeleting(false)
      }
    },
    [deleting]
  )

  const handlePlayerAdded = () => {
    setShowAdd(false)

    /*
     * For now we refresh the page so the new player
     * is loaded from the server.
     */
    window.location.reload()
  }

  return (
    <>
      <div className="p-8">
        {/* Squad tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveSquad('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSquad === 'all'
                ? 'bg-purple-900 text-white shadow'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'
            }`}
          >
            <Shield size={14} />

            All Squads

            <span className="text-xs opacity-70">
              ({filtered.length})
            </span>
          </button>

          {squadOrder.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                setActiveSquad(type)
              }
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeSquad === type
                  ? 'bg-purple-900 text-white shadow'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'
              }`}
            >
              {squadLabels[type] || type}

              <span className="text-xs opacity-70">
                ({totalBySquad[type] || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name or nickname..."
              className="input-field pl-9"
            />
          </div>

          <select
            value={position}
            onChange={(event) =>
              setPosition(event.target.value)
            }
            className="input-field w-full sm:w-44"
          >
            <option value="">
              All positions
            </option>

            {POSITIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="input-field w-full sm:w-44"
          >
            <option value="">
              All statuses
            </option>

            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {canEdit && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="btn-primary whitespace-nowrap"
              style={{ background: '#4B0082' }}
            >
              <Plus size={16} />
              Add Player
            </button>
          )}
        </div>

        {/* Players */}
        <div className="space-y-10">
          {displaySquads.map((squadType) => {
            const squadPlayers =
              grouped[squadType] || []

            if (
              squadPlayers.length === 0 &&
              activeSquad !== 'all'
            ) {
              return (
                <div
                  key={squadType}
                  className="card text-center py-12"
                >
                  <User
                    size={36}
                    className="text-slate-300 mx-auto mb-3"
                  />

                  <p className="text-slate-500">
                    No players found matching your
                    filters
                  </p>
                </div>
              )
            }

            if (squadPlayers.length === 0) {
              return null
            }

            const squad = teams.find(
              (team: any) =>
                team.type === squadType
            )

            return (
              <div key={squadType}>
                {/* Squad heading */}
                <div
                  className={`bg-gradient-to-r ${
                    squadColors[squadType] ||
                    'from-slate-800 to-slate-600'
                  } rounded-2xl p-5 mb-4 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Shield
                        size={18}
                        className="text-white"
                      />
                    </div>

                    <div>
                      <h2 className="text-white font-black text-lg">
                        {squad?.name ||
                          squadLabels[squadType] ||
                          squadType}
                      </h2>

                      <p className="text-white/70 text-sm">
                        {squadPlayers.length} players
                        {' · '}
                        Season 2025
                      </p>
                    </div>
                  </div>

                  {squad && (
                    <Link
                      href={`/teams/${squad._id}`}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1"
                    >
                      Manage
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>

                {/* Positions */}
                {[
                  'Goalkeeper',
                  'Defender',
                  'Midfielder',
                  'Striker',
                ].map((pos) => {
                  const positionPlayers =
                    squadPlayers.filter(
                      (player) =>
                        player.position === pos
                    )

                  if (
                    positionPlayers.length === 0
                  ) {
                    return null
                  }

                  return (
                    <div
                      key={pos}
                      className="mb-6"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`badge ${posColors[pos]}`}
                        >
                          {pos}s
                        </span>

                        <span className="text-slate-400 text-xs">
                          ({positionPlayers.length})
                        </span>

                        <div className="flex-1 h-px bg-slate-100" />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {positionPlayers.map(
                          (player) => (
                            <PlayerCard
                              key={player._id}
                              player={player}
                              canEdit={canEdit}
                              onDelete={deletePlayer}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Other positions */}
                {squadPlayers.some(
                  (player) =>
                    ![
                      'Goalkeeper',
                      'Defender',
                      'Midfielder',
                      'Striker',
                    ].includes(
                      player.position || ''
                    )
                ) && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge bg-slate-100 text-slate-700">
                        Other
                      </span>

                      <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {squadPlayers
                        .filter(
                          (player) =>
                            ![
                              'Goalkeeper',
                              'Defender',
                              'Midfielder',
                              'Striker',
                            ].includes(
                              player.position || ''
                            )
                        )
                        .map((player) => (
                          <PlayerCard
                            key={player._id}
                            player={player}
                            canEdit={canEdit}
                            onDelete={deletePlayer}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="card text-center py-16">
              <User
                size={40}
                className="text-slate-300 mx-auto mb-3"
              />

              <p className="text-slate-500 font-medium">
                No players found
              </p>

              <p className="text-slate-400 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddPlayerModal
          onClose={() => setShowAdd(false)}
          onSuccess={handlePlayerAdded}
        />
      )}
    </>
  )
}