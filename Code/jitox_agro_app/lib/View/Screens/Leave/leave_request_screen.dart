import 'dart:io';
import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:image_picker/image_picker.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class LeaveRequestScreen extends StatefulWidget {
  const LeaveRequestScreen({super.key});

  @override
  State<LeaveRequestScreen> createState() => _LeaveRequestScreenState();
}

class _LeaveRequestScreenState extends State<LeaveRequestScreen>
    with SingleTickerProviderStateMixin {
  late TabController tabController;
  final leaveTypeController = TextEditingController(text: '');
  final fromDateController = TextEditingController(text: '');
  final toDateController = TextEditingController(text: '');
  final reasonController = TextEditingController();
  List<XFile> attachments = [];
  String selectedValue = 'Full Day';
  final List<String> dayOptions = ['Full Day', 'Half Day', 'Quarter Day'];

  @override
  void initState() {
    super.initState();
    tabController = TabController(length: 2, vsync: this);
  }

  Future<void> pickImages() async {
    final ImagePicker picker = ImagePicker();
    final List<XFile> images = await picker.pickMultiImage();
    if (images.isNotEmpty) {
      setState(() {
        attachments.addAll(images);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: PreferredSize(
          preferredSize: Size.fromHeight(7.h),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 4.w),
            child: SafeArea(
              child: Row(
                children: [
                  arrowBackButton(context),
                  Expanded(
                    child: Center(
                      child: Text(
                        "Leave Request",
                        style: TextStyle(
                          fontSize: 17.sp,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  Container(
                    width: 4.5.h,
                    height: 4.5.h,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: const Icon(
                      Icons.notifications_none,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        body: Column(
          children: [
            CustomTabBar(controller: tabController),
            Expanded(
              child: TabBarView(
                controller: tabController,
                children: [
                  leaveFormUi(),
                  DocumentListScreen(),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget leaveFormUi() {
    final size = (100.w - (8.w + (3.w * 4))) / 5;
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 4.w),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 3.h),
            Row(
              children: [
                CircleAvatar(
                  radius: 5.5.w,
                  backgroundColor: Color(0xFF297dc9),
                  child: Text(
                    'AJ',
                    style: TextStyle(
                        fontSize: 16.sp,
                        color: Colors.white,
                        fontWeight: FontWeight.w600),
                  ),
                ),
                SizedBox(width: 3.w),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Abc John',
                      style: TextStyle(
                          fontSize: 17.sp, fontWeight: FontWeight.w600),
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 0.5.h),
                    Text(
                      'Marketing Manager',
                      style: TextStyle(
                          fontSize: 15.sp, color: Colors.grey.shade600),
                    )
                  ],
                ),
                Spacer(),
                Container(
                  width: 4.5.h,
                  height: 4.5.h,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: const Icon(
                    Icons.close,
                    color: Colors.black,
                  ),
                ),
                SizedBox(width: 3.w),
                Container(
                  width: 4.5.h,
                  height: 4.5.h,
                  decoration: BoxDecoration(
                    color: Color(0xFF297dc9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.check, color: Colors.white, size: 20.sp),
                )
              ],
            ),
            SizedBox(height: 4.h),
            inputField('Leave Type', leaveTypeController),
            SizedBox(height: 4.h),
            inputFieldWithIcon(
                'From', fromDateController, CupertinoIcons.calendar),
            SizedBox(height: 0.5.h),
            Text(
              'More then One Day?',
              style: TextStyle(
                fontSize: 15.sp,
                color: Color(0xFF297dc9),
              ),
            ),
            SizedBox(height: 4.h),
            Row(
              children: [
                Expanded(
                  child: inputFieldWithIcon(
                      'To', toDateController, CupertinoIcons.calendar),
                ),
                SizedBox(width: 2.w),
                Container(
                  width: 2.5.h,
                  height: 2.5.h,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  child: Icon(
                    Icons.close,
                    color: Colors.red,
                    size: 1.5.h,
                  ),
                ),
              ],
            ),
            SizedBox(height: 4.h),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.5.h),
              decoration: BoxDecoration(
                // color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade300, width: 1.2),
              ),
              child: Row(
                children: [
                  Text('Fri, 23 May 2025', style: TextStyle(fontSize: 15.sp)),
                  Spacer(),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: selectedValue,
                      icon: Icon(Icons.keyboard_arrow_down_outlined,
                          color: Colors.grey.shade400, size: 20.sp),
                      decoration: InputDecoration(
                        contentPadding: EdgeInsets.symmetric(
                            horizontal: 3.w, vertical: 1.h),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(2.w),
                          borderSide: BorderSide(
                              color: Colors.grey.shade300, width: 1.5),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(2.w),
                          borderSide: BorderSide(
                              color: Colors.grey.shade300, width: 1.5),
                        ),
                      ),
                      style: TextStyle(
                          fontSize: 14.sp, color: Colors.grey.shade700),
                      dropdownColor: Colors.white,
                      items: dayOptions.map((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value, style: TextStyle(fontSize: 14.sp)),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          selectedValue = value!;
                        });
                      },
                    ),
                  )
                ],
              ),
            ),
            SizedBox(height: 2.5.h),
            inputField('Reason for Leave', reasonController, maxLines: 2),
            SizedBox(height: 2.5.h),
            Text('Attachment',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w600)),
            SizedBox(height: 1.5.h),
            Wrap(
              spacing: 3.w,
              runSpacing: 3.w,
              children: [
                ...attachments.map((file) {
                  return Stack(
                    children: [
                      Container(
                        width: size,
                        height: size,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(2.w),
                          image: DecorationImage(
                            image: FileImage(File(file.path)),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Positioned(
                        top: 0.5.w,
                        right: 0.5.w,
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              attachments.remove(file);
                            });
                          },
                          child: Container(
                            width: 6.w,
                            height: 6.w,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.grey.shade400),
                            ),
                            child: Icon(Icons.close,
                                color: Colors.grey.shade600, size: 16.sp),
                          ),
                        ),
                      )
                    ],
                  );
                }),
                GestureDetector(
                  onTap: pickImages,
                  child: DottedBorder(
                    color: Colors.grey.shade400,
                    strokeWidth: 1,
                    borderType: BorderType.RRect,
                    radius: Radius.circular(2.w),
                    dashPattern: [6, 3],
                    child: Container(
                      width: size,
                      height: size,
                      color: Colors.white,
                      child: Icon(Icons.add,
                          color: Colors.grey.shade500, size: 22.sp),
                    ),
                  ),
                )
              ],
            ),
            SizedBox(height: 6.h)
          ],
        ),
      ),
    );
  }

  Widget inputField(String label, TextEditingController controller,
      {int maxLines = 1, bool showRequired = true}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      cursorColor: Color(0xFF297dc9),
      decoration: InputDecoration(
        label: RichText(
          text: TextSpan(
            text: label,
            style: TextStyle(fontSize: 15.sp, color: Colors.grey.shade700),
            children: showRequired
                ? [
                    TextSpan(
                      text: ' *',
                      style: TextStyle(color: Colors.red, fontSize: 16.sp),
                    )
                  ]
                : [],
          ),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.7.h),
        labelStyle: TextStyle(fontSize: 15.sp, color: Colors.grey.shade500),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1.2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.red, width: 1.2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.red, width: 1.5),
        ),
      ),
    );
  }

  Widget inputFieldWithIcon(
      String label, TextEditingController controller, IconData icon,
      {bool showRequired = true}) {
    return TextField(
      controller: controller,
      cursorColor: Color(0xFF297dc9),
      decoration: InputDecoration(
        label: RichText(
          text: TextSpan(
            text: label,
            style: TextStyle(fontSize: 15.sp, color: Colors.grey.shade700),
            children: showRequired
                ? [
                    TextSpan(
                      text: ' *',
                      style: TextStyle(color: Colors.red, fontSize: 16.sp),
                    )
                  ]
                : [],
          ),
        ),
        labelStyle: TextStyle(fontSize: 15.sp, color: Colors.grey.shade700),
        suffixIcon: Icon(icon, size: 20.sp, color: Colors.grey.shade500),
        contentPadding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.7.h),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1.2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.red, width: 1.2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.red, width: 1.5),
        ),
      ),
    );
  }
}

