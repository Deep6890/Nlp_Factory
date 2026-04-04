import 'package:shared_preferences/shared_preferences.dart';

class ScheduleService {
  ScheduleService._();
  static final ScheduleService instance = ScheduleService._();

  static const _kPriorityStartHour = 'schedule_priority_start_hour';
  static const _kPriorityStartMin = 'schedule_priority_start_min';
  static const _kPriorityEndHour = 'schedule_priority_end_hour';
  static const _kPriorityEndMin = 'schedule_priority_end_min';
  static const _kWorstStartHour = 'schedule_worst_start_hour';
  static const _kWorstStartMin = 'schedule_worst_start_min';
  static const _kWorstEndHour = 'schedule_worst_end_hour';
  static const _kWorstEndMin = 'schedule_worst_end_min';
  static const _kEnabled = 'schedule_enabled';
  static const _kDiscardWorst = 'schedule_discard_worst';

  static const _defaultPriorityStart = TimeOfDaySimple(9, 0);
  static const _defaultPriorityEnd = TimeOfDaySimple(18, 0);
  static const _defaultWorstStart = TimeOfDaySimple(0, 0);
  static const _defaultWorstEnd = TimeOfDaySimple(6, 0);

  TimeOfDaySimple _priorityStart = _defaultPriorityStart;
  TimeOfDaySimple _priorityEnd = _defaultPriorityEnd;
  TimeOfDaySimple _worstStart = _defaultWorstStart;
  TimeOfDaySimple _worstEnd = _defaultWorstEnd;
  bool _enabled = true;
  bool _discardDuringWorst = true;

