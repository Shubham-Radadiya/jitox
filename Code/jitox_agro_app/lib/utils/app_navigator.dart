import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';

/// Replace entire stack so back does not return to splash / leave / etc.
void navigateToLogin(BuildContext context) {
  Navigator.of(context).pushNamedAndRemoveUntil(
    authScreen,
    (route) => false,
    arguments: {'login': true},
  );
}

void navigateToHome(BuildContext context) {
  Navigator.of(context).pushNamedAndRemoveUntil(
    tabScreen,
    (route) => false,
  );
}

void navigateToOnboard(BuildContext context) {
  Navigator.of(context).pushNamedAndRemoveUntil(
    onboardScreen,
    (route) => false,
  );
}
