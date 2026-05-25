import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/services/auth_api.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:jitox_agro_app/View/Widgets/checkbox.dart';
import 'package:jitox_agro_app/View/Widgets/dropdown.dart';
import 'package:jitox_agro_app/View/Widgets/textfield.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({
    super.key,
    this.onSwitchToLogin,
    this.onRegistered,
  });

  final VoidCallback? onSwitchToLogin;
  final VoidCallback? onRegistered;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  late FocusNode firstNameFocus;
  late FocusNode lastNameFocus;
  late FocusNode emailFocus;
  late FocusNode passwordFocus;
  late FocusNode addressFocus;
  late FocusNode pincodeFocus;
  late FocusNode talukaFocus;
  late FocusNode districtFocus;

  bool isFormValid = false;
  bool _loading = false;

  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final addressController = TextEditingController();
  final pincodeController = TextEditingController();
  final talukaController = TextEditingController();
  final districtController = TextEditingController();

  String? selectedRole;
  String? selectedCity;
  String? selectedState;

  bool isAgreed = false;

  List<String> roles = ['Farmer', 'Distributor', 'Retailer'];
  List<String> cities = ['Rajkot', 'Ahmedabad', 'Surat'];
  List<String> states = ['Gujarat', 'Maharashtra', 'Rajasthan'];

  Map<String, dynamic> _buildRegisterPayload() {
    return {
      'firstName': firstNameController.text.trim(),
      'lastName': lastNameController.text.trim(),
      'email': emailController.text.trim().toLowerCase(),
      'password': passwordController.text,
      'address': addressController.text.trim(),
      'streetAddress': addressController.text.trim(),
      'city': selectedCity,
      'state': selectedState,
      'taluka': talukaController.text.trim(),
      'district': districtController.text.trim(),
      'country': 'India',
      'pincode':
          pincodeController.text.trim().replaceAll(RegExp(r'\D'), ''),
    };
  }

  Future<void> _submit() async {
    if (_formKey.currentState!.validate()) {
      if (!isAgreed) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please agree to the Terms and Privacy Policy'),
          ),
        );
        return;
      }

      setState(() => _loading = true);
      try {
        final result = await AuthApi.register(_buildRegisterPayload());
        if (!mounted) return;

        final message = result['message']?.toString() ??
            'Registration submitted. Please wait for admin approval before logging in.';

        await showDialog<void>(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Text('Registration submitted'),
            content: Text(message),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  widget.onRegistered?.call();
                },
                child: const Text('Go to Login'),
              ),
            ],
          ),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.toString().replaceFirst('Exception: ', ''),
            ),
          ),
        );
      } finally {
        if (mounted) setState(() => _loading = false);
      }
    }
  }

  void _validateForm() {
    bool isValid = false;
    if (firstNameController.text.isNotEmpty &&
        lastNameController.text.isNotEmpty &&
        emailController.text.isNotEmpty &&
        passwordController.text.length >= 6 &&
        addressController.text.isNotEmpty &&
        pincodeController.text.length >= 5 &&
        talukaController.text.isNotEmpty &&
        districtController.text.isNotEmpty &&
        selectedRole != null &&
        selectedCity != null &&
        selectedState != null &&
        isAgreed) {
      isValid = _formKey.currentState?.validate() ?? false;
    }

    final areDropdownsValid =
        selectedRole != null && selectedCity != null && selectedState != null;

    setState(() {
      isFormValid = isValid && areDropdownsValid && isAgreed;
    });
  }

  @override
  void initState() {
    super.initState();
    firstNameFocus = FocusNode()..addListener(_validateForm);
    lastNameFocus = FocusNode()..addListener(_validateForm);
    emailFocus = FocusNode()..addListener(_validateForm);
    passwordFocus = FocusNode()..addListener(_validateForm);
    addressFocus = FocusNode()..addListener(_validateForm);
    pincodeFocus = FocusNode()..addListener(_validateForm);
    talukaFocus = FocusNode()..addListener(_validateForm);
    districtFocus = FocusNode()..addListener(_validateForm);
  }

  @override
  void dispose() {
    firstNameFocus.dispose();
    lastNameFocus.dispose();
    emailFocus.dispose();
    passwordFocus.dispose();
    addressFocus.dispose();
    pincodeFocus.dispose();
    talukaFocus.dispose();
    districtFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            SizedBox(height: 1.h),
            CustomTextField(
              label: 'First Name',
              hint: 'Enter First Name',
              controller: firstNameController,
              focusNode: firstNameFocus,
              validator: (value) =>
                  value!.isEmpty ? 'First name is required' : null,
            ),
            SizedBox(height: 2.h),
            CustomTextField(
              label: 'Last Name',
              hint: 'Enter Last Name',
              controller: lastNameController,
              focusNode: lastNameFocus,
              validator: (value) =>
                  value!.isEmpty ? 'Last name is required' : null,
            ),
            SizedBox(height: 2.h),
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
            SizedBox(height: 2.h),
            CustomDropdown(
              label: "Role",
              value: selectedRole,
              items: roles,
              hint: 'Select Your Role',
              onChanged: (value) {
                setState(() {
                  selectedRole = value;
                });
                _validateForm();
              },
              validator: (value) =>
                  value == null ? 'Please select a role' : null,
            ),
            SizedBox(height: 2.h),
            CustomTextField(
              label: 'Address',
              hint: 'Enter Your Address',
              controller: addressController,
              focusNode: addressFocus,
              validator: (value) =>
                  value!.isEmpty ? 'Address is required' : null,
            ),
            SizedBox(height: 2.h),
            Row(
              children: [
                Expanded(
                  child: CustomDropdown(
                    label: 'City',
                    value: selectedCity,
                    items: cities,
                    hint: 'Select City',
                    onChanged: (value) {
                      setState(() {
                        selectedCity = value;
                      });
                      _validateForm();
                    },
                    validator: (value) =>
                        value == null ? 'Select city' : null,
                  ),
                ),
                SizedBox(width: 3.w),
                Expanded(
                  child: CustomDropdown(
                    label: 'State',
                    value: selectedState,
                    items: states,
                    hint: 'Select State',
                    onChanged: (value) {
                      setState(() {
                        selectedState = value;
                      });
                      _validateForm();
                    },
                    validator: (value) =>
                        value == null ? 'Select state' : null,
                  ),
                ),
              ],
            ),
            SizedBox(height: 2.h),
            CustomTextField(
              label: 'Pincode',
              hint: 'Enter 5–10 digit pincode',
              controller: pincodeController,
              focusNode: pincodeFocus,
              validator: (value) {
                final digits = (value ?? '').replaceAll(RegExp(r'\D'), '');
                if (digits.length < 5 || digits.length > 10) {
                  return 'Enter a valid pincode (5–10 digits)';
                }
                return null;
              },
            ),
            SizedBox(height: 2.h),
            Row(
              children: [
                Expanded(
                  child: CustomTextField(
                    label: 'Taluka',
                    hint: 'Enter Your Taluka',
                    controller: talukaController,
                    focusNode: talukaFocus,
                    validator: (value) =>
                        value!.isEmpty ? 'Taluka is required' : null,
                  ),
                ),
                SizedBox(width: 3.w),
                Expanded(
                  child: CustomTextField(
                    label: 'District',
                    hint: 'Enter Your District',
                    controller: districtController,
                    focusNode: districtFocus,
                    validator: (value) =>
                        value!.isEmpty ? 'District is required' : null,
                  ),
                ),
              ],
            ),
            SizedBox(height: 2.h),
            Row(
              children: [
                CustomCheckbox(
                  value: isAgreed,
                  onChanged: (val) {
                    setState(() => isAgreed = val!);
                    _validateForm();
                  },
                ),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(
                        fontSize: 15.sp,
                        color: Colors.black,
                      ),
                      children: [
                        const TextSpan(
                          text: 'By using Jitox, you agree to the ',
                        ),
                        TextSpan(
                          text: 'Terms and Privacy Policy.',
                          style: const TextStyle(
                            color: Colors.blue,
                            decoration: TextDecoration.underline,
                          ),
                          recognizer: TapGestureRecognizer()..onTap = () {},
                        ),
                      ],
                    ),
                  ),
                )
              ],
            ),
            SizedBox(height: 2.h),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: !isFormValid || _loading,
                text: _loading ? 'Connecting to live server…' : 'Register',
                outlineColor: lightFontColor,
                onPressed: isFormValid && !_loading ? _submit : () {},
              ),
            ),
            SizedBox(height: 1.h),
            Text(
              'Uses live server (jitox.onrender.com). Admin must approve before login.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13.sp, color: Colors.black54),
            ),
            SizedBox(height: 2.h),
            RichText(
              text: TextSpan(
                style: TextStyle(
                  fontSize: 15.sp,
                  color: Colors.black,
                ),
                children: [
                  const TextSpan(text: 'Already have an account? '),
                  TextSpan(
                    text: 'Login',
                    style: const TextStyle(
                      color: Colors.blue,
                      decoration: TextDecoration.underline,
                    ),
                    recognizer: TapGestureRecognizer()
                      ..onTap = () => widget.onSwitchToLogin?.call(),
                  ),
                ],
              ),
            ),
            SizedBox(height: 4.h),
          ],
        ),
      ),
    );
  }
}
