require('dotenv').config();
const mongoose = require('mongoose');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Transcript = require('./src/models/Transcript');
  
  const latest = await Transcript.findOne().sort({ createdAt: -1 });
  console.log(JSON.stringify(latest, null, 2));
  
  process.exit(0);
}

verify().catch(console.error);
