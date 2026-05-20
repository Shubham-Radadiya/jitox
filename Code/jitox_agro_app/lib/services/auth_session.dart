import 'package:shared_preferences/shared_preferences.dart';

/// Persists login token so the app opens on login until the user signs out.
class AuthSession {
  static const _tokenKey = 'auth_token';
  static const _onboardSeenKey = 'onboard_seen';

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    return token != null && token.trim().isNotEmpty;
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> saveSession(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  static Future<bool> hasSeenOnboard() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardSeenKey) ?? false;
  }

  static Future<void> markOnboardSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardSeenKey, true);
  }
}
