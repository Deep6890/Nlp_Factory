import 'dart:async';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:uuid/uuid.dart';

import '../models/recording_entry.dart';
import 'schedule_service.dart';
import 'upload_queue.dart';

enum AudioState { idle, listening, recording }

class AudioService {
  static final AudioService _instance = AudioService._internal();
  factory AudioService() => _instance;
  AudioService._internal();

  // ── State ──────────────────────────────────────────────────────────────────
  AudioState _state = AudioState.idle;
  AudioState get state => _state;

  final _stateCtrl    = StreamController<AudioState>.broadcast();
  final _dbCtrl       = StreamController<double>.broadcast();
  final _rawDbCtrl    = StreamController<double>.broadcast();
  final _durationCtrl = StreamController<Duration>.broadcast();

  Stream<AudioState> get stateStream    => _stateCtrl.stream;
  Stream<double>     get dbStream       => _dbCtrl.stream;
  Stream<double>     get rawDbStream    => _rawDbCtrl.stream;
  Stream<Duration>   get durationStream => _durationCtrl.stream;

  // ── Internal ───────────────────────────────────────────────────────────────
  AudioRecorder? _recorder;
  Timer?         _vadTimer;       // polls amplitude at 150 ms
  Timer?         _silenceTimer;   // fires after sustained silence
  Timer?         _chunkTimer;     // fires every chunkSec to rotate
  Timer?         _durationTicker; // fires every 1 s to update UI

  String?   _chunkPath;
  DateTime? _sessionStart;
  DateTime? _chunkStart;
  bool      _busy       = false;  // prevents re-entrant session start
  bool      _running    = false;  // true while startListening is active

  ListeningProfile? _sessionProfile;

  void _setState(AudioState s) { _state = s; _stateCtrl.add(s); }

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Start the VAD loop. Safe to call only when idle.
  Future<void> startListening() async {
    if (_state != AudioState.idle) return;
    _running = true;
    _setState(AudioState.listening);
    // Small delay so the background isolate is fully ready before mic opens
    await Future.delayed(const Duration(milliseconds: 800));
    if (_running) _startVad();
  }

  /// Stop everything and return to idle.
  Future<void> stop() async {
    _running = false;
    _busy    = false;
    _cancelAllTimers();
    await _closeRecorder();
    _deleteChunk();
    _sessionProfile = null;
    _sessionStart   = null;
    _chunkStart     = null;
    _durationCtrl.add(Duration.zero);
    _setState(AudioState.idle);
  }

  // ── VAD loop ───────────────────────────────────────────────────────────────

  /// Opens a single persistent recorder and polls amplitude every 150 ms.
  /// When speech is detected it transitions directly into a recording session
  /// by swapping the recorder file — no gap, no stop/start.
  void _startVad() {
    if (!_running || _state != AudioState.listening) return;
    _openProbeRecorder();
  }

  Future<void> _openProbeRecorder() async {
    if (!_running || _state != AudioState.listening) return;

    // Close any previous recorder cleanly
    await _closeRecorder();

    _recorder = AudioRecorder();
    final tmp  = (await getTemporaryDirectory()).path;
    final path = '$tmp/vad_probe_${DateTime.now().millisecondsSinceEpoch}.m4a';

    try {
      await _recorder!.start(
        const RecordConfig(
          encoder:    AudioEncoder.aacLc,
          sampleRate: 16000,
          numChannels: 1,
        ),
        path: path,
      );
    } catch (e) {
      await _recorder?.dispose();
      _recorder = null;
      // Retry with back-off
      if (_running) {
        await Future.delayed(const Duration(seconds: 2));
        if (_running) _openProbeRecorder();
      }
      return;
    }

    // Give the recorder 300 ms to warm up before reading amplitude
    await Future.delayed(const Duration(milliseconds: 300));
    if (!_running || _state != AudioState.listening) {
      await _closeRecorder();
      return;
    }

    _vadTimer = Timer.periodic(const Duration(milliseconds: 150), (_) async {
      if (!_running || _state != AudioState.listening || _recorder == null) return;
      try {
        final amp     = await _recorder!.getAmplitude();
        final raw     = amp.current;
        _emitAmplitude(raw);

        final profile = ScheduleService.instance.profileAt();
        if (!_busy && raw > profile.triggerDb) {
          _vadTimer?.cancel();
          _vadTimer = null;
          await _beginSession(profile);
        }
      } catch (_) {}
    });
  }

  // ── Session ────────────────────────────────────────────────────────────────

  Future<void> _beginSession(ListeningProfile profile) async {
    if (_busy || _state != AudioState.listening || !_running) return;
    _busy           = true;
    _sessionProfile = profile;

    // Stop the probe recorder — we'll start a fresh one for the actual recording
    await _closeRecorder();

    _setState(AudioState.recording);
    _sessionStart = DateTime.now();
    _durationCtrl.add(Duration.zero);

    // Open the real recording file
    final ok = await _openChunkRecorder();
    if (!ok) {
      // Failed to open recorder — fall back to listening
      _busy = false;
      _setState(AudioState.listening);
      if (_running) _startVad();
      return;
    }

    _busy = false;

    // Duration ticker
    _durationTicker = Timer.periodic(const Duration(seconds: 1), (_) {
      final s = _sessionStart;
      if (s != null) _durationCtrl.add(DateTime.now().difference(s));
    });

    // Silence detection
    _vadTimer = Timer.periodic(const Duration(milliseconds: 150), (_) async {
      if (_recorder == null || _state != AudioState.recording) return;
      try {
        final amp     = await _recorder!.getAmplitude();
        final active  = _sessionProfile ?? ScheduleService.instance.profileAt();
        _emitAmplitude(amp.current);

        if (amp.current > active.silenceDb) {
          // Speech — reset silence countdown
          _silenceTimer?.cancel();
          _silenceTimer = null;
        } else {
          // Silence — start countdown if not already running
          _silenceTimer ??= Timer(
            Duration(milliseconds: active.silenceMs),
            _endSession,
          );
        }
      } catch (_) {}
    });

    // Chunk rotation
    final chunkSec = (_sessionProfile ?? profile).chunkSec;
    _chunkTimer = Timer(Duration(seconds: chunkSec), _rotateChunk);
  }

