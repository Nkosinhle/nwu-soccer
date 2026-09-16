import mongoose, { Schema, Document, Model } from 'mongoose'

// ─── USER ──────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: 'admin' | 'coach' | 'physio' | 'support_staff' | 'player'
  avatar?: string
  playerId?: mongoose.Types.ObjectId
  createdAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin','coach','physio','support_staff','player'], default: 'player' },
  avatar:   { type: String },
  playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
}, { timestamps: true })

// NOTE: No pre-save password hashing hook.
// Passwords are hashed explicitly in seed.js and api/profile/route.ts.
// This prevents double-hashing which corrupts passwords.

UserSchema.methods.comparePassword = async function(candidate: string) {
  return bcrypt.compare(candidate, this.password)
}

// ─── PLAYER ─────────────────────────────────────────────────────────────────
export interface IPlayer extends Document {
  fullName: string
  studentNumber: string
  age: number
  dateOfBirth: Date
  gender: 'male' | 'female'
  position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Striker'
  jerseyNumber: number
  contactEmail: string
  contactPhone: string
  emergencyContact: { name: string; phone: string; relationship: string }
  squad: mongoose.Types.ObjectId
  profileImage?: string
  fitnessStatus: 'Fit' | 'Injured' | 'Recovering' | 'Suspended'
  nationality: string
  bio?: string
  nickname?: string
  socialMedia?: { instagram?: string; facebook?: string; twitter?: string; tiktok?: string }
  favouritePlayer?: string
  favouriteTeam?: string
  favouriteQuote?: string
  favouriteSuperhero?: string
  createdAt: Date
  updatedAt: Date
}

const PlayerSchema = new Schema<IPlayer>({
  fullName:      { type: String, required: true, trim: true },
  studentNumber: { type: String, required: true, unique: true },
  age:           { type: Number, required: true },
  dateOfBirth:   { type: Date, required: true },
  gender:        { type: String, enum: ['male','female'], default: 'male' },
  position:      { type: String, enum: ['Goalkeeper','Defender','Midfielder','Striker'], required: true },
  jerseyNumber:  { type: Number, required: true },
  contactEmail:  { type: String, required: true },
  contactPhone:  { type: String },
  emergencyContact: {
    name:         { type: String },
    phone:        { type: String },
    relationship: { type: String },
  },
  squad:         { type: Schema.Types.ObjectId, ref: 'Team' },
  profileImage:  { type: String },
  fitnessStatus: { type: String, enum: ['Fit','Injured','Recovering','Suspended'], default: 'Fit' },
  nationality:   { type: String, default: 'South African' },
  bio:           { type: String },
  nickname:      { type: String },
  socialMedia: {
    instagram: { type: String },
    facebook:  { type: String },
    twitter:   { type: String },
    tiktok:    { type: String },
  },
  favouritePlayer:    { type: String },
  favouriteTeam:      { type: String },
  favouriteQuote:     { type: String },
  favouriteSuperhero: { type: String },
}, { timestamps: true })

// ─── TEAM ────────────────────────────────────────────────────────────────────
export interface ITeam extends Document {
  name: string
  type: 'First Team' | 'Reserves' | 'U21'
  players: mongoose.Types.ObjectId[]
  coaches: mongoose.Types.ObjectId[]
  physios: mongoose.Types.ObjectId[]
  supportStaff: mongoose.Types.ObjectId[]
  season: string
  description?: string
}

