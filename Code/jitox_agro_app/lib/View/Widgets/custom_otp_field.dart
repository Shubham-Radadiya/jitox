import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

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
