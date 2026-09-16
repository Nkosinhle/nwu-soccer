'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export function invalidateCache(urlPattern?: string) {
  if (!urlPattern) { cache.clear(); return }
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) cache.delete(key)
  }
}

interface UseFetchOptions {
  ttlMs?: number
  enabled?: boolean
}

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useFetch<T>(url: string, options: UseFetchOptions = {}): UseFetchResult<T> {
  const ttlMs   = options.ttlMs   ?? 30000
  const enabled = options.enabled ?? true

  const getCached = (): T | null => {
    const entry = cache.get(url) as CacheEntry<T> | undefined
    if (entry && Date.now() - entry.timestamp < ttlMs) return entry.data
    return null
  }

  const [data,    setData]    = useState<T | null>(getCached)
  const [loading, setLoading] = useState<boolean>(!getCached() && enabled)
  const [error,   setError]   = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const keyRef   = useRef(0)

  const doFetch = useCallback(() => {
    if (!enabled) return
    const cached = getCached()
    if (cached) { setData(cached); setLoading(false); return }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const key = ++keyRef.current

    setLoading(true)
    setError(null)

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json() as Promise<T>
      })
      .then(result => {
        if (key !== keyRef.current) return
        cache.set(url, { data: result, timestamp: Date.now() })
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        if (err.name === 'AbortError' || key !== keyRef.current) return
        setError(err.message || 'Request failed')
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ttlMs, enabled])

  useEffect(() => {
    doFetch()
    return () => { abortRef.current?.abort() }
  }, [doFetch])

  const refetch = useCallback(() => {
    cache.delete(url)
    doFetch()
  }, [url, doFetch])

  return { data, loading, error, refetch }
}