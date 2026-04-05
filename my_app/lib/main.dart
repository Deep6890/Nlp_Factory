import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:permission_handler/permission_handler.dart';

import 'services/audio_service.dart';
import 'services/background_entry.dart';
import 'services/schedule_service.dart';
import 'services/server_config.dart';
import 'ui/recordings_page.dart';
import 'ui/setup_page.dart';
import 'ui/settings_page.dart';

const kLime = Color(0xFFDDEB9D);
const kBg = Color(0xFFFFFDF6);
const kBgCard = Color(0xFFF7F9EC);
const kLimeDark = Color(0xFF6B8C2A);
const kLimeDeep = Color(0xFF4A6010);
const kAccentRed = Color(0xFFE05C5C);
const kTextDark = Color(0xFF2D2D2D);
const kTextMid = Color(0xFF6B6B6B);
const kTextLight = Color(0xFFAAAAAA);
const kCream = kBg;
const kCreamDeep = kBgCard;
const kLimeLight = Color(0xFFEEF5C8);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));
  // Lock to portrait — prevents layout issues on rotation
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  await Permission.microphone.request();
  await Permission.notification.request();
  await Permission.ignoreBatteryOptimizations.request();
  await Permission.systemAlertWindow.request();

  await ScheduleService.instance.load();
  await initBackgroundService();
  await ServerConfig.instance.getUrl();

  runApp(const ArmorAiApp());
}

class ArmorAiApp extends StatelessWidget {
  const ArmorAiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Armor.ai',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: kLimeDark,
          surface: kBg,
        ),
        scaffoldBackgroundColor: kBg,
      ),
      routes: {
        '/': (_) => const _StartRouter(),
        '/setup': (_) => const SetupPage(),
        '/home': (_) => const HomePage(),
      },
    );
  }
}

class _StartRouter extends StatelessWidget {
  const _StartRouter();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: ServerConfig.instance.isSetupDone(),
      builder: (_, snap) {
        if (!snap.hasData) {
          return const Scaffold(
            backgroundColor: kBg,
            body: Center(child: CircularProgressIndicator(color: kLimeDark)),
          );
        }
        return snap.data == true ? const HomePage() : const SetupPage();
      },
    );
  }
}

class LeafLogo extends StatelessWidget {
  final double size;
  final Color? bg;

