import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/models/registration_draft.dart';
import 'package:jitox_agro_app/services/auth_api.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({
    super.key,
    required this.draft,
    this.onVerified,
    this.onBackToRegister,
  });

  final RegistrationDraft draft;
  final VoidCallback? onVerified;
  final VoidCallback? onBackToRegister;

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final TextEditingController otpController = TextEditingController();
  bool _loading = false;
  bool _resending = false;
  int _resendSeconds = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  void _startResendTimer() {
    _timer?.cancel();
    setState(() => _resendSeconds = 30);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_resendSeconds <= 0) {
        t.cancel();
        setState(() {});
      } else {
        setState(() => _resendSeconds--);
      }
    });
  }

  Future<void> _resend() async {
    if (_resendSeconds > 0 || _resending) return;
    setState(() => _resending = true);
    try {
      await AuthApi.sendRegistrationOtp(email: widget.draft.email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('A new code was sent to your email.')),
      );
      _startResendTimer();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
        ),
      );
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  Future<void> _submit() async {
    final otp = otpController.text.trim();
    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit code.')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      await AuthApi.verifyOtp(email: widget.draft.email, otp: otp);
      await AuthApi.register(widget.draft.payload);
      if (!mounted) return;
      _showSuccessDialog();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: Colors.white,
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Registration submitted successfully.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: primaryColor,
                  fontSize: 17.sp,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 2.h),
              Text(
                'Your email is verified. An administrator must approve your account before you can log in. You will receive access once approved.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w300,
                ),
              ),
              SizedBox(height: 2.h),
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  isOutlined: false,
                  text: 'Continue',
                  onPressed: () {
                    Navigator.of(dialogContext).pop();
                    widget.onVerified?.call();
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          Text(
            'Code sent to ${widget.draft.email}',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14.sp, color: Colors.black54),
          ),
          SizedBox(height: 1.h),
          Text(
            'Enter the 6-digit code',
            style: TextStyle(fontWeight: FontWeight.w500, fontSize: 16.sp),
          ),
          SizedBox(height: 4.h),
          CustomOtpField(
            controller: otpController,
            length: 6,
            onCompleted: (_) => _submit(),
          ),
          SizedBox(height: 6.h),
          SizedBox(
            width: double.infinity,
            child: CustomButton(
              isOutlined: false,
              text: _loading ? 'Verifying…' : 'Submit',
              onPressed: _loading ? () {} : _submit,
            ),
          ),
          SizedBox(height: 2.h),
          if (_resendSeconds > 0)
            Text(
              'Resend code in 00:${_resendSeconds.toString().padLeft(2, '0')}',
              style: TextStyle(fontSize: 15.sp),
            )
          else
            RichText(
              text: TextSpan(
                style: TextStyle(fontSize: 15.sp, color: Colors.black),
                children: [
                  const TextSpan(text: "Haven't received the code? "),
                  TextSpan(
                    text: _resending ? 'Sending…' : 'Resend the code.',
                    style: const TextStyle(color: Colors.blue),
                    recognizer: TapGestureRecognizer()
                      ..onTap = _resending ? null : _resend,
                  ),
                ],
              ),
            ),
          SizedBox(height: 1.h),
          TextButton(
            onPressed: widget.onBackToRegister,
            child: const Text('Change email / edit registration'),
          ),
          SizedBox(height: 2.h),
        ],
      ),
    );
  }
}

class CustomOtpField extends StatelessWidget {
  final TextEditingController controller;
  final void Function(String) onCompleted;
  final FocusNode? focusNode;
  final int length;

  const CustomOtpField({
    super.key,
    required this.controller,
    required this.onCompleted,
    this.focusNode,
    this.length = 6,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 2.w),
      child: PinCodeTextField(
        appContext: context,
        length: length,
        controller: controller,
        focusNode: focusNode,
        animationType: AnimationType.fade,
        keyboardType: TextInputType.number,
        enableActiveFill: true,
        textStyle: TextStyle(
          fontSize: 18.sp,
          color: Colors.black,
          fontWeight: FontWeight.w500,
        ),
        pinTheme: PinTheme(
          shape: PinCodeFieldShape.box,
          borderRadius: BorderRadius.circular(12),
          fieldHeight: 12.w,
          fieldWidth: 11.w,
          borderWidth: 0.3,
          activeFillColor: Colors.white,
          inactiveFillColor: Colors.white,
          selectedFillColor: Colors.white,
          activeColor: Colors.grey.withOpacity(0.5),
          inactiveColor: Colors.grey.withOpacity(0.5),
          selectedColor: primaryColor,
          fieldOuterPadding: EdgeInsets.zero,
        ),
        cursorColor: primaryColor,
        animationDuration: const Duration(milliseconds: 300),
        onCompleted: onCompleted,
        onChanged: (_) {},
      ),
    );
  }
}
