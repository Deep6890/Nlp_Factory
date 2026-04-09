const supabase  = require('../config/supabase');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');
const { spawn }   = require('child_process');
const path        = require('path');
const fs          = require('fs');
const os          = require('os');

/**
 * POST /api/v1/reports/generate
 * Generates a markdown + PDF report from the user's last N days of transcripts.
 */
const generateReport = async (req, res, next) => {
  try {
    const days = parseInt(req.body.days || '10', 10);

    // Fetch user's done transcripts
    const { data: transcripts, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('user_id', req.user._id)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(days * 3); // fetch more, generator picks last N days

    if (error) throw ApiError.internal(error.message);
    if (!transcripts?.length) throw ApiError.badRequest('No processed transcripts found');

    // Write transcripts to temp JSON file
    const tmpJson = path.join(os.tmpdir(), `armor_report_${Date.now()}.json`);
    const tmpPdf  = path.join(os.tmpdir(), `armor_report_${Date.now()}.pdf`);
    fs.writeFileSync(tmpJson, JSON.stringify(transcripts), 'utf8');

    const scriptPath = path.resolve(__dirname, '../../../AiModule/report_generator.py');
    const pythonExec = process.env.PYTHON_EXEC
      || path.resolve(__dirname, '../../../AiModule/venv/Scripts/python.exe');

    const child = spawn(pythonExec, [scriptPath, tmpJson, tmpPdf, String(days)], {
      timeout: 60_000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    });

    let stdout = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => process.stdout.write('[Report] ' + d.toString()));

    child.on('close', (code) => {
      try { fs.unlinkSync(tmpJson); } catch (_) {}

      if (code !== 0) {
        return next(ApiError.internal('Report generation failed'));
      }

      try {
        const result = JSON.parse(stdout.slice(stdout.indexOf('{')));

        // If PDF was generated, send it
        if (result.success && fs.existsSync(tmpPdf)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="armor-report-${days}days.pdf"`);
          const stream = fs.createReadStream(tmpPdf);
          stream.on('end', () => { try { fs.unlinkSync(tmpPdf); } catch (_) {} });
          return stream.pipe(res);
        }

        // Fallback: return markdown
        return res.status(200).json(ApiResponse.ok('Report generated', {
          markdown: result.markdown,
          days,
        }));
      } catch (e) {
        next(ApiError.internal('Failed to parse report output'));
      }
    });

    child.on('error', (err) => next(ApiError.internal(`Spawn failed: ${err.message}`)));
  } catch (err) { next(err); }
};

module.exports = { generateReport };
