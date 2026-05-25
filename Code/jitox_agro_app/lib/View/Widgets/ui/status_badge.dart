import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_typography.dart';
import 'package:jitox_agro_app/Constants/colors.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, label) = _style(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: AppTypography.captionStyle(color: fg).copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  (Color, Color, String) _style(String raw) {
    switch (raw.toLowerCase()) {
      case 'completed':
        return (const Color(0xFFDCFCE7), const Color(0xFF166534), 'Completed');
      case 'in_progress':
        return (AppColors.progressBadge, AppColors.progressText, 'In progress');
      case 'overdue':
        return (AppColors.pendingBadge, AppColors.pendingText, 'Overdue');
      default:
        return (const Color(0xFFF3F4F6), AppColors.textSecondary, 'Pending');
    }
  }
}
