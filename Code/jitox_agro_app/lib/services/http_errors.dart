import 'package:jitox_agro_app/Constants/api_config.dart';

/// User-friendly message for failed API calls (DNS, timeout, Render cold start).
String friendlyHttpError(Object error) {
  final raw = error.toString().replaceFirst('Exception: ', '');
  final lower = raw.toLowerCase();

  if (lower.contains('failed host lookup') ||
      lower.contains('socketexception') ||
      lower.contains('network is unreachable') ||
      lower.contains('no address associated')) {
    return 'Cannot reach live server (${ApiConfig.baseUrl}). '
        'Turn on Wi‑Fi or mobile data, then try again.';
  }

  if (lower.contains('timeout') || lower.contains('timed out')) {
    return 'Live server is slow to respond (first request can take up to '
        '${ApiConfig.liveTimeoutSeconds} seconds). Please wait and tap Register again.';
  }

  if (lower.contains('handshake') || lower.contains('certificate')) {
    return 'Secure connection failed. Check device date/time and network, then retry.';
  }

  return raw;
}
