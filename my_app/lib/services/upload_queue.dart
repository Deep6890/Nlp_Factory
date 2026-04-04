import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

import '../models/recording_entry.dart';
import 'server_config.dart';

class UploadQueue {
  static Database? _db;

  static Future<Database> get _database async {
    _db ??= await openDatabase(
      join(await getDatabasesPath(), 'recordings.db'),
      onCreate: (db, _) => db.execute(
        'CREATE TABLE recordings('
        'id TEXT PRIMARY KEY, filePath TEXT, '
        'timestamp TEXT, mode TEXT NOT NULL DEFAULT "adaptive", '
        'durationSec INTEGER NOT NULL DEFAULT 0, status TEXT)',
      ),
      onUpgrade: (db, oldV, newV) async {
        await db.execute('DROP TABLE IF EXISTS recordings');
        await db.execute(
          'CREATE TABLE recordings('
          'id TEXT PRIMARY KEY, filePath TEXT, '
          'timestamp TEXT, mode TEXT NOT NULL DEFAULT "adaptive", '
          'durationSec INTEGER NOT NULL DEFAULT 0, status TEXT)',
        );
      },
      version: 5,
    );
    return _db!;
  }

  static Future<void> resetStaleProcessing() async {
    final db = await _database;
    await db.update(
      'recordings',
      {'status': 'pending'},
      where: 'status = ?',
      whereArgs: ['processing'],
    );
  }

  static Future<void> enqueue(RecordingEntry entry) async {
    final db = await _database;
    await db.insert(
      'recordings',
      entry.toMap(),
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
  }

  static Future<void> drainQueue() async {
    final results = await Connectivity().checkConnectivity();
    if (results.isEmpty || results.every((r) => r == ConnectivityResult.none)) {
      return;
    }

    final serverUrl = await ServerConfig.instance.getUrl();
    if (serverUrl == null || serverUrl.isEmpty) return;

    final uploadEndpoint = '$serverUrl/upload';
    final db = await _database;
    final rows = await db.query('recordings', where: 'status = ?', whereArgs: ['pending']);

    for (final row in rows) {
      final entry = RecordingEntry.fromMap(row);

      if (!await File(entry.filePath).exists()) {
        await db.delete('recordings', where: 'id = ?', whereArgs: [entry.id]);
        continue;
      }

      await db.update(
        'recordings',
        {'status': 'processing'},
        where: 'id = ?',
        whereArgs: [entry.id],
      );

      try {
        final request = http.MultipartRequest('POST', Uri.parse(uploadEndpoint))
          ..fields['id'] = entry.id
          ..fields['timestamp'] = entry.timestamp.toIso8601String()
          ..fields['recordedAt'] = entry.timestamp.toIso8601String()
          ..fields['mode'] = entry.mode
          ..fields['durationSec'] = entry.durationSec.toString()
          ..files.add(await http.MultipartFile.fromPath('file', entry.filePath));

        final response = await request.send().timeout(const Duration(seconds: 30));

        if (response.statusCode == 200) {
          final file = File(entry.filePath);
          if (await file.exists()) {
            await file.delete();
          }
          await db.delete('recordings', where: 'id = ?', whereArgs: [entry.id]);
        } else {
          await db.update(
            'recordings',
            {'status': 'pending'},
            where: 'id = ?',
            whereArgs: [entry.id],
          );
        }
      } catch (_) {
        await db.update(
          'recordings',
          {'status': 'pending'},
          where: 'id = ?',
          whereArgs: [entry.id],
        );
      }
    }
  }

  static Future<void> watchConnectivity() async {
    Connectivity().onConnectivityChanged.listen((results) {
      if (results.any((r) => r != ConnectivityResult.none)) {
        drainQueue();
      }
    });
  }

  static String get recordingsEndpoint => ServerConfig.instance.recordingsEndpoint;
}
