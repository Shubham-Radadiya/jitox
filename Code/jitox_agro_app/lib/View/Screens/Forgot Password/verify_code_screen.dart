import 'dart:async';

import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Screens/Auth/otp_verification_screen.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class VerifyCodeScreen extends StatefulWidget {
  const VerifyCodeScreen({super.key});

  @override
  State<VerifyCodeScreen> createState() => _VerifyCodeScreenState();
}

class _VerifyCodeScreenState extends State<VerifyCodeScreen> {
  final TextEditingController otpController = TextEditingController();

  int counter = 30;
  Timer? timer;

  @override
  void initState() {
    super.initState();
    startCounter();
  }

  void startCounter() {
    timer?.cancel(); // just in case
    setState(() {
      counter = 30;
    });

    timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (counter == 0) {
        timer.cancel();
        setState(() {});
      } else {
        setState(() {
          counter--;
        });
      }
    });
  }

  void resendCode() {
    startCounter();
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: customAppBar('', context),
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: 4.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 2.h,
            ),
            Center(
              child: Text(
                "Please type something you’ll remember",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22.sp,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            SizedBox(
              height: 1.h,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                RichText(
                  text: TextSpan(
                    text: 'We’ve sent a verification code to ',
                    style: TextStyle(
                      fontSize: 15.sp,
                      color: Colors.black,
                    ),
                    children: [
                      TextSpan(
                        text: "xyz@gmail.com",
                        style: TextStyle(
                          fontSize: 15.sp,
                          color: Colors.black,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(
              height: 4.h,
            ),
            SizedBox(
              height: 35.h,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CustomOtpField(
                    controller: otpController,
                    onCompleted: (otp) {
                      // verify otp here
                    },
                  ),
                  Spacer(),
                  SizedBox(
                    width: double.infinity,
                    child: CustomButton(
                      isOutlined: false,
                      text: "Verify",
                      onPressed: () {
                        Navigator.pushNamed(context, resetPasswordScreen);
                      },
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: 2.h,
            ),
            if (counter > 0)
              Center(
                child: RichText(
                  text: TextSpan(
                    text: 'Resend code in ',
                    style: TextStyle(
                      fontSize: 16.sp,
                      color: Colors.black,
                    ),
                    children: [
                      TextSpan(
                        text: '00:${counter.toString().padLeft(2, '0')}',
                        style: TextStyle(
                          fontSize: 16.sp,
                          color: Colors.blue,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            if (counter == 0)
              Center(
                child: GestureDetector(
                  onTap: resendCode,
                  child: Text(
                    'Resend',
                    style: TextStyle(
                      fontSize: 16.sp,
                      color: Colors.blue,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
