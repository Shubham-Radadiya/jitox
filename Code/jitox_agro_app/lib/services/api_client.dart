import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:jitox_agro_app/Constants/api_config.dart';
import 'package:jitox_agro_app/services/auth_session.dart';

class ApiClient {
  static Future<dynamic> get(String path, {Map<String, String>? query}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path').replace(queryParameters: query);
    final res = await http
        .get(uri, headers: await _headers())
        .timeout(const Duration(seconds: 45));
    return _parse(res);
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path');
    final res = await http
        .post(
          uri,
          headers: await _headers(),
          body: jsonEncode(body ?? {}),
        )
        .timeout(const Duration(seconds: 45));
    return _parse(res);
  }

  static Future<Map<String, String>> _headers() async {
    final token = await AuthSession.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  static dynamic _parse(http.Response res) {
    dynamic body;
    try {
      body = jsonDecode(res.body);
    } catch (_) {
      body = res.body;
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (body is Map && body['success'] == true && body.containsKey('data')) {
        return body['data'];
      }
      return body;
    }

    String message = 'Request failed (${res.statusCode})';
    if (body is Map) {
      message = body['message']?.toString() ?? message;
    }
    throw Exception(message);
  }
}
