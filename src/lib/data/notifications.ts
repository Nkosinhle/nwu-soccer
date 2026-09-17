import { connectDB } from '@/lib/db'
import { Notification } from '@/lib/models'

export async function getNotifications(
  userId: string,
  role: string
) {
  await connectDB()

  const notifications = await Notification.find({
    $or: [
      { forRoles: role },

      {
        forRoles: { $size: 0 },
        forUser: { $exists: false },
      },

      { forUser: userId },
    ],
  })
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  const result = notifications.map((notification: any) => ({
    ...notification,

    isRead:
      notification.read?.some(
        (readUserId: any) =>
          readUserId.toString() === userId
      ) ?? false,
  }))

  return JSON.parse(
    JSON.stringify({
      notifications: result,

      unreadCount: result.filter(
        (notification: any) => !notification.isRead
      ).length,
    })
  )
}