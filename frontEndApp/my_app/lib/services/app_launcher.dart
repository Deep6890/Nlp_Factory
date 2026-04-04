import 'dart:io';
import 'package:flutter/services.dart';

/// Brings the app to foreground and wakes the screen from the background isolate.
class AppLauncher {
  AppLauncher._();

  static const _channel = MethodChannel('com.example.my_app/screen');

  /// Call this from the background service when wake word is detected.
  /// On Android: wakes screen + dismisses keyguard via MainActivity.
  static Future<void> wakeAndShow() async {
    if (!Platform.isAndroid) return;
    try {
      await _channel.invokeMethod('wakeScreen');
    } catch (_) {
      // Activity may not be running yet — that's fine,
      // the FLAG_TURN_SCREEN_ON in the manifest handles cold launch.
    }
  }
}
