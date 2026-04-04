import 'dart:ui';
import 'package:flutter/material.dart';
import '../services/server_config.dart';
import '../main.dart'
    show kBg, kLime, kLimeDark, kLimeDeep, kTextMid, kTextLight, kTextDark, kAccentRed, LeafLogo;

class SetupPage extends StatefulWidget {
  const SetupPage({super.key});

  @override
  State<SetupPage> createState() => _SetupPageState();
}

class _SetupPageState extends State<SetupPage> {
  final _ctrl = TextEditingController(text: 'http://');
  final _formKey = GlobalKey<FormState>();
  bool _testing = false;
  String? _testError;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _testing = true; _testError = null; });

    final url = _ctrl.text.trim();
    final reachable = await ServerConfig.instance.testConnection(url);

    if (!mounted) return;
    if (!reachable) {
      setState(() {
        _testing = false;
        _testError = 'Server not reachable. Check URL and Wi-Fi.';
      });
      return;
    }

    await ServerConfig.instance.setUrl(url);
    await ServerConfig.instance.markSetupDone();
    if (mounted) Navigator.of(context).pushReplacementNamed('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 36),
                const LeafLogo(size: 56),
                const SizedBox(height: 20),
                const Text('Connect to Server',
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: kLimeDeep)),
                const SizedBox(height: 8),
                const Text(
                  'Enter your Armor.ai server URL.\nPhone and PC must be on the same Wi-Fi.',
                  style: TextStyle(color: kTextMid, fontSize: 13),
                ),
                const SizedBox(height: 32),
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: kLime.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: kLime.withValues(alpha: 0.4)),
                      ),
                      child: TextFormField(
                        controller: _ctrl,
                        style: const TextStyle(color: kTextDark),
                        keyboardType: TextInputType.url,
                        autocorrect: false,
                        decoration: InputDecoration(
                          labelText: 'Server URL',
                          labelStyle: const TextStyle(color: kTextMid),
                          hintText: 'http://192.168.1.5:3000',
                          hintStyle: const TextStyle(color: kTextLight),
                          filled: true,
                          fillColor: kBg,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: kLimeDark, width: 1.5),
                          ),
                          prefixIcon: const Icon(Icons.link_rounded, color: kLimeDark),
                        ),
                        validator: (v) => ServerConfig.validate(v ?? ''),
                      ),
                    ),
                  ),
                ),
                if (_testError != null) ...[
                  const SizedBox(height: 10),
                  Row(children: [
                    const Icon(Icons.error_outline, size: 14, color: kAccentRed),
                    const SizedBox(width: 6),
                    Expanded(child: Text(_testError!,
                        style: const TextStyle(color: kAccentRed, fontSize: 12))),
                  ]),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity, height: 52,
                  child: ElevatedButton(
                    onPressed: _testing ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kLimeDark,
                      foregroundColor: kBg,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: _testing
                        ? const SizedBox(width: 20, height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Connect & Continue',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: TextButton(
                    onPressed: _testing ? null : () async {
                      if (!_formKey.currentState!.validate()) return;
                      final nav = Navigator.of(context);
                      await ServerConfig.instance.setUrl(_ctrl.text.trim());
                      await ServerConfig.instance.markSetupDone();
                      nav.pushReplacementNamed('/home');
                    },
                    child: const Text('Skip connection test',
                        style: TextStyle(color: kTextLight, fontSize: 12)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
