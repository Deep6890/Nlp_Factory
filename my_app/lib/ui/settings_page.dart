import 'package:flutter/material.dart';

import '../main.dart'
    show kAccentRed, kBg, kLime, kLimeDark, kLimeDeep, kTextDark, kTextLight, kTextMid, LeafLogo;
import '../services/schedule_service.dart';
import '../services/server_config.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _ctrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _loading = true;
  bool _testing = false;
  bool _saved = false;
  String? _testError;

  bool _scheduleEnabled = true;
  bool _discardWorst = true;
  TimeOfDaySimple _priorityStart = const TimeOfDaySimple(9, 0);
  TimeOfDaySimple _priorityEnd = const TimeOfDaySimple(18, 0);
  TimeOfDaySimple _worstStart = const TimeOfDaySimple(0, 0);
  TimeOfDaySimple _worstEnd = const TimeOfDaySimple(6, 0);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final url = await ServerConfig.instance.getUrl();
    await ScheduleService.instance.load();
    final schedule = ScheduleService.instance;
    if (!mounted) return;
    setState(() {
      _ctrl.text = url ?? '';
      _scheduleEnabled = schedule.enabled;
      _discardWorst = schedule.discardDuringWorst;
      _priorityStart = schedule.priorityStart;
      _priorityEnd = schedule.priorityEnd;
      _worstStart = schedule.worstStart;
      _worstEnd = schedule.worstEnd;
      _loading = false;
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _pickTime({
    required TimeOfDaySimple current,
    required ValueChanged<TimeOfDaySimple> onChanged,
  }) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: current.hour, minute: current.minute),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: kLimeDark,
              onPrimary: Colors.white,
              surface: kBg,
              onSurface: kTextDark,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked == null || !mounted) return;
    onChanged(TimeOfDaySimple(picked.hour, picked.minute));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _testing = true;
      _saved = false;
      _testError = null;
    });

    final url = _ctrl.text.trim();
    final reachable = await ServerConfig.instance.testConnection(url);
    await ServerConfig.instance.setUrl(url);
    await ScheduleService.instance.save(
      priorityStart: _priorityStart,
      priorityEnd: _priorityEnd,
      worstStart: _worstStart,
      worstEnd: _worstEnd,
      enabled: _scheduleEnabled,
      discardDuringWorst: _discardWorst,
    );

    if (!mounted) return;
    setState(() {
      _testing = false;
      _saved = true;
      _testError = reachable ? null : 'Server not reachable right now. Settings were still saved.';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Listening strategy updated'),
        backgroundColor: reachable ? kLimeDark : kAccentRed,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: kBg,
        body: Center(child: CircularProgressIndicator(color: kLimeDark)),
      );
    }

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
          children: const [
            LeafLogo(size: 28),
            SizedBox(width: 8),
            Text(
              'Settings',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: kLimeDeep),
            ),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            const _SectionLabel('Server'),
            const SizedBox(height: 10),
            _Card(
              child: Column(
                children: [
                  TextFormField(
                    controller: _ctrl,
                    keyboardType: TextInputType.url,
                    autocorrect: false,
                    decoration: InputDecoration(
                      labelText: 'Server URL',
                      hintText: 'http://192.168.1.5:3000',
                      prefixIcon: const Icon(Icons.link_rounded),
                      suffixIcon: _saved ? const Icon(Icons.check_circle, color: Colors.green) : null,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    validator: (v) => ServerConfig.validate(v ?? ''),
                  ),
                  if (_testError != null) ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(Icons.info_outline, color: kAccentRed, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _testError!,
                            style: const TextStyle(color: kAccentRed, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 22),
            const _SectionLabel('Listening Strategy'),
            const SizedBox(height: 10),
            _Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Use time-based priority'),
                    subtitle: const Text('Let the engine behave differently across your day.'),
                    activeTrackColor: kLimeDark,
                    activeThumbColor: Colors.white,
                    value: _scheduleEnabled,
                    onChanged: (value) => setState(() => _scheduleEnabled = value),
                  ),
                  const Divider(height: 20),
                  _TimeRangeTile(
                    title: 'Priority time',
                    subtitle: 'Most financial conversations are expected here.',
                    start: _priorityStart,
                    end: _priorityEnd,
                    onPickStart: () => _pickTime(
                      current: _priorityStart,
                      onChanged: (v) => setState(() => _priorityStart = v),
                    ),
                    onPickEnd: () => _pickTime(
                      current: _priorityEnd,
                      onChanged: (v) => setState(() => _priorityEnd = v),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _TimeRangeTile(
                    title: 'Worst time',
                    subtitle: 'Low-value hours when you want fewer or no saved recordings.',
                    start: _worstStart,
                    end: _worstEnd,
                    onPickStart: () => _pickTime(
                      current: _worstStart,
                      onChanged: (v) => setState(() => _worstStart = v),
                    ),
                    onPickEnd: () => _pickTime(
                      current: _worstEnd,
                      onChanged: (v) => setState(() => _worstEnd = v),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Discard recordings in worst time'),
                    subtitle: const Text('Keep listening light and skip storage during that window.'),
                    activeTrackColor: kLimeDark,
                    activeThumbColor: Colors.white,
                    value: _discardWorst,
                    onChanged: (value) => setState(() => _discardWorst = value),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            const _SectionLabel('What Changes'),
            const SizedBox(height: 10),
            _Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  _BulletLine('Wake word mode has been removed completely.'),
                  _BulletLine('Priority time uses more sensitive speech capture and longer chunks.'),
                  _BulletLine('Worst time uses conservative capture, and can discard recordings entirely.'),
                  _BulletLine('Every recording now carries its recording time and duration.'),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _testing ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kLimeDark,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _testing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Save Settings'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TimeRangeTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final TimeOfDaySimple start;
  final TimeOfDaySimple end;
  final VoidCallback onPickStart;
  final VoidCallback onPickEnd;

  const _TimeRangeTile({
    required this.title,
    required this.subtitle,
    required this.start,
    required this.end,
    required this.onPickStart,
    required this.onPickEnd,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: kTextDark)),
        const SizedBox(height: 4),
        Text(subtitle, style: const TextStyle(fontSize: 12, color: kTextMid)),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  onPressed: onPickStart,
                  icon: const Icon(Icons.schedule, size: 16),
                  label: Text(start.format()),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8),
              child: Text('to', style: TextStyle(color: kTextLight)),
            ),
            Expanded(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  onPressed: onPickEnd,
                  icon: const Icon(Icons.schedule, size: 16),
                  label: Text(end.format()),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;

  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: kLime.withValues(alpha: 0.6)),
        boxShadow: const [
          BoxShadow(color: Color(0x12000000), blurRadius: 14, offset: Offset(0, 5)),
        ],
      ),
      child: child,
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;

  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        letterSpacing: 1.4,
        color: kLimeDeep,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _BulletLine extends StatelessWidget {
  final String text;

  const _BulletLine(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 5),
            child: CircleAvatar(radius: 3, backgroundColor: kLimeDark),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 13, color: kTextMid)),
          ),
        ],
      ),
    );
  }
}
