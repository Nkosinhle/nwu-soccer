/**
 * NWU Soccer Institute — Notification Service
 * Channels: Resend (email) + In-app (existing MongoDB Notification model)
 *
 * IMPORTANT: Uses your EXISTING Notification model shape:
 *   { title, message, type, link, forUser, forRoles: [], read: [] }
 * NOT a separate model — this stores directly into your existing
 * `notifications` collection, so they appear in your existing bell/list.
 *
 * WhatsApp: wired but disabled. Set WHATSAPP_ENABLED=true to activate.
 */

import { Resend } from 'resend'
import mongoose, { Schema } from 'mongoose'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null
const FROM     = process.env.RESEND_FROM || 'NWU Soccer Institute <soccer@nwu.ac.za>'
const APP_URL  = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// ─── Notification model (same schema as app/api/notifications/route.ts) ──────
// We re-use the existing model if already registered, otherwise define it here.
// This means in-app notifications from the academics module appear in the
// SAME collection and the SAME notification bell as broadcast notifications.

const NotifSchema = new Schema({
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  type:     { type: String, enum: ['match','medical','training','general','info','warning','success','error'], default: 'general' },
  link:     { type: String },
  forRoles: [{ type: String }],
  forUser:  { type: Schema.Types.ObjectId, ref: 'User' },
  read:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdBy:{ type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotifSchema)

// ─── WhatsApp (optional, disabled by default) ─────────────────────────────────
const WHATSAPP_ENABLED  = process.env.WHATSAPP_ENABLED === 'true'
const WHATSAPP_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WA_VERSION        = process.env.WHATSAPP_API_VERSION || 'v21.0'

async function sendWhatsAppTemplate(opts: {
  to: string; templateName: string; languageCode?: string; params?: string[]
}) {
  if (!WHATSAPP_ENABLED) {
    console.log(`[whatsapp] disabled — would send "${opts.templateName}" to ${opts.to}`)
    return { skipped: true }
  }
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error('[whatsapp] enabled but credentials missing')
    return { skipped: true }
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/${WA_VERSION}/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: opts.to,
          type: 'template',
          template: {
            name: opts.templateName,
            language: { code: opts.languageCode || 'en' },
            components: opts.params?.length
              ? [{ type: 'body', parameters: opts.params.map(p => ({ type: 'text', text: p })) }]
              : undefined,
          },
        }),
      }
    )
    if (!res.ok) { console.error('[whatsapp] send failed', await res.text()); return { success: false } }
    return { success: true }
  } catch (err) { console.error('[whatsapp] threw', err); return { success: false } }
}

function toWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  if (digits.startsWith('27')) return digits
  if (digits.startsWith('0'))  return `27${digits.slice(1)}`
  return digits
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerRef {
  _id: string
  fullName: string
  contactEmail?: string
  contactPhone?: string
  /** User._id — needed to create a per-user in-app notification */
  userId?: string
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

function emailHtml(title: string, body: string, ctaLabel?: string, ctaUrl?: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#f3f0fa;font-family:Arial,Helvetica,sans-serif;color:#1a0f33}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(75,45,131,.12)}
  .hdr{background:#4B2D83;padding:28px 32px}
  .hdr h1{margin:0;color:#fff;font-size:22px;font-weight:700}
  .hdr p{margin:4px 0 0;color:#c4b4f0;font-size:13px}
  .body{padding:28px 32px}
  .body p{font-size:15px;line-height:1.7;color:#2d1f5e}
  .cta{text-align:center;margin:28px 0 0}
  .cta a{display:inline-block;background:#4B2D83;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:15px}
  .footer{background:#f3f0fa;padding:18px 32px;font-size:12px;color:#8878aa;text-align:center}
  .badge{display:inline-block;background:#e8a020;color:#1a0f33;border-radius:4px;padding:2px 10px;font-weight:700;font-size:12px;margin-bottom:12px}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr"><h1>${title}</h1><p>NWU Soccer Institute · Mafikeng Campus</p></div>
  <div class="body">
    <span class="badge">NWU SOCCER</span>
    ${body}
    ${ctaLabel && ctaUrl ? `<div class="cta"><a href="${ctaUrl}">${ctaLabel}</a></div>` : ''}
  </div>
  <div class="footer">Automated message from NWU Soccer Institute PMS · Mafikeng Campus</div>
</div>
</body>
</html>`
}

// ─── In-app notification (into existing notifications collection) ──────────────

async function createInAppNotification(opts: {
  userId: string
  title: string
  message: string
  link?: string
  type?: string
}) {
  try {
    await Notification.create({
      title:    opts.title,
      message:  opts.message,
      type:     opts.type || 'info',
      link:     opts.link,
      forUser:  opts.userId,
      forRoles: [],
      read:     [],
    })
  } catch (err) {
    console.error('[notify] in-app create failed', err)
  }
}

// ─── Exported notify object ───────────────────────────────────────────────────

export const notify = {

  async academicsReminder(opts: {
    players: PlayerRef[]
    semester: number
    year: number
    deadline: Date
    missingItems: ('schedule' | 'assessments')[]
  }) {
    const { players, semester, year, deadline, missingItems } = opts
    const deadlineStr = deadline.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const missing = missingItems.includes('schedule') && missingItems.includes('assessments')
      ? 'class timetable and assessment timetable'
      : missingItems.includes('schedule') ? 'class timetable' : 'assessment timetable'

    const emailPromises = players.filter(p => p.contactEmail).map(p =>
      resend.emails.send({
        from: FROM, to: p.contactEmail!,
        subject: `Action Required: Submit your Semester ${semester} Academic Timetable`,
        html: emailHtml(
          'Academic Timetable Submission Required',
          `<p>Hi <strong>${p.fullName}</strong>,</p>
          <p>Please submit your <strong>${missing}</strong> for <strong>Semester ${semester}, ${year}</strong> before <strong>${deadlineStr}</strong>.</p>
          <p>The coaching staff needs your timetable to plan training around your academic schedule.</p>`,
          'Submit My Timetable', `${APP_URL}/academics/submit?semester=${semester}&year=${year}`,
        ),
      }).catch(err => console.error(`[notify] email failed for ${p.contactEmail}`, err))
    )

    const inAppPromises = players.filter(p => p.userId).map(p =>
      createInAppNotification({
        userId:  p.userId!,
        title:   `Timetable Submission Due — S${semester} ${year}`,
        message: `Please submit your ${missing} before ${deadlineStr}.`,
        link:    `/academics/submit?semester=${semester}&year=${year}`,
        type:    'warning',
      })
    )

    const whatsappPromises = players.filter(p => p.contactPhone).map(p => {
      const number = toWhatsAppNumber(p.contactPhone!)
      if (!number) return Promise.resolve()
      return sendWhatsAppTemplate({
        to: number, templateName: 'academics_reminder',
        params: [p.fullName, String(semester), String(year), deadlineStr],
      })
    })

    await Promise.allSettled([...emailPromises, ...inAppPromises, ...whatsappPromises])
  },

  async academicsSubmitted(opts: {
    player: PlayerRef
    semester: number
    year: number
    type: 'schedule' | 'assessments'
  }) {
    const { player, semester, year, type } = opts
    const label = type === 'schedule' ? 'Class Timetable' : 'Assessment Timetable'

    if (player.contactEmail) {
      await resend.emails.send({
        from: FROM, to: player.contactEmail,
        subject: `Timetable Received — ${label} · Semester ${semester}`,
        html: emailHtml(
          `${label} Received`,
          `<p>Hi <strong>${player.fullName}</strong>,</p>
          <p>We've received your <strong>${label}</strong> for <strong>Semester ${semester}, ${year}</strong>.</p>
          <p>The coaching staff will review your schedule to plan training accordingly.</p>`,
          'View My Schedule', `${APP_URL}/academics/submit?semester=${semester}&year=${year}`,
        ),
      }).catch(err => console.error('[notify] email failed', err))
    }

    if (player.userId) {
      await createInAppNotification({
        userId:  player.userId,
        title:   `${label} Submitted ✓`,
        message: `Your Semester ${semester} ${label.toLowerCase()} has been received.`,
        link:    `/academics/${player._id}`,
        type:    'success',
      })
    }

    if (player.contactPhone) {
      const number = toWhatsAppNumber(player.contactPhone)
      if (number) {
        await sendWhatsAppTemplate({
          to: number, templateName: 'academics_submission_confirmed',
          params: [player.fullName, label, String(semester), String(year)],
        })
      }
    }
  },

  async examClashAlert(opts: {
    adminEmails: string[]
    clashes: Array<{ playerName: string; subject: string; date: Date; startTime: string; trainingSession: string }>
  }) {
    const { adminEmails, clashes } = opts
    if (!clashes.length || !adminEmails.length) return
    const rows = clashes.map(c =>
      `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e9e0ff">${c.playerName}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e9e0ff">${c.subject}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e9e0ff">${c.date.toLocaleDateString('en-ZA')}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e9e0ff">${c.startTime}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e9e0ff">${c.trainingSession}</td>
      </tr>`
    ).join('')
    await resend.emails.send({
      from: FROM, to: adminEmails,
      subject: `Exam/Training Clash Alert — ${clashes.length} conflict${clashes.length !== 1 ? 's' : ''} detected`,
      html: emailHtml(
        'Exam / Training Clash Alert',
        `<p>${clashes.length} player${clashes.length !== 1 ? 's have' : ' has'} upcoming assessments that overlap with scheduled training:</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px">
          <thead><tr style="background:#4B2D83;color:#fff">
            <th style="padding:8px 12px;text-align:left">Player</th>
            <th style="padding:8px 12px;text-align:left">Module</th>
            <th style="padding:8px 12px;text-align:left">Date</th>
            <th style="padding:8px 12px;text-align:left">Time</th>
            <th style="padding:8px 12px;text-align:left">Session</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`,
        'View Academics Overview', `${APP_URL}/academics`,
      ),
    }).catch(err => console.error('[notify] clash email failed', err))
  },

  async inApp(opts: {
    userIds: string[]; title: string; message: string; link?: string
    type?: 'info' | 'warning' | 'success' | 'error'
  }) {
    await Promise.allSettled(
      opts.userIds.map(id => createInAppNotification({
        userId: id, title: opts.title, message: opts.message, link: opts.link, type: opts.type,
      }))
    )
  },

  async bulkEmail(opts: { to: string[]; subject: string; title: string; body: string; ctaLabel?: string; ctaUrl?: string }) {
    const BATCH = 50
    for (let i = 0; i < opts.to.length; i += BATCH) {
      await resend.emails.send({
        from: FROM, to: opts.to.slice(i, i + BATCH),
        subject: opts.subject,
        html: emailHtml(opts.title, opts.body, opts.ctaLabel, opts.ctaUrl),
      }).catch(err => console.error('[notify] bulk email batch failed', err))
    }
  },

  whatsapp: {
    async send(opts: { phone: string; templateName: string; params?: string[]; languageCode?: string }) {
      const number = toWhatsAppNumber(opts.phone)
      if (!number) return { skipped: true }
      return sendWhatsAppTemplate({ to: number, ...opts })
    },
    get enabled() { return WHATSAPP_ENABLED },
  },
}

// ─── Bulk reminder sweep ──────────────────────────────────────────────────────

export async function sendAcademicsReminders(semester: number, year: number, deadline: Date) {
  const { Player, ClassSchedule, AssessmentTimetable, User } = await import('@/lib/models')

  const players = await Player.find({}).select('fullName contactEmail contactPhone').lean()

  const [schedules, assessments] = await Promise.all([
    ClassSchedule.find({ semester, year }).select('player').lean(),
    AssessmentTimetable.find({ semester, year }).select('player').lean(),
  ])

  const submittedSchedule   = new Set(schedules.map(s => s.player.toString()))
  const submittedAssessment = new Set(assessments.map(a => a.player.toString()))

  type PlayerDoc = { _id: { toString(): string }; fullName: string; contactEmail?: string; contactPhone?: string }

  for (const player of players as unknown as PlayerDoc[]) {
    const id      = player._id.toString()
    const missing: ('schedule' | 'assessments')[] = []
    if (!submittedSchedule.has(id))   missing.push('schedule')
    if (!submittedAssessment.has(id)) missing.push('assessments')
    if (!missing.length) continue

    // Look up the linked User account for the in-app notification
    const userDoc = await User.findOne({ playerId: id }).select('_id').lean() as { _id: { toString(): string } } | null

    await notify.academicsReminder({
      players: [{
        _id:          id,
        fullName:     player.fullName,
        contactEmail: player.contactEmail,
        contactPhone: player.contactPhone,
        userId:       userDoc?._id.toString(),
      }],
      semester, year, deadline, missingItems: missing,
    })
  }
}
