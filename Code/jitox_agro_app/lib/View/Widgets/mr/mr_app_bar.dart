import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

/// Green header bar matching MR Employee Tracker reference UI.
class MrAppBar extends StatelessWidget implements PreferredSizeWidget {
  const MrAppBar({
    super.key,
    required this.title,
    this.showMenu = true,
    this.onMenuTap,
    this.showBack = false,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final bool showMenu;
  final VoidCallback? onMenuTap;
  final bool showBack;
  final String? subtitle;
  final Widget? trailing;

  @override
  Size get preferredSize => Size.fromHeight(subtitle != null ? 11.h : 7.h);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: primaryColor,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 0.8.h),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  if (showBack)
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.maybePop(context),
                    )
                  else if (showMenu)
                    IconButton(
                      icon: const Icon(Icons.menu, color: Colors.white),
                      onPressed: onMenuTap,
                    )
                  else
                    SizedBox(width: 48),
                  Expanded(
                    child: Text(
                      title,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  trailing ??
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _HeaderIcon(
                            icon: Icons.home_outlined,
                            onTap: () => Navigator.pushNamedAndRemoveUntil(
                              context,
                              tabScreen,
                              (r) => false,
                            ),
                          ),
                          _HeaderIcon(
                            icon: Icons.notifications_none,
                            onTap: () => Navigator.pushNamed(
                              context,
                              notificationScreen,
                            ),
                          ),
                          _HeaderIcon(
                            icon: Icons.history,
                            onTap: () {},
                          ),
                        ],
                      ),
                ],
              ),
              if (subtitle != null) ...[
                SizedBox(height: 0.3.h),
                Text(
                  subtitle!,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _HeaderIcon extends StatelessWidget {
  const _HeaderIcon({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(icon, color: Colors.white, size: 22.sp),
      onPressed: onTap,
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
    );
  }
}
