'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { Activity, Trophy, Target, Clock } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useFetch } from '@/lib/use-fetch'

const POS_COLORS = ['#4B0082', '#7c3aed', '#0891b2', '#059669']

export default function PerformancePage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [selectedSquad, setSelectedSquad] = useState('')

  // ── useFetch replaces useState + fetchAll + useEffect ────────────────────
  // Performance stats aggregate across all matches — cache 30 seconds
  const url = `/api/stats${selectedSquad ? `?squad=${selectedSquad}` : ''}`
  const { data: statsData, loading } = useFetch<any>(url, { ttlMs: 30_000 })

  const { data: teamsData } = useFetch<any>('/api/teams', { ttlMs: 300_000 })
  const teams: any[] = teamsData?.teams ?? (Array.isArray(teamsData) ? teamsData : [])

  // Support both { players: [...] } and a flat array response from /api/stats
  const players: any[] = statsData?.players ?? statsData?.topScorers ?? (Array.isArray(statsData) ? statsData : [])

  const topScorers  = [...players].sort((a, b) => (b.totalGoals  ?? b.goals  ?? 0) - (a.totalGoals  ?? a.goals  ?? 0)).slice(0, 10)
  const topAssists  = [...players].sort((a, b) => (b.totalAssists ?? b.assists ?? 0) - (a.totalAssists ?? a.assists ?? 0)).slice(0, 5)

  const chartData = topScorers.map(p => ({
    name: (p.player?.fullName ?? p.fullName ?? '').split(' ').slice(-1)[0],
    Goals:   p.totalGoals   ?? p.goals   ?? 0,
    Assists: p.totalAssists ?? p.assists ?? 0,
  }))

  return (
    <div className="animate-fade-in">
      <Header title="Performance" subtitle="Player stats & season analytics" />
      <div className="p-8">
        {/* Squad filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setSelectedSquad('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!selectedSquad ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
            All Squads
          </button>
          {teams.map(t => (
            <button key={t._id} onClick={() => setSelectedSquad(t._id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedSquad === t._id ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
              {t.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Goals + Assists chart */}
            {chartData.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Trophy size={16} className="text-amber-500" /> Top Performers
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barSize={20} barGap={4}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="Goals" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={POS_COLORS[i % POS_COLORS.length]} />)}
                    </Bar>
                    <Bar dataKey="Assists" radius={[4, 4, 0, 0]} fill="#e8a020" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Scorers */}
              <div className="card">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Trophy size={16} className="text-purple-600" /> Top Scorers
                </h2>
                {topScorers.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No stats recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {topScorers.map((p: any, i: number) => {
                      const name    = p.player?.fullName ?? p.fullName ?? '—'
                      const goals   = p.totalGoals   ?? p.goals   ?? 0
                      const assists = p.totalAssists ?? p.assists ?? 0
                      const matches = p.matches ?? 0
                      return (
                        <div key={p._id ?? i} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'}`}>
                            {i + 1}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-sm flex-shrink-0">
                            {name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                            <p className="text-xs text-slate-400">
                              {p.player?.position ?? p.position ?? ''} · {matches} match{matches !== 1 ? 'es' : ''}
                            </p>
                          </div>
                          <div className="flex gap-4 text-right flex-shrink-0">
                            <div>
                              <p className="text-sm font-bold text-purple-700">{goals}</p>
                              <p className="text-xs text-slate-400">Goals</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-blue-600">{assists}</p>
                              <p className="text-xs text-slate-400">Assists</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Top Assists */}
              <div className="card">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Target size={16} className="text-blue-600" /> Top Assists
                </h2>
                {topAssists.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No stats recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {topAssists.map((p: any, i: number) => {
                      const name    = p.player?.fullName ?? p.fullName ?? '—'
                      const assists = p.totalAssists ?? p.assists ?? 0
                      const minutes = p.totalMinutes ?? p.minutesPlayed ?? 0
                      return (
                        <div key={p._id ?? i} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {i + 1}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold text-sm flex-shrink-0">
                            {name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {minutes} mins played
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-blue-600">{assists}</p>
                            <p className="text-xs text-slate-400">Assists</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {players.length === 0 && (
              <div className="card text-center py-16">
                <Activity size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No performance data yet</p>
                <p className="text-slate-400 text-sm mt-1">Record match stats to see performance analytics</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
