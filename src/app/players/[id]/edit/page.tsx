'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, Loader2, User, Camera } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Striker']
const STATUSES  = ['Fit', 'Injured', 'Recovering', 'Suspended']

export default function EditPlayerPage() {
  const { id }  = useParams()
  const router  = useRouter()

  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(true)
  const [teams,    setTeams]    = useState<any[]>([])
  const [preview,  setPreview]  = useState<string | null>(null)
  const [imgFile,  setImgFile]  = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    Promise.all([
      fetch(`/api/players/${id}`).then(r => r.json()),
      fetch('/api/teams').then(r => r.json()),
    ]).then(([playerData, teamsData]) => {
      const p = playerData.player
      reset({
        fullName:      p.fullName,
        nickname:      p.nickname,
        studentNumber: p.studentNumber,
        age:           p.age,
        dateOfBirth:   p.dateOfBirth?.split('T')[0],
        gender:        p.gender,
        position:      p.position,
        jerseyNumber:  p.jerseyNumber,
        contactEmail:  p.contactEmail,
        contactPhone:  p.contactPhone,
        squad:         p.squad?._id || p.squad || '',
        fitnessStatus: p.fitnessStatus,
        nationality:   p.nationality,
        bio:           p.bio,
        favouritePlayer:    p.favouritePlayer,
        favouriteTeam:      p.favouriteTeam,
        favouriteQuote:     p.favouriteQuote,
        favouriteSuperhero: p.favouriteSuperhero,
        'emergencyContact.name':         p.emergencyContact?.name,
        'emergencyContact.phone':        p.emergencyContact?.phone,
        'emergencyContact.relationship': p.emergencyContact?.relationship,
        'socialMedia.instagram': p.socialMedia?.instagram,
        'socialMedia.facebook':  p.socialMedia?.facebook,
        'socialMedia.twitter':   p.socialMedia?.twitter,
        'socialMedia.tiktok':    p.socialMedia?.tiktok,
      })
      // ── FIX: teamsData is now { teams: [...] } not a plain array ──
      setTeams(teamsData?.teams ?? (Array.isArray(teamsData) ? teamsData : []))
      if (p.profileImage) setPreview(p.profileImage)
      setFetching(false)
    })
  }, [id, reset])

  // Handle photo selection — show local preview immediately
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setImgFile(file)
    setPreview(URL.createObjectURL(file))
  }

  // Upload photo separately so the form doesn't slow down
  const uploadPhoto = async (): Promise<string | null> => {
    if (!imgFile) return null
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', imgFile)
      const res = await fetch(`/api/players/${id}/photo`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      return url
    } catch (err) {
      toast.error('Photo upload failed — other changes will still save')
      return null
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: any) => {
    setLoading(true)
    // Upload photo first if changed, then save player data
    const photoUrl = imgFile ? await uploadPhoto() : null
    const payload: any = {
      ...data,
      age:          parseInt(data.age),
      jerseyNumber: parseInt(data.jerseyNumber),
    }
    if (photoUrl) payload.profileImage = photoUrl

    const res = await fetch(`/api/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Player updated successfully!')
      router.push(`/players/${id}`)
    } else {
      toast.error('Failed to update player')
    }
  }

  if (fetching) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-in">
      <Header title="Edit Player" subtitle="Update player information" />
      <div className="p-4 md:p-8 max-w-3xl">
        <Link href={`/players/${id}`}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-purple-700 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to profile
        </Link>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Photo upload ─────────────────────────────────────────────── */}
          <div className="card flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-900 flex items-center justify-center overflow-hidden shadow-lg">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-white" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center shadow-md hover:bg-purple-700 transition-colors"
              >
                <Camera size={14} className="text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">Player Photo</p>
              <p className="text-xs text-slate-400">PNG, JPG or WebP · max 5 MB</p>
              {imgFile && (
                <p className="text-xs text-emerald-600 mt-1">✓ {imgFile.name} selected</p>
              )}
            </div>
          </div>

          {/* ── Personal Info ─────────────────────────────────────────────── */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User size={16} className="text-purple-600" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Full Name *</label>
                <input {...register('fullName', { required: true })} className="input-field" />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Nickname</label>
                <input {...register('nickname')} className="input-field" placeholder="e.g. Dinho" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Student Number *</label>
                <input {...register('studentNumber', { required: true })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Date of Birth</label>
                <input {...register('dateOfBirth')} type="date" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Age</label>
                <input {...register('age')} type="number" min="15" max="40" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Gender</label>
                <select {...register('gender')} className="input-field">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Nationality</label>
                <input {...register('nationality')} className="input-field" />
              </div>
            </div>
          </div>

          {/* ── Soccer Details ─────────────────────────────────────────────── */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Soccer Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Position *</label>
                <select {...register('position', { required: true })} className="input-field">
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Jersey # *</label>
                <input {...register('jerseyNumber', { required: true })} type="number" min="1" max="99" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Fitness Status</label>
                <select {...register('fitnessStatus')} className="input-field">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <label className="block text-sm text-slate-700 mb-1">Squad</label>
                <select {...register('squad')} className="input-field">
                  <option value="">Unassigned</option>
                  {teams.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.type})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Contact ─────────────────────────────────────────────── */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Email *</label>
                <input {...register('contactEmail', { required: true })} type="email" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Phone</label>
                <input {...register('contactPhone')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Emergency Contact Name</label>
                <input {...register('emergencyContact.name')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Emergency Phone</label>
                <input {...register('emergencyContact.phone')} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Relationship</label>
                <input {...register('emergencyContact.relationship')} placeholder="e.g. Parent" className="input-field" />
              </div>
            </div>
          </div>

          {/* ── Social Media ─────────────────────────────────────────────── */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Social Media</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Instagram</label>
                <input {...register('socialMedia.instagram')} placeholder="@handle" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">TikTok</label>
                <input {...register('socialMedia.tiktok')} placeholder="@handle" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Facebook</label>
                <input {...register('socialMedia.facebook')} placeholder="Name or handle" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Twitter / X</label>
                <input {...register('socialMedia.twitter')} placeholder="@handle" className="input-field" />
              </div>
            </div>
          </div>

          {/* ── Personal Favourites ─────────────────────────────────────────────── */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Personal Favourites</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Favourite Player</label>
                <input {...register('favouritePlayer')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Favourite Team</label>
                <input {...register('favouriteTeam')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Favourite Superhero</label>
                <input {...register('favouriteSuperhero')} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Favourite Quote</label>
                <textarea {...register('favouriteQuote')} rows={2} className="input-field resize-none" />
              </div>
            </div>
          </div>

          {/* ── Bio ─────────────────────────────────────────────── */}
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Bio / Notes</h3>
            <textarea {...register('bio')} rows={4} className="input-field resize-none"
              placeholder="Optional notes about the player..." />
          </div>

          {/* ── Actions ─────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <Link href={`/players/${id}`} className="btn-secondary flex-1 justify-center text-center py-3">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="btn-primary flex-1 justify-center py-3 disabled:opacity-60"
              style={{ background: '#4B0082' }}
            >
              {loading || uploading
                ? <><Loader2 size={15} className="animate-spin" /> {uploading ? 'Uploading photo…' : 'Saving…'}</>
                : <><Save size={15} /> Save Changes</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
