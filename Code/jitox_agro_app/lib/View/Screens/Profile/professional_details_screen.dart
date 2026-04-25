import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:jitox_agro_app/View/Widgets/textfield.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class ProfessionalDetailsScreen extends StatefulWidget {
  const ProfessionalDetailsScreen({super.key});

  @override
  State<ProfessionalDetailsScreen> createState() =>
      _ProfessionalDetailsScreenState();
}

class _ProfessionalDetailsScreenState extends State<ProfessionalDetailsScreen> {
  bool isFormValidate = false;
  final jobController = TextEditingController();
  final departmentController = TextEditingController();
  final teamController = TextEditingController();

  void _validateForm() {
    bool isValid = jobController.text.isNotEmpty &&
        departmentController.text.isNotEmpty &&
        teamController.text.isNotEmpty;

    setState(() {
      isFormValidate = isValid;
    });
  }

  void _submit() {
    showProfileAddedSuccessAlertDialog(context);
  }

  @override
  void initState() {
    super.initState();

    jobController.addListener(_validateForm);
    departmentController.addListener(_validateForm);
    teamController.addListener(_validateForm);
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: EdgeInsets.all(4.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SingleChildScrollView(
              child: Column(
                children: [
                  Text(
                    "Tell us more about work related info",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20.sp,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(
                    height: 4.h,
                  ),
                  CustomTextField(
                    label: 'Your Job',
                    label2: ' (“Default”)',
                    hint: 'Enter Your Job',
                    controller: jobController,
                    validator: (value) =>
                        value!.isEmpty ? 'Job is required' : null,
                  ),
                  SizedBox(height: 2.h),
                  CustomTextField(
                    label: 'Your Department',
                    label2: ' (“Default”)',
                    hint: 'Enter Your Department',
                    controller: departmentController,
                    validator: (value) =>
                        value!.isEmpty ? 'Department is required' : null,
                  ),
                  SizedBox(height: 2.h),
                  CustomTextField(
                    label: 'Your Team',
                    label2: ' (“Default”)',
                    hint: 'Enter Your Team',
                    controller: teamController,
                    validator: (value) =>
                        value!.isEmpty ? 'Team is required' : null,
                  ),
                ],
              ),
            ),
            Spacer(),
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

void showProfileAddedSuccessAlertDialog(BuildContext context) {
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
              imagePath: AppIcons.profileAddedIcon,
              width: 20.w,
            ),
            SizedBox(
              height: 2.h,
            ),
            Text(
              'Profile Added Successfully',
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
              'Your Profile has been Added successfully.',
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
                text: "Go to Home Screen",
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
