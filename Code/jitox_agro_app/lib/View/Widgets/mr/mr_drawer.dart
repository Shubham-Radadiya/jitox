import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/services/auth_session.dart';
import 'package:jitox_agro_app/utils/app_navigator.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class MrDrawer extends StatelessWidget {
  const MrDrawer({
    super.key,
    this.userCode = 'KANT-10',
    this.userName = 'Mr. Mayurkumar B. Shilu',
    this.userRole = 'Marketing Officer',
  });

  final String userCode;
  final String userName;
  final String userRole;

  @override
  Widget build(BuildContext context) {
    final items = <_DrawerItem>[
      _DrawerItem(Icons.home_outlined, 'Home', () {
        Navigator.pop(context);
        Navigator.pushNamedAndRemoveUntil(context, tabScreen, (r) => false);
      }),
      _DrawerItem(Icons.flight_outlined, 'My Tour', () => Navigator.pop(context)),
      _DrawerItem(Icons.inventory_2_outlined, 'Product List', () => Navigator.pop(context)),
      _DrawerItem(Icons.download_outlined, 'Document Download', () => Navigator.pop(context)),
      _DrawerItem(Icons.factory_outlined, 'Company Profile', () => Navigator.pop(context)),
      _DrawerItem(Icons.translate, 'Language', () {
        Navigator.pop(context);
        Navigator.pushNamed(context, languageScreen);
      }),
      _DrawerItem(Icons.play_circle_outline, 'Help(Tutorial)', () => Navigator.pop(context)),
      _DrawerItem(Icons.lock_outline, 'Change mPin', () => Navigator.pop(context)),
      _DrawerItem(Icons.person_outline, 'My Profile', () {
        Navigator.pop(context);
        Navigator.pushNamed(context, profileInfoScreen);
      }),
      _DrawerItem(Icons.vpn_key_outlined, 'Change Password', () => Navigator.pop(context)),
      _DrawerItem(Icons.logout, 'Logout', () async {
        Navigator.pop(context);
        await AuthSession.clearSession();
        if (!context.mounted) return;
        navigateToLogin(context);
      }),
    ];

    return Drawer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            color: const Color(0xFFF5F5F5),
            padding: EdgeInsets.fromLTRB(4.w, 5.h, 4.w, 2.h),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: primaryColor.withOpacity(0.15),
                  child: Icon(Icons.person, color: primaryColor, size: 32.sp),
                ),
                SizedBox(height: 1.5.h),
                Text(
                  'Code : $userCode',
                  style: TextStyle(fontSize: 12.sp, color: AppColors.textSecondary),
                ),
                SizedBox(height: 0.5.h),
                Text(
                  'Name : $userName($userRole)',
                  style: TextStyle(
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 1.5.h),
                Row(
                  children: [
                    Expanded(
                      child: _ShareBtn(
                        label: 'Share V Card',
                        onTap: () => Navigator.pop(context),
                      ),
                    ),
                    SizedBox(width: 2.w),
                    Expanded(
                      child: _ShareBtn(
                        label: 'Share I-Card',
                        onTap: () => Navigator.pop(context),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.zero,
              itemCount: items.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade300),
              itemBuilder: (context, i) {
                final item = items[i];
                return ListTile(
                  dense: true,
                  leading: Icon(item.icon, color: AppColors.textPrimary, size: 22.sp),
                  title: Text(
                    item.label,
                    style: TextStyle(fontSize: 14.sp, color: AppColors.textPrimary),
                  ),
                  onTap: item.onTap,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _DrawerItem {
  const _DrawerItem(this.icon, this.label, this.onTap);
  final IconData icon;
  final String label;
  final VoidCallback onTap;
}

class _ShareBtn extends StatelessWidget {
  const _ShareBtn({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: primaryColor,
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 1.h),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 11.sp,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
