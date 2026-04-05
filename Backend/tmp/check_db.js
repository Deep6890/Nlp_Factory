require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Recording = require('../src/models/Recording');

async function checkLatestTranscript() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the latest recording that has a 'completed' status
    const latest = await Recording.findOne({ status: 'completed' })
      .sort({ createdAt: -1 })
      .lean();

    if (!latest) {
      console.log('\n--- No completed transcripts found in MongoDB ---');
      console.log('You might need to upload a new audio file first via the frontend UI.');
    } else {
      console.log('\n--- 🎯 Latest Completed Transcript Found! ---');
      console.log(`Filename:    ${latest.filename}`);
      console.log(`Duration:    ${latest.duration ? latest.duration + ' sec' : 'unknown'}`);
      console.log(`Recorded at: ${latest.createdAt}`);
      console.log(`\nTranscript Data:\n`, JSON.stringify(latest.transcript, null, 2));
    }
    
    await mongoose.disconnect();
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkLatestTranscript();
