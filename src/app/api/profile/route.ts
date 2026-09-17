import {
  NextRequest,
  NextResponse,
} from 'next/server'

import bcrypt from 'bcryptjs'

import { connectDB } from '@/lib/db'
import { User } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(
  req: NextRequest
) {
  const { error, session } =
    await requireAuth(req)

  if (error) return error

  await connectDB()

  const user = await User.findById(
    session!.user.id
  )
    .select('-password')
    .lean()

  if (!user) {
    return NextResponse.json(
      {
        error: 'User not found',
      },
      {
        status: 404,
      }
    )
  }

  return NextResponse.json(user)
}

export async function PUT(
  req: NextRequest
) {
  const { error, session } =
    await requireAuth(req)

  if (error) return error

  await connectDB()

  const body = await req.json()

  const userId =
    session!.user.id

  /*
   * PASSWORD CHANGE
   */
  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json(
        {
          error:
            'Current password is required',
        },
        {
          status: 400,
        }
      )
    }

    if (
      typeof body.newPassword !==
        'string' ||
      body.newPassword.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            'New password must be at least 8 characters',
        },
        {
          status: 400,
        }
      )
    }

    const user =
      await User.findById(userId)

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
        },
        {
          status: 404,
        }
      )
    }

    const valid =
      await bcrypt.compare(
        body.currentPassword,
        user.password
      )

    if (!valid) {
      return NextResponse.json(
        {
          error:
            'Current password is incorrect',
        },
        {
          status: 400,
        }
      )
    }

    const hashedPassword =
      await bcrypt.hash(
        body.newPassword,
        12
      )

    user.password = hashedPassword

    await user.save()

    return NextResponse.json({
      success: true,
      message:
        'Password changed successfully',
    })
  }

  /*
   * PROFILE INFORMATION CHANGE
   */
  const name =
    typeof body.name === 'string'
      ? body.name.trim()
      : ''

  const email =
    typeof body.email === 'string'
      ? body.email
          .trim()
          .toLowerCase()
      : ''

  if (!name || !email) {
    return NextResponse.json(
      {
        error:
          'Name and email are required',
      },
      {
        status: 400,
      }
    )
  }

  const existingUser =
    await User.findOne({
      email,
      _id: {
        $ne: userId,
      },
    }).lean()

  if (existingUser) {
    return NextResponse.json(
      {
        error:
          'That email address is already in use',
      },
      {
        status: 409,
      }
    )
  }

  const updated =
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          email,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select('-password')
      .lean()

  if (!updated) {
    return NextResponse.json(
      {
        error: 'User not found',
      },
      {
        status: 404,
      }
    )
  }

  return NextResponse.json(updated)
}