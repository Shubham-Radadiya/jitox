/// Live API — default production host on Render.
/// Override at build: `flutter build apk --dart-define=API_BASE_URL=https://...`
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://jitox.onrender.com',
  );

  /// Render free tier may cold-start; allow long first request.
  static const int liveTimeoutSeconds = 90;

  static Duration get liveTimeout =>
      const Duration(seconds: liveTimeoutSeconds);

  static String get health => '$baseUrl/health';
  static String get usersLogin => '$baseUrl/users/login';
  static String get usersRegister => '$baseUrl/users/register';
}
