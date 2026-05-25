import 'package:jitox_agro_app/services/api_client.dart';

class TrackingApi {
  static Future<void> postPing({
    required double lat,
    required double lng,
    String kind = 'ping',
    double? accuracy,
    String? address,
  }) async {
    await ApiClient.post('/tracking/ping', body: {
      'lat': lat,
      'lng': lng,
      'kind': kind,
      if (accuracy != null) 'accuracy': accuracy,
      if (address != null && address.isNotEmpty) 'address': address,
    });
  }

  static Future<Map<String, dynamic>> myToday() async {
    final data = await ApiClient.get('/tracking/me/today');
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }
}
