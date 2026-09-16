import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

let cached = global.mongoose ?? { conn: null, promise: null }
if (!global.mongoose) global.mongoose = cached

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,

      // ── Performance tuning ───────────────────────────────────────────────
      // maxPoolSize: how many simultaneous connections to keep open.
      // Default is 5 — increase to handle concurrent requests without
      // queuing. 10 is safe for a dev/small-prod environment.
      maxPoolSize: 10,

      // serverSelectionTimeoutMS: how long to wait to find a MongoDB server.
      // Default is 30 seconds — way too long for a web app. 5 seconds gives
      // a fast failure instead of a hanging request.
      serverSelectionTimeoutMS: 5000,

      // socketTimeoutMS: how long to wait for a response from MongoDB.
      // Default is 0 (infinite). 10 seconds is safe and prevents hanging.
      socketTimeoutMS: 10000,

      // connectTimeoutMS: TCP connection timeout.
      // Default is 30 seconds — reduce to fail fast on network issues.
      connectTimeoutMS: 5000,

      // compressors: compress data over the wire. Meaningful when MongoDB
      // is remote (Atlas etc.), negligible on localhost — safe to keep.
      compressors: ['zlib'],

      // family: force IPv4. On some machines, Node tries IPv6 first and
      // falls back to IPv4 after a timeout — this eliminates that delay.
      // Remove this line if you're on an IPv6-only network.
      family: 4,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