class CustomTabBar extends StatelessWidget {
  final TabController controller;

  const CustomTabBar({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 6.h,
      child: Stack(
        children: [
          Positioned.fill(
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => controller.animateTo(0),
                    child: Center(
                      child: Text(
                        'Leave',
                        style: TextStyle(
                          fontSize: 16.sp,
                          color: controller.index == 0
                              ? Colors.black
                              : Colors.grey.shade500,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => controller.animateTo(1),
                    child: Center(
                      child: Text(
                        'Documents',
                        style: TextStyle(
                          fontSize: 16.sp,
                          color: controller.index == 1
                              ? Colors.black
                              : Colors.grey.shade500,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          AnimatedBuilder(
            animation: controller.animation!,
            builder: (context, child) {
              double indicatorLeft = controller.animation!.value * 50.w;
              return Positioned(
                bottom: 0,
                left: indicatorLeft,
                child: Container(
                  width: 50.w,
                  height: 2,
                  color: primaryColor,
                ),
              );
            },
          )
        ],
      ),
    );
  }
}

class DocumentListScreen extends StatelessWidget {
  final List<Map<String, dynamic>> documents = [
    {
      "name": "Invoice",
      "number": "1548214",
      "attachment": "-",
      "size": "",
    },
    {
      "name": "Agreement",
      "number": "#DF4541D",
      "attachment": "Create account docs.pdf",
      "size": "12.6 MB"
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.all(3.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Table Header
            Container(
              padding: EdgeInsets.symmetric(vertical: 1.5.h),
              color: Colors.grey.shade100,
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Text('Document Name',
                        style: TextStyle(
                            fontSize: 15.sp, fontWeight: FontWeight.w600)),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text('Number',
                        style: TextStyle(
                            fontSize: 15.sp, fontWeight: FontWeight.w600)),
                  ),
                  Expanded(
                    flex: 4,
                    child: Text('Attachment',
                        style: TextStyle(
                            fontSize: 15.sp, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),
            Divider(height: 0.2.h, thickness: 0.3, color: Colors.grey.shade300),

            // Table Rows
            ...documents.map((doc) => buildDocumentRow(doc)).toList(),
          ],
        ),
      ),
    );
  }

  Widget buildDocumentRow(Map<String, dynamic> doc) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.symmetric(vertical: 1.5.h),
          child: Row(
            children: [
              Expanded(
                flex: 3,
                child: Text(doc['name'],
                    style: TextStyle(
                        fontSize: 15.sp, color: Colors.grey.shade800)),
              ),
              Expanded(
                flex: 2,
                child: Text(doc['number'],
                    style: TextStyle(
                        fontSize: 15.sp, color: Colors.grey.shade700)),
              ),
              Expanded(
                flex: 4,
                child: doc['attachment'] == '-'
                    ? Text('-',
                        style: TextStyle(
                            fontSize: 15.sp, color: Colors.grey.shade500))
                    : SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            Icon(Icons.insert_drive_file,
                                color: Color(0xFFFF5722), size: 20.sp),
                            SizedBox(width: 1.w),
                            Text(
                              doc['attachment'],
                              style: TextStyle(
                                  fontSize: 15.sp,
                                  color: Colors.black,
                                  fontWeight: FontWeight.w500),
                              overflow: TextOverflow.visible,
                            ),
                            SizedBox(width: 1.w),
                            Text(
                              doc['size'],
                              style: TextStyle(
                                  fontSize: 13.sp, color: Colors.grey.shade500),
                            )
                          ],
                        ),
                      ),
              ),
            ],
          ),
        ),
        Divider(height: 0.2.h, thickness: 0.3, color: Colors.grey.shade300),
      ],
    );
  }
}
