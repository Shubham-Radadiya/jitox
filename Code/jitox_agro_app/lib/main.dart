import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_theme.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/routes.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ResponsiveSizer(
      builder: (context, orientation, screenType) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(),
          restorationScopeId: null,
          initialRoute: splashScreen,
          onGenerateRoute: AppRoutes.routes,
          builder: (context, child) {
            final mq = MediaQuery.of(context);
            final scale = mq.textScaler.scale(1.0).clamp(0.92, 1.08);
            return MediaQuery(
              data: mq.copyWith(textScaler: TextScaler.linear(scale)),
              child: child ?? const SizedBox.shrink(),
            );
          },
        );
      },
    );
  }
}
