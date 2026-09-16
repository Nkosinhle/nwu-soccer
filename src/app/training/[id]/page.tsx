'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Check, X as XIcon, Clock, Save, Loader2, Users } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

const statusOptions = ['Present', 'Absent', 'Excused'] as const
type AttendanceStatus = typeof statusOptions[number]

const statusColors: Record<AttendanceStatus, string> = {
  Present: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Absent:  'bg-red-100 text-red-700 border-red-200',
  Excused: 'bg-amber-100 text-amber-700 border-amber-200',
}

export default function TrainingDetailPage() {
  const { id }   = useParams()
  const { data: session } = useSession()
  const role     = (session?.user as any)?.role
  const canEdit  = ['admin', 'coach', 'support_staff'].includes(role)

  const [training, setTraining]   = useState<any>(null)
  const [squadPlayers, setSquadPlayers] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    fetch(`/api/attendance/${id}`)
      .then(r => r.json())
      .then(async data => {
        setTraining(data)
        // Build attendance map from existing records
        const map: Record<string, AttendanceStatus> = {}
        ;(data.attendance || []).forEach((a: any) => {
          if (a.player?._id) map[a.player._id] = a.status
        })
        setAttendance(map)

        // Get all squad players to show those not yet in attendance
        if (data.squad?._id) {
          const teamData = await fetch(`/api/teams/${data.squad._id}`).then(r => r.json())
          setSquadPlayers(teamData.players || [])
          // Default unrecorded players to Present
          ;(teamData.players || []).forEach((p: any) => {
            if (!map[p._id]) map[p._id] = 'Present'
          })
          setAttendance({ ...map })
        }
        setLoading(false)
      })
  }, [id])

  const toggle = (playerId: string) => {
    setAttendance(prev => {
      const current = prev[playerId] || 'Present'
      const next: AttendanceStatus = current === 'Present' ? 'Absent' : current === 'Absent' ? 'Excused' : 'Present'
      return { ...prev, [playerId]: next }
    })
  }

  const saveAttendance = async () => {
    setSaving(true)
    const attendanceArray = squadPlayers.map(p => ({
      player: p._id,
      status: attendance[p._id] || 'Present',
    }))
    const res = await fetch(`/api/attendance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance: attendanceArray }),
    })
    setSaving(false)
    if (res.ok) toast.success('Attendance saved!')
    else toast.error('Failed to save attendance')
  }

  if (loading || !training) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const present = Object.values(attendance).filter(s => s === 'Present').length
  const absent  = Object.values(attendance).filter(s => s === 'Absent').length
  const excused = Object.values(attendance).filter(s => s === 'Excused').length
  const total   = squadPlayers.length
  const rate    = total ? Math.round(present / total * 100) : 0

  return (
    <div className="animate-fade-in">
      <Header title={training.title} subtitle={`${training.type} · ${training.location}`} />
      <div className="p-8">
        <Link href="/training" className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-700 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Training
        </Link>

        {/* Session Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center py-4 border-l-4 border-purple-500">
            <p className="text-2xl font-black text-purple-700">{present}</p>
            <p className="text-xs text-slate-500">Present</p>
          </div>
          <div className="card text-center py-4 border-l-4 border-red-400">
            <p className="text-2xl font-black text-red-600">{absent}</p>
            <p className="text-xs text-slate-500">Absent</p>
          </div>
          <div className="card text-center py-4 border-l-4 border-amber-400">
            <p className="text-2xl font-black text-amber-600">{excused}</p>
            <p className="text-xs text-slate-500">Excused</p>
          </div>
          <div className="card text-center py-4 border-l-4 border-emerald-400">
            <p className={`text-2xl font-black ${rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{rate}%</p>
            <p className="text-xs text-slate-500">Attendance Rate</p>
          </div>
        </div>

        {/* Session details card */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-slate-400 text-xs">Date</p><p className="font-medium">{new Date(training.date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
            <div><p className="text-slate-400 text-xs">Time</p><p className="font-medium">{new Date(training.date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p></div>
            <div><p className="text-slate-400 text-xs">Duration</p><p className="font-medium">{training.duration} minutes</p></div>
            <div><p className="text-slate-400 text-xs">Type</p><p className="font-medium">{training.type}</p></div>
          </div>
          {training.notes && <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100 italic">{training.notes}</p>}
        </div>

        {/* Attendance marking */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-purple-600" /> Attendance ({total} players)
            </h3>
            {canEdit && (
              <button onClick={saveAttendance} disabled={saving}
                className="btn-primary" style={{ background: '#4B0082' }}>
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Save size={14} />Save Attendance</>}
              </button>
            )}
          </div>

          {canEdit && (
            <p className="text-xs text-slate-400 mb-4 bg-slate-50 rounded-lg p-2">
              Click a player's status badge to cycle through: <span className="text-emerald-600 font-medium">Present</span> → <span className="text-red-600 font-medium">Absent</span> → <span className="text-amber-600 font-medium">Excused</span>
            </p>
          )}

          {squadPlayers.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No players in this squad's roster.</p>
          ) : (
            <div className="space-y-2">
              {squadPlayers.map((p: any) => {
                const status = attendance[p._id] || 'Present'
                return (
                  <div key={p._id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${status === 'Present' ? 'bg-emerald-50' : status === 'Absent' ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-700 font-bold text-sm">{p.fullName?.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{p.fullName}</p>
                      <p className="text-xs text-slate-400">#{p.jerseyNumber} · {p.position}</p>
                    </div>
                    {canEdit ? (
                      <button onClick={() => toggle(p._id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${statusColors[status]}`}>
                        {status === 'Present' ? '✓ Present' : status === 'Absent' ? '✗ Absent' : '~ Excused'}
                      </button>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[status]}`}>
                        {status}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
