enum RecordingStatus { pending, processing, uploaded }

class RecordingEntry {
  final String id;
  final String filePath;
  final DateTime timestamp;
  final String mode;
  final int durationSec;
  RecordingStatus status;

  RecordingEntry({
    required this.id,
    required this.filePath,
    required this.timestamp,
    this.mode = 'adaptive',
    this.durationSec = 0,
    this.status = RecordingStatus.pending,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'filePath': filePath,
        'timestamp': timestamp.toIso8601String(),
        'mode': mode,
        'durationSec': durationSec,
        'status': status.name,
      };

  factory RecordingEntry.fromMap(Map<String, dynamic> m) => RecordingEntry(
        id: m['id'],
        filePath: m['filePath'],
        timestamp: DateTime.parse(m['timestamp']),
        mode: m['mode'] as String? ?? 'adaptive',
        durationSec: m['durationSec'] as int? ?? 0,
        status: RecordingStatus.values.byName(m['status']),
      );
}
