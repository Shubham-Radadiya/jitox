import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/services/auth_api.dart';
import 'package:jitox_agro_app/services/auth_session.dart';
import 'package:jitox_agro_app/utils/app_navigator.dart';
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
  final emailFocus = FocusNode();
  final passwordFocus = FocusNode();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  bool _loading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final data = await AuthApi.login(
        email: emailController.text,
        password: passwordController.text,
      );
      final token = data['token']?.toString() ?? '';
      final rawUser = data['user'];
      final userMap =
          rawUser is Map ? Map<String, dynamic>.from(rawUser) : null;
      if (userMap != null && !AuthSession.isFieldRole(userMap)) {
        throw Exception(
          'Admin and Manager accounts must sign in on the web dashboard.',
        );
      }
      await AuthSession.saveSession(
        token,
        user: userMap,
      );
      if (!mounted) return;
      navigateToHome(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    emailFocus.dispose();
    passwordFocus.dispose();
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
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
                      label: 'Email Address',
                      hint: 'Enter your email',
                      controller: emailController,
                      focusNode: emailFocus,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Email is required';
                        }
                        if (!value.contains('@')) return 'Invalid email';
                        return null;
                      },
                    ),
                    SizedBox(height: 2.h),
                    CustomTextField(
                      label: 'Password',
                      hint: 'Enter password',
                      controller: passwordController,
                      focusNode: passwordFocus,
                      obscureText: true,
                      validator: (value) =>
                          value == null || value.length < 6
                              ? 'Minimum 6 characters'
                              : null,
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
                            'Forget Password?',
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
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: false,
                text: _loading ? 'Logging in…' : 'Login',
                onPressed: _loading ? () {} : _submit,
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
                    const TextSpan(text: "Don't have an account? "),
                    TextSpan(
                      text: 'Register',
                      style: const TextStyle(
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
    );
  }
}
