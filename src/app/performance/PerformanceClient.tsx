'use client'

import { useMemo, useState } from 'react'
import Header from '@/components/layout/Header'
import {
  Activity,
  Trophy,
  Target,
  Clock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const POS_COLORS = [
  '#4B0082',
  '#7c3aed',
  '#0891b2',
  '#059669',
]

interface PerformanceClientProps {
  initialStats: any[]
  teams: any[]
}

export default function PerformanceClient({
  initialStats,
  teams,
}: PerformanceClientProps) {
  const [selectedSquad, setSelectedSquad] =
    useState('')

  /*
   * PlayerStats contains one record per
   * player per match.
   *
   * The old Performance page treated the
   * /api/stats response as though it already
   * contained season totals.
   *
   * Here we calculate those totals properly.
   */
  const players = useMemo(() => {
    const playerMap = new Map<
      string,
      any
    >()

    initialStats.forEach((stat: any) => {
      const player = stat.player

      if (!player?._id) return

      const playerId = String(player._id)

      const playerSquad =
        player.squad?._id
          ? String(player.squad._id)
          : player.squad
            ? String(player.squad)
            : ''

      /*
       * Apply squad filter.
       */
      if (
        selectedSquad &&
        playerSquad !== selectedSquad
      ) {
        return
      }

      if (!playerMap.has(playerId)) {
        playerMap.set(playerId, {
          _id: playerId,
          player,
          fullName:
            player.fullName ?? '',
          position:
            player.position ?? '',
          squad: playerSquad,

          totalGoals: 0,
          totalAssists: 0,
          totalMinutes: 0,
          yellowCards: 0,
          redCards: 0,
          saves: 0,
          tackles: 0,

          matches: 0,

          ratingTotal: 0,
          ratingCount: 0,
        })
      }

      const aggregate =
        playerMap.get(playerId)

      aggregate.totalGoals +=
        Number(stat.goals ?? 0)

      aggregate.totalAssists +=
        Number(stat.assists ?? 0)

      aggregate.totalMinutes +=
        Number(
          stat.minutesPlayed ?? 0
        )

      aggregate.yellowCards +=
        Number(
          stat.yellowCards ?? 0
        )

      aggregate.redCards +=
        Number(stat.redCards ?? 0)

      aggregate.saves +=
        Number(stat.saves ?? 0)

      aggregate.tackles +=
        Number(stat.tackles ?? 0)

      aggregate.matches += 1

      const rating =
        Number(stat.rating ?? 0)

      if (rating > 0) {
        aggregate.ratingTotal +=
          rating

        aggregate.ratingCount += 1
      }
    })

    return Array.from(
      playerMap.values()
    ).map((player: any) => ({
      ...player,

      averageRating:
        player.ratingCount > 0
          ? Number(
              (
                player.ratingTotal /
                player.ratingCount
              ).toFixed(1)
            )
          : 0,
    }))
  }, [initialStats, selectedSquad])

  const topScorers = useMemo(
    () =>
      [...players]
        .sort(
          (a, b) =>
            b.totalGoals -
            a.totalGoals
        )
        .slice(0, 10),
    [players]
  )

  const topAssists = useMemo(
    () =>
      [...players]
        .sort(
          (a, b) =>
            b.totalAssists -
            a.totalAssists
        )
        .slice(0, 5),
    [players]
  )

  const chartData = useMemo(
    () =>
      topScorers.map((player) => ({
        name: (
          player.fullName ?? ''
        )
          .split(' ')
          .slice(-1)[0],

        Goals:
          player.totalGoals ?? 0,

        Assists:
          player.totalAssists ?? 0,
      })),
    [topScorers]
  )

  return (
    <div className="animate-fade-in">
      <Header
        title="Performance"
        subtitle="Player stats & season analytics"
      />

      <div className="p-8">

        {/* Squad filter */}
        <div className="flex gap-2 mb-6 flex-wrap">

          <button
            onClick={() =>
              setSelectedSquad('')
            }
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              !selectedSquad
                ? 'bg-purple-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'
            }`}
          >
            All Squads
          </button>

          {teams.map((team: any) => (
            <button
              key={team._id}
              onClick={() =>
                setSelectedSquad(
                  String(team._id)
                )
              }
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedSquad ===
                String(team._id)
                  ? 'bg-purple-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'
              }`}
            >
              {team.name}
            </button>
          ))}

        </div>

        <div className="space-y-6">

          {/* Goals + Assists chart */}
          {chartData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy
                  size={16}
                  className="text-amber-500"
                />
                Top Performers
              </h2>

              <ResponsiveContainer
                width="100%"
                height={220}
              >
                <BarChart
                  data={chartData}
                  barSize={20}
                  barGap={4}
                >
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                      fill: '#94a3b8',
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: '#94a3b8',
                    }}
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="Goals"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  >
                    {chartData.map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill={
                            POS_COLORS[
                              index %
                                POS_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Bar>

                  <Bar
                    dataKey="Assists"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    fill="#e8a020"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top Scorers */}
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy
                  size={16}
                  className="text-purple-600"
                />
                Top Scorers
              </h2>

              {topScorers.length ===
              0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  No stats recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {topScorers.map(
                    (
                      player: any,
                      index: number
                    ) => {
                      const name =
                        player.fullName ||
                        '—'

                      return (
                        <div
                          key={
                            player._id
                          }
                          className="flex items-center gap-3"
                        >
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                              index === 0
                                ? 'bg-amber-100 text-amber-700'
                                : index ===
                                    1
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-orange-50 text-orange-600'
                            }`}
                          >
                            {index + 1}
                          </span>

                          <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-sm flex-shrink-0">
                            {name.charAt(
                              0
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {name}
                            </p>

                            <p className="text-xs text-slate-400">
                              {
                                player.position
                              }{' '}
                              ·{' '}
                              {
                                player.matches
                              }{' '}
                              match
                              {player.matches !==
                              1
                                ? 'es'
                                : ''}
                            </p>
                          </div>

                          <div className="flex gap-4 text-right flex-shrink-0">
                            <div>
                              <p className="text-sm font-bold text-purple-700">
                                {
                                  player.totalGoals
                                }
                              </p>

                              <p className="text-xs text-slate-400">
                                Goals
                              </p>
                            </div>

                            <div>
                              <p className="text-sm font-bold text-blue-600">
                                {
                                  player.totalAssists
                                }
                              </p>

                              <p className="text-xs text-slate-400">
                                Assists
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              )}
            </div>

            {/* Top Assists */}
            <div className="card">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Target
                  size={16}
                  className="text-blue-600"
                />
                Top Assists
              </h2>

              {topAssists.length ===
              0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  No stats recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {topAssists.map(
                    (
                      player: any,
                      index: number
                    ) => {
                      const name =
                        player.fullName ||
                        '—'

                      return (
                        <div
                          key={
                            player._id
                          }
                          className="flex items-center gap-3"
                        >
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                              index === 0
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {index + 1}
                          </span>

                          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold text-sm flex-shrink-0">
                            {name.charAt(
                              0
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {name}
                            </p>

                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock
                                size={10}
                              />
                              {
                                player.totalMinutes
                              }{' '}
                              mins played
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-blue-600">
                              {
                                player.totalAssists
                              }
                            </p>

                            <p className="text-xs text-slate-400">
                              Assists
                            </p>
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              )}
            </div>

          </div>

          {players.length === 0 && (
            <div className="card text-center py-16">
              <Activity
                size={40}
                className="text-slate-300 mx-auto mb-3"
              />

              <p className="text-slate-500 font-medium">
                No performance data yet
              </p>

              <p className="text-slate-400 text-sm mt-1">
                Record match stats to
                see performance
                analytics
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}