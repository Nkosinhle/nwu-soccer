'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'

import {
  Bell,
  CheckCheck,
  AlertCircle,
  Trophy,
  HeartPulse,
  ClipboardList,
  Info,
} from 'lucide-react'

import toast from 'react-hot-toast'

const typeIcons: Record<
  string,
  React.ReactNode
> = {
  match: (
    <Trophy
      size={15}
      className="text-amber-500"
    />
  ),

  medical: (
    <HeartPulse
      size={15}
      className="text-red-500"
    />
  ),

  training: (
    <ClipboardList
      size={15}
      className="text-blue-500"
    />
  ),

  warning: (
    <AlertCircle
      size={15}
      className="text-amber-500"
    />
  ),

  success: (
    <CheckCheck
      size={15}
      className="text-emerald-500"
    />
  ),

  error: (
    <AlertCircle
      size={15}
      className="text-red-500"
    />
  ),

  general: (
    <Info
      size={15}
      className="text-purple-500"
    />
  ),

  info: (
    <Info
      size={15}
      className="text-purple-500"
    />
  ),
}

const typeBg: Record<
  string,
  string
> = {
  match:
    'bg-amber-50 border-amber-100',

  medical:
    'bg-red-50 border-red-100',

  training:
    'bg-blue-50 border-blue-100',

  warning:
    'bg-amber-50 border-amber-100',

  success:
    'bg-emerald-50 border-emerald-100',

  error:
    'bg-red-50 border-red-100',

  general:
    'bg-purple-50 border-purple-100',

  info:
    'bg-purple-50 border-purple-100',
}

interface NotificationsClientProps {
  initialNotifications: any[]
  initialUnreadCount: number
  role: string
}

