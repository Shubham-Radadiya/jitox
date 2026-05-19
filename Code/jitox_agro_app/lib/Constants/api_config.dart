/// Live API used for client test APK builds.
/// Override at build time:
/// `flutter build apk --dart-define=API_BASE_URL=https://your-api.example.com`
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://jitox.onrender.com',
  );

  static String get usersLogin => '$baseUrl/users/login';
  static String get usersRegister => '$baseUrl/users/register';
}
