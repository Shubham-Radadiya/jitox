import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

PreferredSizeWidget customAppBar(String title, BuildContext context) =>
    PreferredSize(
      preferredSize: Size.fromHeight(7.h),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 4.w),
        decoration: const BoxDecoration(
          color: Colors.white,
        ),
        child: SafeArea(
          child: Row(
            children: [
              arrowBackButton(context),
              Expanded(
                child: Center(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 18.sp,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 40),
            ],
          ),
        ),
      ),
    );

/// Consistent back control — single tap target, always calls [Navigator.maybePop].
Widget arrowBackButton(BuildContext context) {
  return Material(
    color: Colors.transparent,
    child: InkWell(
      onTap: () => Navigator.maybePop(context),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 40,
        width: 40,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        alignment: Alignment.center,
        child: Icon(
          Icons.arrow_back_ios_new,
          size: 18,
          color: AppColors.textPrimary,
        ),
      ),
    ),
  );
}
