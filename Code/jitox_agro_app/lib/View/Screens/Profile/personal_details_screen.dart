import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:jitox_agro_app/View/Widgets/dropdown.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:jitox_agro_app/View/Widgets/textfield.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class PersonalDetailScreen extends StatefulWidget {
  const PersonalDetailScreen({super.key});

  @override
  State<PersonalDetailScreen> createState() => _PersonalDetailScreenState();
}

class _PersonalDetailScreenState extends State<PersonalDetailScreen> {
  final _formKey = GlobalKey<FormState>();

  bool isFormValidate = false;

  late FocusNode employeeNameFocus;
  late FocusNode lastNameFocus;
  late FocusNode emailFocus;
  late FocusNode contactNuberFocus;
  late FocusNode addressFocus;
  late FocusNode talukaFocus;
  late FocusNode districtFocus;

  bool isFormValid = false;

  final employeeNameController = TextEditingController();
  final locationController = TextEditingController();
  final emailController = TextEditingController();
  final contactNubeController = TextEditingController();
  final addressController = TextEditingController();

  String selectedDate = "";
  String selectedMonth = "";
  String selectedYear = "";

  List<String> dates = [];
  List<String> months = [];
  List<String> years = [];

  String gender = "Male";

  void _submit() {
    if (_formKey.currentState!.validate()) {}
  }

  void _validateForm() {
    final RegExp phoneExp = RegExp(r'^\d{10,15}$');

    bool isValid = employeeNameController.text.isNotEmpty &&
        emailController.text.isNotEmpty &&
        emailController.text.contains('@') &&
        contactNubeController.text.isNotEmpty &&
        phoneExp.hasMatch(contactNubeController.text) &&
        addressController.text.isNotEmpty &&
        addressController.text.length > 5 &&
        addressController.text.length < 200;

    setState(() {
      isFormValidate = isValid;
    });
  }

  @override
  void initState() {
    super.initState();

    dates = [];
    dates = List.generate(31, (index) => (index + 1).toString());
    months = List.generate(12, (index) => (index + 1).toString());
    int currentYear = DateTime.now().year;
    years = List.generate(
        (currentYear - 1950 + 1), (index) => (1950 + index).toString());

    DateTime now = DateTime.now();
    selectedDate = now.day.toString();
    selectedMonth = now.month.toString();
    selectedYear = now.year.toString();

    employeeNameFocus = FocusNode()..addListener(_validateForm);
    lastNameFocus = FocusNode()..addListener(_validateForm);
    emailFocus = FocusNode()..addListener(_validateForm);
    contactNuberFocus = FocusNode()..addListener(_validateForm);
    addressFocus = FocusNode()..addListener(_validateForm);

    employeeNameController.addListener(_validateForm);
    locationController.addListener(_validateForm);
    emailController.addListener(_validateForm);
    contactNubeController.addListener(_validateForm);
    addressController.addListener(_validateForm);
  }

  @override
  void dispose() {
    employeeNameFocus.dispose();
    lastNameFocus.dispose();
    emailFocus.dispose();
    contactNuberFocus.dispose();
    addressFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(4.w),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Tell us more about yourself",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20.sp,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(
              height: 2.h,
            ),
            Center(
              child: CustomAssetImage(
                imagePath: AppIcons.userIcon,
                width: 19.w,
              ),
            ),
            SizedBox(
              height: 2.h,
            ),
            CustomTextField(
              label: 'Employee Name',
              label2: ' (“Required”)',
              hint: 'Enter Employee Name',
              controller: employeeNameController,
              focusNode: employeeNameFocus,
              validator: (value) =>
                  value!.isEmpty ? 'Employee name is required' : null,
            ),
            SizedBox(height: 2.h),
            CustomTextField(
              label: 'Email Address',
              label2: ' (“Enter valid email”)',
              hint: 'Enter Email Address',
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
              label: 'Contact Number',
              label2: ' (“Required”)',
              hint: 'Enter Contact Number',
              controller: contactNubeController,
              focusNode: contactNuberFocus,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a contact number';
                }

