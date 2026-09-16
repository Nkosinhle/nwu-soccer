'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Phone, Mail, MapPin, Activity, Target, AlertTriangle, Edit, Instagram, Twitter, Facebook, Camera, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const posColors: Record<string, string> = {
  Goalkeeper: 'bg-amber-100 text-amber-800',
  Defender:   'bg-blue-100 text-blue-800',
  Midfielder: 'bg-purple-100 text-purple-800',
  Striker:    'bg-rose-100 text-rose-800',
}
const fitnessColors: Record<string, string> = {
  Fit: 'badge-fit', Injured: 'badge-injured',
  Recovering: 'badge-recovering', Suspended: 'badge-suspended',
}

export default function PlayerDetailPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const role    = (session?.user as any)?.role
  const canEdit = ['admin', 'coach'].includes(role)

  const [data,       setData]       = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState<'stats' | 'medical' | 'contact' | 'personal'>('stats')
  const [imgError,   setImgError]   = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [preview,    setPreview]    = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [id])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/players/${id}/photo`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      setData((prev: any) => ({ ...prev, player: { ...prev.player, profileImage: url } }))
      setImgError(false)
      toast.success('Photo updated!')
    } catch {
      toast.error('Photo upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data?.player) return (
    <div className="p-8">
      <p className="text-slate-500">Player not found.</p>
      <Link href="/players" className="text-purple-600 text-sm hover:underline mt-2 block">Back to players</Link>
    </div>
  )

  const { player, totals, stats, medical } = data
  const displayImage = preview || player.profileImage

  return (
    <div className="animate-fade-in">
      <Header
        title={player.fullName}
        subtitle={`${player.position} · #${player.jerseyNumber}${player.nickname ? ` · "${player.nickname}"` : ''}`}
      />
      <div className="p-4 md:p-8">

        {/* Back + Edit row */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/players" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-purple-700 transition-colors">
            <ArrowLeft size={14} /> Players
          </Link>
          {canEdit && (
            <Link href={`/players/${id}/edit`} className="btn-primary text-sm py-2" style={{ background: '#4B0082' }}>
              <Edit size={13} /> Edit
            </Link>
          )}
        </div>

        {/* ── Profile card — full width on mobile, 1/3 on desktop ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card flex flex-col items-center text-center">

            {/* Avatar with upload */}
            <div className="relative mb-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-purple-500 to-purple-900 flex items-center justify-center shadow-xl overflow-hidden">
                {displayImage && !imgError ? (
                  <img
                    src={displayImage}
                    alt={player.fullName}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-white text-4xl font-black">{player.fullName.charAt(0)}</span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 md:w-9 md:h-9 bg-purple-900 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-black text-xs">#{player.jerseyNumber}</span>
              </div>
              {canEdit && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute -top-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-purple-50 transition-colors disabled:opacity-50"
                    title="Upload photo"
                  >
                    <Camera size={12} className="text-purple-700" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </>
              )}
            </div>

            <h2 className="text-lg md:text-xl font-black text-slate-900 mb-0.5">{player.fullName}</h2>
            {player.nickname && (
              <p className="text-purple-600 text-sm font-medium mb-1">"{player.nickname}"</p>
            )}
            <p className="text-slate-400 text-xs mb-3">{player.studentNumber}</p>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`badge ${posColors[player.position] || 'bg-slate-100 text-slate-700'}`}>{player.position}</span>
              <span className={`badge ${fitnessColors[player.fitnessStatus] || 'badge-fit'}`}>{player.fitnessStatus}</span>
            </div>

            {/* Mini stats */}
            <div className="w-full grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xl font-black text-purple-700">{totals.goals}</p>
                <p className="text-xs text-slate-400">Goals</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-blue-600">{totals.assists}</p>
                <p className="text-xs text-slate-400">Assists</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-emerald-600">{totals.matches}</p>
                <p className="text-xs text-slate-400">Apps</p>
              </div>
            </div>

            {/* Contact */}
            <div className="w-full space-y-2 pt-3 border-t border-slate-100 text-left">
              {player.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-purple-500 flex-shrink-0" />
                  <span className="text-slate-600 text-xs truncate">{player.contactEmail}</span>
                </div>
              )}
              {player.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-purple-500 flex-shrink-0" />
                  <span className="text-slate-600 text-xs">{player.contactPhone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-purple-500 flex-shrink-0" />
                <span className="text-slate-600 text-xs">{player.nationality}</span>
              </div>
              {player.squad && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-500 text-xs font-bold flex-shrink-0">Squad</span>
                  <Link href={`/teams/${player.squad._id || player.squad}`} className="text-purple-600 hover:underline text-xs">
                    {player.squad.name || 'View Squad'}
                  </Link>
                </div>
              )}
            </div>

            {/* Social */}
            {player.socialMedia && (player.socialMedia.instagram || player.socialMedia.twitter || player.socialMedia.facebook || player.socialMedia.tiktok) && (
              <div className="w-full mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2 text-left">Social Media</p>
                <div className="flex flex-wrap gap-1.5">
                  {player.socialMedia.instagram && (
                    <span className="flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded-lg">
                      <Instagram size={11} /> {player.socialMedia.instagram}
                    </span>
                  )}
                  {player.socialMedia.twitter && (
                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                      <Twitter size={11} /> {player.socialMedia.twitter}
                    </span>
                  )}
                  {player.socialMedia.facebook && (
                    <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                      <Facebook size={11} /> {player.socialMedia.facebook}
                    </span>
                  )}
                  {player.socialMedia.tiktok && (
                    <span className="flex items-center gap-1 text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded-lg">
                      TikTok: {player.socialMedia.tiktok}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Detail area ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Tabs — scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
              {[
                { key: 'stats',    label: 'Stats',    icon: Target },
                { key: 'personal', label: 'Personal', icon: Activity },
                { key: 'medical',  label: 'Medical',  icon: AlertTriangle },
                { key: 'contact',  label: 'Contact',  icon: Phone },
              ].map(t => {
                const Icon = t.icon
                return (
                  <button key={t.key} onClick={() => setTab(t.key as any)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === t.key ? 'bg-purple-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'}`}>
                    <Icon size={13} /> {t.label}
                  </button>
                )
              })}
            </div>

            {/* Career totals */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                <Activity size={15} className="text-purple-600" /> Career Statistics
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { label: 'Matches', value: totals.matches,      color: 'text-slate-800' },
                  { label: 'Goals',   value: totals.goals,         color: 'text-purple-700' },
                  { label: 'Assists', value: totals.assists,        color: 'text-blue-600' },
                  { label: 'Minutes', value: totals.minutesPlayed,  color: 'text-emerald-600' },
                  { label: 'Yellow',  value: totals.yellowCards,    color: 'text-amber-600' },
                  { label: 'Red',     value: totals.redCards,       color: 'text-red-600' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2.5 bg-slate-50 rounded-xl">
                    <p className={`text-lg md:text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* STATS TAB */}
            {tab === 'stats' && (
              <div className="card">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                  <Target size={15} className="text-emerald-600" /> Match Performance
                </h3>
                {stats.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No match stats recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['Match','Date','G','A','Mins','YC','RC','Rating'].map(h => (
                            <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((s: any) => (
                          <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2.5 px-2 font-medium text-slate-800 truncate max-w-[100px]">vs {s.match?.opponent || '—'}</td>
                            <td className="py-2.5 px-2 text-slate-400 text-xs whitespace-nowrap">{s.match?.date ? new Date(s.match.date).toLocaleDateString('en-ZA') : '—'}</td>
                            <td className="py-2.5 px-2 font-bold text-purple-700">{s.goals}</td>
                            <td className="py-2.5 px-2 font-bold text-blue-600">{s.assists}</td>
                            <td className="py-2.5 px-2 text-slate-500">{s.minutesPlayed}'</td>
                            <td className="py-2.5 px-2 text-amber-600">{s.yellowCards || '—'}</td>
                            <td className="py-2.5 px-2 text-red-600">{s.redCards || '—'}</td>
                            <td className="py-2.5 px-2">
                              {s.rating ? (
                                <span className={`font-bold text-xs ${s.rating >= 8 ? 'text-emerald-600' : s.rating >= 6 ? 'text-amber-600' : 'text-red-600'}`}>{s.rating}/10</span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PERSONAL TAB */}
            {tab === 'personal' && (
              <div className="card">
                <h3 className="font-semibold text-slate-900 mb-4 text-sm">Personal Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Date of Birth', value: player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                    { label: 'Age',           value: player.age ? `${player.age} years` : '—' },
                    { label: 'Nationality',   value: player.nationality || '—' },
                    { label: 'Gender',        value: player.gender ? player.gender.charAt(0).toUpperCase() + player.gender.slice(1) : '—' },
                    { label: 'Nickname',      value: player.nickname || '—' },
                    { label: 'Fav. Player',   value: player.favouritePlayer || '—' },
                    { label: 'Dream Team',    value: player.favouriteTeam || '—' },
                    { label: 'Superhero',     value: player.favouriteSuperhero || '—' },
                  ].map(f => (
                    <div key={f.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
                      <p className="font-medium text-slate-800 text-sm">{f.value}</p>
                    </div>
                  ))}
                </div>
                {player.favouriteQuote && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-xl border-l-4 border-purple-400">
                    <p className="text-xs text-slate-400 mb-1">Favourite Quote</p>
                    <p className="text-sm text-purple-900 italic font-medium">"{player.favouriteQuote}"</p>
                  </div>
                )}
                {player.bio && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Bio</p>
                    <p className="text-sm text-slate-600">{player.bio}</p>
                  </div>
                )}
              </div>
            )}

            {/* MEDICAL TAB */}
            {tab === 'medical' && (
              <div className="card">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                  <AlertTriangle size={15} className="text-red-500" /> Medical & Injury History
                </h3>
                {medical.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No medical records for this player.</p>
                ) : (
                  <div className="space-y-3">
                    {medical.map((m: any) => (
                      <div key={m._id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${m.recoveryStatus === 'Active' ? 'bg-red-500' : m.recoveryStatus === 'Recovering' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 text-sm">{m.injuryType}</p>
                            <span className={`badge text-xs ${m.severity === 'Severe' ? 'bg-red-100 text-red-800' : m.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'}`}>{m.severity}</span>
                            <span className={`badge text-xs ${m.recoveryStatus === 'Cleared' ? 'bg-emerald-100 text-emerald-800' : m.recoveryStatus === 'Recovering' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{m.recoveryStatus}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{m.bodyPart} · {new Date(m.dateOfInjury).toLocaleDateString('en-ZA')}</p>
                          <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTACT TAB */}
            {tab === 'contact' && (
              <div className="card">
                <h3 className="font-semibold text-slate-900 mb-4 text-sm">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Email', value: player.contactEmail },
                    { label: 'Phone', value: player.contactPhone || 'Not provided' },
                  ].map(f => (
                    <div key={f.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
                      <p className="font-medium text-slate-800 text-sm break-all">{f.value || '—'}</p>
                    </div>
                  ))}
                </div>
                {player.emergencyContact?.name && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Emergency Contact</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Name',         value: player.emergencyContact.name },
                        { label: 'Phone',        value: player.emergencyContact.phone },
                        { label: 'Relationship', value: player.emergencyContact.relationship || '—' },
                      ].map(f => (
                        <div key={f.label} className="bg-red-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
                          <p className="font-medium text-slate-800 text-sm">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
