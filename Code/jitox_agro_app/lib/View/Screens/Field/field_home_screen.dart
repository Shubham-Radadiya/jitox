import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_theme.dart';
import 'package:jitox_agro_app/Constants/app_typography.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/mr/mr_app_bar.dart';
import 'package:jitox_agro_app/View/Widgets/mr/mr_drawer.dart';
import 'package:jitox_agro_app/View/Widgets/ui/app_card.dart';
import 'package:jitox_agro_app/View/Widgets/ui/section_title.dart';
import 'package:jitox_agro_app/services/auth_session.dart';
import 'package:jitox_agro_app/services/location_permission.dart';
import 'package:jitox_agro_app/services/location_tracking_service.dart';
import 'package:jitox_agro_app/services/notifications_api.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class FieldHomeScreen extends StatefulWidget {
  const FieldHomeScreen({super.key});

  @override
  State<FieldHomeScreen> createState() => _FieldHomeScreenState();
}

class _FieldHomeScreenState extends State<FieldHomeScreen> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _dayStarted = false;
  Map<String, dynamic>? _user;
  int _unread = 0;

  static const _menuItems = [
    _MenuItem('Tasks', Icons.task_alt_outlined, taskScreen),
    _MenuItem('Dealer List', Icons.storefront_outlined, dealerListScreen),
    _MenuItem('Dealer Order', Icons.edit_note_outlined, orderDetailPage),
    _MenuItem('Payment', Icons.payments_outlined, addDealerPaymentScreen),
    _MenuItem('Dealer Visit', Icons.map_outlined, null),
    _MenuItem('New Party', Icons.person_add_alt_1_outlined, null),
    _MenuItem('Reminder', Icons.alarm_outlined, null),
    _MenuItem('Farmer', Icons.agriculture_outlined, null),
    _MenuItem('Meeting', Icons.event_note_outlined, null),
    _MenuItem('Product Demo', Icons.science_outlined, productDemoScreen),
    _MenuItem('Expense', Icons.receipt_long_outlined, null),
    _MenuItem('Calendar', Icons.calendar_month_outlined, null),
    _MenuItem('Print', Icons.print_outlined, null),
  ];

  @override
  void initState() {
    super.initState();
    _loadProfile();
    _loadDayState();
  }

  Future<void> _loadDayState() async {
    final active = await LocationTrackingService.instance.isActive();
    if (mounted) setState(() => _dayStarted = active);
  }

  Future<void> _toggleDay() async {
    if (_dayStarted) {
      await LocationTrackingService.instance.endDay();
      if (!mounted) return;
      setState(() => _dayStarted = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Day ended — location tracking stopped')),
      );
      return;
    }
    final access = await prepareLocationForTracking(context);
    if (!mounted) return;
    if (!access.granted) {
      final msg = switch (access.issue) {
        LocationAccessIssue.serviceDisabled =>
          'Turn on GPS/location on your phone, then tap START again.',
        LocationAccessIssue.deniedForever =>
          'Allow location for Jitox Agro in app settings, then tap START again.',
        _ => 'Location permission is required for field day tracking.',
      };
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      return;
    }

    final ok = await LocationTrackingService.instance.startDay();
    if (!mounted) return;
    if (ok) {
      setState(() => _dayStarted = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Day started — sharing location with admin')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Could not get GPS fix. Go outdoors or wait a moment and try again.',
          ),
        ),
      );
    }
  }

  Future<void> _loadProfile() async {
    final user = await AuthSession.getUser();
    var unread = 0;
    try {
      unread = await NotificationsApi.unreadCount();
    } catch (_) {}
    if (mounted) {
      setState(() {
        _user = user;
        _unread = unread;
      });
    }
  }

  String _field(String key, [String fallback = '—']) {
    final v = _user?[key];
    if (v == null || v.toString().isEmpty) return fallback;
    return v.toString();
  }

  String _nowLabel() {
    final n = DateTime.now();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final h = n.hour > 12 ? n.hour - 12 : (n.hour == 0 ? 12 : n.hour);
    final ampm = n.hour >= 12 ? 'PM' : 'AM';
    final m = n.minute.toString().padLeft(2, '0');
    return '${n.day} ${months[n.month - 1]} ${n.year} · $h:$m $ampm';
  }

  @override
  Widget build(BuildContext context) {
    final code = _field('employeeCode', _field('userCode', '—'));
    final name = _field('name', 'Field user');
    final mobile = _field('phone', _field('mobile', '—'));
    final role = _field('role', 'Employee');
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.surfaceMuted,
      drawer: MrDrawer(user: _user),
      appBar: MrAppBar(
        title: 'Jitox Field',
        onMenuTap: () => _scaffoldKey.currentState?.openDrawer(),
        unreadCount: _unread,
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _loadProfile,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            AppCard(
              padding: EdgeInsets.all(4.w),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.mintHero,
                    child: Text(
                      initial,
                      style: AppTypography.headlineStyle(
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  SizedBox(width: 3.5.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: AppTypography.titleSmStyle(),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          role,
                          style: AppTypography.bodySmStyle(),
                        ),
                        SizedBox(height: 1.h),
                        _MetaChip(icon: Icons.badge_outlined, label: code),
                        SizedBox(height: 0.5.h),
                        _MetaChip(icon: Icons.phone_outlined, label: mobile),
                        SizedBox(height: 0.5.h),
                        _MetaChip(icon: Icons.schedule, label: _nowLabel()),
                      ],
                    ),
                  ),
                  _DayStartButton(
                    active: _dayStarted,
                    onTap: _toggleDay,
                  ),
                ],
              ),
            ),
            SizedBox(height: 2.h),
            Row(
              children: [
                Expanded(
                  child: _ActionChip(
                    label: 'Live Feed',
                    icon: Icons.sensors,
                    onTap: () => Navigator.pushNamed(context, liveFeedScreen),
                  ),
                ),
                SizedBox(width: 2.5.w),
                Expanded(
                  child: _ActionChip(
                    label: 'My Tasks',
                    icon: Icons.task_alt,
                    onTap: () => Navigator.pushNamed(context, taskScreen),
                  ),
                ),
                if (_unread > 0) ...[
                  SizedBox(width: 2.5.w),
                  Expanded(
                    child: _ActionChip(
                      label: 'Alerts ($_unread)',
                      icon: Icons.notifications_active,
                      onTap: () =>
                          Navigator.pushNamed(context, notificationScreen),
                    ),
                  ),
                ],
              ],
            ),
            const SectionTitle(title: 'Quick actions'),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 2.w,
                crossAxisSpacing: 2.w,
                childAspectRatio: 0.88,
              ),
              itemCount: _menuItems.length,
              itemBuilder: (context, index) {
                final item = _menuItems[index];
                return _MenuTile(
                  label: item.label,
                  icon: item.icon,
                  onTap: () {
                    if (item.route != null) {
                      Navigator.pushNamed(context, item.route!);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${item.label} — coming soon'),
                        ),
                      );
                    }
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            label,
            style: AppTypography.captionStyle(),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _DayStartButton extends StatelessWidget {
  const _DayStartButton({required this.active, required this.onTap});

  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppColors.error : AppColors.primary,
      shape: const CircleBorder(),
      elevation: 3,
      shadowColor: AppColors.primary.withValues(alpha: 0.35),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 20.w,
          height: 20.w,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                active ? Icons.stop_circle_outlined : Icons.play_circle_outline,
                color: Colors.white,
                size: 22,
              ),
              const SizedBox(height: 4),
              Text(
                active ? 'END' : 'START',
                style: AppTypography.captionStyle(color: Colors.white).copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.4.h),
      onTap: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: AppColors.primary, size: 18),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              style: AppTypography.bodySmStyle(
                color: AppColors.textPrimary,
                weight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuItem {
  const _MenuItem(this.label, this.icon, this.route);
  final String label;
  final IconData icon;
  final String? route;
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        side: const BorderSide(color: AppColors.border),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 2.w, vertical: 1.2.h),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: EdgeInsets.all(2.w),
                decoration: BoxDecoration(
                  color: AppColors.mintHero,
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: Icon(icon, color: AppColors.primary, size: 22),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.captionStyle(
                  color: AppColors.textPrimary,
                ).copyWith(fontWeight: FontWeight.w600, height: 1.2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
