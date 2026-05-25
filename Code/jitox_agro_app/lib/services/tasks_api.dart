import 'package:jitox_agro_app/services/api_client.dart';

class TaskItem {
  TaskItem({
    required this.id,
    required this.title,
    required this.status,
    required this.description,
    this.dueDate,
  });

  final String id;
  final String title;
  final String status;
  final String description;
  final DateTime? dueDate;

  factory TaskItem.fromJson(Map<String, dynamic> json) {
    DateTime? due;
    final raw = json['dueDate'] ?? json['setDate'];
    if (raw != null) {
      due = DateTime.tryParse(raw.toString());
    }
    return TaskItem(
      id: json['_id']?.toString() ?? '',
      title: (json['taskName'] ?? json['title'] ?? 'Task').toString(),
      status: (json['effectiveStatus'] ?? json['status'] ?? 'pending').toString(),
      description: (json['description'] ?? '').toString(),
      dueDate: due,
    );
  }

  bool get isCompleted => status == 'completed';
}

class TasksApi {
  static Future<List<TaskItem>> list({DateTime? date}) async {
    final query = <String, String>{};
    if (date != null) {
      final d = date;
      query['date'] =
          '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    }
    final data = await ApiClient.get('/tasks/', query: query.isEmpty ? null : query);
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => TaskItem.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }
    return [];
  }
}
