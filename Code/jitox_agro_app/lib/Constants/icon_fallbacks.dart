import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';

/// Material icon fallback when PNG assets are missing from the bundle.
IconData iconFallbackForAsset(String path) {
  if (path == Logo.logoIcon) return Icons.eco_rounded;
  if (path == AppIcons.homeIcon) return Icons.home_outlined;
  if (path == AppIcons.orderIcon) return Icons.receipt_long_outlined;
  if (path == AppIcons.chartIcon) return Icons.pie_chart_outline;
  if (path == AppIcons.liUserIcon) return Icons.person_outline;
  if (path == AppIcons.userIcon) return Icons.person_outline;
  if (path == AppIcons.currentLocationIcon) return Icons.my_location;
  if (path == AppIcons.passwordChangedIcon) return Icons.lock_reset;
  if (path == AppIcons.profileAddedIcon) return Icons.check_circle_outline;
  if (path == AppIcons.clockIcon) return Icons.schedule;
  if (path == AppIcons.locationIcon) return Icons.location_on_outlined;
  if (path == AppIcons.phoneIcon) return Icons.phone_outlined;
  if (path == AppIcons.crmIcon) return Icons.hub_outlined;
  if (path == AppIcons.doneIcon) return Icons.check_circle;
  if (path == AppIcons.deleteIcon) return Icons.delete_outline;
  if (path == AppIcons.editIcon) return Icons.edit_outlined;
  if (path == AppIcons.shareIcon) return Icons.share_outlined;
  if (path == AppIcons.calendaeTimeIcon) return Icons.calendar_today_outlined;
  if (path == AppIcons.boxIcon) return Icons.inventory_2_outlined;
  if (path == AppIcons.filterIcon) return Icons.filter_list;
  if (path == AppIcons.timeIcon) return Icons.access_time;
  if (path == AppIcons.doubleTickIcon) return Icons.done_all;
  if (path == AppIcons.truckIcon) return Icons.local_shipping_outlined;
  if (path == Images.threeDAnnouncement) return Icons.campaign_outlined;
  if (path == Images.noNotification) return Icons.notifications_none_outlined;
  if (path == Images.bell) return Icons.notifications_active_outlined;
  return Icons.image_not_supported_outlined;
}
