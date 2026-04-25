import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Screens/Auth/auth_screen.dart';
import 'package:jitox_agro_app/View/Screens/Auth/share_location_screen.dart';
import 'package:jitox_agro_app/View/Screens/Auth/turnon_notification_screen.dart';
import 'package:jitox_agro_app/View/Screens/Forgot%20Password/forgot_password.dart';
import 'package:jitox_agro_app/View/Screens/Forgot%20Password/reset_password_screen.dart';
import 'package:jitox_agro_app/View/Screens/Forgot%20Password/verify_code_screen.dart';
import 'package:jitox_agro_app/View/Screens/Leave/leave_request_screen.dart';
import 'package:jitox_agro_app/View/Screens/Notification/notification_screen.dart';
import 'package:jitox_agro_app/View/Screens/Order/order_detail_screen.dart';
import 'package:jitox_agro_app/View/Screens/Payment/payment_partial_screen.dart';
import 'package:jitox_agro_app/View/Screens/Payment/payment_receipt_screen.dart';
import 'package:jitox_agro_app/View/Screens/Payment/payment_screen.dart';
import 'package:jitox_agro_app/View/Screens/Profile/profile_info_screen.dart';
import 'package:jitox_agro_app/View/Screens/Splash/onboard_screen.dart';
import 'package:jitox_agro_app/View/Screens/Splash/splash_screen.dart';
import 'package:jitox_agro_app/View/Screens/Tab/tab_screen.dart';
import 'package:jitox_agro_app/View/Screens/Tasks/add_task_screen.dart';
import 'package:jitox_agro_app/View/Screens/Tasks/task_details_screen.dart';
import 'package:jitox_agro_app/View/Screens/Tasks/task_screen.dart';

class AppRoutes {
  static Route? routes(RouteSettings settings) {
    switch (settings.name) {
      case splashScreen:
        return MaterialPageRoute(builder: (_) {
          return SplashScreen();
        });

      case onboardScreen:
        return MaterialPageRoute(builder: (_) {
          return OnboardScreen();
        });

      case authScreen:
        final authArgs = settings.arguments as Map<String, dynamic>?;
        final startLogin = authArgs?['login'] == true;
        return MaterialPageRoute(builder: (_) {
          return AuthScreen(openLogin: startLogin);
        });

      case shareLocationScreen:
        return MaterialPageRoute(builder: (_) {
          return ShareLocationScreen();
        });

      case turnOnNotificationScreen:
        return MaterialPageRoute(builder: (_) {
          return TurnOnNotification();
        });

      case forgotPassword:
        return MaterialPageRoute(builder: (_) {
          return ForgotPassword();
        });

      case verifyCodeScreen:
        return MaterialPageRoute(builder: (_) {
          return VerifyCodeScreen();
        });

      case resetPasswordScreen:
        return MaterialPageRoute(builder: (_) {
          return ResetPasswordScreen();
        });

      case profileInfoScreen:
        return MaterialPageRoute(builder: (_) {
          return ProfileInfoScreen();
        });

      case tabScreen:
        return MaterialPageRoute(builder: (_) {
          return TabScreen();
        });

      case taskScreen:
        return MaterialPageRoute(builder: (_) {
          return TaskScreen();
        });

      case taskDetailsScreen:
        return MaterialPageRoute(builder: (_) {
          return TaskDetailPage();
        });

      case notificationScreen:
        return MaterialPageRoute(builder: (_) {
          return NotificationsScreen();
        });

      case addTaskScreen:
        return MaterialPageRoute(builder: (_) {
          return AddTaskScreen();
        });

      case orderDetailPage:
        return MaterialPageRoute(builder: (_) {
          return OrderDetailScreen();
        });

      case paymentScreen:
        return MaterialPageRoute(builder: (_) {
          return const PaymentScreen();
        });

      case paymentPartialScreen:
        return MaterialPageRoute(builder: (_) {
          return const PaymentPartialScreen();
        });

      case paymentReceiptScreen:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) {
            return const PaymentReceiptScreen();
          },
        );

      case leaveRequestPage:
        return MaterialPageRoute(builder: (_) {
          return LeaveRequestScreen();
        });
      default:
        return MaterialPageRoute(builder: (_) => SplashScreen());
    }
  }
}
