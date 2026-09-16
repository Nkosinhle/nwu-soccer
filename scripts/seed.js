/**
 * NWU Soccer Institute - Database Seed Script
 * Run: npm run db:seed
 *
 * Squads:
 *   First Team
 *   Regional Team
 *   Junior Team
 *   NFD Squad
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set in .env.local')
  process.exit(1)
}


// ============================================================
// SCHEMAS
// ============================================================

const UserSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    unique: true
  },

  password: String,

  role: {
    type: String,
    enum: [
      'admin',
      'coach',
      'physio',
      'support_staff',
      'player'
    ]
  },

  avatar: String,

  playerId: mongoose.Types.ObjectId,

}, { timestamps: true })


const PlayerSchema = new mongoose.Schema({

  fullName: String,

  studentNumber: String,

  age: Number,

  dateOfBirth: Date,

  gender: String,

  position: String,

  jerseyNumber: Number,

  contactEmail: String,

  contactPhone: String,

  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },

  squad: mongoose.Types.ObjectId,

  profileImage: String,

  fitnessStatus: {
    type: String,
    default: 'Fit'
  },

  nationality: String,

  bio: String,

  nickname: String,

  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String,
    tiktok: String
  },

  favouritePlayer: String,

  favouriteTeam: String,

  favouriteQuote: String,

  favouriteSuperhero: String,

}, { timestamps: true })


const TeamSchema = new mongoose.Schema({

  name: String,

  type: String,

  players: [mongoose.Types.ObjectId],

  coaches: [mongoose.Types.ObjectId],

  physios: [mongoose.Types.ObjectId],

  supportStaff: [mongoose.Types.ObjectId],

  season: String,

  description: String,

}, { timestamps: true })


const MatchSchema = new mongoose.Schema({

  opponent: String,

  date: Date,

  venue: String,

  location: String,

  competition: String,

  squad: mongoose.Types.ObjectId,

  status: String,

  score: {
    home: Number,
    away: Number
  },

  lineup: [mongoose.Types.ObjectId],

  notes: String,

}, { timestamps: true })


const PlayerStatsSchema = new mongoose.Schema({

  player: mongoose.Types.ObjectId,

  match: mongoose.Types.ObjectId,

  goals: {
    type: Number,
    default: 0
  },

  assists: {
    type: Number,
    default: 0
  },

  minutesPlayed: {
    type: Number,
    default: 0
  },

  yellowCards: {
    type: Number,
    default: 0
  },

  redCards: {
    type: Number,
    default: 0
  },

  saves: {
    type: Number,
    default: 0
  },

  tackles: {
    type: Number,
    default: 0
  },

  rating: Number,

}, { timestamps: true })


const MedicalRecordSchema = new mongoose.Schema({

  player: mongoose.Types.ObjectId,

  injuryType: String,

  severity: String,

  dateOfInjury: Date,

  description: String,

  bodyPart: String,

  recoveryStatus: {
    type: String,
    default: 'Active'
  },

  estimatedRecoveryDate: Date,

  notes: String,

  clearedForPlay: {
    type: Boolean,
    default: false
  },

  recordedBy: mongoose.Types.ObjectId,

}, { timestamps: true })


const TrainingSessionSchema = new mongoose.Schema({

  title: String,

  date: Date,

  duration: Number,

  squad: mongoose.Types.ObjectId,

  location: String,

  type: String,

  notes: String,

  attendance: [{

    player: mongoose.Types.ObjectId,

    status: {
      type: String,
      enum: [
        'Present',
        'Absent',
        'Excused'
      ],
      default: 'Present'
    },

    notes: String,

  }],

  createdBy: mongoose.Types.ObjectId,

}, { timestamps: true })


const User =
  mongoose.models.User ||
  mongoose.model('User', UserSchema)

const Player =
  mongoose.models.Player ||
  mongoose.model('Player', PlayerSchema)

const Team =
  mongoose.models.Team ||
  mongoose.model('Team', TeamSchema)

const Match =
  mongoose.models.Match ||
  mongoose.model('Match', MatchSchema)

const PlayerStats =
  mongoose.models.PlayerStats ||
  mongoose.model('PlayerStats', PlayerStatsSchema)

const MedicalRecord =
  mongoose.models.MedicalRecord ||
  mongoose.model('MedicalRecord', MedicalRecordSchema)

const TrainingSession =
  mongoose.models.TrainingSession ||
  mongoose.model('TrainingSession', TrainingSessionSchema)


// ============================================================
// HELPERS
// ============================================================

function calcAge(dob) {

  const today = new Date()

  const birth = new Date(dob)

  let age =
    today.getFullYear() -
    birth.getFullYear()

  const month =
    today.getMonth() -
    birth.getMonth()

  if (
    month < 0 ||
    (
      month === 0 &&
      today.getDate() < birth.getDate()
    )
  ) {
    age--
  }

  return age
}


function toSlug(name) {

  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}


function buildPlayer(p, squadId, idx, prefix, imageExtension) {
  var dob = new Date(p.dob)

  return {
    fullName:           p.n,
    nickname:           p.nick || '',
    dateOfBirth:        dob,
    age:                calcAge(dob),
    gender:             'male',
    nationality:        'South African',
    squad:              squadId,
    fitnessStatus:      'Fit',
    position:           p.pos || 'Midfielder',
    jerseyNumber:       idx + 1,
    studentNumber:      prefix + String(idx + 1).padStart(3, '0'),
    contactEmail:       toSlug(p.n).replace(/-/g, '.') + '@nwu.ac.za',
    contactPhone:       '',

    profileImage:
      '/images/players/' +
      toSlug(p.n) +
      '.' +
      imageExtension,

    socialMedia: {
      instagram: p.ig || '',
      facebook:  p.fb || '',
      twitter:   p.tw || '',
      tiktok:    p.tt || '',
    },

    bio:
      p.dpos
        ? 'Plays as ' + p.dpos
        : '',

    favouritePlayer:
      p.fp || '',

    favouriteTeam:
      p.ft || '',

    favouriteQuote:
      p.fq || '',

    favouriteSuperhero:
      p.sh || '',
  }
}


// ============================================================
// NFD RETURNING PLAYERS
// ============================================================
//
// These names are intentionally excluded from the other squads.
// They will be created ONCE and assigned to NFD.
//
// ============================================================

const nfdReturningPlayers = new Set([

  'Ranonyane Mmutlane',

  'Xolani Masethi',

  'Lucas Seromo',

  'Momelezi Mngati',

  'Khumoetsile Moses',

  'Thapelo Letsholonyane',

  'Sive Pitolo',

  'Reatlegile Kgosithebe',

  'Philane Masondo',

  'Aphelele Sibisi',

  'Bokamoso Ramoshoane',

  'Thikho Magada',

  'Karabo Ntsala',

  'Sinethemba Mdluli',

])


// ============================================================
// SEED
// ============================================================

async function seed() {

  console.log('')
  console.log('Connecting to MongoDB...')


  try {

    await mongoose.connect(
      MONGODB_URI,
      {
        serverSelectionTimeoutMS: 10000
      }
    )

    console.log('Connected.')

  } catch (err) {

    console.error(
      'Connection failed: ' +
      err.message
    )

    if (
      err.message.includes(
        'ECONNREFUSED'
      )
    ) {

      console.error(
        'MongoDB is not running.'
      )

      console.error(
        'Run: net start MongoDB'
      )

    }

    process.exit(1)
  }


  // ==========================================================
  // CLEAR DATABASE
  // ==========================================================

  await Promise.all([

    User.deleteMany({}),

    Player.deleteMany({}),

    Team.deleteMany({}),

    Match.deleteMany({}),

    PlayerStats.deleteMany({}),

    MedicalRecord.deleteMany({}),

    TrainingSession.deleteMany({}),

  ])

  console.log('Cleared existing data.')


  // ==========================================================
  // PASSWORD
  // ==========================================================

  const PLAIN =
    'password123'

  const hash =
    await bcrypt.hash(
      PLAIN,
      12
    )


  // ==========================================================
  // STAFF
  // ==========================================================

  const staff =
    await User.insertMany([

      {
        name: 'Admin User',

        email:
          'admin@nwu.ac.za',

        password:
          hash,

        role:
          'admin'
      },

      {
        name: 'Head Coach',

        email:
          'coach@nwu.ac.za',

        password:
          hash,

        role:
          'coach'
      },

      {
        name: 'Physiotherapist',

        email:
          'physio@nwu.ac.za',

        password:
          hash,

        role:
          'physio'
      },

      {
        name: 'Support Staff',

        email:
          'support@nwu.ac.za',

        password:
          hash,

        role:
          'support_staff'
      },

    ])


  const coach =
    staff[1]

  const physio =
    staff[2]

  const support =
    staff[3]


  console.log(
    'Created 4 staff users.'
  )


  // ==========================================================
  // SQUADS
  // ==========================================================

  const squads =
    await Team.insertMany([

      {
        name:
          'NWU First XI',

        type:
          'First Team',

        coaches:
          [coach._id],

        physios:
          [physio._id],

        supportStaff:
          [support._id],

        season:
          '2025',

        description:
          'Main competitive squad - Season 2025/26'
      },


      {
        name:
          'NWU Regional Team',

        type:
          'Regional',

        coaches:
          [coach._id],

        physios:
          [physio._id],

        season:
          '2025',

        description:
          'Regional representative squad - Season 2025'
      },


      {
        name:
          'NWU Junior Team',

        type:
          'Junior',

        coaches:
          [coach._id],

        season:
          '2025',

        description:
          'Junior development squad - Season 2025'
      },


      {
        name:
          'NWU NFD Squad',

        type:
          'NFD',

        coaches:
          [coach._id],

        physios:
          [physio._id],

        supportStaff:
          [support._id],

        season:
          '2025',

        description:
          'NFD squad - Season 2025/26'
      },

    ])


  const firstTeam =
    squads[0]

  const regionalTeam =
    squads[1]

  const juniorTeam =
    squads[2]

  const nfdTeam =
    squads[3]


  console.log(
    'Created 4 squads.'
  )


  // ==========================================================
  // FIRST TEAM
  // ==========================================================

  const firstRaw = [

    {
      n:'Mlamleli Kokela',
      nick:'Mlamleli',
      dob:'2006-07-14',
      pos:'Defender',
      dpos:'RB',
      ig:'Mlamleli_kokela',
      tt:'Mlamleli kokela'
    },

    {
      n:'Khumoetsile Moses',
      nick:'Khumo',
      dob:'2001-07-26',
      pos:'Goalkeeper',
      dpos:'GK',
      ig:'Khumoetsile Moses',
      fb:'Khumoetsile moses',
      fp:'Manuel Neuer',
      ft:'Mamelodi Sundowns, Man City',
      fq:'Isaiah 60:22'
    },

    {
      n:'Thapelo Letsholonyane',
      nick:'Tino',
      dob:'2002-04-12',
      pos:'Midfielder',
      dpos:'CDM',
      ig:'letsholonyane18',
      tt:'Tino letsholonyane',
      fp:'Federico Valverde',
      fq:'Isaiah 60:22'
    },

    {
      n:'Keorapetse Galehose',
      nick:'Keorapetse',
      dob:'2002-01-31',
      pos:'Striker',
      dpos:'ST',
      ig:'keogalehose_17',
      fp:'CR7',
      ft:'Real Madrid',
      fq:'Matthew 9:29'
    },

    {
      n:'Bokamoso Ramoshoane',
      nick:'Duracell',
      dob:'2003-10-25',
      pos:'Midfielder',
      dpos:'CDM',
      ig:'Duracell_08'
    },

    {
      n:'Khumoetsile Van Schalkwyk',
      nick:'Messi',
      dob:'2005-01-01',
      pos:'Midfielder',
      dpos:'LW',
      ig:'messirvanschalkwyk',
      fb:'messir Vsk'
    },

    {
      n:'Reatlegile Kgosithebe',
      nick:'Rea',
      dob:'2003-07-24',
      pos:'Striker',
      dpos:'ST',
      ig:'reatlegilekgosithebe',
      tt:'reatlegilekgosithebe13',
      fp:'Kylian Mbappe',
      ft:'Orlando Pirates',
      fq:'Consistency'
    },

    {
      n:'Lucas Seromo',
      nick:'Ramos',
      dob:'2002-04-27',
      pos:'Defender',
      dpos:'RB'
    },

    {
      n:'Ranonyane Mmutlane',
      nick:'Tyza',
      dob:'2001-12-23',
      pos:'Midfielder',
      dpos:'RW',
      ig:'tyza_7',
      fb:'Mmutlane Tyza'
    },

    {
      n:'Mpho Mokoena',
      nick:'Gobs',
      dob:'2004-02-12',
      pos:'Defender',
      dpos:'LB',
      ig:'mphogobsmokoena',
      fb:'mphogobsmokoena',
      ft:'Kaizer Chiefs',
      fq:'Jeremiah 29:11',
      sh:'Spider Man'
    },

    {
      n:'Xolani Masethi',
      nick:'Gwara',
      dob:'2003-08-18',
      pos:'Midfielder',
      dpos:'LW',
      ig:'xolani582',
      tt:'gwarababy'
    },

    {
      n:'Philane Masondo',
      nick:'Sjeza',
      dob:'1998-08-12',
      pos:'Midfielder',
      dpos:'ACM',
      ig:'Philane_masondo',
      fb:'philane masondo'
    },

    {
      n:'Momelezi Mngati',
      nick:'Walleto',
      dob:'2002-02-18',
      pos:'Midfielder',
      dpos:'ACM',
      ig:'Walleto_19',
      fb:'Momelezi Mngati'
    },

    {
      n:'Aphelele Sibisi',
      nick:'Aphelele',
      dob:'2004-01-19',
      pos:'Defender',
      dpos:'CB'
    },

    {
      n:'Sandile Silinda',
      nick:'Lion',
      dob:'2004-08-02',
      pos:'Defender',
      dpos:'CB',
      fb:'Sandile silinda',
      ft:'Stellenbosch',
      fq:'Do not worry about tomorrow. Each day has enough troubles of its own.'
    },

    {
      n:'Aluwelwa Duma',
      nick:'Alu',
      dob:'2006-12-05',
      pos:'Goalkeeper',
      dpos:'GK',
      ig:'_simply.alurh',
      tt:'Typical_alurh',
      fp:'Senzo Meyiwa',
      ft:'Orlando Pirates',
      fq:'Philippians 4:13',
      sh:'Black Panther'
    },

    {
      n:'Gomolemo Moaludi',
      nick:'Doku',
      dob:'2003-11-16',
      pos:'Midfielder',
      dpos:'RW',
      ig:'Max_phamodi',
      fp:'Doku',
      ft:'Orlando Pirates',
      fq:'It is either you DO OR YOU DIE'
    },

    {
      n:'Tsebo Muleya',
      nick:'Nuno',
      dob:'2005-07-25',
      pos:'Defender',
      dpos:'LB',
      ig:'tsebomuleya25',
      tt:'tsebomuleya25',
      fp:'Nuno Mendes',
      ft:'Mamelodi Sundowns',
      fq:'Isaiah 60:22'
    },

    {
      n:'Tshepo Lefooana',
      nick:'Stsipa',
      dob:'2006-01-31',
      pos:'Midfielder',
      dpos:'CDM',
      ig:'lefooana_tshepo13',
      fb:'Tshepho Casemiro',
      fp:'Casemiro'
    },

    {
      n:'Zabian Allenburg',
      nick:'Zabi',
      dob:'2005-03-09',
      pos:'Striker',
      dpos:'ST',
      ig:'zabianallenburg',
      fb:'Zabian Allenburg',
      fp:'Cristiano Ronaldo',
      ft:'Orlando Pirates',
      fq:'Isaiah 60:22'
    },

    {
      n:'Jamie Booysen',
      nick:'Jamie',
      dob:'2006-01-11',
      pos:'Midfielder',
      dpos:'CDM',
      ig:'booysenxjamie',
      fp:'Allende',
      ft:'Orlando Pirates',
      fq:'John 3:16'
    },

    {
      n:'Thomo Lenkopane',
      nick:'TP',
      dob:'2006-01-31',
      pos:'Defender',
      dpos:'CB',
      ig:'thomo_lenkopane_04',
      fb:'Thomo Lenkopane',
      fp:'Virgil Van Dijk',
      ft:'Mamelodi Sundowns',
      fq:'Deuteronomy 31:6'
    },

    {
      n:'Realeboga Moswane',
      nick:'Realeboga',
      dob:'2005-09-25',
      pos:'Midfielder',
      dpos:'LW',
      tw:'@reah_moswane',
      fq:'Psalm 23:1'
    },

    {
      n:'Wame Pitso',
      nick:'Veve',
      dob:'2005-03-02',
      pos:'Midfielder',
      dpos:'RW',
      ig:'@wameofficial_',
      fb:'@wameofficial',
      tw:'@wameofficial',
      fp:'Ronaldinho',
      ft:'Real Madrid',
      fq:'I am the greatest of all time'
    },

    {
      n:'Keotshepile Senye',
      nick:'Tshepi',
      dob:'2006-06-28',
      pos:'Midfielder',
      dpos:'LW',
      fp:'Lucas Ribeiro',
      ft:'Mamelodi Sundowns',
      fq:'Isaiah 60:22'
    },

    {
      n:'Sinethemba Mdluli',
      nick:'Bastarh',
      dob:'2005-03-15',
      pos:'Goalkeeper',
      dpos:'GK',
      fp:'Manuel Neuer',
      sh:'Hulk'
    },

    {
      n:'Sive Pitolo',
      nick:'Mavesta',
      dob:'2005-11-14',
      pos:'Midfielder',
      dpos:'CDM',
      fp:'Konate',
      sh:'Spider Man'
    },

    {
      n:'Feza Ngcotsha',
      nick:'Mxhosa',
      dob:'2005-04-29',
      pos:'Striker',
      dpos:'ST',
      tt:'fezangcotsha10',
      fb:'Ngcotsha Feza',
      fp:'Mario Balotelli',
      ft:'Kaizer Chiefs',
      fq:'Thixo Zonke Zezakho. Amen.'
    },

    {
      n:'Karabo Ntsala',
      nick:'Karabo',
      dob:'2006-01-12',
      pos:'Striker',
      dpos:'ST',
      ig:'karabo.ntsala9',
      ft:'Kaizer Chiefs',
      fq:'Matthew 19:26'
    },

    {
      n:'Babalo Mjonono',
      nick:'Larnie',
      dob:'2003-12-11',
      pos:'Midfielder',
      dpos:'CDM',
      ig:'b_mjonono',
      fb:'Babalo Mjonono',
      fp:'Jayden Adams',
      ft:'Kaizer Chiefs',
      fq:'Take action and persevere'
    },

    {
      n:'Thikho Magada',
      nick:'Modric',
      dob:'2004-01-01',
      pos:'Midfielder',
      dpos:'CDM',
      ig:'Thikhomagada',
      fb:'Thikho magada',
      fp:'Modric',
      ft:'Real Madrid'
    },

  ]


  // ==========================================================
  // REMOVE RETURNING PLAYERS FROM OLD SQUAD
  // ==========================================================

  const firstFiltered =
    firstRaw.filter(function(player) {

      return !nfdReturningPlayers.has(
        player.n
      )

    })


  console.log(
    'Removed ' +
    (
      firstRaw.length -
      firstFiltered.length
    ) +
    ' returning players from First Team.'
  )


  // ==========================================================
  // REGIONAL TEAM
  // ==========================================================

  const regionalRaw = [

    {
      n:'Bonke Siphokuhle Bhali',
      nick:'Dinho',
      dob:'2007-01-25',
      pos:'Midfielder',
      dpos:'RW',
      ig:'kuhle_bhali',
      tt:'kuhlebhali_11',
      fb:'Siphokuhle bhali',
      fp:'Rodrygo Goes',
      ft:'Mamelodi Sundowns',
      fq:'The pain you are facing now is nothing compared to the joy coming your way'
    },

    {
      n:'Kutloano Mphuthi',
      nick:'Skipper',
      dob:'2004-05-29',
      pos:'Midfielder',
      dpos:'CDM',
      ig:'onlyonekutloano',
      tt:'onlyonekutloano',
      fp:'Jayden Adams',
      ft:'Orbit College FC',
      fq:'Psalms 91:1-2'
    },

    {
      n:'Oatlhotse Ditlhobolo',
      nick:'Lefty',
      dob:'2003-08-09',
      pos:'Defender',
      dpos:'LB',
      fp:'Messi',
      ft:'Stellenbosch',
      fq:'We know what we are, but not what we may be'
    },

    {
      n:'Lefa Ranyere',
      nick:'Lefa',
      dob:'2004-02-02',
      pos:'Midfielder',
      dpos:'ACM',
      ig:'lefa_blessing',
      fb:'Lefa lefa',
      fp:'Jude Bellingham',
      ft:'Mamelodi Sundowns',
      fq:"I'll bounce back"
    },

    {
      n:'Mbuso Phiri',
      nick:'Mbuso',
      dob:'2004-09-12',
      pos:'Striker',
      dpos:'ST',
      fb:'Mbuso Phiri',
      fp:'Marcelo',
      ft:'Orlando Pirates',
      fq:'None of us is as smart as all of us'
    },

    {
      n:'Daniel Leburu',
      nick:'Dimitri',
      dob:'1998-04-07',
      pos:'Midfielder',
      dpos:'ACM',
      ig:'Dan_leegh',
      tt:'Dimitri0711',
      fb:'Daniel Leburu',
      fp:'Messi',
      ft:'Supersport',
      fq:'A journey of a thousand miles begins with one step'
    },

    {
      n:'Lesego Matemane',
      nick:'Lesego',
      dob:'2002-09-03',
      pos:'Goalkeeper',
      dpos:'GK',
      ig:'lesego_matemane',
      fp:'Mike Maignan',
      ft:'Orlando Pirates',
      fq:"Don't stop, keep on going"
    },

    {
      n:'Caswell Malinga',
      nick:'Wessie',
      dob:'2005-06-15',
      pos:'Striker',
      dpos:'ST',
      fp:'Messi',
      ft:'Mamelodi Sundowns',
      fq:'Psalms 23'
    },

    {
      n:'Chuma Gebashe',
      nick:'Chuma',
      dob:'2003-01-09',
      pos:'Defender',
      dpos:'CB',
      tt:'Chuma319',
      fp:'',
      ft:'Kaizer Chiefs',
      fq:'Bad company corrupts good character'
    },

    {
      n:'Thabisha Moholola',
      nick:'Warra',
      dob:'2003-11-22',
      pos:'Midfielder',
      dpos:'RW',
      ig:'sthabimoholola',
      fp:'Thapelo Morena',
      ft:'SuperSport United',
      fq:'Life has no limitations except the ones you make'
    },

    {
      n:'Olwethu Madlala',
      nick:'Olwethu',
      dob:'2004-05-07',
      pos:'Midfielder',
      dpos:'LW',
      ig:'o.lwethu.m',
      fp:'Vitinha',
      ft:'Cape Town City',
      fq:'You can get anything you set your mind to'
    },

    {
      n:'Lethabo Marumo',
      nick:'Dybala',
      dob:'2009-03-03',
      pos:'Striker',
      dpos:'ST',
      ig:'lethabo_dybala',
      tt:'@lethabo.dybala',
      fb:'Lethabo Dybala',
      fp:'Paulo Dybala',
      ft:'Orlando Pirates',
      fq:'The only impossible journey is the one you never begin'
    },

    {
      n:'Kwanda Thango',
      nick:'Maestro',
      dob:'2003-03-01',
      pos:'Midfielder',
      dpos:'ACM',
      fp:'Trent Alexander-Arnold',
      ft:'Kaizer Chiefs',
      fq:'When the time is right, I the Lord will make it happen'
    },

    {
      n:'Philasande Thabethe',
      nick:'Phila',
      dob:'2000-10-19',
      pos:'Defender',
      dpos:'RB',
      fp:'CR7 Ronaldo',
      ft:'AmaZulu',
      fq:'With God nothing shall be impossible'
    },

    {
      n:'Remofilwe Mothibi',
      nick:'Virgil',
      dob:'2005-12-05',
      pos:'Defender',
      dpos:'CB',
      fp:'Virgil Van Dijk',
      ft:'Orlando Pirates',
      fq:"There's always light at the end of the tunnel"
    },

    {
      n:'Sakhile Mthembu',
      nick:'Sakhile',
      dob:'2003-09-04',
      pos:'Defender',
      dpos:'CB',
      tt:'Sakhile_Lwando10',
      ft:'Stellenbosch',
      fq:'Stay true to your grind'
    },

    {
      n:'Olebile Motsileng',
      nick:'Benzema',
      dob:'2002-01-08',
      pos:'Striker',
      dpos:'ST',
      fp:'Karim Benzema',
      ft:'Orlando Pirates',
      fq:'Victory is in having done your best'
    },

    {
      n:'Olebogeng Phogojane',
      nick:'Ole',
      dob:'2000-05-02',
      pos:'Midfielder',
      dpos:'CDM',
      fp:'Teboho Mokoena',
      ft:'Orlando Pirates',
      fq:"I wouldn't stand on top of the roof if I was afraid of the heights"
    },

    {
      n:'Sandile Silinda Jr',
      nick:'Maphangule',
      dob:'2004-02-08',
      pos:'Defender',
      dpos:'CB',
      fp:'Antonio Rudiger',
      ft:'Stellenbosch',
      fq:'Jeremiah 29:11'
    },

    {
      n:'Thabang Makgalanyane',
      nick:'Thabang',
      dob:'2000-09-07',
      pos:'Midfielder',
      dpos:'CDM',
      fp:'Messi',
      ft:'Kaizer Chiefs',
      fq:'God helps those who help themselves'
    },

    {
      n:'Oratile Sefodi',
      nick:'Shika',
      dob:'2000-12-17',
      pos:'Midfielder',
      dpos:'LW',
      fp:'Themba Zwane',
      ft:'Stellenbosch',
      fq:'Isaiah 60:22'
    },

    {
      n:'Arnold Tsimele',
      nick:'Arnold',
      dob:'2006-04-22',
      pos:'Striker',
      dpos:'ST',
      fp:'Messi',
      ft:'Cape Town City',
      fq:'Greatness requires sacrifices, dedication and hardwork'
    },

    {
      n:'Itumeleng Tlhone',
      nick:'Bullet',
      dob:'2003-01-01',
      pos:'Midfielder',
      dpos:'RW'
    },

    {
      n:'Shaun Moteane',
      nick:'Shaun',
      dob:'2003-12-07',
      pos:'Goalkeeper',
      dpos:'GK',
      fp:'Kasper Schmeichel',
      fq:"You miss 100% of the shots you don't take"
    },

    {
      n:'Siyamthanda Koyana',
      nick:'Siya',
      dob:'2006-07-23',
      pos:'Midfielder',
      dpos:'CDM',
      fp:'Thiago Alcantara',
      ft:'Orlando Pirates',
      fq:'Footsteps never lie'
    },

  ]


  const regionalFiltered =
    regionalRaw.filter(function(player) {

      return !nfdReturningPlayers.has(
        player.n
      )

    })


  // ==========================================================
  // JUNIOR TEAM
  // ==========================================================

  const juniorRaw = [

    {n:'Orisang',nick:'Orisang',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Reatlegile',nick:'Rea',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Peo',nick:'Peo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Letsema',nick:'Letse',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Lebaka',nick:'Lebaka',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Ogene',nick:'Ogene',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Kutlwano',nick:'Kutlwano',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Isago',nick:'Isago',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Koketso',nick:'Koketso',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Joshua',nick:'Joshua',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Duwe',nick:'Duwe',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Amantle',nick:'Amantle',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Leano',nick:'Leano',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Poe Metse',nick:'Poe',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Olmo',nick:'Olmo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Keoagile',nick:'Keoagile',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Ona',nick:'Ona',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Tshiamo',nick:'Tshiamo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Itumeleng',nick:'Itu',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Kgothatso',nick:'Kgothatso',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Leano Kganathe',nick:'Kganathe',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Thotloletso',nick:'Thotlo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Tshepo',nick:'Tshepo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Kwanele March',nick:'Kwanele',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Kaelo',nick:'Kaelo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Tumalano',nick:'Tumalano',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Theo',nick:'Theo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Anelisitswe',nick:'Anelisitswe',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Mmuso',nick:'Mmuso',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Ogone Leeepile',nick:'Ogone',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Realeboga',nick:'Realeboga',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Omolemo',nick:'Omolemo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Olrato',nick:'Olerato',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Thatoyaone',nick:'Thatoyaone',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Koketso Thakanyane',nick:'Koketso',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Phenyo',nick:'Phenyo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Oatile',nick:'Oatile',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Oamogetswe',nick:'Oamogetswe',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Boikanyo',nick:'Boikanyo',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Kabelano',nick:'Kabelano',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Kgolagano',nick:'Kgolagano',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Omosa',nick:'Omosa',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Otlotleng',nick:'Otlotleng',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},
    {n:'Vulombe Mbombi',nick:'Vulombe',dob:'2007-01-01',pos:'Midfielder',dpos:'MF'},

  ]


  // ==========================================================
  // NFD SQUAD - 30 PLAYERS
  // ==========================================================

  const nfdRaw = [

    {
      n:'Pule Victor Khasane',
      nick:'Sweswe',
      dob:'1997-03-05',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Wakhiwe Shelembe',
      nick:'Juba',
      dob:'2005-04-25',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Ranonyane Mmutlane',
      nick:'Tyza',
      dob:'2001-12-23',
      pos:'Midfielder',
      dpos:'RW'
    },

    {
      n:'Boitshoko Sekai',
      nick:'Mario',
      dob:'1992-02-28',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Lucky Letwaba',
      nick:'Coutinho',
      dob:'2003-11-10',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Ofentse Dintwe',
      nick:'CR7',
      dob:'2000-09-25',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Oupa Maehetja',
      nick:'Warra',
      dob:'2007-09-22',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Kabelo Moagi',
      nick:'Mphathi',
      dob:'2004-11-10',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Minenhle Makhathini',
      nick:'Gerroh',
      dob:'2004-12-15',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Sanele Bixa',
      nick:'Saider',
      dob:'2000-07-30',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Vincent Moropene',
      nick:'Vinny',
      dob:'2003-08-24',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Siyabonga Shelembe',
      nick:'Shelembe',
      dob:'2002-03-22',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Chuma Qinga',
      nick:'Chumz',
      dob:'2004-08-28',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Onalenna Masendi',
      nick:'Vetties',
      dob:'2005-04-22',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Lincoln Vyver',
      nick:'Spider',
      dob:'2001-03-02',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Xolani Masethi',
      nick:'X',
      dob:'2003-08-18',
      pos:'Midfielder',
      dpos:'LW'
    },

    {
      n:'Lucas Seromo',
      nick:'Ramos',
      dob:'2002-04-27',
      pos:'Defender',
      dpos:'RB'
    },

    {
      n:'Momelezi Mngati',
      nick:'Walleto',
      dob:'2002-02-18',
      pos:'Midfielder',
      dpos:'ACM'
    },

    {
      n:'Khumoetsile Moses',
      nick:'Khumo',
      dob:'2001-07-26',
      pos:'Goalkeeper',
      dpos:'GK'
    },

    {
      n:'Piwokuhle Mareledwane',
      nick:'Mhlonishwa',
      dob:'1998-01-07',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Thapelo Letsholonyane',
      nick:'TP',
      dob:'2002-12-04',
      pos:'Midfielder',
      dpos:'CDM'
    },

    {
      n:'Sive Pitolo',
      nick:'Mavesta',
      dob:'2005-11-14',
      pos:'Midfielder',
      dpos:'CDM'
    },

    {
      n:'Onkarabile Moswane',
      nick:'Levendays',
      dob:'2005-09-05',
      pos:'Midfielder',
      dpos:'MF'
    },

    {
      n:'Reatlegile Kgosithebe',
      nick:'Rea',
      dob:'2004-07-03',
      pos:'Striker',
      dpos:'ST'
    },

    {
      n:'Philane Masondo',
      nick:'Sjeza',
      dob:'1998-12-08',
      pos:'Midfielder',
      dpos:'ACM'
    },

    {
      n:'Aphelele Sibisi',
      nick:'Abednego',
      dob:'2004-01-19',
      pos:'Defender',
      dpos:'CB'
    },

    {
      n:'Bokamoso Ramoshoane',
      nick:'Duracell',
      dob:'2005-10-03',
      pos:'Midfielder',
      dpos:'CDM'
    },

    {
      n:'Thikho Magada',
      nick:'Modric',
      dob:'2004-07-04',
      pos:'Midfielder',
      dpos:'CDM'
    },

    {
      n:'Karabo Ntsala',
      nick:'Sejabana',
      dob:'2006-12-01',
      pos:'Striker',
      dpos:'ST'
    },

    {
      n:'Sinethemba Sibongakonke Mdluli',
      nick:'Bastarh',
      dob:'2005-03-15',
      pos:'Goalkeeper',
      dpos:'GK'
    },

  ]


  // ==========================================================
  // BUILD PLAYER RECORDS
  // ==========================================================

  const firstRows =
  firstFiltered.map(function(player, index) {

    return buildPlayer(
      player,
      firstTeam._id,
      index,
      'FT25',
      'png'
    )

  })


  const regionalRows =
  regionalFiltered.map(function(player, index) {

    return buildPlayer(
      player,
      regionalTeam._id,
      index,
      'RT25',
      'png'
    )

  })


  const juniorRows =
  juniorRaw.map(function(player, index) {

    return buildPlayer(
      player,
      juniorTeam._id,
      index,
      'JT25',
      'png'
    )

  })


  const nfdRows =
  nfdRaw.map(function(player, index) {

    return buildPlayer(
      player,
      nfdTeam._id,
      index,
      'NFD25',
      'jpg'
    )

  })


  // ==========================================================
  // INSERT PLAYERS
  // ==========================================================

  const firstPlayers =
    await Player.insertMany(
      firstRows
    )


  const regionalPlayers =
    await Player.insertMany(
      regionalRows
    )


  const juniorPlayers =
    await Player.insertMany(
      juniorRows
    )


  const nfdPlayers =
    await Player.insertMany(
      nfdRows
    )


  console.log(
    'Created ' +
    firstPlayers.length +
    ' First Team players.'
  )


  console.log(
    'Created ' +
    regionalPlayers.length +
    ' Regional Team players.'
  )


  console.log(
    'Created ' +
    juniorPlayers.length +
    ' Junior Team players.'
  )


  console.log(
    'Created ' +
    nfdPlayers.length +
    ' NFD Squad players.'
  )


  // ==========================================================
  // ASSIGN PLAYERS TO SQUADS
  // ==========================================================

  await firstTeam.updateOne({

    $set: {

      players:
        firstPlayers.map(function(player) {
          return player._id
        })

    }

  })


  await regionalTeam.updateOne({

    $set: {

      players:
        regionalPlayers.map(function(player) {
          return player._id
        })

    }

  })


  await juniorTeam.updateOne({

    $set: {

      players:
        juniorPlayers.map(function(player) {
          return player._id
        })

    }

  })


  await nfdTeam.updateOne({

    $set: {

      players:
        nfdPlayers.map(function(player) {
          return player._id
        })

    }

  })


  console.log(
    'Assigned players to squads.'
  )


  // ==========================================================
  // MATCHES
  // ==========================================================

  await Match.insertMany([

    {
      opponent:'Upington City FC',

      date:
        new Date(
          '2026-08-22T15:00:00Z'
        ),

      venue:
        'Fanie du Toit Stadium',

      location:
        'Home',

      competition:
        'NFD League',

      squad:
        nfdTeam._id,

      status:
        'Played',

      score:{
        home:1,
        away:1
      }
    },


    {
      opponent:'Lerumo Lions FC',

      date:
        new Date(
          '2026-08-29T15:00:00Z'
        ),

      venue:
        'Dobsonville Stadium',

      location:
        'Away',

      competition:
        'Nfd League',

      squad:
        nfdTeam._id,

      status:
        'Played',

      score:{
        home:2,
        away:0
      }
    },


    {
      opponent:'Hope FC',

      date:
        new Date(
          '2026-09-05T15:00:00Z'
        ),

      venue:
        'Fanie du Toit Stadium',

      location:
        'Home',

      competition:
        'NFD League',

      squad:
        nfdTeam._id,

      status:
        'Played',

      score:{
        home:0,
        away:1
      }
    },

  ])


  console.log(
    'Created fixtures.'
  )


  // ==========================================================
  // TRAINING
  // ==========================================================

  await TrainingSession.insertMany([

    {
      title:
        'First Team Pre-season',

      date:
        new Date(
          '2025-05-05T08:00:00Z'
        ),

      duration:
        120,

      squad:
        firstTeam._id,

      location:
        'Fanie du Toit Sports Complex',

      type:
        'Physical',

      notes:
        'Pre-season conditioning.',

      createdBy:
        coach._id,

      attendance:
        firstPlayers.map(function(player) {

          return {

            player:
              player._id,

            status:
              'Present'

          }

        })

    },


    {
      title:
        'Regional Squad Prep',

      date:
        new Date(
          '2025-04-10T09:00:00Z'
        ),

      duration:
        90,

      squad:
        regionalTeam._id,

      location:
        'Fanie du Toit Sports Complex',

      type:
        'Tactical',

      notes:
        'Regional cup preparation.',

      createdBy:
        coach._id,

      attendance:
        regionalPlayers.map(function(player) {

          return {

            player:
              player._id,

            status:
              'Present'

          }

        })

    },


    {
      title:
        'Junior Team Training',

      date:
        new Date(
          '2025-04-15T10:00:00Z'
        ),

      duration:
        75,

      squad:
        juniorTeam._id,

      location:
        'Fanie du Toit Sports Complex',

      type:
        'Technical',

      notes:
        'Technical skills development.',

      createdBy:
        coach._id,

      attendance:
        juniorPlayers.map(function(player) {

          return {

            player:
              player._id,

            status:
              'Present'

          }

        })

    },


    {
      title:
        'NFD Squad Training',

      date:
        new Date(
          '2025-05-12T09:00:00Z'
        ),

      duration:
        90,

      squad:
        nfdTeam._id,

      location:
        'Fanie du Toit Sports Complex',

      type:
        'Tactical',

      notes:
        'NFD squad tactical preparation.',

      createdBy:
        coach._id,

      attendance:
        nfdPlayers.map(function(player) {

          return {

            player:
              player._id,

            status:
              'Present'

          }

        })

    },

  ])


  console.log(
    'Created 4 training sessions.'
  )


  // ==========================================================
  // PLAYER LOGIN
  // ==========================================================

  await User.insertMany([{

    name:
      firstPlayers[0].fullName,

    email:
      'player@nwu.ac.za',

    password:
      hash,

    role:
      'player',

    playerId:
      firstPlayers[0]._id,

  }])


  console.log(
    'Created player login (' +
    firstPlayers[0].fullName +
    ').'
  )


  // ==========================================================
  // VERIFY ACCOUNTS
  // ==========================================================

  console.log(
    'Verifying accounts...'
  )


  const accounts = [

    'admin@nwu.ac.za',

    'coach@nwu.ac.za',

    'physio@nwu.ac.za',

    'support@nwu.ac.za',

    'player@nwu.ac.za',

  ]


  let allOk = true


  for (
    let i = 0;
    i < accounts.length;
    i++
  ) {

    const user =
      await User
        .findOne({
          email:
            accounts[i]
        })
        .lean()


    const ok =
      user
        ? await bcrypt.compare(
            PLAIN,
            user.password
          )
        : false


    console.log(

      '  [' +
      (ok ? 'PASS' : 'FAIL') +
      '] ' +
      accounts[i]

    )


    if (!ok) {
      allOk = false
    }

  }


  if (!allOk) {

    console.error(
      'ERROR: Some accounts failed.'
    )

    process.exit(1)

  }


  // ==========================================================
  // FINAL SUMMARY
  // ==========================================================

  const total =
    firstPlayers.length +
    regionalPlayers.length +
    juniorPlayers.length +
    nfdPlayers.length


  console.log('')

  console.log(
    '========================================'
  )

  console.log(
    '             SEED COMPLETE'
  )

  console.log(
    '========================================'
  )

  console.log(
    'First Team:    ' +
    firstPlayers.length +
    ' players'
  )

  console.log(
    'Regional Team: ' +
    regionalPlayers.length +
    ' players'
  )

  console.log(
    'Junior Team:   ' +
    juniorPlayers.length +
    ' players'
  )

  console.log(
    'NFD Squad:     ' +
    nfdPlayers.length +
    ' players'
  )

  console.log(
    'Total:         ' +
    total +
    ' players'
  )

  console.log('')

  console.log(
    'Returning NFD players were NOT duplicated.'
  )

  console.log(
    'They were assigned exclusively to NFD.'
  )

  console.log('')

  console.log(
    'Login: http://localhost:3000/login'
  )

  console.log(
    'Password: password123'
  )

  console.log(
    '========================================'
  )


  await mongoose.disconnect()

}


seed().catch(function(err) {

  console.error(
    'Seed failed: ' +
    err.message
  )

  process.exit(1)

})