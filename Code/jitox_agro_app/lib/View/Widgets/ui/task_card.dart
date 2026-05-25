import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_theme.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/ui/status_badge.dart';
import 'package:jitox_agro_app/services/tasks_api.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class TaskCard extends StatelessWidget {
  const TaskCard({super.key, required this.task});

  final TaskItem task;

  @override
  Widget build(BuildContext context) {
    final due = task.dueDate;
    final dueLabel = due != null
        ? '${due.day.toString().padLeft(2, '0')}/${due.month.toString().padLeft(2, '0')} ${due.hour}:${due.minute.toString().padLeft(2, '0')}'
        : '';

    return Padding(
      padding: EdgeInsets.only(bottom: 1.5.h),
      child: Material(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          side: const BorderSide(color: AppColors.border),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          onTap: () => Navigator.pushNamed(context, taskDetailsScreen),
          child: Padding(
            padding: EdgeInsets.all(3.5.w),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.mintHero,
                    borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  ),
                  child: Icon(
                    task.isCompleted ? Icons.check_circle_outline : Icons.task_alt,
                    color: AppColors.primary,
                  ),
                ),
                SizedBox(width: 3.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              task.title,
                              style: TextStyle(
                                fontSize: 15.sp,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          StatusBadge(status: task.status),
                        ],
                      ),
                      if (task.description.isNotEmpty) ...[
                        SizedBox(height: 0.5.h),
                        Text(
                          task.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12.5.sp,
                            color: AppColors.textSecondary,
                            height: 1.3,
                          ),
                        ),
                      ],
                      if (dueLabel.isNotEmpty) ...[
                        SizedBox(height: 0.6.h),
                        Row(
                          children: [
                            Icon(Icons.schedule, size: 14.sp, color: AppColors.textSecondary),
                            SizedBox(width: 1.w),
                            Text(
                              dueLabel,
                              style: TextStyle(fontSize: 11.5.sp, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: AppColors.textSecondary, size: 22.sp),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
