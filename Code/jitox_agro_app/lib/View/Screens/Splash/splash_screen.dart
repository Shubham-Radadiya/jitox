import 'dart:async';

import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/services/auth_session.dart';
import 'package:jitox_agro_app/utils/app_navigator.dart';
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
        final user = await AuthSession.getUser();
        if (!mounted) return;
        if (AuthSession.isFieldRole(user)) {
          navigateToHome(context);
        } else {
          await AuthSession.clearSession();
          if (!mounted) return;
          navigateToLogin(context);
        }
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
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.mintHero, AppColors.background],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: EdgeInsets.all(5.w),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.eco_rounded,
                  size: 14.h,
                  color: AppColors.primary,
                ),
              ),
              SizedBox(height: 3.h),
              Text(
                'JETOX',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 28.sp,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 2,
                ),
              ),
              SizedBox(height: 0.8.h),
              Text(
                'Agro Industries',
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
              ),
              SizedBox(height: 5.h),
              SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppColors.primary.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