  const LeafLogo({super.key, this.size = 36, this.bg});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bg ?? kLimeDark,
        borderRadius: BorderRadius.circular(size * 0.28),
      ),
      child: Center(
        child: Icon(Icons.eco_rounded, color: kLime, size: size * 0.58),
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  AudioState _audioState = AudioState.idle;
  bool _engineOn = false;

  final _dbCtrl = StreamController<double>.broadcast();
  final _rawDbCtrl = StreamController<double>.broadcast();
  final _durationCtrl = StreamController<Duration>.broadcast();
  final List<StreamSubscription> _subs = [];

  @override
  void initState() {
    super.initState();
    final svc = FlutterBackgroundService();

    _subs.add(svc.on('ready').listen((_) {
      if (!mounted) return;
      setState(() {
        _engineOn = true;
        _audioState = AudioState.listening;
      });
    }));

    _subs.add(svc.on('audioState').listen((data) {
      if (!mounted) return;
      final name = data?['state'] as String? ?? 'idle';
      final state = AudioState.values.firstWhere(
        (e) => e.name == name,
        orElse: () => AudioState.idle,
      );
      setState(() {
        _audioState = state;
        // Only set engineOn=false when truly idle; listening/recording = engine is on
        if (state == AudioState.idle) {
          _engineOn = false;
        } else {
          _engineOn = true;
        }
      });
    }));

    _subs.add(svc.on('dbLevel').listen((data) {
      final db = (data?['db'] as num?)?.toDouble() ?? 0.0;
      _dbCtrl.add(db);
    }));

    _subs.add(svc.on('rawDb').listen((data) {
      final raw = (data?['raw'] as num?)?.toDouble() ?? -160.0;
      _rawDbCtrl.add(raw);
    }));

    _subs.add(svc.on('duration').listen((data) {
      final sec = (data?['seconds'] as num?)?.toInt() ?? 0;
      _durationCtrl.add(Duration(seconds: sec));
    }));
  }

  @override
  void dispose() {
    for (final sub in _subs) {
      sub.cancel();
    }
    _dbCtrl.close();
    _rawDbCtrl.close();
    _durationCtrl.close();
    super.dispose();
  }

  Future<void> _toggleEngine() async {
    final svc = FlutterBackgroundService();
    if (_engineOn) {
      svc.invoke('stop');
      _durationCtrl.add(Duration.zero);
      if (mounted) {
        setState(() {
          _engineOn = false;
          _audioState = AudioState.idle;
        });
      }
      return;
    }

    // Reload schedule before restarting
    await ScheduleService.instance.load();
    svc.invoke('restart');
    // Optimistically show listening — confirmed by 'ready' event
    if (mounted) {
      setState(() {
        _engineOn = true;
        _audioState = AudioState.listening;
      });
    }
  }

  Future<void> _openSettings() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SettingsPage()),
    );
    await ScheduleService.instance.load();
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final schedule = ScheduleService.instance;
    final disposition = schedule.dispositionAt();

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: RefreshIndicator(
          color: kLimeDark,
          onRefresh: () async {
            await ScheduleService.instance.load();
            if (mounted) setState(() {});
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              Row(
                children: [
                  const LeafLogo(size: 42),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Armor.ai',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: kLimeDeep,
                        ),
                      ),
                      Text(
                        'Adaptive speech listener',
                        style: TextStyle(fontSize: 12, color: kTextMid),
                      ),
                    ],
                  ),
                  const Spacer(),
                  _RoundIconButton(
                    icon: Icons.folder_outlined,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const RecordingsPage()),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _RoundIconButton(
                    icon: Icons.settings_outlined,
                    onTap: _openSettings,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _HeroCard(
                state: _audioState,
                engineOn: _engineOn,
                disposition: disposition,
                onToggle: _toggleEngine,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: StreamBuilder<double>(
                      stream: _rawDbCtrl.stream,
                      initialData: -160,
                      builder: (_, snap) => _MetricCard(
                        title: 'Live input',
                        value: '${(snap.data ?? -160).toStringAsFixed(1)} dB',
                        subtitle: 'Raw microphone level',
                        icon: Icons.graphic_eq_rounded,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: StreamBuilder<Duration>(
                      stream: _durationCtrl.stream,
                      initialData: Duration.zero,
                      builder: (_, snap) => _MetricCard(
                        title: 'Recording time',
                        value: _formatDuration(snap.data ?? Duration.zero),
                        subtitle: 'Current active session',
                        icon: Icons.timer_outlined,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _PanelCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Time strategy',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: kLimeDeep,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      disposition.subtitle,
                      style: const TextStyle(fontSize: 13, color: kTextMid),
                    ),
                    const SizedBox(height: 12),
                    _InfoLine(
                      label: 'Priority window',
                      value: '${schedule.priorityStart.format()} - ${schedule.priorityEnd.format()}',
                    ),
                    _InfoLine(
                      label: 'Worst window',
                      value: '${schedule.worstStart.format()} - ${schedule.worstEnd.format()}',
                    ),
                    _InfoLine(
                      label: 'Worst-time behavior',
                      value: schedule.discardDuringWorst ? 'Discard recordings' : 'Keep conservative recordings',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              StreamBuilder<double>(
                stream: _dbCtrl.stream,
                initialData: 0,
                builder: (_, snap) => _PanelCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Speech activity',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: kLimeDeep,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: ((snap.data ?? 0) / 100).clamp(0.0, 1.0),
                          minHeight: 14,
                          backgroundColor: kLime.withValues(alpha: 0.28),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            _audioState == AudioState.recording ? kAccentRed : kLimeDark,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'The simplified home screen avoids the old heavy blur and wake overlay to keep Flutter responsive.',
                        style: const TextStyle(fontSize: 12, color: kTextMid),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _formatDuration(Duration duration) {
  final hours = duration.inHours;
  final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
  final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
  if (hours > 0) {
    return '$hours:$minutes:$seconds';
  }
  return '$minutes:$seconds';
}

class _HeroCard extends StatelessWidget {
  final AudioState state;
  final bool engineOn;
  final RecordingDisposition disposition;
  final VoidCallback onToggle;

  const _HeroCard({
    required this.state,
    required this.engineOn,
    required this.disposition,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final title = switch (state) {
      AudioState.recording => 'Recording now',
      AudioState.listening => 'Listening now',
      AudioState.idle => 'Engine stopped',
    };

    final accent = state == AudioState.recording ? kAccentRed : kLimeDark;

    return _PanelCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              disposition.label,
              style: TextStyle(
                color: accent,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: kTextDark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            disposition.subtitle,
            style: const TextStyle(fontSize: 14, color: kTextMid),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onToggle,
              style: ElevatedButton.styleFrom(
                backgroundColor: engineOn ? kAccentRed : kLimeDark,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: Icon(engineOn ? Icons.stop_rounded : Icons.mic_none_rounded),
              label: Text(engineOn ? 'Stop listening' : 'Start listening'),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return _PanelCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: kLimeDark, size: 20),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(fontSize: 12, color: kTextMid)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: kLimeDeep,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(fontSize: 11, color: kTextLight)),
        ],
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  final String label;
  final String value;

  const _InfoLine({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 118,
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, color: kTextMid),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                color: kTextDark,
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 2,
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _RoundIconButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: kLime.withValues(alpha: 0.7)),
          ),
          child: Icon(icon, color: kLimeDeep, size: 20),
        ),
      ),
    );
  }
}

class _PanelCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const _PanelCard({
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: kLime.withValues(alpha: 0.55)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: child,
    );
  }
}
