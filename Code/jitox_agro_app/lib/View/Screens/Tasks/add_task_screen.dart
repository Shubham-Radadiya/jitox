import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/dropdown.dart';
import 'package:jitox_agro_app/View/Widgets/snackbar.dart';
import 'package:jitox_agro_app/View/Widgets/textfield.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class AddTaskScreen extends StatefulWidget {
  @override
  State<AddTaskScreen> createState() => _AddTaskScreenState();
}

class _AddTaskScreenState extends State<AddTaskScreen> {
  final _formKey = GlobalKey<FormState>();
  bool isFormValid = false;
  String? selectedDealer;
  List<String> dealerNames = ["Ramesh", "Suresh", "Paresh"];

  final TextEditingController dealerNameController = TextEditingController();
  final TextEditingController taskNameController = TextEditingController();
  final TextEditingController timeController = TextEditingController();
  final TextEditingController subTitleController = TextEditingController();
  final TextEditingController platformController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController contactController = TextEditingController();
  final TextEditingController addressController = TextEditingController();
  final TextEditingController notesController = TextEditingController();

  void _validateForm() {
    if (selectedDealer != null &&
        emailController.text.isNotEmpty &&
        contactController.text.isNotEmpty &&
        addressController.text.isNotEmpty) {
      setState(() {
        isFormValid = _formKey.currentState?.validate() ?? false;
      });
    }
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      showCustomSnackBar(context, "Your task has been added");
    }
  }

  @override
  void initState() {
    dealerNameController.addListener(_validateForm);
    contactController.addListener(_validateForm);
    emailController.addListener(_validateForm);
    notesController.addListener(_validateForm);
    addressController.addListener(_validateForm);
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(7.h),
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 4.w),
          decoration: const BoxDecoration(
            color: const Color(0xfff5fcf8),
          ),
          child: SafeArea(
            child: Row(
              children: [
                arrowBackButton(context),
                Expanded(
                  child: Center(
                    child: Text(
                      "Add Task",
                      style: TextStyle(
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                Container(
                  width: 4.5.h,
                ),
              ],
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Stack(
              children: [
                Container(
                  height: 8.h,
                  color: const Color(0xfff5fcf8),
                ),
                SizedBox(height: 1.h),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4.w),
                  child: VisitTypeSelector(),
                ),
              ],
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 4.w),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: 3.h),
                    CustomDropdown(
                      label: "Dealer Name",
                      label2: "*",
                      label2Color: Colors.red,
                      value: selectedDealer,
                      items: dealerNames,
                      hint: 'Enter Dealer Name',
                      onChanged: (value) {
                        setState(() {
                          selectedDealer = value!;
                        });
                        _validateForm();
                      },
                      validator: (value) =>
                          value == null ? 'Please select a role' : null,
                    ),
                    SizedBox(height: 2.5.h),
                    CustomTextField(
                      label: "Task Name",
                      hint: "Your Task Name",
                      controller: taskNameController,
                      fontWeight: FontWeight.w500,
                    ),
                    SizedBox(height: 2.5.h),
                    CustomTextField(
                      label: "Time",
                      hint: "Starting Time",
                      controller: timeController,
                      fontWeight: FontWeight.w500,
                      readOnly: true,
                      suffixIcon: Icon(
                        Icons.access_time,
                        color: Colors.black54,
                      ),
                    ),
                    SizedBox(height: 2.5.h),
                    CustomTextField(
                      label: "Sub Title",
                      hint: "Add sub title",
                      controller: subTitleController,
                      fontWeight: FontWeight.w500,
                    ),
                    SizedBox(height: 2.5.h),
                    CustomTextField(
                      label: "Platform",
                      hint: "Ex: location, call, zoom, chat etc....",
                      controller: platformController,
                      fontWeight: FontWeight.w500,
                    ),
                    SizedBox(height: 2.5.h),
                    CustomTextField(
                      label: "Email ID",
                      label2: "*",
                      hint: "Enter your Id",
                      controller: emailController,
                      label2Color: Colors.red,
                      fontWeight: FontWeight.w500,
                      validator: (value) {
                        if (value!.isEmpty) return 'Email is required';
                        if (!value.contains('@')) return 'Invalid email';
                        return null;
                      },
                    ),
                    SizedBox(height: 2.5.h),
                    CustomTextField(
                      label: "Contact Detail",
                      label2: "*",
                      hint: "+91 00000 00000",
                      controller: contactController,
                      label2Color: Colors.red,
                      fontWeight: FontWeight.w500,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter contact number';
                        } else if (!value.startsWith('+91')) {
                          return 'Contact must start with +91';
                        } else if (value.trim().length != 13) {
                          return 'Contact must be +91 followed by 10 digits';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 2.5.h),
                    CustomTextField(
                      label: "Address",
                      label2: "*",
                      hint: "Enter Your Address",
                      label2Color: Colors.red,
                      controller: addressController,
                      fontWeight: FontWeight.w500,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter your address';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 2.5.h),
                    CustomTextField(
                      label: "Add Notes",
                      label2: "*",
                      hint: "Add notes here...",
                      controller: notesController,
                      maxLines: 3,
                      label2Color: Colors.red,
                      fontWeight: FontWeight.w500,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter notes';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 3.h),
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {},
                            child: Container(
                              height: 6.5.h,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(13),
                                border:
                                    Border.all(color: Colors.black, width: 0.7),
                              ),
                              child: Center(
                                child: Text(
                                  "Cancel",
                                  style: TextStyle(
                                    fontSize: 16.sp,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.black,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 3.w),
                        Expanded(
                          child: GestureDetector(
                            onTap: isFormValid ? _submit : () {},
                            child: Container(
                              height: 6.5.h,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(13),
                                color: !isFormValid
                                    ? Colors.grey.shade400
                                    : primaryColor,
                              ),
                              child: Center(
                                child: Text(
                                  "Save",
                                  style: TextStyle(
                                    fontSize: 16.sp,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 2.h),
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

class VisitTypeSelector extends StatefulWidget {
  @override
  State<VisitTypeSelector> createState() => _VisitTypeSelectorState();
}

class _VisitTypeSelectorState extends State<VisitTypeSelector> {
  String selectedVisitType = "Dealer Visit";

  final List<String> visitTypes = ["Dealer Visit", "Farmer Visit", "Other"];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(3.w),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: primaryColor, width: 0.8),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Activity",
            style: TextStyle(
              fontSize: 16.sp,
              color: Colors.black,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(
            height: 1.3.h,
          ),
          Row(
            children: visitTypes.map((type) {
              final isSelected = selectedVisitType == type;
              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      selectedVisitType = type;
                    });
                  },
                  child: Container(
                    height: 5.5.h,
                    margin: EdgeInsets.symmetric(horizontal: 1.w),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(5),
                      border: Border.all(
                        color: isSelected
                            ? primaryColor
                            : Colors.grey.withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        type,
                        style: TextStyle(
                          color: isSelected ? primaryColor : lightFontColor,
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          // Text(
          //   "",
          //   style: TextStyle(
          //     fontSize: 15.sp,
          //     color: Colors.black,
          //     fontWeight: FontWeight.w500,
          //   ),
          // ),
          SizedBox(
            height: 1.3.h,
          ),
        ],
      ),
    );
  }
}
