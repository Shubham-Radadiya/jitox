import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class OnboardScreen extends StatelessWidget {
  const OnboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 6.w),
          child: Column(
            children: [
              SizedBox(height: 8.h),
              _SparkleIllustration(),
              const Spacer(flex: 2),
              Text(
                'Explore the app',
                style: TextStyle(
                  fontSize: 20.sp,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 1.2.h),
              Text(
                'Empowering farmers with innovative agro solutions.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15.sp,
                  height: 1.45,
                  color: AppColors.textSecondary,
                ),
              ),
              const Spacer(flex: 3),
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  isOutlined: true,
                  text: 'Create account',
                  onPressed: () {
                    Navigator.pushNamed(context, authScreen);
                  },
                ),
              ),
              SizedBox(height: 2.h),
              TextButton(
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    authScreen,
                    arguments: {'login': true},
                  );
                },
                child: Text(
                  'Already have an account? Login',
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: AppColors.link,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              SizedBox(height: 3.h),
            ],
          ),
        ),
      ),
    );
  }
}

class _SparkleIllustration extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 22.h,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(
            Icons.auto_awesome_rounded,
            size: 28.w,
            color: AppColors.primary.withOpacity(0.12),
          ),
          Positioned(
            right: 18.w,
            top: 2.h,
            child: Icon(
              Icons.star_rounded,
              size: 8.w,
              color: AppColors.textSecondary.withOpacity(0.35),
            ),
          ),
          Positioned(
            left: 16.w,
            bottom: 4.h,
            child: Icon(
              Icons.star_rounded,
              size: 6.w,
              color: AppColors.textSecondary.withOpacity(0.28),
            ),
          ),
        ],
      ),
    );
  }
}
