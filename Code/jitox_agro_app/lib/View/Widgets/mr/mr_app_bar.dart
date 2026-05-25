import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_typography.dart';
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
    this.unreadCount = 0,
  });

  final String title;
  final bool showMenu;
  final VoidCallback? onMenuTap;
  final bool showBack;
  final String? subtitle;
  final Widget? trailing;
  final int unreadCount;

  @override
  Size get preferredSize => Size.fromHeight(subtitle != null ? 11.h : 56);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.primaryDark],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: subtitle != null ? null : 56,
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 2.w),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  height: 48,
                  child: Row(
                    children: [
                      if (showBack)
                        _HeaderIcon(
                          icon: Icons.arrow_back,
                          onTap: () => Navigator.maybePop(context),
                        )
                      else if (showMenu)
                        _HeaderIcon(
                          icon: Icons.menu,
                          onTap: onMenuTap,
                        )
                      else
                        const SizedBox(width: 48),
                      Expanded(
                        child: Text(
                          title,
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.titleSmStyle(
                            color: Colors.white,
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
                                badge: unreadCount > 0 ? unreadCount : null,
                                onTap: () => Navigator.pushNamed(
                                  context,
                                  notificationScreen,
                                ),
                              ),
                            ],
                          ),
                    ],
                  ),
                ),
                if (subtitle != null) ...[
                  Padding(
                    padding: EdgeInsets.only(bottom: 0.6.h),
                    child: Text(
                      subtitle!,
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySmStyle(
                        color: Colors.white.withValues(alpha: 0.92),
                        weight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HeaderIcon extends StatelessWidget {
  const _HeaderIcon({
    required this.icon,
    required this.onTap,
    this.badge,
  });

  final IconData icon;
  final VoidCallback? onTap;
  final int? badge;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          icon: Icon(icon, color: Colors.white, size: 22.sp),
          onPressed: onTap,
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
        ),
        if (badge != null)
          Positioned(
            right: 6,
            top: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                badge! > 9 ? '9+' : '$badge',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 9.sp,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
