import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../main.dart'
    show kAccentRed, kBg, kLime, kLimeDark, kLimeDeep, kTextDark, kTextLight, kTextMid, LeafLogo;
import '../services/server_config.dart';

class RecordingsPage extends StatefulWidget {
  const RecordingsPage({super.key});

  @override
  State<RecordingsPage> createState() => _RecordingsPageState();
}

class _RecordingsPageState extends State<RecordingsPage> {
  List<Map<String, dynamic>> _recordings = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final url = await ServerConfig.instance.getUrl();
      if (!mounted) return;
      if (url == null || url.isEmpty) {
        setState(() {
          _error = 'No server URL. Open Settings first.';
          _loading = false;
        });
        return;
      }

      final res = await http.get(Uri.parse('$url/recordings')).timeout(const Duration(seconds: 8));
      if (!mounted) return;
      if (res.statusCode != 200) {
        setState(() {
          _error = 'Server error ${res.statusCode}';
          _loading = false;
        });
        return;
      }

      setState(() {
        _recordings = List<Map<String, dynamic>>.from(jsonDecode(res.body));
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Cannot reach server';
        _loading = false;
      });
    }
  }

  Future<void> _delete(Map<String, dynamic> rec) async {
    try {
      final url = await ServerConfig.instance.getUrl();
      if (url != null) {
        await http.delete(Uri.parse('$url/recordings/${rec['filename']}'));
      }
    } catch (_) {}
    await _fetch();
  }

  String _size(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  String _date(dynamic value) {
    if (value == null || '$value'.isEmpty) return 'Unknown time';
    final d = DateTime.parse('$value').toLocal();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} '
        '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: kBg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: kLimeDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            const LeafLogo(size: 28),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Recordings',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: kLimeDeep),
                ),
                if (!_loading && _error == null)
                  Text(
                    '${_recordings.length} files',
                    style: const TextStyle(fontSize: 11, color: kTextLight),
                  ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: kLimeDark),
            onPressed: _fetch,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kLimeDark))
          : _error != null
              ? _ErrorState(message: _error!, onRetry: _fetch)
              : _recordings.isEmpty
                  ? const _EmptyState()
                  : RefreshIndicator(
                      color: kLimeDark,
                      onRefresh: _fetch,
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        itemCount: _recordings.length,
                        itemBuilder: (_, index) {
                          final rec = _recordings[index];
                          final recordedAt = rec['recordedAt'] ?? rec['timestamp'] ?? rec['uploadedAt'];
                          final durationSec = (rec['durationSec'] as num?)?.toInt() ?? 0;
                          final expiresIn = ((rec['expiresIn'] as num?)?.toDouble() ?? 0) / 60000;
                          return _RecordingCard(
                            filename: '${rec['filename'] ?? ''}',
                            recordedAt: _date(recordedAt),
                            uploadedAt: _date(rec['uploadedAt']),
                            duration: durationSec <= 0 ? 'Unknown' : '${durationSec}s',
                            size: _size((rec['size'] as num?)?.toInt() ?? 0),
                            mode: '${rec['mode'] ?? 'adaptive'}',
                            expiresIn: '${expiresIn.floor()} min',
                            onDelete: () => _confirmDelete(rec),
                          );
                        },
                      ),
                    ),
    );
  }

  void _confirmDelete(Map<String, dynamic> rec) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: kBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete recording?'),
        content: Text('${rec['filename'] ?? ''}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: kTextMid)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _delete(rec);
            },
            child: const Text('Delete', style: TextStyle(color: kAccentRed)),
          ),
        ],
      ),
    );
  }
}

class _RecordingCard extends StatelessWidget {
  final String filename;
  final String recordedAt;
  final String uploadedAt;
  final String duration;
  final String size;
  final String mode;
  final String expiresIn;
  final VoidCallback onDelete;

  const _RecordingCard({
    required this.filename,
    required this.recordedAt,
    required this.uploadedAt,
    required this.duration,
    required this.size,
    required this.mode,
    required this.expiresIn,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: kLime.withValues(alpha: 0.6)),
        boxShadow: const [
          BoxShadow(color: Color(0x12000000), blurRadius: 16, offset: Offset(0, 5)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: kLimeDark,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.multitrack_audio_rounded, color: kLime, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  filename,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: kTextDark,
                  ),
                ),
              ),
              IconButton(
                onPressed: onDelete,
                icon: const Icon(Icons.delete_outline_rounded, color: kAccentRed),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _Tag(icon: Icons.schedule_outlined, label: 'Recorded $recordedAt'),
              _Tag(icon: Icons.cloud_done_outlined, label: 'Uploaded $uploadedAt'),
              _Tag(icon: Icons.timer_outlined, label: duration),
              _Tag(icon: Icons.storage_rounded, label: size),
              _Tag(icon: Icons.auto_awesome_outlined, label: _modeLabel(mode)),
              _Tag(icon: Icons.delete_sweep_outlined, label: 'Delete in $expiresIn', color: kAccentRed),
            ],
          ),
        ],
      ),
    );
  }

  String _modeLabel(String value) {
    if (value == 'adaptive') return 'Adaptive';
    return 'Legacy';
  }
}

class _Tag extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _Tag({required this.icon, required this.label, this.color = kTextMid});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: kBg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: kLime.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              label,
              style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.wifi_off_rounded, color: kLime.withValues(alpha: 0.7), size: 52),
            const SizedBox(height: 12),
            Text(message, style: const TextStyle(color: kTextMid)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(backgroundColor: kLimeDark, foregroundColor: Colors.white),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.multitrack_audio_rounded, color: kLime, size: 60),
          SizedBox(height: 12),
          Text('No recordings yet', style: TextStyle(color: kTextMid, fontSize: 16)),
          SizedBox(height: 6),
          Text(
            'Start the engine and speak during your chosen time windows.',
            style: TextStyle(color: kTextLight),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
