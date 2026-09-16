/**
 * Run this once to check your .env.local and test the connection
 * node scripts/fix-env.js
 */
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nwu-soccer'
console.log('Testing URI:', uri.replace(/:([^:@]{3})[^:@]*@/, ':***@'))

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => { console.log('✅ Connected successfully!'); mongoose.disconnect() })
  .catch(err => {
    console.error('❌ Failed:', err.message)
    if (uri.includes('localhost')) {
      console.log('\nMongoDB is installed but may not be running.')
      console.log('Start it: net start MongoDB   (or restart your computer)')
    } else {
      console.log('\nAtlas connection failed. Your .env.local should be:')
      console.log('MONGODB_URI=mongodb://localhost:27017/nwu-soccer')
    }
  })
