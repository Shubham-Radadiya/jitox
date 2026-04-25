import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:jitox_agro_app/View/Widgets/textfield.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.onSwitchToRegister});

  final VoidCallback? onSwitchToRegister;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  late FocusNode userNameFocus;
  late FocusNode emailFocus;
  late FocusNode passwordFocus;

  final userNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  bool isFormValid = false;

  void _submit() {
    if (_formKey.currentState!.validate()) {
      // Perform login action here
    }
  }

  void _validateForm() {
    bool isValid = false;
    if (userNameController.text.isNotEmpty &&
        emailController.text.isNotEmpty &&
        passwordController.text.length >= 6) {
      isValid = _formKey.currentState?.validate() ?? false;
    }

    setState(() {
      isFormValid = isValid;
    });
  }

  @override
  void initState() {
    super.initState();
    userNameFocus = FocusNode()..addListener(_validateForm);
    emailFocus = FocusNode()..addListener(_validateForm);
    passwordFocus = FocusNode()..addListener(_validateForm);
  }

  @override
  void dispose() {
    userNameFocus.dispose();
    emailFocus.dispose();
    passwordFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 4.w),
        child: Column(
          children: [
            SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    SizedBox(height: 1.h),
                    CustomTextField(
                      label: 'User Name',
                      hint: 'Enter User Name',
                      controller: userNameController,
                      focusNode: userNameFocus,
                      validator: (value) =>
                          value!.isEmpty ? 'User name is required' : null,
                    ),
                    SizedBox(height: 2.h),
                    CustomTextField(
                      label: 'Email Address',
                      hint: 'Enter Your Email Id',
                      controller: emailController,
                      focusNode: emailFocus,
                      validator: (value) {
                        if (value!.isEmpty) return 'Email is required';
                        if (!value.contains('@')) return 'Invalid email';
                        return null;
                      },
                    ),
                    SizedBox(height: 2.h),
                    CustomTextField(
                      label: 'Password*',
                      hint: 'Enter Password',
                      controller: passwordController,
                      focusNode: passwordFocus,
                      obscureText: true,
                      validator: (value) =>
                          value!.length < 6 ? 'Minimum 6 characters' : null,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.pushNamed(
                            context,
                            forgotPassword,
                          ),
                          child: Text(
                            "Forget Password?",
                            style: TextStyle(
                              fontSize: 15.sp,
                              color: Colors.blue,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            Spacer(),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: !isFormValid,
                text: "Login",
                outlineColor: lightFontColor,
                onPressed: isFormValid ? _submit : () {},
              ),
            ),
            SizedBox(height: 2.h),
            Padding(
              padding: EdgeInsets.only(bottom: 2.h),
              child: RichText(
                text: TextSpan(
                  style: TextStyle(
                    fontSize: 15.sp,
                    color: Colors.black,
                  ),
                  children: [
                    TextSpan(text: "Don't have an account? "),
                    TextSpan(
                      text: 'Register',
                      style: TextStyle(
                        color: Colors.blue,
                        decoration: TextDecoration.underline,
                      ),
                      recognizer: TapGestureRecognizer()
                        ..onTap = () => widget.onSwitchToRegister?.call(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
