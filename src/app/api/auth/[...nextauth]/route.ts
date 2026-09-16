import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          await connectDB()
          const user = await User.findOne({
            email: credentials.email.toLowerCase().trim(),
          }).lean() as any

          if (!user) {
            console.log('[Auth] User not found:', credentials.email)
            return null
          }

          const valid = await bcrypt.compare(credentials.password, user.password)
          if (!valid) {
            console.log('[Auth] Wrong password for:', credentials.email)
            return null
          }

          console.log('[Auth] Login OK:', user.email, '| role:', user.role)
          return {
            id:       user._id.toString(),
            email:    user.email,
            name:     user.name,
            role:     user.role,
            avatar:   user.avatar   ?? null,
            playerId: user.playerId?.toString() ?? null,
          }
        } catch (err: any) {
          console.error('[Auth] Error:', err.message)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = (user as any).id
        token.role     = (user as any).role
        token.avatar   = (user as any).avatar
        token.playerId = (user as any).playerId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id       = token.id
        ;(session.user as any).role     = token.role
        ;(session.user as any).avatar   = token.avatar
        ;(session.user as any).playerId = token.playerId
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session:  { strategy: 'jwt' },
  secret:   process.env.NEXTAUTH_SECRET,
  debug:    false,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
