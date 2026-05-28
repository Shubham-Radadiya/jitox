import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:jitox_agro_app/Constants/app_typography.dart';
import 'package:jitox_agro_app/Constants/colors.dart';

/// Why location access failed (for UI messaging).
enum LocationAccessIssue {
  none,
  serviceDisabled,
  denied,
  deniedForever,
}

class LocationAccessResult {
  const LocationAccessResult({
    required this.granted,
    this.issue = LocationAccessIssue.none,
  });

  final bool granted;
  final LocationAccessIssue issue;
}

/// Explains why we need location, then runs the system permission prompt.
Future<LocationAccessResult> ensureLocationAccess({
  bool requestIfNeeded = true,
}) async {
  if (!await Geolocator.isLocationServiceEnabled()) {
    return const LocationAccessResult(
      granted: false,
      issue: LocationAccessIssue.serviceDisabled,
    );
  }

  var perm = await Geolocator.checkPermission();
  if (perm == LocationPermission.denied && requestIfNeeded) {
    perm = await Geolocator.requestPermission();
  }

  if (perm == LocationPermission.always ||
      perm == LocationPermission.whileInUse) {
    return const LocationAccessResult(granted: true);
  }

  if (perm == LocationPermission.deniedForever) {
    return const LocationAccessResult(
      granted: false,
      issue: LocationAccessIssue.deniedForever,
    );
  }

  return const LocationAccessResult(
    granted: false,
    issue: LocationAccessIssue.denied,
  );
}

/// Rationale dialog before the OS permission sheet (Android / iOS).
Future<bool> showLocationRationaleDialog(BuildContext context) async {
  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text('Allow location access', style: AppTypography.titleSmStyle()),
      content: Text(
        'Jitox Agro needs your location while your field day is active so '
        'your admin can see your route on the live map.\n\n'
        'On the next screen, tap Allow or While using the app.',
        style: AppTypography.bodySmStyle(),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Not now'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
          ),
          onPressed: () => Navigator.of(ctx).pop(true),
          child: const Text('Continue'),
        ),
      ],
    ),
  );
  return result == true;
}

Future<void> showLocationIssueDialog(
  BuildContext context,
  LocationAccessIssue issue,
) async {
  if (!context.mounted || issue == LocationAccessIssue.none) return;

  late final String title;
  late final String message;
  late final String primaryLabel;
  Future<void> Function() onPrimary;

  switch (issue) {
    case LocationAccessIssue.serviceDisabled:
      title = 'Turn on location';
      message =
          'GPS is turned off on this device. Enable location services, then try Day Start again.';
      primaryLabel = 'Open location settings';
      onPrimary = () => Geolocator.openLocationSettings();
    case LocationAccessIssue.deniedForever:
      title = 'Location permission blocked';
      message =
          'Location was denied permanently. Open app settings and allow Location for Jitox Agro.';
      primaryLabel = 'Open app settings';
      onPrimary = () => Geolocator.openAppSettings();
    case LocationAccessIssue.denied:
      title = 'Location permission required';
      message =
          'Field tracking needs location access. Tap Try again and choose Allow on the system prompt.';
      primaryLabel = 'Try again';
      onPrimary = () => Geolocator.requestPermission();
    case LocationAccessIssue.none:
      return;
  }

  await showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(title, style: AppTypography.titleSmStyle()),
      content: Text(message, style: AppTypography.bodySmStyle()),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
          ),
          onPressed: () async {
            Navigator.of(ctx).pop();
            await onPrimary();
          },
          child: Text(primaryLabel),
        ),
      ],
    ),
  );
}

/// Full flow: rationale → system prompt → settings dialog if still blocked.
Future<LocationAccessResult> prepareLocationForTracking(
  BuildContext context,
) async {
  var access = await ensureLocationAccess(requestIfNeeded: false);
  if (access.granted) return access;

  if (access.issue == LocationAccessIssue.serviceDisabled) {
    if (!context.mounted) return access;
    await showLocationIssueDialog(context, access.issue);
    return ensureLocationAccess();
  }

  if (!context.mounted) return access;
  final agreed = await showLocationRationaleDialog(context);
  if (!agreed) {
    return const LocationAccessResult(
      granted: false,
      issue: LocationAccessIssue.denied,
    );
  }

  access = await ensureLocationAccess();
  if (access.granted) return access;

  if (!context.mounted) return access;
  await showLocationIssueDialog(context, access.issue);

  if (access.issue == LocationAccessIssue.denied) {
    return ensureLocationAccess();
  }

  return access;
}
