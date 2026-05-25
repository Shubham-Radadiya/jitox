import 'package:http/http.dart' as http;
import 'package:jitox_agro_app/Constants/api_config.dart';

/// Wake production API (Render cold start) before register/login.
Future<void> warmLiveServer() async {
  try {
    await http.get(Uri.parse(ApiConfig.health)).timeout(ApiConfig.liveTimeout);
  } catch (_) {
    // Best-effort; register/login will retry.
  }
}
