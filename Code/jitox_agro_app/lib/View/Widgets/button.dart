import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_theme.dart';
import 'package:jitox_agro_app/Constants/app_typography.dart';
import 'package:jitox_agro_app/Constants/colors.dart';

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
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      ),
      onPressed: onPressed,
      child: Text(
        text,
        style: AppTypography.buttonStyle(
          color: isOutlined ? borderColor : Colors.white,
        ),
      ),
    );
  }
}
