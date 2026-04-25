import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_theme.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final bool isOutlined;
  final Color? outlineColor;

  const CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    required this.isOutlined,
    this.outlineColor,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor = outlineColor ?? AppColors.textPrimary;
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: isOutlined ? Colors.white : primaryColor,
        foregroundColor: isOutlined ? borderColor : Colors.white,
        disabledBackgroundColor: Colors.grey.shade200,
        disabledForegroundColor: Colors.grey.shade500,
        elevation: 0,
        side: isOutlined
            ? BorderSide(color: borderColor, width: 1)
            : BorderSide.none,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        ),
        padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 1.6.h),
      ),
      onPressed: onPressed,
      child: Text(
        text,
        style: TextStyle(
          color: isOutlined ? borderColor : Colors.white,
          fontSize: 16.sp,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
