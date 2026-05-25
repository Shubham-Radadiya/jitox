import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/ui/empty_state.dart';
import 'package:jitox_agro_app/View/Widgets/ui/page_header.dart';
import 'package:jitox_agro_app/View/Widgets/ui/search_field.dart';
import 'package:jitox_agro_app/View/Widgets/ui/task_card.dart';
import 'package:jitox_agro_app/services/tasks_api.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class TaskScreen extends StatefulWidget {
  const TaskScreen({super.key});

  @override
  State<TaskScreen> createState() => _TaskScreenState();
}

class _TaskScreenState extends State<TaskScreen> {
  String _filter = 'All';
  final _search = TextEditingController();
  List<TaskItem> _tasks = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
    _search.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await TasksApi.list();
      if (!mounted) return;
      setState(() {
        _tasks = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  List<TaskItem> get _visible {
    final q = _search.text.trim().toLowerCase();
    return _tasks.where((t) {
      if (_filter == 'Pending' && t.isCompleted) return false;
      if (_filter == 'Completed' && !t.isCompleted) return false;
      if (q.isEmpty) return true;
      return t.title.toLowerCase().contains(q) ||
          t.description.toLowerCase().contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceMuted,
      appBar: const PageHeader(title: 'Tasks'),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(4.w, 2.h, 4.w, 3.h),
          children: [
            Row(
              children: ['All', 'Pending', 'Completed'].map((label) {
                final selected = _filter == label;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: label != 'Completed' ? 2.w : 0),
                    child: InkWell(
                      onTap: () => setState(() => _filter = label),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        height: 40,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: selected ? AppColors.primary : AppColors.surface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: selected ? AppColors.primary : AppColors.border,
                          ),
                        ),
                        child: Text(
                          label,
                          style: TextStyle(
                            fontSize: 13.sp,
                            fontWeight: FontWeight.w600,
                            color: selected ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: 2.h),
            AppSearchField(
              hint: 'Search tasks…',
              controller: _search,
            ),
            SizedBox(height: 2.h),
            if (_loading)
              Padding(
                padding: EdgeInsets.symmetric(vertical: 8.h),
                child: const Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              EmptyState(
                title: 'Could not load tasks',
                subtitle: _error,
                icon: Icons.cloud_off_outlined,
                actionLabel: 'Retry',
                onAction: _load,
              )
            else if (_visible.isEmpty)
              const EmptyState(
                title: 'No tasks yet',
                subtitle: 'Assigned tasks from your manager will appear here.',
                icon: Icons.task_alt_outlined,
              )
            else
              ..._visible.map((t) => TaskCard(task: t)),
          ],
        ),
      ),
    );
  }
}
