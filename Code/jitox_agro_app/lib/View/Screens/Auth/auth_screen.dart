import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/text_styles.dart';
import 'package:jitox_agro_app/View/Screens/Auth/login_screen.dart';
import 'package:jitox_agro_app/View/Screens/Auth/otp_verification_screen.dart';
import 'package:jitox_agro_app/View/Screens/Auth/register_screen.dart';
import 'package:jitox_agro_app/models/registration_draft.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

enum _AuthPane { register, login, verifyEmail }

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, this.openLogin = false});

  final bool openLogin;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late _AuthPane _pane;
  RegistrationDraft? _registrationDraft;

  @override
  void initState() {
    super.initState();
    _pane = widget.openLogin ? _AuthPane.login : _AuthPane.register;
  }

  int get _progressStep => _pane == _AuthPane.verifyEmail ? 2 : 1;

  void _showRegister() => setState(() {
        _pane = _AuthPane.register;
        _registrationDraft = null;
      });

  void _showLogin() => setState(() {
        _pane = _AuthPane.login;
        _registrationDraft = null;
      });

  void _showOtp(RegistrationDraft draft) => setState(() {
        _registrationDraft = draft;
        _pane = _AuthPane.verifyEmail;
      });

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
                totalSteps: 3,
                currentStep: _progressStep,
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
                            onOtpSent: _showOtp,
                          )
                        : _pane == _AuthPane.login
                            ? LoginScreen(onSwitchToRegister: _showRegister)
                            : _registrationDraft == null
                                ? RegisterScreen(
                                    onSwitchToLogin: _showLogin,
                                    onOtpSent: _showOtp,
                                  )
                                : OtpVerificationScreen(
                                    draft: _registrationDraft!,
                                    onVerified: _showLogin,
                                    onBackToRegister: _showRegister,
                                  ),
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
    String title;
    String message;
    bool showBrand;

    switch (_pane) {
      case _AuthPane.register:
        title = 'Register Account to';
        message = 'Hello there, Register to continue';
        showBrand = true;
        break;
      case _AuthPane.login:
        title = 'Welcome Back to';
        message = 'Hello there, Login to continue';
        showBrand = true;
        break;
      case _AuthPane.verifyEmail:
        title = 'Verify your Email Id';
        message =
            'Enter the 6-digit code we sent to ${_registrationDraft?.email ?? 'your email'}.';
        showBrand = false;
        break;
    }

    return Column(
      children: [
        SizedBox(height: 2.h),
        Text(
          title,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 18.sp,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        if (showBrand) ...[
          Text('Jitox Agro', style: authScreensTitle),
          SizedBox(height: 0.8.h),
        ] else
          SizedBox(height: 1.h),
        Text(
          message,
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
