import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Persists login token and profile for the MR app shell.
class AuthSession {
  static const _tokenKey = 'auth_token';
  static const _userKey = 'auth_user';
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

  static Future<void> saveSession(
    String token, {
    Map<String, dynamic>? user,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    if (user != null) {
      await prefs.setString(_userKey, jsonEncode(user));
    }
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } catch (_) {}
    return null;
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  static Future<bool> hasSeenOnboard() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardSeenKey) ?? false;
  }

  static Future<void> markOnboardSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardSeenKey, true);
  }

  /// Field app: only API role `User` may stay signed in.
  static bool isFieldRole(Map<String, dynamic>? user) {
    if (user == null) return false;
    final role = (user['role'] ?? user['Role'] ?? '').toString().trim();
    return role.toLowerCase() == 'user';
  }
}
