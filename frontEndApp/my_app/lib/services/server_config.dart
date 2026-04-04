import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const _kServerUrl = 'server_url';
const _kSetupDone = 'setup_done';

class ServerConfig {
  ServerConfig._();
  static final ServerConfig instance = ServerConfig._();

  String? _cachedUrl;

  Future<String?> getUrl() async {
    _cachedUrl ??= (await SharedPreferences.getInstance()).getString(_kServerUrl);
    return _cachedUrl;
  }

  Future<void> setUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kServerUrl, url.trim());
    _cachedUrl = url.trim();
  }

  Future<bool> isSetupDone() async =>
      (await SharedPreferences.getInstance()).getBool(_kSetupDone) ?? false;

  Future<void> markSetupDone() async =>
      (await SharedPreferences.getInstance()).setBool(_kSetupDone, true);

  // Returns null if valid, error string if not
  static String? validate(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return 'URL cannot be empty';
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return 'Must start with http:// or https://';
    }
    final uri = Uri.tryParse(trimmed);
    if (uri == null || !uri.hasAuthority) return 'Invalid URL format';
    return null;
  }

  // Ping /recordings — returns true if server responds
  Future<bool> testConnection(String url) async {
    try {
      final uri = Uri.parse('${url.trim()}/recordings');
      final res = await http.get(uri).timeout(const Duration(seconds: 5));
      return res.statusCode < 500;
    } catch (_) {
      return false;
    }
  }

  String get uploadEndpoint => '${_cachedUrl ?? ''}/upload';
  String get recordingsEndpoint => '${_cachedUrl ?? ''}/recordings';
}