  /// Opens a new AudioRecorder to a fresh temp file.
  /// Returns true on success.
  Future<bool> _openChunkRecorder() async {
    _recorder = AudioRecorder();
    _chunkStart = DateTime.now();
    final tmp = (await getTemporaryDirectory()).path;
    _chunkPath = '$tmp/${const Uuid().v4()}.m4a';

    try {
      await _recorder!.start(
        const RecordConfig(
          encoder:    AudioEncoder.aacLc,
          sampleRate: 16000,
          numChannels: 1,
        ),
        path: _chunkPath!,
      );
      return true;
    } catch (_) {
      await _recorder?.dispose();
      _recorder  = null;
      _chunkPath = null;
      return false;
    }
  }

  Future<void> _rotateChunk() async {
    if (_state != AudioState.recording) return;

    final oldPath  = _chunkPath;
    final oldStart = _chunkStart;
    final profile  = _sessionProfile ?? ScheduleService.instance.profileAt();

    // Start new recorder BEFORE stopping old one — minimises gap
    final tmp     = (await getTemporaryDirectory()).path;
    final newPath = '$tmp/${const Uuid().v4()}.m4a';
    final newRec  = AudioRecorder();

    try {
      await newRec.start(
        const RecordConfig(encoder: AudioEncoder.aacLc, sampleRate: 16000, numChannels: 1),
        path: newPath,
      );
    } catch (_) {
      await newRec.dispose();
      await _endSession();
      return;
    }

    // Stop old recorder
    String? savedOldPath;
    if (_recorder != null) {
      try {
        if (await _recorder!.isRecording()) {
          savedOldPath = await _recorder!.stop();
        }
      } catch (_) {}
      await _recorder!.dispose();
    }

    _recorder   = newRec;
    _chunkPath  = newPath;
    _chunkStart = DateTime.now();
    _chunkTimer = Timer(Duration(seconds: profile.chunkSec), _rotateChunk);

    // Upload old chunk in background
    final toUpload = savedOldPath ?? oldPath;
    if (toUpload != null) unawaited(_uploadChunk(toUpload, oldStart));
  }

  Future<void> _endSession() async {
    if (_state != AudioState.recording) return;

    _silenceTimer?.cancel();   _silenceTimer   = null;
    _chunkTimer?.cancel();     _chunkTimer     = null;
    _vadTimer?.cancel();       _vadTimer       = null;
    _durationTicker?.cancel(); _durationTicker = null;

    // Stop recorder and grab final path
    String? savedPath;
    try {
      if (_recorder != null && await _recorder!.isRecording()) {
        savedPath = await _recorder!.stop();
      }
    } catch (_) {}
    await _recorder?.dispose();
    _recorder = null;

    final path       = savedPath ?? _chunkPath;
    final chunkStart = _chunkStart;
    _chunkPath    = null;
    _chunkStart   = null;
    _sessionStart = null;
    _sessionProfile = null;
    _durationCtrl.add(Duration.zero);

    _setState(AudioState.listening);

    // Restart VAD
    if (_running) _startVad();

    // Upload final chunk
    if (path != null) unawaited(_uploadChunk(path, chunkStart));
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  Future<void> _uploadChunk(String path, DateTime? chunkStart) async {
    final file = File(path);
    if (!await file.exists()) return;
    if (await file.length() < 4096) { await file.delete(); return; }

    final startedAt   = chunkStart ?? DateTime.now();
    final sec         = DateTime.now().difference(startedAt).inSeconds;
    final disposition = ScheduleService.instance.dispositionAt(startedAt);
    final profile     = ScheduleService.instance.profileAt(startedAt);

    if (!profile.shouldStore || !disposition.shouldStore || sec < profile.minSec) {
      await file.delete();
      return;
    }

    final entry = RecordingEntry(
      id:          const Uuid().v4(),
      filePath:    path,
      timestamp:   startedAt,
      mode:        'adaptive',
      durationSec: sec,
    );
    await UploadQueue.enqueue(entry);
    unawaited(UploadQueue.drainQueue());
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  void _emitAmplitude(double raw) {
    final clamped = raw.clamp(-160.0, 0.0);
    _rawDbCtrl.add(clamped);
    _dbCtrl.add(((clamped + 160.0) / 160.0).clamp(0.0, 1.0) * 100.0);
  }

  /// Stops and disposes the current recorder. Does NOT cancel _vadTimer —
  /// callers must do that themselves if needed.
  Future<void> _closeRecorder() async {
    final rec = _recorder;
    _recorder = null;
    if (rec != null) {
      try {
        if (await rec.isRecording()) await rec.stop();
      } catch (_) {}
      try { await rec.dispose(); } catch (_) {}
    }
  }

  void _deleteChunk() {
    final p = _chunkPath;
    _chunkPath = null;
    if (p != null) {
      File(p).exists().then((e) { if (e) File(p).delete(); });
    }
  }

  void _cancelAllTimers() {
    _vadTimer?.cancel();       _vadTimer       = null;
    _silenceTimer?.cancel();   _silenceTimer   = null;
    _chunkTimer?.cancel();     _chunkTimer     = null;
    _durationTicker?.cancel(); _durationTicker = null;
  }
}
