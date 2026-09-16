import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import {
  buildAcademicsOverviewPptx,
  buildPlayerSchedulePptx,
  buildPlayerStatsPptx,
  buildMatchSummaryPptx,
  buildAnalyticsPptx,
  buildExamTimetablePptx,
} from '@/lib/pptx-export'

/**
 * POST /api/export/pptx
 * Body: { type, ...payload }
 *
 * Types:
 *  - academics-overview  { semester, year, squad? }       squad = Team ObjectId
 *  - player-schedule     { playerId, semester, year }
 *  - exam-timetable      { semester, year, squad? }
 *  - player-stats        { playerId?, squad?, season? }
 *  - match-summary       { matchId?, squad?, season? }
 *  - analytics           { analyticsType: 'attendance', squad?, season? }
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type, ...payload } = body

    let buffer: Buffer
    let filename: string

    switch (type) {
      case 'academics-overview':
        buffer   = await buildAcademicsOverviewPptx(payload)
        filename = `NWU_Academics_Overview_S${payload.semester}_${payload.year}.pptx`
        break
      case 'player-schedule':
        buffer   = await buildPlayerSchedulePptx(payload)
        filename = `NWU_Player_Schedule_S${payload.semester}_${payload.year}.pptx`
        break
      case 'exam-timetable':
        buffer   = await buildExamTimetablePptx(payload)
        filename = `NWU_Exam_Timetable_S${payload.semester}_${payload.year}.pptx`
        break
      case 'player-stats':
        buffer   = await buildPlayerStatsPptx(payload)
        filename = `NWU_Player_Stats_${payload.season || 'Current'}.pptx`
        break
      case 'match-summary':
        buffer   = await buildMatchSummaryPptx(payload)
        filename = `NWU_Match_Summary.pptx`
        break
      case 'analytics':
        buffer   = await buildAnalyticsPptx(payload)
        filename = `NWU_Analytics_${payload.analyticsType || 'Report'}.pptx`
        break
      default:
        return NextResponse.json({ error: `Unknown export type: ${type}` }, { status: 400 })
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('POST /api/export/pptx', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
