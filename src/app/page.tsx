import { redirect } from 'next/navigation'

// The proxy.ts handles auth-aware redirects.
// This is a fallback that just sends / → /login.
// The proxy will then redirect to /dashboard if already logged in.
export default function RootPage() {
  redirect('/login')
}