const TeamSchema = new Schema<ITeam>({
  name:         { type: String, required: true },
  type:         { type: String, enum: ['First Team','Reserves','U21', 'NFD'], required: true },
  players:      [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  coaches:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  physios:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  supportStaff: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  season:       { type: String, default: new Date().getFullYear().toString() },
  description:  { type: String },
}, { timestamps: true })

// ─── MATCH ───────────────────────────────────────────────────────────────────
export interface IMatch extends Document {
  opponent: string
  date: Date
  venue: string
  location: 'Home' | 'Away' | 'Neutral'
  competition: string
  squad: mongoose.Types.ObjectId
  status: 'Upcoming' | 'Played' | 'Cancelled' | 'Postponed'
  score: { home: number; away: number }
  lineup: mongoose.Types.ObjectId[]
  notes?: string
  createdAt: Date
}

const MatchSchema = new Schema<IMatch>({
  opponent:    { type: String, required: true },
  date:        { type: Date, required: true },
  venue:       { type: String, required: true },
  location:    { type: String, enum: ['Home','Away','Neutral'], default: 'Home' },
  competition: { type: String, default: 'USSA League' },
  squad:       { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  status:      { type: String, enum: ['Upcoming','Played','Cancelled','Postponed'], default: 'Upcoming' },
  score:       { home: { type: Number, default: 0 }, away: { type: Number, default: 0 } },
  lineup:      [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  notes:       { type: String },
}, { timestamps: true })

// ─── PLAYER STATS ─────────────────────────────────────────────────────────────
export interface IPlayerStats extends Document {
  player: mongoose.Types.ObjectId
  match: mongoose.Types.ObjectId
  goals: number
  assists: number
  minutesPlayed: number
  yellowCards: number
  redCards: number
  saves?: number
  tackles?: number
  rating?: number
}

const PlayerStatsSchema = new Schema<IPlayerStats>({
  player:       { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  match:        { type: Schema.Types.ObjectId, ref: 'Match', required: true },
  goals:        { type: Number, default: 0 },
  assists:      { type: Number, default: 0 },
  minutesPlayed:{ type: Number, default: 0 },
  yellowCards:  { type: Number, default: 0 },
  redCards:     { type: Number, default: 0 },
  saves:        { type: Number, default: 0 },
  tackles:      { type: Number, default: 0 },
  rating:       { type: Number, min: 1, max: 10 },
}, { timestamps: true })

// ─── MEDICAL RECORD ───────────────────────────────────────────────────────────
export interface IMedicalRecord extends Document {
  player: mongoose.Types.ObjectId
  injuryType: string
  severity: 'Minor' | 'Moderate' | 'Severe'
  dateOfInjury: Date
  description: string
  bodyPart: string
  recoveryStatus: 'Active' | 'Recovering' | 'Cleared'
  estimatedRecoveryDate?: Date
  actualRecoveryDate?: Date
  notes?: string
  clearedForPlay: boolean
  recordedBy: mongoose.Types.ObjectId
}

const MedicalRecordSchema = new Schema<IMedicalRecord>({
  player:               { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  injuryType:           { type: String, required: true },
  severity:             { type: String, enum: ['Minor','Moderate','Severe'], required: true },
  dateOfInjury:         { type: Date, required: true },
  description:          { type: String, required: true },
  bodyPart:             { type: String, required: true },
  recoveryStatus:       { type: String, enum: ['Active','Recovering','Cleared'], default: 'Active' },
  estimatedRecoveryDate:{ type: Date },
  actualRecoveryDate:   { type: Date },
  notes:                { type: String },
  clearedForPlay:       { type: Boolean, default: false },
  recordedBy:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

// ─── TRAINING SESSION ─────────────────────────────────────────────────────────
export interface ITrainingSession extends Document {
  title: string
  date: Date
  duration: number
  squad: mongoose.Types.ObjectId
  location: string
  type: 'Technical' | 'Tactical' | 'Physical' | 'Recovery' | 'Match Prep'
  notes?: string
  attendance: Array<{
    player: mongoose.Types.ObjectId
    status: 'Present' | 'Absent' | 'Excused'
    notes?: string
  }>
  createdBy: mongoose.Types.ObjectId
}

const TrainingSessionSchema = new Schema<ITrainingSession>({
  title:    { type: String, required: true },
  date:     { type: Date, required: true },
  duration: { type: Number, required: true },
  squad:    { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  location: { type: String, required: true },
  type:     { type: String, enum: ['Technical','Tactical','Physical','Recovery','Match Prep'], required: true },
  notes:    { type: String },
  attendance: [{
    player: { type: Schema.Types.ObjectId, ref: 'Player' },
    status: { type: String, enum: ['Present','Absent','Excused'], default: 'Present' },
    notes:  { type: String },
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

// ── CLASS SCHEDULE ────────────────────────────────────────────────────────────
export interface IClassSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  startTime: string   // "08:00"
  endTime: string     // "10:00"
  subject: string
  code: string         // e.g. "COMP211"
  venue: string
  lecturer: string
}

export interface IClassSchedule extends Document {
  player: mongoose.Types.ObjectId
  semester: 1 | 2
  year: number
  slots: IClassSlot[]
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

const ClassSlotSchema = new Schema<IClassSlot>({
  day:       { type: String, required: true, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  subject:   { type: String, required: true },
  code:      { type: String, required: true },
  venue:     { type: String, required: true },
  lecturer:  { type: String, required: true },
}, { _id: false })

const ClassScheduleSchema = new Schema<IClassSchedule>({
  player:      { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  semester:    { type: Number, required: true, enum: [1, 2] },
  year:        { type: Number, required: true },
  slots:       [ClassSlotSchema],
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })

ClassScheduleSchema.index({ player: 1, semester: 1, year: 1 }, { unique: true })

// ── ASSESSMENT / EXAM TIMETABLE ───────────────────────────────────────────────
export interface IAssessment {
  type: 'class-test' | 'assignment' | 'exam' | 'practical'
  subject: string
  code: string          // e.g. "COMP211"
  date: Date
  startTime: string     // "08:00"
  endTime: string       // "10:00"
  venue: string
  notes?: string
  weight?: number        // % of final mark, e.g. 30
}

export interface IAssessmentTimetable extends Document {
  player: mongoose.Types.ObjectId
  semester: 1 | 2
  year: number
  assessments: IAssessment[]
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

const AssessmentSchema = new Schema<IAssessment>({
  type:      { type: String, required: true, enum: ['class-test','assignment','exam','practical'] },
  subject:   { type: String, required: true },
  code:      { type: String, required: true },
  date:      { type: Date,   required: true },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  venue:     { type: String, required: true },
  notes:     { type: String },
  weight:    { type: Number },
}, { _id: false })

const AssessmentTimetableSchema = new Schema<IAssessmentTimetable>({
  player:      { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  semester:    { type: Number, required: true, enum: [1, 2] },
  year:        { type: Number, required: true },
  assessments: [AssessmentSchema],
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })

AssessmentTimetableSchema.index({ player: 1, semester: 1, year: 1 }, { unique: true })

// ── NOTIFICATION (in-app) ─────────────────────────────────────────────────────
export interface INotification extends Document {
  user: mongoose.Types.ObjectId   // ref 'User' — matches your existing naming convention (no "Id" suffix elsewhere, e.g. `squad`, `match`, `player`)
  title: string
  message: string
  link?: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>({
  user:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  link:    { type: String },
  type:    { type: String, enum: ['info','warning','success','error'], default: 'info' },
  read:    { type: Boolean, default: false },
}, { timestamps: true })

// ─── EXPORT MODELS ────────────────────────────────────────────────────────────
function model<T extends Document>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema)
}

export const User           = model<IUser>('User', UserSchema)
export const Player         = model<IPlayer>('Player', PlayerSchema)
export const Team           = model<ITeam>('Team', TeamSchema)
export const Match          = model<IMatch>('Match', MatchSchema)
export const PlayerStats    = model<IPlayerStats>('PlayerStats', PlayerStatsSchema)
export const MedicalRecord  = model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema)
export const TrainingSession = model<ITrainingSession>('TrainingSession', TrainingSessionSchema)

export const ClassSchedule       = model<IClassSchedule>('ClassSchedule', ClassScheduleSchema)
export const AssessmentTimetable = model<IAssessmentTimetable>('AssessmentTimetable', AssessmentTimetableSchema)
export const Notification        = model<INotification>('Notification', NotificationSchema)