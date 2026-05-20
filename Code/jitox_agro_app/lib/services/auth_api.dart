import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:jitox_agro_app/Constants/api_config.dart';

class AuthApi {
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await http
        .post(
          Uri.parse(ApiConfig.usersLogin),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'email': email.trim().toLowerCase(),
            'password': password,
          }),
        )
        .timeout(const Duration(seconds: 45));

    Map<String, dynamic> body = {};
    try {
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic>) body = decoded;
    } catch (_) {}

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final token = body['token']?.toString();
      if (token == null || token.isEmpty) {
        throw Exception('Login succeeded but no token was returned.');
      }
      return body;
    }

    final msg = body['message']?.toString() ??
        'Login failed (${res.statusCode})';
    throw Exception(msg);
  }
}
