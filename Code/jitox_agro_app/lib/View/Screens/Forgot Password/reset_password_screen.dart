import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:jitox_agro_app/View/Widgets/textfield.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  bool isFormValidate = false;

  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  void _validateForm() {
    final password = passwordController.text;
    final confirmPassword = confirmPasswordController.text;

    setState(() {
      isFormValidate = password.length >= 6 &&
          confirmPassword.length >= 6 &&
          password == confirmPassword;
    });
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      showRegosterSuccessAlertDialog(context);
    }
  }

  @override
  void initState() {
    super.initState();
    passwordController.addListener(_validateForm);
    confirmPasswordController.addListener(_validateForm);
  }

  @override
  void dispose() {
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
                  "Reset Password?",
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
              Center(
                child: Text(
                  "Please type something you’ll remember",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15.sp,
                  ),
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
                      label: 'New Password',
                      hint: 'Enter New Password',
                      controller: passwordController,
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a password';
                        }
                        if (value.length < 6) {
                          return 'Minimum 6 characters';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 2.h),
                    CustomTextField(
                      label: 'Confirm New Password',
                      hint: 'Enter Confirm Password',
                      controller: confirmPasswordController,
                      obscureText: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please confirm your password';
                        }
                        if (value.length < 6) {
                          return 'Minimum 6 characters';
                        }
                        if (value != passwordController.text) {
                          return 'Passwords do not match';
                        }
                        return null;
                      },
                    ),
                    Spacer(),
                    SizedBox(
                      width: double.infinity,
                      child: CustomButton(
                        isOutlined: !isFormValidate,
                        text: "Update Password",
                        outlineColor: lightFontColor,
                        onPressed: isFormValidate
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

void showRegosterSuccessAlertDialog(BuildContext context) {
  showDialog(
    context: context,
    builder: (context) {
      return AlertDialog(
        backgroundColor: Colors.white,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Container(
                  margin: EdgeInsets.only(right: 8, bottom: 8),
                  child: Material(
                    shape: CircleBorder(),
                    elevation: 6,
                    shadowColor: Colors.black54,
                    color: Colors.white,
                    child: InkWell(
                      customBorder: CircleBorder(),
                      onTap: () => Navigator.of(context).pop(),
                      child: Padding(
                        padding: EdgeInsets.all(1.w),
                        child: Icon(
                          Icons.close,
                          color: Colors.black87,
                          size: 17.sp,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            CustomAssetImage(
              imagePath: AppIcons.passwordChangedIcon,
              width: 20.w,
            ),
            SizedBox(
              height: 2.h,
            ),
            Text(
              'Password changed',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: primaryColor,
                fontSize: 19.sp,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(
              height: 2.h,
            ),
            Text(
              'Your password has been changed successfully.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w300,
              ),
            ),
            SizedBox(
              height: 2.h,
            ),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: false,
                text: "Back to Login",
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(
                      context, authScreen, (route) => false);
                },
              ),
            ),
          ],
        ),
        actions: [],
      );
    },
  );
}
