import 'package:jitox_agro_app/services/api_client.dart';

class AppNotification {
  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.read,
    this.createdAt,
  });

  final String id;
  final String title;
  final String body;
  final String type;
  final bool read;
  final DateTime? createdAt;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id']?.toString() ?? '',
      title: (json['title'] ?? 'Notification').toString(),
      body: (json['body'] ?? '').toString(),
      type: (json['type'] ?? '').toString(),
      read: json['read'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }
}

class NotificationsApi {
  static Future<List<AppNotification>> list() async {
    final data = await ApiClient.get('/notifications/');
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => AppNotification.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    return [];
  }

  static Future<int> unreadCount() async {
    final data = await ApiClient.get('/notifications/unread-count');
    if (data is Map && data['count'] != null) {
      return int.tryParse(data['count'].toString()) ?? 0;
    }
    if (data is int) return data;
    return 0;
  }
}
