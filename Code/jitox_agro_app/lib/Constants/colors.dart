import 'package:flutter/material.dart';

/// Primary brand green (matches web dashboard / mockups).
const Color primaryColor = Color(0xFF0A9242);

/// Legacy alias used across existing screens.
Color lightFontColor = const Color(0xFF242424).withOpacity(0.5);

abstract final class AppColors {
  static const Color primary = Color(0xFF0A9242);
  static const Color primaryDark = Color(0xFF087038);
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFF8FAF9);
  static const Color mintHero = Color(0xFFE8F5E9);
  static const Color mintHeroEnd = Color(0xFFF1F8F4);
  static const Color border = Color(0xFFE5E7EB);
  static const Color textPrimary = Color(0xFF242424);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color link = Color(0xFF2563EB);
  static const Color error = Color(0xFFE5463E);
  static const Color bottomNavBg = Color(0xFFFFFFFF);
  static const Color pendingBadge = Color(0xFFFEF2F2);
  static const Color pendingText = Color(0xFFB91C1C);
  static const Color progressBadge = Color(0xFFFFF7ED);
  static const Color progressText = Color(0xFFC2410C);
}
