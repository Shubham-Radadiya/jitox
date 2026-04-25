import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:jitox_agro_app/View/Widgets/textfield.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class ForgotPassword extends StatefulWidget {
  const ForgotPassword({super.key});

  @override
  State<ForgotPassword> createState() => _ForgotPasswordState();
}

class _ForgotPasswordState extends State<ForgotPassword> {
  final _formKey = GlobalKey<FormState>();
  FocusNode? emailFocus;
  final emailController = TextEditingController();
  bool isFormValid = false;

  void _validateForm() {
    setState(() {
      isFormValid = _formKey.currentState?.validate() ?? false;
    });
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      // Perform login action here
    }
  }

  @override
  void initState() {
    super.initState();
    emailFocus = FocusNode()..addListener(_validateForm);
    emailController.addListener(_validateForm);
  }

  @override
  void dispose() {
    emailFocus!.dispose();
    emailController.removeListener(_validateForm);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: customAppBar('', context),
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: 4.w),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 2.h,
              ),
              Center(
                child: Text(
                  "Forgot Password?",
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
              Text(
                "Don’t worry! It happens. Please enter the email associated with your account.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15.sp,
                ),
              ),
              SizedBox(
                height: 4.h,
              ),
              SizedBox(
                height: 35.h,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CustomTextField(
                      label: 'Email Address',
                      hint: 'Enter Your Email Id',
                      controller: emailController,
                      focusNode: emailFocus,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Email is required';
                        }
                        if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                            .hasMatch(value)) {
                          return 'Enter a valid email';
                        }
                        return null;
                      },
                    ),
                    Spacer(),
                    SizedBox(
                      width: double.infinity,
                      child: CustomButton(
                        isOutlined: !isFormValid,
                        text: "Send Code",
                        outlineColor: lightFontColor,
                        onPressed: isFormValid
                            ? () {
                                _submit();
                              }
                            : () {},
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
