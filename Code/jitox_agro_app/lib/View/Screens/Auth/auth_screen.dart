import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/text_styles.dart';
import 'package:jitox_agro_app/View/Screens/Auth/login_screen.dart';
import 'package:jitox_agro_app/View/Screens/Auth/register_screen.dart';
import 'package:jitox_agro_app/services/live_api.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

enum _AuthPane { register, login }

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, this.openLogin = false});

  final bool openLogin;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late _AuthPane _pane;

  @override
  void initState() {
    super.initState();
    _pane = widget.openLogin ? _AuthPane.login : _AuthPane.register;
    warmLiveServer();
  }

  void _showRegister() => setState(() => _pane = _AuthPane.register);

  void _showLogin() => setState(() => _pane = _AuthPane.login);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceMuted,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 4.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(height: 1.h),
              StepProgressIndicator(
                totalSteps: 2,
                currentStep: _pane == _AuthPane.register ? 1 : 2,
              ),
              _buildHeader(),
              Expanded(
                child: Card(
                  elevation: 0,
                  margin: EdgeInsets.only(bottom: 2.h),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: AppColors.border),
                  ),
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(4.w, 2.h, 4.w, 0),
                    child: _pane == _AuthPane.register
                        ? RegisterScreen(
                            onSwitchToLogin: _showLogin,
                            onRegistered: _showLogin,
                          )
                        : LoginScreen(onSwitchToRegister: _showRegister),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final isRegister = _pane == _AuthPane.register;
    return Column(
      children: [
        SizedBox(height: 2.h),
        Text(
          isRegister ? 'Register Account to' : 'Welcome Back to',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 18.sp,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        Text('Jitox Agro', style: authScreensTitle),
        SizedBox(height: 0.8.h),
        Text(
          isRegister
              ? 'Hello there, Register to continue'
              : 'Hello there, Login to continue',
          textAlign: TextAlign.center,
          style: authScreenMessage,
        ),
        SizedBox(height: 1.h),
      ],
    );
  }
}

class StepProgressIndicator extends StatelessWidget {
  final int totalSteps;
  final int currentStep;

  const StepProgressIndicator({
    super.key,
    required this.totalSteps,
    required this.currentStep,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 4.h,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(totalSteps * 2 - 1, (index) {
          if (index.isEven) {
            final dotIndex = index ~/ 2;
            final filled = dotIndex + 1 <= currentStep;
            return Container(
              width: 1.6.h,
              height: 1.6.h,
              decoration: BoxDecoration(
                color: filled ? AppColors.primary : Colors.white,
                border: Border.all(
                  color: AppColors.primary,
                  width: filled ? 0 : 1.2,
                ),
                shape: BoxShape.circle,
              ),
            );
          }
          return Padding(
            padding: EdgeInsets.symmetric(horizontal: 1.2.w),
            child: Container(
              width: 3.5.h,
              height: 0.12.h,
              constraints: const BoxConstraints(minHeight: 2, minWidth: 16),
              color: AppColors.primary.withOpacity(0.35),
            ),
          );
        }),
      ),
    );
  }
}
