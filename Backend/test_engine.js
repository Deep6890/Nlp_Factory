require('dotenv').config({ path: __dirname + '/.env' });
const axios = require('axios');
const FormData = require('form-data');

async function discoverCorrectHeader() {
  const engineUrl = process.env.TRANSCRIPT_ENGINE_URL || 'http://10.0.20.228:8000/process-audio';
  const rawKey = process.env.TRANSCRIPT_ENGINE_API_KEY || 'aimodule-secret-2026';
  
  // Minimal dummy file
  const buf = Buffer.alloc(200); 

  // Various patterns teammates typically use in Python FastAPI/Flask:
  const combinations = [
    { name: 'x-api-key', headers: { 'x-api-key': rawKey } },
    { name: 'X-API-Key', headers: { 'X-API-Key': rawKey } },
    { name: 'api-key',   headers: { 'api-key': rawKey } },
    { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${rawKey}` } },
    { name: 'Authorization Basic', headers: { 'Authorization': `Basic ${rawKey}` } },
    { name: 'Authorization token', headers: { 'Authorization': `token ${rawKey}` } },
    { name: 'access_token', headers: { 'access_token': rawKey } }
  ];

  console.log(`\n🔍 Searching for correct Auth Header combination to connect to Python...`);

  for (const combo of combinations) {
    process.stdout.write(`Trying [${combo.name}]... `);
    
    const form = new FormData();
    form.append('file', buf, { filename: 'test.wav', contentType: 'audio/wav' });
    form.append('language', 'hi');

    try {
      const res = await axios.post(engineUrl, form, {
        headers: { ...form.getHeaders(), ...combo.headers },
        timeout: 2000,
      });
      // If we get here, it didn't throw 401! It might throw 400 for bad audio but that proves auth works!
      console.log(`✅ SUCCESS! It accepted the auth header.`);
      console.log(`Response Code: ${res.status}`);
      return; 
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log(`❌ Failed (401)`);
      } else if (err.response) {
        // Any other code like 400 Bad Request means AUTH PASSED but it didn't like our 200-byte buffer
        console.log(`✅ SUCCESS! Auth Passed (Threw ${err.response.status} instead of 401). Use header:`, combo.name);
        return;
      } else {
        console.log(`⚠️ Network hit error: ${err.message}`);
      }
    }
  }

  console.log(`\n❌ All permutations failed 401. The API key "aimodule-secret-2026" itself is WRONG. Ask your teammate for the correct key string.`);
}

discoverCorrectHeader();
