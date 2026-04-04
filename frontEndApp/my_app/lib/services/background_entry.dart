import 'package:flutter/widgets.dart';
import 'package:flutter_background_service/flutter_background_service.dart';

import 'audio_service.dart';
import 'schedule_service.dart';
import 'server_config.dart';
import 'upload_queue.dart';

Future<void> initBackgroundService() async {
  final service = FlutterBackgroundService();
  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart:                      _onBackgroundStart,
      isForegroundMode:             true,
      autoStart:                    true,
      notificationChannelId:        'audio_engine',
      initialNotificationTitle:     'Armor.ai',
      initialNotificationContent:   'Listening...',
      foregroundServiceNotificationId: 888,
    ),
    iosConfiguration: IosConfiguration(
      autoStart:    true,
      onForeground: _onBackgroundStart,
      onBackground: _onIosBackground,
    ),
  );
  await service.startService();
}

@pragma('vm:entry-point')
void _onBackgroundStart(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();

  await ServerConfig.instance.getUrl();
  await ScheduleService.instance.load();
  await UploadQueue.resetStaleProcessing();

  final audio = AudioService();

  // ── Wire streams to UI ────────────────────────────────────────────────────
  audio.stateStream.listen((state) {
    service.invoke('audioState', {'state': state.name});
    if (service is AndroidServiceInstance) {
      service.setForegroundNotificationInfo(
        title:   'Armor.ai',
        content: state == AudioState.recording
            ? '🔴 Recording speech...'
            : '🎙 Listening for speech...',
      );
    }
  });

  audio.dbStream.listen(
    (db)  => service.invoke('dbLevel', {'db': db}),
  );
  audio.rawDbStream.listen(
    (raw) => service.invoke('rawDb', {'raw': raw}),
  );
  audio.durationStream.listen(
    (dur) => service.invoke('duration', {'seconds': dur.inSeconds}),
  );

  // ── Start VAD ─────────────────────────────────────────────────────────────
  await audio.startListening();
  await UploadQueue.watchConnectivity();
  service.invoke('ready', {});

  // ── Commands from UI ──────────────────────────────────────────────────────
  service.on('stop').listen((_) async {
    await audio.stop();
    service.invoke('audioState', {'state': 'idle'});
  });

  service.on('restart').listen((_) async {
    // Full stop first
    await audio.stop();
    await Future.delayed(const Duration(milliseconds: 600));
    // Reload schedule in case settings changed
    await ScheduleService.instance.load();
    // Restart VAD
    await audio.startListening();
    service.invoke('ready', {});
    service.invoke('audioState', {'state': 'listening'});
  });
}

@pragma('vm:entry-point')
Future<bool> _onIosBackground(ServiceInstance service) async => true;
