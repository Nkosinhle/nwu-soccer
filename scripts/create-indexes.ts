/**
 * NWU Soccer Institute — MongoDB Index Setup
 * Run once: npx tsx scripts/create-indexes.ts
 * Or add to your seed script.
 *
 * These indexes turn full collection scans (100–400ms each) into
 * index lookups (1–5ms). This is the biggest single performance
 * improvement you can make without changing any application code.
 */

import { connectDB } from '../src/lib/db'
import mongoose from 'mongoose'

async function createIndexes() {
  await connectDB()
  const db = mongoose.connection.db!

  console.log('Creating indexes...\n')

  // ── Player ────────────────────────────────────────────────────────────────
  await db.collection('players').createIndexes([
    { key: { squad: 1 },                     name: 'squad' },
    { key: { fitnessStatus: 1 },             name: 'fitnessStatus' },
    { key: { position: 1 },                  name: 'position' },
    { key: { studentNumber: 1 }, unique: true, name: 'studentNumber_unique' },
    // Compound — used by overview pages that filter by squad + status
    { key: { squad: 1, fitnessStatus: 1 },   name: 'squad_fitnessStatus' },
  ])
  console.log('✓ players')

  // ── Match ─────────────────────────────────────────────────────────────────
  await db.collection('matches').createIndexes([
    { key: { status: 1 },                    name: 'status' },
    { key: { squad: 1 },                     name: 'squad' },
    { key: { date: -1 },                     name: 'date_desc' },
    // Compound — dashboard "upcoming matches" and "recent matches" queries
    { key: { status: 1, date: -1 },          name: 'status_date' },
    { key: { squad: 1, status: 1, date: -1 },name: 'squad_status_date' },
  ])
  console.log('✓ matches')

  // ── PlayerStats ───────────────────────────────────────────────────────────
  // This is the most critical — aggregate() without an index is a full scan
  await db.collection('playerstats').createIndexes([
    { key: { player: 1 },                    name: 'player' },
    { key: { match: 1 },                     name: 'match' },
    // Compound — the dashboard topScorers aggregation groups by player
    { key: { player: 1, match: 1 }, unique: true, name: 'player_match_unique' },
    // Allows fast per-player stat lookups
    { key: { player: 1, goals: -1 },         name: 'player_goals' },
  ])
  console.log('✓ playerstats')

  // ── Team ──────────────────────────────────────────────────────────────────
  await db.collection('teams').createIndexes([
    { key: { type: 1 },                      name: 'type' },
    { key: { season: 1 },                    name: 'season' },
    { key: { type: 1, season: 1 },           name: 'type_season' },
  ])
  console.log('✓ teams')

  // ── MedicalRecord ─────────────────────────────────────────────────────────
  await db.collection('medicalrecords').createIndexes([
    { key: { player: 1 },                    name: 'player' },
    { key: { recoveryStatus: 1 },            name: 'recoveryStatus' },
    // Dashboard active-injuries query
    { key: { recoveryStatus: 1, dateOfInjury: -1 }, name: 'recoveryStatus_date' },
  ])
  console.log('✓ medicalrecords')

  // ── TrainingSession ───────────────────────────────────────────────────────
  await db.collection('trainingsessions').createIndexes([
    { key: { squad: 1 },                     name: 'squad' },
    { key: { date: -1 },                     name: 'date_desc' },
    { key: { squad: 1, date: -1 },           name: 'squad_date' },
  ])
  console.log('✓ trainingsessions')

  // ── User ──────────────────────────────────────────────────────────────────
  await db.collection('users').createIndexes([
    { key: { email: 1 }, unique: true,       name: 'email_unique' },
    { key: { playerId: 1 },                  name: 'playerId' },
    { key: { role: 1 },                      name: 'role' },
  ])
  console.log('✓ users')

  // ── Notification ──────────────────────────────────────────────────────────
  await db.collection('notifications').createIndexes([
    { key: { forUser: 1 },                   name: 'forUser' },
    { key: { forRoles: 1 },                  name: 'forRoles' },
    { key: { createdAt: -1 },                name: 'createdAt_desc' },
    // The exact compound needed by the GET /api/notifications query
    { key: { forUser: 1, createdAt: -1 },    name: 'forUser_date' },
  ])
  console.log('✓ notifications')

  // ── ClassSchedule ─────────────────────────────────────────────────────────
  await db.collection('classschedules').createIndexes([
    { key: { player: 1, semester: 1, year: 1 }, unique: true, name: 'player_semester_year_unique' },
    { key: { semester: 1, year: 1 },            name: 'semester_year' },
  ])
  console.log('✓ classschedules')

  // ── AssessmentTimetable ───────────────────────────────────────────────────
  await db.collection('assessmenttimetables').createIndexes([
    { key: { player: 1, semester: 1, year: 1 }, unique: true, name: 'player_semester_year_unique' },
    { key: { semester: 1, year: 1 },            name: 'semester_year' },
    // For upcoming-assessment queries
    { key: { 'assessments.date': 1 },           name: 'assessments_date' },
  ])
  console.log('✓ assessmenttimetables')

  console.log('\nAll indexes created successfully.')
  process.exit(0)
}

createIndexes().catch(err => {
  console.error('Index creation failed:', err)
  process.exit(1)
})