  TimeOfDaySimple get priorityStart => _priorityStart;
  TimeOfDaySimple get priorityEnd => _priorityEnd;
  TimeOfDaySimple get worstStart => _worstStart;
  TimeOfDaySimple get worstEnd => _worstEnd;
  bool get enabled => _enabled;
  bool get discardDuringWorst => _discardDuringWorst;

  Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    _priorityStart = TimeOfDaySimple(
      p.getInt(_kPriorityStartHour) ?? _defaultPriorityStart.hour,
      p.getInt(_kPriorityStartMin) ?? _defaultPriorityStart.minute,
    );
    _priorityEnd = TimeOfDaySimple(
      p.getInt(_kPriorityEndHour) ?? _defaultPriorityEnd.hour,
      p.getInt(_kPriorityEndMin) ?? _defaultPriorityEnd.minute,
    );
    _worstStart = TimeOfDaySimple(
      p.getInt(_kWorstStartHour) ?? _defaultWorstStart.hour,
      p.getInt(_kWorstStartMin) ?? _defaultWorstStart.minute,
    );
    _worstEnd = TimeOfDaySimple(
      p.getInt(_kWorstEndHour) ?? _defaultWorstEnd.hour,
      p.getInt(_kWorstEndMin) ?? _defaultWorstEnd.minute,
    );
    _enabled = p.getBool(_kEnabled) ?? true;
    _discardDuringWorst = p.getBool(_kDiscardWorst) ?? true;
  }

  Future<void> save({
    required TimeOfDaySimple priorityStart,
    required TimeOfDaySimple priorityEnd,
    required TimeOfDaySimple worstStart,
    required TimeOfDaySimple worstEnd,
    required bool enabled,
    required bool discardDuringWorst,
  }) async {
    final p = await SharedPreferences.getInstance();
    await p.setInt(_kPriorityStartHour, priorityStart.hour);
    await p.setInt(_kPriorityStartMin, priorityStart.minute);
    await p.setInt(_kPriorityEndHour, priorityEnd.hour);
    await p.setInt(_kPriorityEndMin, priorityEnd.minute);
    await p.setInt(_kWorstStartHour, worstStart.hour);
    await p.setInt(_kWorstStartMin, worstStart.minute);
    await p.setInt(_kWorstEndHour, worstEnd.hour);
    await p.setInt(_kWorstEndMin, worstEnd.minute);
    await p.setBool(_kEnabled, enabled);
    await p.setBool(_kDiscardWorst, discardDuringWorst);

    _priorityStart = priorityStart;
    _priorityEnd = priorityEnd;
    _worstStart = worstStart;
    _worstEnd = worstEnd;
    _enabled = enabled;
    _discardDuringWorst = discardDuringWorst;
  }

  RecordingDisposition dispositionAt([DateTime? time]) {
    if (!_enabled) {
      return const RecordingDisposition(
        level: RecordingPriority.normal,
        shouldStore: true,
        label: 'Always On',
        subtitle: 'Time rules are disabled.',
      );
    }

    final now = time ?? DateTime.now();
    final inPriority = _isWithin(now, _priorityStart, _priorityEnd);
    final inWorst = _isWithin(now, _worstStart, _worstEnd);

    if (inWorst && _discardDuringWorst) {
      return const RecordingDisposition(
        level: RecordingPriority.discard,
        shouldStore: false,
        label: 'Worst Time',
        subtitle: 'Listening stays light and recordings are skipped.',
      );
    }

    if (inPriority) {
      return const RecordingDisposition(
        level: RecordingPriority.priority,
        shouldStore: true,
        label: 'Priority Time',
        subtitle: 'Speech capture is more responsive right now.',
      );
    }

    if (inWorst) {
      return const RecordingDisposition(
        level: RecordingPriority.low,
        shouldStore: true,
        label: 'Worst Time',
        subtitle: 'Speech capture is conservative right now.',
      );
    }

    return const RecordingDisposition(
      level: RecordingPriority.normal,
      shouldStore: true,
      label: 'Balanced Time',
      subtitle: 'Standard speech capture rules are active.',
    );
  }

  ListeningProfile profileAt([DateTime? time]) {
    final disposition = dispositionAt(time);
    switch (disposition.level) {
      case RecordingPriority.priority:
        return const ListeningProfile(
          label:      'Priority',
          triggerDb:  -45.0,  // trigger on fairly quiet speech
          silenceDb:  -50.0,  // silence below this
          silenceMs:  4000,
          chunkSec:   45,
          minSec:     2,
          shouldStore: true,
        );
      case RecordingPriority.low:
        return const ListeningProfile(
          label:      'Low',
          triggerDb:  -38.0,
          silenceDb:  -45.0,
          silenceMs:  2500,
          chunkSec:   20,
          minSec:     4,
          shouldStore: true,
        );
      case RecordingPriority.discard:
        return const ListeningProfile(
          label:      'Discard',
          triggerDb:  -35.0,
          silenceDb:  -42.0,
          silenceMs:  2000,
          chunkSec:   15,
          minSec:     30,
          shouldStore: false,
        );
      case RecordingPriority.normal:
        return const ListeningProfile(
          label:      'Balanced',
          triggerDb:  -42.0,  // trigger on normal conversational speech
          silenceDb:  -50.0,  // silence below this
          silenceMs:  3000,
          chunkSec:   30,
          minSec:     3,
          shouldStore: true,
        );
    }
  }

  String priorityLabel() => dispositionAt().label;

  String summary() {
    if (!_enabled) return 'Always listening, no time-based filtering.';
    final discardText = _discardDuringWorst ? 'discard' : 'keep';
    return 'Priority ${_priorityStart.format()}-${_priorityEnd.format()}, '
        'worst ${_worstStart.format()}-${_worstEnd.format()} ($discardText during worst time).';
  }

  bool _isWithin(DateTime time, TimeOfDaySimple start, TimeOfDaySimple end) {
    final nowMins = time.hour * 60 + time.minute;
    final startMins = start.hour * 60 + start.minute;
    final endMins = end.hour * 60 + end.minute;

    if (startMins == endMins) return true;
    if (startMins < endMins) {
      return nowMins >= startMins && nowMins < endMins;
    }
    return nowMins >= startMins || nowMins < endMins;
  }
}

enum RecordingPriority { priority, normal, low, discard }

class RecordingDisposition {
  final RecordingPriority level;
  final bool shouldStore;
  final String label;
  final String subtitle;

  const RecordingDisposition({
    required this.level,
    required this.shouldStore,
    required this.label,
    required this.subtitle,
  });
}

class ListeningProfile {
  final String label;
  final double triggerDb;
  final double silenceDb;
  final int silenceMs;
  final int chunkSec;
  final int minSec;
  final bool shouldStore;

  const ListeningProfile({
    required this.label,
    required this.triggerDb,
    required this.silenceDb,
    required this.silenceMs,
    required this.chunkSec,
    required this.minSec,
    required this.shouldStore,
  });
}

class TimeOfDaySimple {
  final int hour;
  final int minute;

  const TimeOfDaySimple(this.hour, this.minute);

  String format() {
    final h = hour % 12 == 0 ? 12 : hour % 12;
    final m = minute.toString().padLeft(2, '0');
    final ap = hour < 12 ? 'AM' : 'PM';
    return '$h:$m $ap';
  }

  @override
  String toString() => format();
}
