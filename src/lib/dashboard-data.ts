import { connectDB } from '@/lib/db'
import {
  Player,
  Match,
  Team,
  MedicalRecord,
  PlayerStats,
  ClassSchedule,
  AssessmentTimetable,
} from '@/lib/models'

export async function getDashboardData() {
  await connectDB()

  const now = new Date()
  const semester = now.getMonth() < 6 ? 1 : 2
  const year = now.getFullYear()

  const [
    totalPlayers,
    totalTeams,
    upcomingMatches,
    injuredPlayers,
    fitPlayers,
    totalMatches,
    recentMatches,
    recentInjuries,
    topScorers,
    fitnessBreakdown,
    positionBreakdown,
    matchResults,
    schedulePlayerIds,
    assessmentPlayerIds,
    allPlayerIds,
  ] = await Promise.all([
    Player.countDocuments(),
    Team.countDocuments(),
    Match.countDocuments({ status: 'Upcoming' }),

    Player.countDocuments({
      fitnessStatus: { $in: ['Injured', 'Recovering'] },
    }),

    Player.countDocuments({ fitnessStatus: 'Fit' }),
    Match.countDocuments({ status: 'Played' }),

    Match.find({
      status: { $in: ['Played', 'Upcoming'] },
    })
      .sort({ date: -1 })
      .limit(5)
      .select('opponent date status score location squad')
      .populate('squad', 'name')
      .lean(),

    MedicalRecord.find({
      recoveryStatus: { $in: ['Active', 'Recovering'] },
    })
      .sort({ dateOfInjury: -1 })
      .limit(5)
      .select('injuryType player recoveryStatus')
      .populate('player', 'fullName')
      .lean(),

    PlayerStats.aggregate([
      {
        $group: {
          _id: '$player',
          totalGoals: { $sum: '$goals' },
          totalAssists: { $sum: '$assists' },
          matches: { $sum: 1 },
          totalMinutes: { $sum: '$minutesPlayed' },
        },
      },
      {
        $sort: {
          totalGoals: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: 'players',
          localField: '_id',
          foreignField: '_id',
          as: 'player',
          pipeline: [
            {
              $project: {
                fullName: 1,
                position: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: '$player',
      },
    ]),

    Player.aggregate([
      {
        $group: {
          _id: '$fitnessStatus',
          count: { $sum: 1 },
        },
      },
    ]),

    Player.aggregate([
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 },
        },
      },
    ]),

    Match.aggregate([
      {
        $match: {
          status: 'Played',
        },
      },
      {
        $project: {
          result: {
            $cond: [
              {
                $gt: ['$score.home', '$score.away'],
              },
              'Win',
              {
                $cond: [
                  {
                    $lt: ['$score.home', '$score.away'],
                  },
                  'Loss',
                  'Draw',
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$result',
          count: { $sum: 1 },
        },
      },
    ]),

    ClassSchedule.distinct('player', {
      semester,
      year,
    }),

    AssessmentTimetable.distinct('player', {
      semester,
      year,
    }),

    Player.distinct('_id'),
  ])

  const scheduleSet = new Set(
    schedulePlayerIds.map((id) => id.toString())
  )

  const assessmentSet = new Set(
    assessmentPlayerIds.map((id) => id.toString())
  )

  let complete = 0
  let partial = 0
  let none = 0

  for (const id of allPlayerIds) {
    const playerId = id.toString()

    const hasSchedule = scheduleSet.has(playerId)
    const hasAssessment = assessmentSet.has(playerId)

    if (hasSchedule && hasAssessment) {
      complete++
    } else if (hasSchedule || hasAssessment) {
      partial++
    } else {
      none++
    }
  }

  const data = {
    stats: {
      totalPlayers,
      totalTeams,
      upcomingMatches,
      injuredPlayers,
      fitPlayers,
      totalMatches,
    },

    recentMatches,
    topScorers,
    fitnessBreakdown,
    positionBreakdown,
    matchResults,
    recentInjuries,

    academicsSummary: {
      semester,
      year,
      total: totalPlayers,
      complete,
      partial,
      none,
    },
  }

  // Absolutely ensure no ObjectIds / Mongoose-specific values
  // cross the Server -> Client boundary.
  return JSON.parse(JSON.stringify(data))
}