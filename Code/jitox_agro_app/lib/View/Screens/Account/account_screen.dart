import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_theme.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/services/auth_session.dart';
import 'package:jitox_agro_app/utils/app_navigator.dart';
import 'package:jitox_agro_app/View/Widgets/ui/app_card.dart';
import 'package:jitox_agro_app/View/Widgets/ui/section_title.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final user = await AuthSession.getUser();
    if (mounted) setState(() => _user = user);
  }

  String _field(String key, [String fallback = '—']) {
    final v = _user?[key];
    if (v == null || v.toString().isEmpty) return fallback;
    return v.toString();
  }

  @override
  Widget build(BuildContext context) {
    final name = _field('name', 'User');
    final email = _field('email');
    final phone = _field('phone', _field('mobile'));
    final role = _field('role', 'Employee');
    final code = _field('employeeCode', _field('userCode', '—'));

    return Scaffold(
      backgroundColor: AppColors.surfaceMuted,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: _load,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.fromLTRB(4.w, 2.h, 4.w, 4.h),
            children: [
              Text(
                'Account',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontSize: 24.sp,
                    ),
              ),
              SizedBox(height: 2.h),
              AppCard(
                padding: EdgeInsets.all(4.w),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: AppColors.mintHero,
                      child: Text(
                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                        style: TextStyle(
                          fontSize: 24.sp,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    SizedBox(width: 4.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: TextStyle(
                              fontSize: 17.sp,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          SizedBox(height: 0.3.h),
                          Text(
                            role,
                            style: TextStyle(
                              fontSize: 13.sp,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 2.h),
              _InfoTile(label: 'Employee code', value: code),
              _InfoTile(label: 'Email', value: email),
              _InfoTile(label: 'Mobile', value: phone),
              const SectionTitle(title: 'Settings'),
              _ActionTile(
                icon: Icons.person_outline,
                label: 'Edit profile',
                onTap: () => Navigator.pushNamed(context, profileInfoScreen),
              ),
              _ActionTile(
                icon: Icons.task_alt_outlined,
                label: 'My tasks',
                onTap: () => Navigator.pushNamed(context, taskScreen),
              ),
              _ActionTile(
                icon: Icons.notifications_outlined,
                label: 'Notifications',
                onTap: () => Navigator.pushNamed(context, notificationScreen),
              ),
              SizedBox(height: 2.h),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await AuthSession.clearSession();
                    if (!context.mounted) return;
                    navigateToLogin(context);
                  },
                  icon: const Icon(Icons.logout, size: 20),
                  label: const Text('Sign out'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                    padding: EdgeInsets.symmetric(vertical: 1.4.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: EdgeInsets.only(bottom: 1.h),
      padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.4.h),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(fontSize: 13.sp, color: AppColors.textSecondary),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(fontSize: 13.5.sp, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: EdgeInsets.only(bottom: 1.h),
      padding: EdgeInsets.zero,
      onTap: onTap,
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.mintHero,
            borderRadius: BorderRadius.circular(AppTheme.radiusSm),
          ),
          child: Icon(icon, color: AppColors.primary, size: 22),
        ),
        title: Text(label, style: TextStyle(fontSize: 14.5.sp, fontWeight: FontWeight.w500)),
        trailing: Icon(Icons.chevron_right, color: AppColors.textSecondary, size: 22),
      ),
    );
  }
}
