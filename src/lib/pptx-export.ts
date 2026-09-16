/**
 * NWU Soccer Institute — PPTX Export Engine
 * Covers: Academics, Player Stats, Match Summaries, Analytics (training attendance)
 * Brand: NWU Purple #4B2D83 on White, Accent Gold #E8A020
 *
 * Schema notes (matches your real models.ts):
 *  - Player.fullName (not firstName/lastName), Player.jerseyNumber, Player.squad (ref Team)
 *  - PlayerStats is a separate per-match collection — aggregate across it for season totals
 *  - Match has opponent/score{home,away}/location/status — not homeTeam/awayTeam/result
 *  - TrainingSession.attendance is an array of {player, status, notes} — not a flat attendees[] list
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PptxGenJS = require('pptxgenjs')

import { connectDB } from '@/lib/db'
import {
  ClassSchedule, AssessmentTimetable, Player, Team,
  Match, PlayerStats, TrainingSession,
} from '@/lib/models'

// ─── Brand Tokens ────────────────────────────────────────────────────────────
const PURPLE  = '4B2D83'
const GOLD    = 'E8A020'
const WHITE   = 'FFFFFF'
const LIGHT   = 'F3F0FA'
const DARK    = '1A0F33'
const MUTED   = '8878AA'
const SUCCESS = '16A34A'
const WARNING = 'D97706'
const DANGER  = 'DC2626'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newPres(title: string) {
  const pres = new PptxGenJS()
  pres.layout  = 'LAYOUT_16x9'
  pres.title   = title
  pres.author  = 'NWU Soccer Institute'
  pres.company = 'North-West University, Mafikeng Campus'
  return pres
}

function addCoverSlide(pres: typeof PptxGenJS, title: string, subtitle: string) {
  const slide = pres.addSlide()
  slide.background = { color: PURPLE }

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.1, fill: { color: DARK }, line: { color: DARK },
  })
  slide.addText('NWU', {
    x: 0.4, y: 0.2, w: 1.2, h: 0.7, fontSize: 28, bold: true, color: GOLD,
    fontFace: 'Cambria', margin: 0,
  })
  slide.addText('SOCCER INSTITUTE', {
    x: 1.65, y: 0.35, w: 4, h: 0.45, fontSize: 10, bold: true, color: WHITE,
    fontFace: 'Calibri', charSpacing: 3, margin: 0,
  })
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 7, y: 0, w: 3, h: 5.625, fill: { color: GOLD, transparency: 88 }, line: { color: GOLD, transparency: 88 },
  })
  slide.addText(title, {
    x: 0.5, y: 1.6, w: 6.2, h: 2.2, fontSize: 40, bold: true, color: WHITE,
    fontFace: 'Cambria', valign: 'middle', margin: 0,
  })
  slide.addText(subtitle, {
    x: 0.5, y: 3.9, w: 6.2, h: 0.7, fontSize: 16, color: GOLD, fontFace: 'Calibri', margin: 0,
  })
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.1, w: 10, h: 0.525, fill: { color: DARK }, line: { color: DARK },
  })
  slide.addText(`North-West University · Mafikeng Campus · ${new Date().getFullYear()}`, {
    x: 0.4, y: 5.15, w: 9, h: 0.4, fontSize: 10, color: MUTED, fontFace: 'Calibri', margin: 0,
  })

  return slide
}

function addSlideHeader(slide: typeof PptxGenJS, pres: typeof PptxGenJS, title: string, tag?: string) {
  slide.background = { color: WHITE }
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.75, fill: { color: PURPLE }, line: { color: PURPLE },
  })
  slide.addText(title, {
    x: 0.35, y: 0.1, w: tag ? 7.5 : 9.3, h: 0.55, fontSize: 18, bold: true, color: WHITE,
    fontFace: 'Cambria', valign: 'middle', margin: 0,
  })
  if (tag) {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 8.2, y: 0.13, w: 1.5, h: 0.48, fill: { color: GOLD }, line: { color: GOLD }, rectRadius: 0.08,
    })
    slide.addText(tag, {
      x: 8.2, y: 0.13, w: 1.5, h: 0.48, fontSize: 11, bold: true, color: DARK,
      fontFace: 'Calibri', align: 'center', valign: 'middle', margin: 0,
    })
  }
}

function addStatCard(
  slide: typeof PptxGenJS, pres: typeof PptxGenJS,
  x: number, y: number, w: number, h: number,
  value: string, label: string, color = PURPLE,
) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, fill: { color: LIGHT }, line: { color: 'E2E8F0' }, rectRadius: 0.1,
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 45, opacity: 0.08 },
  })
  slide.addText(value, {
    x: x + 0.1, y: y + 0.12, w: w - 0.2, h: h * 0.58, fontSize: 32, bold: true, color,
    fontFace: 'Cambria', align: 'center', valign: 'middle', margin: 0,
  })
  slide.addText(label, {
    x: x + 0.1, y: y + h * 0.62, w: w - 0.2, h: h * 0.32, fontSize: 11, color: MUTED,
    fontFace: 'Calibri', align: 'center', valign: 'top', margin: 0,
  })
}

function statusColor(status: string) {
  if (status === 'complete') return SUCCESS
  if (status === 'partial')  return WARNING
  return DANGER
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Academics Overview ────────────────────────────────────────────────────
export async function buildAcademicsOverviewPptx(payload: {
  semester: number
  year: number
  squad?: string  // Team ObjectId, optional
}): Promise<Buffer> {
  await connectDB()
  const { semester, year, squad } = payload

  const playerQuery: Record<string, unknown> = {}
  if (squad) playerQuery.squad = squad

  const players = await Player.find(playerQuery)
    .select('fullName jerseyNumber position squad')
    .populate('squad', 'name type')
    .sort({ jerseyNumber: 1 })
    .lean()

  const playerIds = players.map(p => p._id)

  const [schedules, assessmentDocs] = await Promise.all([
    ClassSchedule.find({ player: { $in: playerIds }, semester, year }).lean(),
    AssessmentTimetable.find({ player: { $in: playerIds }, semester, year }).lean(),
  ])

  const scheduleMap   = new Map(schedules.map(s => [s.player.toString(), s]))
  const assessmentMap = new Map(assessmentDocs.map(a => [a.player.toString(), a]))
  const now = new Date()

  type PlayerDoc = { _id: { toString(): string }; fullName: string; jerseyNumber: number; squad?: { name?: string } }

  const overview = (players as unknown as PlayerDoc[]).map(player => {
    const id         = player._id.toString()
    const schedule   = scheduleMap.get(id)
    const assessment = assessmentMap.get(id)
    type AItem = { date: string | Date; subject: string }
    const upcoming = (assessment?.assessments as AItem[] | undefined)
      ?.filter(a => new Date(a.date) >= now)
      ?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null

    const status = !schedule && !assessment ? 'none' : !schedule || !assessment ? 'partial' : 'complete'

    return {
      player: { name: player.fullName, jerseyNumber: player.jerseyNumber, squad: player.squad?.name ?? '—' },
      classSchedule: { submitted: !!schedule, slotCount: schedule?.slots?.length ?? 0 },
      assessmentTimetable: { submitted: !!assessment, assessmentCount: assessment?.assessments?.length ?? 0, nextAssessment: upcoming },
      status,
    }
  })

  const summary = {
    total:    overview.length,
    complete: overview.filter(o => o.status === 'complete').length,
    partial:  overview.filter(o => o.status === 'partial').length,
    none:     overview.filter(o => o.status === 'none').length,
  }

  const pres = newPres(`Academics Overview — Semester ${semester} ${year}`)
  addCoverSlide(pres, 'Academics Overview', `Semester ${semester} · ${year}`)

  // Summary slide
  {
    const slide = pres.addSlide()
    addSlideHeader(slide, pres, 'Submission Status Summary', `S${semester} ${year}`)
    const completePct = summary.total ? Math.round((summary.complete / summary.total) * 100) : 0

    slide.addText(`${completePct}%`, {
      x: 0.5, y: 1.0, w: 3.5, h: 2.5, fontSize: 72, bold: true,
      color: completePct >= 80 ? SUCCESS : completePct >= 50 ? WARNING : DANGER,
      fontFace: 'Cambria', align: 'center', valign: 'middle', margin: 0,
    })
    slide.addText('Fully Submitted', {
      x: 0.5, y: 3.5, w: 3.5, h: 0.5, fontSize: 13, color: MUTED, fontFace: 'Calibri', align: 'center', margin: 0,
    })

    addStatCard(slide, pres, 4.3, 0.95, 1.7, 1.1, String(summary.total),    'Total Players', PURPLE)
    addStatCard(slide, pres, 6.1, 0.95, 1.7, 1.1, String(summary.complete), 'Complete',      SUCCESS)
    addStatCard(slide, pres, 7.9, 0.95, 1.7, 1.1, String(summary.partial),  'Partial',       WARNING)
    addStatCard(slide, pres, 4.3, 2.25, 1.7, 1.1, String(summary.none),    'Not Submitted', DANGER)

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 4.3, y: 3.6, w: 5.3, h: 0.35, fill: { color: 'E2E8F0' }, line: { color: 'E2E8F0' }, rectRadius: 0.08,
    })
    if (completePct > 0) {
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 4.3, y: 3.6, w: 5.3 * (completePct / 100), h: 0.35, fill: { color: SUCCESS }, line: { color: SUCCESS }, rectRadius: 0.08,
      })
    }
    slide.addText(`${completePct}% of players have submitted both timetables`, {
      x: 4.3, y: 4.05, w: 5.3, h: 0.35, fontSize: 11, color: MUTED, fontFace: 'Calibri', align: 'center', margin: 0,
    })
  }

  // Player table slides
  const ROWS_PER_SLIDE = 14
  for (let start = 0; start < overview.length; start += ROWS_PER_SLIDE) {
    const chunk = overview.slice(start, start + ROWS_PER_SLIDE)
    const slide = pres.addSlide()
    addSlideHeader(slide, pres, 'Player Submission Status', `${start + 1}–${Math.min(start + ROWS_PER_SLIDE, overview.length)} of ${overview.length}`)

    const tableData = [
      [
        { text: '#',           options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Player',      options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Squad',       options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Class Timetable', options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Assessments', options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Next Assessment', options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Status',      options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
      ],
      ...chunk.map((row, i) => {
        const rowBg = i % 2 === 0 ? 'FFFFFF' : 'F8F5FF'
        const next  = row.assessmentTimetable.nextAssessment
        return [
          { text: String(row.player.jerseyNumber || '—'), options: { fill: { color: rowBg }, fontSize: 10, align: 'center' } },
          { text: row.player.name,  options: { fill: { color: rowBg }, fontSize: 10, bold: true } },
          { text: row.player.squad, options: { fill: { color: rowBg }, fontSize: 9, color: MUTED } },
          {
            text: row.classSchedule.submitted ? `✓ ${row.classSchedule.slotCount} slots` : '✗ Missing',
            options: { fill: { color: rowBg }, fontSize: 10, color: row.classSchedule.submitted ? SUCCESS : DANGER, bold: row.classSchedule.submitted },
          },
          {
            text: row.assessmentTimetable.submitted ? `✓ ${row.assessmentTimetable.assessmentCount}` : '✗ Missing',
            options: { fill: { color: rowBg }, fontSize: 10, color: row.assessmentTimetable.submitted ? SUCCESS : DANGER, bold: row.assessmentTimetable.submitted },
          },
          {
            text: next ? `${next.subject} · ${new Date(next.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}` : '—',
            options: { fill: { color: rowBg }, fontSize: 9, color: next ? DARK : MUTED },
          },
          {
            text: row.status.toUpperCase(),
            options: { fill: { color: rowBg }, fontSize: 9, bold: true, color: statusColor(row.status) },
          },
        ]
      }),
    ]

    slide.addTable(tableData, {
      x: 0.3, y: 0.9, w: 9.4, h: 4.5,
      colW: [0.5, 2.0, 1.5, 1.5, 1.0, 1.8, 1.1],
      border: { pt: 0.5, color: 'E2E8F0' },
      autoPage: false,
    })
  }

  return pres.write({ outputType: 'nodebuffer' }) as Promise<Buffer>
}

// ── 2. Individual Player Schedule ─────────────────────────────────────────────
export async function buildPlayerSchedulePptx(payload: {
  playerId: string
  semester: number
  year: number
}): Promise<Buffer> {
  await connectDB()
  const { playerId, semester, year } = payload

  const [player, schedule, assessments] = await Promise.all([
    Player.findById(playerId).populate('squad', 'name type').lean(),
    ClassSchedule.findOne({ player: playerId, semester, year }).lean(),
    AssessmentTimetable.findOne({ player: playerId, semester, year }).lean(),
  ])

  if (!player) throw new Error('Player not found')

  type PlayerDoc = { fullName: string; jerseyNumber: number; position: string; squad?: { name?: string } }
  const typedPlayer = player as unknown as PlayerDoc

  const pres = newPres(`${typedPlayer.fullName} — Academic Schedule`)
  addCoverSlide(pres, typedPlayer.fullName, `Academic Schedule · Semester ${semester} · ${year}`)

  if (schedule && (schedule as { slots?: unknown[] }).slots?.length) {
    const slide = pres.addSlide()
    addSlideHeader(slide, pres, 'Weekly Class Schedule', `S${semester} ${year}`)

    const slots = (schedule as { slots: Array<{
      day: string; startTime: string; endTime: string; subject: string; code: string; venue: string; lecturer: string
    }> }).slots

    const byDay: Record<string, typeof slots> = {}
    DAYS.forEach(d => { byDay[d] = [] })
    slots.forEach(slot => { if (byDay[slot.day]) byDay[slot.day].push(slot) })

    const dayColors = [PURPLE, '2D6BA0', '1A7A5E', '8B3A6B', '5B4A2E', '2E4A5B']
    const colW = 1.55

    DAYS.forEach((day, di) => {
      const daySlots = byDay[day]
      const x = 0.3 + di * (colW + 0.04)

      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 0.85, w: colW, h: 0.38, fill: { color: dayColors[di] }, line: { color: dayColors[di] }, rectRadius: 0.05,
      })
      slide.addText(day.slice(0, 3).toUpperCase(), {
        x, y: 0.85, w: colW, h: 0.38, fontSize: 10, bold: true, color: WHITE,
        fontFace: 'Calibri', align: 'center', valign: 'middle', margin: 0,
      })

      if (daySlots.length === 0) {
        slide.addText('Free', {
          x, y: 1.3, w: colW, h: 0.6, fontSize: 9, color: MUTED, fontFace: 'Calibri', align: 'center', margin: 0,
        })
        return
      }

      daySlots.forEach((slot, si) => {
        const sy = 1.3 + si * 1.02
        slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
          x, y: sy, w: colW, h: 0.95, fill: { color: LIGHT }, line: { color: 'E2E8F0' }, rectRadius: 0.06,
        })
        slide.addText([
          { text: slot.code, options: { bold: true, breakLine: true, fontSize: 9, color: dayColors[di] } },
          { text: slot.subject.length > 22 ? slot.subject.slice(0, 20) + '…' : slot.subject, options: { breakLine: true, fontSize: 8, color: DARK } },
          { text: `${slot.startTime}–${slot.endTime}`, options: { breakLine: true, fontSize: 8, color: MUTED } },
          { text: slot.venue, options: { fontSize: 8, color: MUTED } },
        ], {
          x: x + 0.06, y: sy + 0.06, w: colW - 0.12, h: 0.83, fontFace: 'Calibri', valign: 'top', margin: 0,
        })
      })
    })
  }

  if (assessments && (assessments as { assessments?: unknown[] }).assessments?.length) {
    const slide = pres.addSlide()
    addSlideHeader(slide, pres, 'Assessment & Exam Timetable', `S${semester} ${year}`)

    type AssessmentItem = {
      date: string | Date; subject: string; code: string; type: string
      startTime: string; endTime: string; venue: string; weight?: number
    }
    const items = ((assessments as { assessments: AssessmentItem[] }).assessments)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const typeColors: Record<string, string> = {
      exam: DANGER, 'class-test': WARNING, assignment: '2563EB', practical: SUCCESS,
    }

    const tableData = [
      [
        { text: 'Date',   options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Module', options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Type',   options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Time',   options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Venue',  options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Weight', options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
      ],
      ...items.map((item, i) => {
        const rowBg  = i % 2 === 0 ? 'FFFFFF' : 'F8F5FF'
        const typeC  = typeColors[item.type] || PURPLE
        const isPast = new Date(item.date) < new Date()
        return [
          { text: new Date(item.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }), options: { fill: { color: rowBg }, fontSize: 10, color: isPast ? MUTED : DARK } },
          { text: `${item.code} — ${item.subject}`, options: { fill: { color: rowBg }, fontSize: 10, bold: true } },
          { text: item.type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()), options: { fill: { color: rowBg }, fontSize: 10, bold: true, color: typeC } },
          { text: `${item.startTime}–${item.endTime}`, options: { fill: { color: rowBg }, fontSize: 10 } },
          { text: item.venue, options: { fill: { color: rowBg }, fontSize: 10 } },
          { text: item.weight ? `${item.weight}%` : '—', options: { fill: { color: rowBg }, fontSize: 10, align: 'center', bold: !!item.weight } },
        ]
      }),
    ]

    slide.addTable(tableData, {
      x: 0.3, y: 0.9, w: 9.4, h: 4.5,
      colW: [1.6, 2.8, 1.4, 1.3, 1.5, 0.8],
      border: { pt: 0.5, color: 'E2E8F0' },
      autoPage: false,
    })
  }

  return pres.write({ outputType: 'nodebuffer' }) as Promise<Buffer>
}

// ── 3. Exam Timetable per Squad ───────────────────────────────────────────────
export async function buildExamTimetablePptx(payload: {
  semester: number; year: number; squad?: string
}): Promise<Buffer> {
  await connectDB()
  const { semester, year, squad } = payload

  const playerQuery: Record<string, unknown> = {}
  if (squad) playerQuery.squad = squad
  const players = await Player.find(playerQuery).select('fullName jerseyNumber squad').lean()
  const playerIds = players.map(p => p._id)

  const timetables = await AssessmentTimetable.find({ player: { $in: playerIds }, semester, year })
    .populate('player', 'fullName jerseyNumber')
    .lean()

  const pres = newPres(`Exam Timetable S${semester} ${year}`)
  addCoverSlide(pres, 'Exam & Assessment Timetable', `Semester ${semester} · ${year}`)

  type AssessmentItem = { date: string | Date; subject: string; code: string; type: string; startTime: string; venue: string }
  type TimetableDoc = { player: { fullName: string; jerseyNumber: number }; assessments: AssessmentItem[] }

  const allDates: Date[] = []
  timetables.forEach(t => (t as unknown as TimetableDoc).assessments?.forEach(a => allDates.push(new Date(a.date))))
  const uniqueDates = [...new Set(allDates.map(d => d.toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime())

  for (const date of uniqueDates) {
    const slide = pres.addSlide()
    const dateLabel = date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })
    addSlideHeader(slide, pres, dateLabel, `S${semester}`)

    const rows: Array<[string, string, string, string, string, string]> = []
    timetables.forEach(t => {
      const typed = t as unknown as TimetableDoc
      const dayAssessments = typed.assessments?.filter(
        a => new Date(a.date).toDateString() === date.toDateString()
      ) ?? []
      dayAssessments.forEach(a => {
        rows.push([
          String(typed.player.jerseyNumber || '—'),
          typed.player.fullName,
          `${a.code} — ${a.subject}`,
          a.type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()),
          a.startTime,
          a.venue,
        ])
      })
    })
    rows.sort((a, b) => a[1].localeCompare(b[1]))

    const tableData = [
      [
        { text: '#',      options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Player', options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Module', options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Type',   options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Time',   options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
        { text: 'Venue',  options: { bold: true, color: WHITE, fill: { color: PURPLE }, fontSize: 10 } },
      ],
      ...rows.map((r, i) => {
        const rowBg = i % 2 === 0 ? 'FFFFFF' : 'F8F5FF'
        return r.map(cell => ({ text: cell, options: { fill: { color: rowBg }, fontSize: 10 } }))
      }),
    ]

    slide.addTable(tableData, {
      x: 0.3, y: 0.9, w: 9.4, h: 4.5,
      colW: [0.5, 2.2, 2.8, 1.4, 1.0, 1.5],
      border: { pt: 0.5, color: 'E2E8F0' },
      autoPage: false,
    })
  }

  if (uniqueDates.length === 0) {
    const slide = pres.addSlide()
    addSlideHeader(slide, pres, 'No assessments found', '')
    slide.addText('No assessment data available for the selected period.', {
      x: 0.5, y: 2, w: 9, h: 1, fontSize: 16, color: MUTED, fontFace: 'Calibri', align: 'center',
    })
  }

  return pres.write({ outputType: 'nodebuffer' }) as Promise<Buffer>
}

// ── 4. Player Stats ───────────────────────────────────────────────────────────
// PlayerStats is one document per player per match — aggregate across matches
// for season totals, since Player itself carries no stats fields.
export async function buildPlayerStatsPptx(payload: {
  playerId?: string; squad?: string; season?: string
}): Promise<Buffer> {
  await connectDB()
  const { playerId, squad, season } = payload

  const playerQuery: Record<string, unknown> = {}
  if (playerId) playerQuery._id = playerId
  if (squad)    playerQuery.squad = squad

  const players = await Player.find(playerQuery)
    .select('fullName jerseyNumber position squad')
    .populate('squad', 'name type season')
    .sort({ jerseyNumber: 1 })
    .lean()

  type PlayerDoc = { _id: { toString(): string }; fullName: string; jerseyNumber: number; position: string; squad?: { name?: string } }
  const typedPlayers = players as unknown as PlayerDoc[]
  const playerIds = typedPlayers.map(p => p._id)

  // Pull all match-level stat rows for these players, filtered to matches in
  // the requested season via the Match.squad -> Team.season relationship.
  const matchFilter: Record<string, unknown> = {}
  if (season) {
    const teamsInSeason = await Team.find({ season }).select('_id').lean()
    matchFilter.squad = { $in: teamsInSeason.map(t => t._id) }
  }
  const matchIds = season
    ? (await Match.find(matchFilter).select('_id').lean()).map(m => m._id)
    : null

  const statsQuery: Record<string, unknown> = { player: { $in: playerIds } }
  if (matchIds) statsQuery.match = { $in: matchIds }

  const allStats = await PlayerStats.find(statsQuery).lean()

  type StatRow = { player: { toString(): string }; goals: number; assists: number; minutesPlayed: number; yellowCards: number; redCards: number }
  const aggregated = new Map<string, { goals: number; assists: number; minutesPlayed: number; yellowCards: number; redCards: number; appearances: number }>()

  ;(allStats as unknown as StatRow[]).forEach(s => {
    const id = s.player.toString()
    const acc = aggregated.get(id) ?? { goals: 0, assists: 0, minutesPlayed: 0, yellowCards: 0, redCards: 0, appearances: 0 }
    acc.goals += s.goals ?? 0
    acc.assists += s.assists ?? 0
    acc.minutesPlayed += s.minutesPlayed ?? 0
    acc.yellowCards += s.yellowCards ?? 0
    acc.redCards += s.redCards ?? 0
    acc.appearances += 1
    aggregated.set(id, acc)
  })

  const pres = newPres(`Player Stats — ${season || 'Current Season'}`)
  addCoverSlide(pres, 'Player Statistics', season || 'Current Season')

  const ranked = typedPlayers
    .map(p => {
      const s = aggregated.get(p._id.toString()) ?? { goals: 0, assists: 0, minutesPlayed: 0, yellowCards: 0, redCards: 0, appearances: 0 }
      return { ...p, ...s }
    })
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
    .slice(0, 10)

  {
    const slide = pres.addSlide()
    addSlideHeader(slide, pres, 'Top Performers', season || 'Season Overview')

    slide.addChart(pres.charts.BAR, [
      { name: 'Goals',   labels: ranked.map(p => p.fullName.split(' ').slice(-1)[0]), values: ranked.map(p => p.goals) },
      { name: 'Assists', labels: ranked.map(p => p.fullName.split(' ').slice(-1)[0]), values: ranked.map(p => p.assists) },
    ], {
      x: 0.3, y: 0.85, w: 9.4, h: 4.5, barDir: 'bar',
      chartColors: [PURPLE, GOLD],
      chartArea: { fill: { color: 'FFFFFF' }, roundedCorners: true },
      catAxisLabelColor: DARK, valAxisLabelColor: MUTED,
      valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
      showLegend: true, legendPos: 'b', showTitle: false,
    })
  }

  for (const player of typedPlayers) {
    const slide = pres.addSlide()
    addSlideHeader(slide, pres, player.fullName, player.position)

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.3, y: 0.85, w: 3.2, h: 1.5, fill: { color: LIGHT }, line: { color: 'E2E8F0' }, rectRadius: 0.1,
    })
    slide.addText([
      { text: `#${player.jerseyNumber}  `, options: { bold: true, color: PURPLE, fontSize: 16 } },
      { text: player.squad?.name ?? '', options: { fontSize: 12, color: MUTED } },
      { text: '\n' + player.position, options: { fontSize: 13, color: DARK, breakLine: true } },
    ], { x: 0.5, y: 0.95, w: 2.8, h: 1.2, fontFace: 'Calibri', margin: 0 })

    const s = aggregated.get(player._id.toString()) ?? { goals: 0, assists: 0, minutesPlayed: 0, yellowCards: 0, redCards: 0, appearances: 0 }

    addStatCard(slide, pres, 3.8, 0.95, 1.4, 1.1, String(s.appearances),   'Appearances', PURPLE)
    addStatCard(slide, pres, 5.3, 0.95, 1.4, 1.1, String(s.goals),        'Goals',       GOLD)
    addStatCard(slide, pres, 6.8, 0.95, 1.4, 1.1, String(s.assists),      'Assists',     '2563EB')
    addStatCard(slide, pres, 8.3, 0.95, 1.4, 1.1, String(s.minutesPlayed),'Minutes',     DARK)
    addStatCard(slide, pres, 3.8, 2.25, 1.4, 1.1, String(s.yellowCards),  'Yellow',      WARNING)
    addStatCard(slide, pres, 5.3, 2.25, 1.4, 1.1, String(s.redCards),     'Red',         DANGER)

    const gPerGame = s.appearances > 0 ? (s.goals / s.appearances).toFixed(2) : '0.00'
    addStatCard(slide, pres, 6.8, 2.25, 2.9, 1.1, gPerGame, 'Goals per Game', SUCCESS)

    if (s.goals + s.assists > 0) {
      slide.addChart(pres.charts.PIE, [{
        name: 'Contributions', labels: ['Goals', 'Assists'], values: [s.goals, s.assists],
      }], {
        x: 0.3, y: 3.55, w: 3.2, h: 1.8,
        chartColors: [PURPLE, GOLD],
        chartArea: { fill: { color: 'FFFFFF' }, roundedCorners: true },
        showPercent: true, showLegend: true, legendPos: 'b', showTitle: false,
      })
    }
  }

  return pres.write({ outputType: 'nodebuffer' }) as Promise<Buffer>
}

// ── 5. Match Summary ──────────────────────────────────────────────────────────
export async function buildMatchSummaryPptx(payload: {
  matchId?: string; squad?: string; season?: string
}): Promise<Buffer> {
  await connectDB()
  const { matchId, squad, season } = payload

  const matchQuery: Record<string, unknown> = {}
  if (matchId) matchQuery._id = matchId
  if (squad)   matchQuery.squad = squad

  if (season && !squad) {
    const teamsInSeason = await Team.find({ season }).select('_id').lean()
    matchQuery.squad = { $in: teamsInSeason.map(t => t._id) }
  }

  const matches = await Match.find(matchQuery)
    .populate('squad', 'name type')
    .sort({ date: -1 })
    .limit(matchId ? 1 : 20)
    .lean()

  type MatchDoc = {
    opponent: string; date: Date | string; venue: string; location: 'Home' | 'Away' | 'Neutral'
    competition: string; status: string; score: { home: number; away: number }
    squad?: { name?: string }
  }

  function resultFor(m: MatchDoc): 'W' | 'D' | 'L' | null {
    if (m.status !== 'Played') return null
    const us   = m.location === 'Away' ? m.score.away : m.score.home
    const them = m.location === 'Away' ? m.score.home : m.score.away
    if (us > them) return 'W'
    if (us < them) return 'L'
    return 'D'
  }

  const typed = matches as unknown as MatchDoc[]

  const pres = newPres('Match Summary')
  addCoverSlide(pres, 'Match Summary Report', season || 'NWU Soccer Institute')

  const playedMatches = typed.filter(m => m.status === 'Played')

  if (playedMatches.length > 1) {
    const wins   = playedMatches.filter(m => resultFor(m) === 'W').length
    const draws  = playedMatches.filter(m => resultFor(m) === 'D').length
    const losses = playedMatches.filter(m => resultFor(m) === 'L').length

    const slide = pres.addSlide()
    addSlideHeader(slide, pres, 'Season Results Overview', `${playedMatches.length} Matches`)

    addStatCard(slide, pres, 0.5, 1.0, 2.0, 1.3, String(wins),   'Wins',   SUCCESS)
    addStatCard(slide, pres, 2.7, 1.0, 2.0, 1.3, String(draws),  'Draws',  WARNING)
    addStatCard(slide, pres, 4.9, 1.0, 2.0, 1.3, String(losses), 'Losses', DANGER)
    addStatCard(slide, pres, 7.1, 1.0, 2.0, 1.3,
      playedMatches.length > 0 ? `${Math.round((wins / playedMatches.length) * 100)}%` : '—', 'Win Rate', PURPLE)

    slide.addChart(pres.charts.BAR, [{
      name: 'Goals Scored',
      labels: playedMatches.slice(0, 10).map(m => `vs ${m.opponent}`),
      values: playedMatches.slice(0, 10).map(m => m.location === 'Away' ? m.score.away : m.score.home),
    }], {
      x: 0.3, y: 2.6, w: 9.4, h: 2.7, barDir: 'col',
      chartColors: [PURPLE],
      chartArea: { fill: { color: 'FFFFFF' }, roundedCorners: true },
      catAxisLabelColor: MUTED, valAxisLabelColor: MUTED,
      valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
      showValue: true, dataLabelColor: DARK, showTitle: false, showLegend: false,
    })
  }

  for (const match of typed) {
    const slide = pres.addSlide()
    const result = resultFor(match)
    const resultColor = result === 'W' ? SUCCESS : result === 'D' ? WARNING : result === 'L' ? DANGER : MUTED
    const homeLabel = match.location === 'Away' ? match.opponent : (match.squad?.name ?? 'NWU')
    const awayLabel = match.location === 'Away' ? (match.squad?.name ?? 'NWU') : match.opponent
    // score.home / score.away already correspond directly to the home/away
    // labels above — no swap needed regardless of which side NWU is on.
    const homeScore = match.score.home
    const awayScore = match.score.away

    addSlideHeader(slide, pres, `${homeLabel} vs ${awayLabel}`, match.competition)

    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 2.5, y: 1.0, w: 5.0, h: 2.2, fill: { color: DARK }, line: { color: DARK }, rectRadius: 0.15,
    })
    slide.addText([
      { text: homeLabel.slice(0, 12), options: { fontSize: 14, color: MUTED, breakLine: true } },
      { text: String(homeScore), options: { fontSize: 54, bold: true, color: WHITE } },
    ], { x: 2.6, y: 1.05, w: 1.9, h: 2.1, fontFace: 'Cambria', align: 'center', valign: 'middle', margin: 0 })
    slide.addText('—', {
      x: 4.45, y: 1.6, w: 1.1, h: 1.0, fontSize: 28, bold: true, color: GOLD,
      fontFace: 'Cambria', align: 'center', valign: 'middle', margin: 0,
    })
    slide.addText([
      { text: awayLabel.slice(0, 12), options: { fontSize: 14, color: MUTED, breakLine: true } },
      { text: String(awayScore), options: { fontSize: 54, bold: true, color: WHITE } },
    ], { x: 5.5, y: 1.05, w: 1.9, h: 2.1, fontFace: 'Cambria', align: 'center', valign: 'middle', margin: 0 })

    if (result) {
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 4.25, y: 3.35, w: 1.5, h: 0.5, fill: { color: resultColor }, line: { color: resultColor }, rectRadius: 0.08,
      })
      slide.addText(result === 'W' ? 'WIN' : result === 'D' ? 'DRAW' : 'LOSS', {
        x: 4.25, y: 3.35, w: 1.5, h: 0.5, fontSize: 14, bold: true, color: WHITE,
        fontFace: 'Calibri', align: 'center', valign: 'middle', margin: 0,
      })
    } else {
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 4.25, y: 3.35, w: 1.5, h: 0.5, fill: { color: MUTED }, line: { color: MUTED }, rectRadius: 0.08,
      })
      slide.addText(match.status.toUpperCase(), {
        x: 4.25, y: 3.35, w: 1.5, h: 0.5, fontSize: 12, bold: true, color: WHITE,
        fontFace: 'Calibri', align: 'center', valign: 'middle', margin: 0,
      })
    }

    slide.addText(
      `${new Date(match.date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}  ·  ${match.venue}`,
      { x: 0.3, y: 4.0, w: 9.4, h: 0.4, fontSize: 11, color: MUTED, fontFace: 'Calibri', align: 'center', margin: 0 }
    )
  }

  return pres.write({ outputType: 'nodebuffer' }) as Promise<Buffer>
}

// ── 6. Analytics — Training Attendance ─────────────────────────────────────────
// TrainingSession.attendance is an array of {player, status, notes} —
// attendance rate = Present count / total attendance entries logged for that session.
export async function buildAnalyticsPptx(payload: {
  analyticsType: 'attendance'
  squad?: string
  season?: string
}): Promise<Buffer> {
  await connectDB()
  const { analyticsType, squad, season } = payload

  const pres = newPres(`Analytics — ${analyticsType}`)
  addCoverSlide(pres, `${analyticsType.replace(/\b\w/g, c => c.toUpperCase())} Analytics`, season || 'Current Season')

  if (analyticsType === 'attendance') {
    const sessionQuery: Record<string, unknown> = {}
    if (squad) sessionQuery.squad = squad

    const sessions = await TrainingSession.find(sessionQuery)
      .sort({ date: -1 })
      .limit(30)
      .lean()

    type SessionDoc = {
      date: Date | string; title: string
      attendance: Array<{ status: 'Present' | 'Absent' | 'Excused' }>
    }
    const typed = sessions as unknown as SessionDoc[]

    function rateFor(s: SessionDoc) {
      if (!s.attendance?.length) return 0
      const present = s.attendance.filter(a => a.status === 'Present').length
      return Math.round((present / s.attendance.length) * 100)
    }

    const avgRate = typed.length
      ? Math.round(typed.reduce((acc, s) => acc + rateFor(s), 0) / typed.length)
      : 0

    const slide = pres.addSlide()
    addSlideHeader(slide, pres, 'Attendance Overview', season || 'Current Season')

    addStatCard(slide, pres, 0.5, 1.0, 2.0, 1.3, `${avgRate}%`, 'Avg Attendance', avgRate >= 80 ? SUCCESS : avgRate >= 60 ? WARNING : DANGER)
    addStatCard(slide, pres, 2.7, 1.0, 2.0, 1.3, String(sessions.length), 'Sessions', PURPLE)

    if (typed.length > 0) {
      slide.addChart(pres.charts.LINE, [{
        name: 'Attendance %',
        labels: typed.slice(0, 12).reverse().map(s => new Date(s.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })),
        values: typed.slice(0, 12).reverse().map(s => rateFor(s)),
      }], {
        x: 0.3, y: 2.6, w: 9.4, h: 2.7,
        chartColors: [PURPLE],
        chartArea: { fill: { color: 'FFFFFF' }, roundedCorners: true },
        catAxisLabelColor: MUTED, valAxisLabelColor: MUTED,
        valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
        lineSize: 3, lineSmooth: true, showTitle: false, showLegend: false,
      })
    }
  }

  return pres.write({ outputType: 'nodebuffer' }) as Promise<Buffer>
}