                final RegExp phoneExp = RegExp(r'^\d{10,15}$');

                if (!phoneExp.hasMatch(value)) {
                  return 'Enter a valid contact number';
                }

                return null;
              },
            ),
            SizedBox(height: 2.h),
            CustomTextField(
              label: 'Your Location',
              label2: ' (“Required”)',
              hint: 'Enter Your Location',
              controller: addressController,
              maxLines: 2,
              focusNode: addressFocus,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter an address';
                }

                if (value.length < 5) {
                  return 'Address is too short';
                }

                if (value.length > 200) {
                  return 'Address is too long';
                }

                return null;
              },
            ),
            SizedBox(height: 2.h),
            Row(
              children: [
                Expanded(
                  child: CustomDropdown(
                    label: 'DOB',
                    label2: " (Optional)",
                    value: selectedDate,
                    items: dates,
                    hint: 'Select Date',
                    onChanged: (value) {
                      setState(() {
                        selectedDate = value!;
                      });
                      _validateForm();
                    },
                    validator: (value) => value == null ? 'Select Date' : null,
                  ),
                ),
                SizedBox(width: 1.5.w),
                Expanded(
                  child: CustomDropdown(
                    label: ' ',
                    value: selectedMonth,
                    items: months,
                    hint: 'Select Month',
                    onChanged: (value) {
                      setState(() {
                        selectedMonth = value.toString();
                      });
                      _validateForm();
                    },
                    validator: (value) => value == null ? 'Select Month' : null,
                  ),
                ),
                SizedBox(width: 1.5.w),
                Expanded(
                  child: CustomDropdown(
                    label: ' ',
                    value: selectedYear,
                    items: years,
                    hint: 'Select Year',
                    onChanged: (value) {
                      setState(() {
                        selectedYear = value.toString();
                      });
                      _validateForm();
                    },
                    validator: (value) => value == null ? 'Select Year' : null,
                  ),
                ),
              ],
            ),
            SizedBox(height: 2.h),
            RadioButton(
              title: "Gender",
              options: ["Male", "Female"],
              selectedValue: gender,
              onChanged: (value) {
                setState(() {
                  gender = value;
                });
              },
            ),
            SizedBox(height: 4.h),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: isFormValidate == true ? false : true,
                text: "Proceed to professional info",
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
    );
  }
}

class RadioButton extends StatelessWidget {
  final String title;
  final List<String> options;
  final String selectedValue;
  final ValueChanged<String> onChanged;

  const RadioButton({
    super.key,
    required this.title,
    required this.options,
    required this.selectedValue,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    const double fieldHeight = 56;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        /// Title
        RichText(
          text: TextSpan(
            text: title,
            style: TextStyle(
              fontSize: 15.sp,
              color: Colors.black,
            ),
            children: [
              TextSpan(
                text: ' (“Optional”)',
                style: TextStyle(
                  fontSize: 15.sp,
                  color: Colors.grey.withOpacity(0.9),
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 1.h),

        /// Radio options
        Wrap(
          direction: Axis.horizontal,
          spacing: 1.5.w,
          runSpacing: 1.5.w,
          children: options.map((option) {
            return GestureDetector(
              onTap: () => onChanged(option),
              child: Container(
                width: (100.w - 9.5.w) / 2,
                height: fieldHeight,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.withOpacity(0.5)),
                  borderRadius: BorderRadius.circular(13),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      option,
                      style: TextStyle(
                        color: selectedValue == option
                            ? Colors.black
                            : Colors.grey,
                        fontSize: 16.sp,
                      ),
                    ),
                    Radio<String>(
                      value: option,
                      groupValue: selectedValue,
                      onChanged: (value) => onChanged(value!),
                      activeColor: primaryColor,
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
