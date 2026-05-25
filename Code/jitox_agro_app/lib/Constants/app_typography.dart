import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';

/// Fixed type scale for consistent sizing across all field-app screens.
abstract final class AppTypography {
  static const String fontFamily = 'Roboto';

  static const double caption = 11;
  static const double bodySm = 12;
  static const double body = 14;
  static const double bodyLg = 15;
  static const double titleSm = 16;
  static const double title = 17;
  static const double titleLg = 18;
  static const double headline = 20;

  static TextStyle captionStyle({Color? color}) => TextStyle(
        fontFamily: fontFamily,
        fontSize: caption,
        fontWeight: FontWeight.w500,
        height: 1.35,
        color: color ?? AppColors.textSecondary,
      );

  static TextStyle bodySmStyle({Color? color, FontWeight? weight}) =>
      TextStyle(
        fontFamily: fontFamily,
        fontSize: bodySm,
        fontWeight: weight ?? FontWeight.w400,
        height: 1.4,
        color: color ?? AppColors.textSecondary,
      );

  static TextStyle bodyStyle({Color? color, FontWeight? weight}) => TextStyle(
        fontFamily: fontFamily,
        fontSize: body,
        fontWeight: weight ?? FontWeight.w400,
        height: 1.4,
        color: color ?? AppColors.textPrimary,
      );

  static TextStyle bodyLgStyle({Color? color, FontWeight? weight}) =>
      TextStyle(
        fontFamily: fontFamily,
        fontSize: bodyLg,
        fontWeight: weight ?? FontWeight.w500,
        height: 1.35,
        color: color ?? AppColors.textPrimary,
      );

  static TextStyle titleSmStyle({Color? color}) => TextStyle(
        fontFamily: fontFamily,
        fontSize: titleSm,
        fontWeight: FontWeight.w600,
        height: 1.3,
        letterSpacing: -0.2,
        color: color ?? AppColors.textPrimary,
      );

  static TextStyle titleStyle({Color? color}) => TextStyle(
        fontFamily: fontFamily,
        fontSize: title,
        fontWeight: FontWeight.w600,
        height: 1.25,
        letterSpacing: -0.25,
        color: color ?? AppColors.textPrimary,
      );

  static TextStyle titleLgStyle({Color? color}) => TextStyle(
        fontFamily: fontFamily,
        fontSize: titleLg,
        fontWeight: FontWeight.w700,
        height: 1.25,
        letterSpacing: -0.28,
        color: color ?? AppColors.textPrimary,
      );

  static TextStyle headlineStyle({Color? color}) => TextStyle(
        fontFamily: fontFamily,
        fontSize: headline,
        fontWeight: FontWeight.w700,
        height: 1.25,
        letterSpacing: -0.3,
        color: color ?? AppColors.textPrimary,
      );

  static TextStyle buttonStyle({Color? color}) => TextStyle(
        fontFamily: fontFamily,
        fontSize: bodyLg,
        fontWeight: FontWeight.w600,
        height: 1.2,
        color: color ?? Colors.white,
      );

  static TextTheme materialTextTheme() => TextTheme(
        displaySmall: headlineStyle(),
        headlineSmall: titleLgStyle(),
        titleLarge: titleStyle(),
        titleMedium: titleSmStyle(),
        titleSmall: bodyLgStyle(weight: FontWeight.w600),
        bodyLarge: bodyLgStyle(),
        bodyMedium: bodyStyle(),
        bodySmall: bodySmStyle(),
        labelLarge: bodyLgStyle(weight: FontWeight.w600),
        labelMedium: bodyStyle(weight: FontWeight.w500),
        labelSmall: captionStyle(),
      );
}
