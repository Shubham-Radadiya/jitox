import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:jitox_agro_app/View/Widgets/checkbox.dart';
import 'package:jitox_agro_app/View/Widgets/dropdown.dart';
import 'package:jitox_agro_app/View/Widgets/textfield.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({
    super.key,
    this.onSwitchToLogin,
    this.onRegistrationComplete,
  });

  final VoidCallback? onSwitchToLogin;
  final VoidCallback? onRegistrationComplete;

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
  late FocusNode talukaFocus;
  late FocusNode districtFocus;

  bool isFormValid = false;

  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final addressController = TextEditingController();
  final talukaController = TextEditingController();
  final districtController = TextEditingController();

  String? selectedRole;
  String? selectedCity;
  String? selectedState;

  bool isAgreed = false;

  List<String> roles = ['Farmer', 'Distributor', 'Retailer'];
  List<String> cities = ['Rajkot', 'Ahmedabad', 'Surat'];
  List<String> states = ['Gujarat', 'Maharashtra', 'Rajasthan'];

  void _submit() {
    if (_formKey.currentState!.validate()) {
      if (!isAgreed) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Please agree to the Terms and Privacy Policy')),
        );
        return;
      }

      showRegosterSuccessAlertDialog(context);
    }
  }

  void _validateForm() {
    bool isValid = false;
    if (firstNameController.text.isNotEmpty &&
        lastNameController.text.isNotEmpty &&
        emailController.text.isNotEmpty &&
        passwordController.text.length >= 6 &&
        addressController.text.isNotEmpty &&
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
    talukaFocus.dispose();
    districtFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: SingleChildScrollView(
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
                          TextSpan(text: 'By using Jitox, you agree to the '),
                          TextSpan(
                            text: 'Terms and Privacy Policy.',
                            style: TextStyle(
                              color: Colors.blue,
                              decoration: TextDecoration.underline,
                            ),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () {
                                print('Terms clicked');
                              },
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
                  isOutlined: !isFormValid,
                  text: "Register",
                  outlineColor: lightFontColor,
                  onPressed: isFormValid
                      ? () {
                          _submit();
                        }
                      : () {},
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
                    TextSpan(text: 'Already have an account? '),
                    TextSpan(
                      text: 'Login',
                      style: TextStyle(
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
      ),
    );
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
              Text(
                'Thanks, your account has been successfully created.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: primaryColor,
                  fontSize: 17.sp,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(
                height: 2.h,
              ),
              Text(
                'Please check your inbox, a code is sent on your email as well as on your registered phone no. which will be required when you will reach to the venue  and to login your account.',
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
                  text: "Ok",
                  onPressed: () {
                    Navigator.of(context).pop();
                    widget.onRegistrationComplete?.call();
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
}
