require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Recording = require('./src/models/Recording');

async function debugDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find highest recordings
    const latest = await Recording.find().sort({ createdAt: -1 }).limit(3).lean();

    if (!latest.length) {
      console.log('\n--- No recordings found in MongoDB at all ---');
    } else {
      console.log('\n--- 🎯 Top 3 Latest Recordings Found! ---');
      latest.forEach((rec, idx) => {
        console.log(`\n[Recording #${idx + 1}] ID: ${rec._id} | Status: ${rec.status}`);
        console.log(`Filename: ${rec.filename}`);
        if (rec.transcript && rec.transcript.text) {
          console.log(`Transcript Length: ${rec.transcript.text.length} characters`);
          console.log(`Transcript TextPreview: ${rec.transcript.text.substring(0, 100)}...`);
        } else {
          console.log(`Transcript: <No text found... Check status>`);
        }
        if (rec.errorMessage) console.log(`Error: ${rec.errorMessage}`);
      });
    }
    
    await mongoose.disconnect();
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

debugDB();
