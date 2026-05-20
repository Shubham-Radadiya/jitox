import 'dart:async';

import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/services/auth_session.dart';
import 'package:jitox_agro_app/utils/app_navigator.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 2400), () async {
      if (!mounted) return;
      final loggedIn = await AuthSession.isLoggedIn();
      if (!mounted) return;
      if (loggedIn) {
        navigateToHome(context);
        return;
      }
      final seenOnboard = await AuthSession.hasSeenOnboard();
      if (!mounted) return;
      if (seenOnboard) {
        navigateToLogin(context);
      } else {
        navigateToOnboard(context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 8.w),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CustomAssetImage(
                  imagePath: Logo.logoIcon,
                  height: 18.h,
                ),
                SizedBox(height: 2.h),
                Text(
                  'JETOX',
                  style: TextStyle(
                    color: primaryColor,
                    fontSize: 26.sp,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
                SizedBox(height: 0.5.h),
                Text(
                  'Agro Industries',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20.sp,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