export default function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
  role,
}: NotificationsClientProps) {
  const isAdmin = [
    'admin',
    'coach',
  ].includes(role)

  const [filter, setFilter] =
    useState<'all' | 'unread'>(
      'all'
    )

  const [
    notifications,
    setNotifications,
  ] = useState<any[]>(
    initialNotifications
  )

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(
    initialUnreadCount
  )

  const [refreshing, setRefreshing] =
    useState(false)

  const [
    showCompose,
    setShowCompose,
  ] = useState(false)

  const [
    composing,
    setComposing,
  ] = useState(false)

  const [title, setTitle] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [
    notifType,
    setNotifType,
  ] = useState('general')

  const [
    forRoles,
    setForRoles,
  ] = useState<string[]>([])

  const displayed =
    filter === 'unread'
      ? notifications.filter(
          (notification) =>
            !notification.isRead
        )
      : notifications

  const refreshNotifications =
    async () => {
      setRefreshing(true)

      try {
        const res = await fetch(
          '/api/notifications',
          {
            cache: 'no-store',
          }
        )

        if (!res.ok) {
          throw new Error(
            'Failed to refresh notifications'
          )
        }

        const data =
          await res.json()

        setNotifications(
          data.notifications ?? []
        )

        setUnreadCount(
          data.unreadCount ?? 0
        )
      } catch (error) {
        console.error(
          'Failed to refresh notifications:',
          error
        )
      } finally {
        setRefreshing(false)
      }
    }

  const markRead = async (
    id: string
  ) => {
    try {
      const res = await fetch(
        '/api/notifications',
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            id,
          }),
        }
      )

      if (!res.ok) {
        throw new Error(
          'Failed to mark notification as read'
        )
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification._id ===
              id
                ? {
                    ...notification,
                    isRead: true,
                  }
                : notification
          )
      )

      setUnreadCount(
        (current) =>
          Math.max(
            0,
            current - 1
          )
      )
    } catch (error) {
      console.error(error)

      toast.error(
        'Failed to mark notification as read'
      )
    }
  }

  const markAllRead =
    async () => {
      try {
        const res = await fetch(
          '/api/notifications',
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              all: true,
            }),
          }
        )

        if (!res.ok) {
          throw new Error(
            'Failed to mark all notifications as read'
          )
        }

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                isRead: true,
              })
            )
        )

        setUnreadCount(0)

        toast.success(
          'All marked as read'
        )
      } catch (error) {
        console.error(error)

        toast.error(
          'Failed to mark notifications as read'
        )
      }
    }

  const sendNotification =
    async () => {
      if (
        !title.trim() ||
        !message.trim()
      ) {
        toast.error(
          'Title and message are required'
        )

        return
      }

      setComposing(true)

      try {
        const res = await fetch(
          '/api/notifications',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              title,
              message,
              type: notifType,
              forRoles,
            }),
          }
        )

        if (!res.ok) {
          throw new Error(
            'Failed to send notification'
          )
        }

        toast.success(
          'Notification sent'
        )

        setShowCompose(false)
        setTitle('')
        setMessage('')
        setNotifType('general')
        setForRoles([])

        await refreshNotifications()
      } catch (error) {
        console.error(error)

        toast.error(
          'Failed to send notification'
        )
      } finally {
        setComposing(false)
      }
    }

  return (
    <div className="animate-fade-in">
      <Header
        title="Notifications"
        subtitle="Stay up to date with squad activity"
      />

      <div className="p-8">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          <button
            onClick={() =>
              setFilter('all')
            }
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-purple-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'
            }`}
          >
            All
          </button>

          <button
            onClick={() =>
              setFilter('unread')
            }
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-purple-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'
            }`}
          >
            Unread

            {unreadCount > 0 && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  filter ===
                  'unread'
                    ? 'bg-white text-purple-900'
                    : 'bg-red-500 text-white'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={
                refreshNotifications
              }
              disabled={
                refreshing
              }
              className="btn-secondary text-sm"
            >
              {refreshing
                ? 'Refreshing…'
                : 'Refresh'}
            </button>

            {unreadCount >
              0 && (
              <button
                onClick={
                  markAllRead
                }
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <CheckCheck
                  size={14}
                />

                Mark all read
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() =>
                  setShowCompose(
                    !showCompose
                  )
                }
                className="btn-primary text-sm"
                style={{
                  background:
                    '#4B0082',
                }}
              >
                <Bell
                  size={14}
                />

                Send Notification
              </button>
            )}
          </div>
        </div>

        {/* Compose panel */}
        {showCompose &&
          isAdmin && (
            <div className="card mb-5 border border-purple-100">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Bell
                  size={15}
                  className="text-purple-600"
                />

                New Notification
              </h3>

              <div className="space-y-3">
                <input
                  value={title}
                  onChange={(
                    event
                  ) =>
                    setTitle(
                      event.target
                        .value
                    )
                  }
                  placeholder="Title *"
                  className="input-field"
                />

                <textarea
                  value={message}
                  onChange={(
                    event
                  ) =>
                    setMessage(
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  placeholder="Message *"
                  className="input-field resize-none"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Type
                    </label>

                    <select
                      value={
                        notifType
                      }
                      onChange={(
                        event
                      ) =>
                        setNotifType(
                          event
                            .target
                            .value
                        )
                      }
                      className="input-field"
                    >
                      <option value="general">
                        General
                      </option>

                      <option value="match">
                        Match
                      </option>

                      <option value="training">
                        Training
                      </option>

                      <option value="medical">
                        Medical
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      Send to roles
                      (empty = all)
                    </label>

                    <select
                      multiple
                      value={
                        forRoles
                      }
                      onChange={(
                        event
                      ) =>
                        setForRoles(
                          Array.from(
                            event
                              .target
                              .selectedOptions,
                            (
                              option
                            ) =>
                              option.value
                          )
                        )
                      }
                      className="input-field h-[38px]"
                    >
                      <option value="admin">
                        Admin
                      </option>

                      <option value="coach">
                        Coach
                      </option>

                      <option value="physio">
                        Physio
                      </option>

                      <option value="support_staff">
                        Support Staff
                      </option>

                      <option value="player">
                        Player
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() =>
                      setShowCompose(
                        false
                      )
                    }
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={
                      sendNotification
                    }
                    disabled={
                      composing
                    }
                    className="btn-primary text-sm"
                    style={{
                      background:
                        '#4B0082',
                    }}
                  >
                    {composing
                      ? 'Sending…'
                      : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Notifications */}
        {displayed.length ===
        0 ? (
          <div className="card text-center py-16">
            <Bell
              size={40}
              className="text-slate-300 mx-auto mb-3"
            />

            <p className="text-slate-500 font-medium">
              {filter ===
              'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(
              (
                notification: any
              ) => {
                const bg =
                  typeBg[
                    notification
                      .type
                  ] ||
                  typeBg.general

                const icon =
                  typeIcons[
                    notification
                      .type
                  ] ||
                  typeIcons.general

                return (
                  <div
                    key={
                      notification._id
                    }
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${bg} ${
                      !notification.isRead
                        ? 'shadow-sm'
                        : 'opacity-75'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5 relative">
                      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        {icon}
                      </div>

                      {!notification.isRead && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-semibold text-slate-900 ${
                            !notification.isRead
                              ? ''
                              : 'font-medium'
                          }`}
                        >
                          {
                            notification.title
                          }
                        </p>

                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {new Date(
                            notification.createdAt
                          ).toLocaleDateString(
                            'en-ZA',
                            {
                              day:
                                'numeric',
                              month:
                                'short',
                            }
                          )}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mt-0.5">
                        {
                          notification.message
                        }
                      </p>

                      {notification.link && (
                        <a
                          href={
                            notification.link
                          }
                          className="text-xs text-purple-600 hover:underline mt-1 inline-block"
                        >
                          View details →
                        </a>
                      )}

                      {notification
                        .createdBy
                        ?.name && (
                        <p className="text-xs text-slate-400 mt-1">
                          From:{' '}
                          {
                            notification
                              .createdBy
                              .name
                          }
                        </p>
                      )}
                    </div>

                    {!notification.isRead && (
                      <button
                        onClick={() =>
                          markRead(
                            notification._id
                          )
                        }
                        className="flex-shrink-0 p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck
                          size={
                            14
                          }
                        />
                      </button>
                    )}
                  </div>
                )
              }
            )}
          </div>
        )}
      </div>
    </div>
  )
}