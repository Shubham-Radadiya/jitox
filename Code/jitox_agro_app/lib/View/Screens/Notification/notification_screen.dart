import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/ui/empty_state.dart';
import 'package:jitox_agro_app/View/Widgets/ui/page_header.dart';
import 'package:jitox_agro_app/services/notifications_api.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await NotificationsApi.list();
      if (!mounted) return;
      setState(() {
        _items = list;
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

  String _timeAgo(DateTime? dt) {
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'task_assigned':
        return Icons.task_alt;
      case 'territory_unmapped_district':
        return Icons.map_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceMuted,
      appBar: const PageHeader(title: 'Notifications'),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _load,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: 30.h),
          const Center(child: CircularProgressIndicator()),
        ],
      );
    }
    if (_error != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          EmptyState(
            title: 'Could not load notifications',
            subtitle: _error,
            icon: Icons.cloud_off_outlined,
            actionLabel: 'Retry',
            onAction: _load,
          ),
        ],
      );
    }
    if (_items.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: const [
          EmptyState(
            title: 'Nothing to display',
            subtitle: 'We will notify you when there is something new.',
            icon: Icons.notifications_none_outlined,
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(4.w, 2.h, 4.w, 3.h),
      itemCount: _items.length,
      separatorBuilder: (_, __) => SizedBox(height: 1.h),
      itemBuilder: (context, index) {
        final item = _items[index];
        return Material(
          color: item.read ? AppColors.surface : AppColors.mintHero,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppColors.border),
          ),
          child: ListTile(
            contentPadding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 0.5.h),
            leading: CircleAvatar(
              backgroundColor: AppColors.mintHero,
              child: Icon(_iconFor(item.type), color: AppColors.primary, size: 20.sp),
            ),
            title: Text(
              item.title,
              style: TextStyle(
                fontSize: 14.5.sp,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            subtitle: Padding(
              padding: EdgeInsets.only(top: 0.4.h),
              child: Text(
                item.body,
                style: TextStyle(fontSize: 12.5.sp, color: AppColors.textSecondary),
              ),
            ),
            trailing: Text(
              _timeAgo(item.createdAt),
              style: TextStyle(fontSize: 11.sp, color: AppColors.textSecondary),
            ),
          ),
        );
      },
    );
  }
}
