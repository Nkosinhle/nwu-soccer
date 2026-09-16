'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, Mail, Loader2, Users, Shield, BarChart2, HeartPulse, ClipboardList, Target } from 'lucide-react'
import toast from 'react-hot-toast'

interface LoginForm { email: string; password: string }

const features = [
  { icon: Users,       label: 'Player Profiles & Registration' },
  { icon: Shield,      label: 'Squad & Team Management' },
  { icon: Target,      label: 'Match Tracking & Results' },
  { icon: BarChart2,   label: 'Performance Analytics' },
  { icon: HeartPulse,  label: 'Medical & Injury Records' },
  { icon: ClipboardList, label: 'Training & Attendance' },
]

export default function LoginPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email:    data.email.toLowerCase().trim(),
        password: data.password,
        redirect: false,
      })
      if (!result?.ok || result?.error) {
        toast.error('Invalid email or password.')
        setLoading(false)
        return
      }
      toast.success('Welcome back!')
      router.replace('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)',
          backgroundSize: '50px 50px',
        }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-700/30" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-600/20" />

        <div className="relative text-center">
          {/* Logo — always shows the image, no emoji fallback */}
          <div className="w-28 h-28 rounded-3xl mx-auto mb-8 shadow-2xl overflow-hidden bg-white">
            <Image
              src="/images/soccer-logo.jpg"
              alt="NWU Soccer Institute"
              width={112}
              height={112}
              className="object-cover w-full h-full"
              priority
            />
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">NWU Soccer Institute</h1>
          <p className="text-purple-300 text-lg mb-12">Player Management System</p>

          <div className="space-y-4 text-left max-w-xs mx-auto">
            {features.map(f => {
              const Icon = f.icon
              return (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className="text-purple-200 text-sm">{f.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="absolute bottom-6 text-purple-400 text-xs">
          &copy; {new Date().getFullYear()} North-West University &middot; Mafikeng Campus
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo — always shows image */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 overflow-hidden shadow-lg bg-purple-900">
              <img
                src="/images/soccer-logo.jpeg"
                alt="NWU Soccer Institute"
                className="object-cover w-full h-full"
                onError={(e) => { e.currentTarget.style.display='none' }}
              />
            </div>
            <h1 className="text-xl font-black text-slate-900">NWU Soccer Institute</h1>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-8">Enter your credentials to access the system</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Enter a valid email',
                    },
                  })}
                  type="email"
                  autoComplete="email"
                  placeholder="yourname@nwu.ac.za"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white transition-all"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:opacity-90 disabled:opacity-60"
              style={{ background: '#4B0082' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                : 'Sign in'
              }
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              Having trouble signing in? Contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
