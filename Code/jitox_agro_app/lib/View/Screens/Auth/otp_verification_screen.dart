import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final TextEditingController otpController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: SingleChildScrollView(
        child: Column(
          children: [
            Text(
              "or",
              style: TextStyle(fontWeight: FontWeight.w400),
            ),
            SizedBox(height: 1.h),
            Text(
              "Enter the code here",
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            SizedBox(
              height: 4.h,
            ),
            CustomOtpField(
              controller: otpController,
              onCompleted: (otp) {
                // verify otp here
              },
            ),
            SizedBox(
              height: 10.h,
            ),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: false,
                text: "Submit",
                onPressed: () {
                  Navigator.pushReplacementNamed(
                    context,
                    shareLocationScreen,
                  );
                },
              ),
            ),
            SizedBox(height: 2.h),
            RichText(
              text: TextSpan(
                style: TextStyle(
                  fontSize: 15.sp,
                  color: Colors.black,
                ),
                children: [
                  TextSpan(text: "Haven’t received the code? "),
                  TextSpan(
                    text: 'Resend the code.',
                    style: TextStyle(
                      color: Colors.blue,
                    ),
                    recognizer: TapGestureRecognizer()
                      ..onTap = () {
                        // handle register tap
                      },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CustomOtpField extends StatelessWidget {
  final TextEditingController controller;
  final void Function(String) onCompleted;
  final FocusNode? focusNode;

  const CustomOtpField({
    super.key,
    required this.controller,
    required this.onCompleted,
    this.focusNode,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 5.w),
      child: PinCodeTextField(
        appContext: context,
        length: 4,
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
          borderRadius: BorderRadius.circular(15),
          fieldHeight: 16.w,
          fieldWidth: 16.w,
          borderWidth: 0.3,
          // activeBorderWidth: 0.3,
          // selectedBorderWidth: 0.3,
          activeFillColor: Colors.white,
          inactiveFillColor: Colors.white,
          selectedFillColor: Colors.white,
          activeColor: Colors.grey.withOpacity(0.5),
          inactiveColor: Colors.grey.withOpacity(0.5),
          selectedColor: primaryColor,
          fieldOuterPadding: EdgeInsets.symmetric(horizontal: 0),
        ),
        cursorColor: primaryColor,
        animationDuration: const Duration(milliseconds: 300),
        onCompleted: onCompleted,
        onChanged: (value) {},
      ),
    );
  }
}
