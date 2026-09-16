import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:       string
      name:     string
      email:    string
      role:     string
      avatar?:  string
      playerId?: string
    }
  }
  interface User {
    id:       string
    role:     string
    avatar?:  string
    playerId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role:     string
    avatar?:  string
    playerId?: string
  }
}
