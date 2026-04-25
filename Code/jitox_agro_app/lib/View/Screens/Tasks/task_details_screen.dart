import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class TaskDetailPage extends StatefulWidget {
  const TaskDetailPage({super.key});

  @override
  State<TaskDetailPage> createState() => _TaskDetailPageState();
}

class _TaskDetailPageState extends State<TaskDetailPage> {
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
                      "Task Detail",
                      style: TextStyle(
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                PopupMenuButton<int>(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  icon: Container(
                    width: 4.5.h,
                    height: 4.5.h,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: const Icon(
                      Icons.more_vert_outlined,
                      color: Colors.black,
                    ),
                  ),
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: 1,
                      child: Row(
                        children: [
                          CustomAssetImage(
                            imagePath: AppIcons.editIcon,
                            width: 18.sp,
                            color: Colors.black,
                          ),
                          SizedBox(width: 2.w),
                          Text("Edit", style: TextStyle(fontSize: 15.sp)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 2,
                      child: Row(
                        children: [
                          CustomAssetImage(
                            imagePath: AppIcons.shareIcon,
                            width: 18.sp,
                            color: Colors.black,
                          ),
                          SizedBox(width: 2.w),
                          Text("Share", style: TextStyle(fontSize: 15.sp)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 3,
                      child: Row(
                        children: [
                          CustomAssetImage(
                            imagePath: AppIcons.deleteIcon,
                            width: 18.sp,
                            color: Colors.black,
                          ),
                          SizedBox(width: 2.w),
                          Text("Delete", style: TextStyle(fontSize: 15.sp)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              color: const Color(0xfff5fcf8),
              padding: EdgeInsets.symmetric(horizontal: 4.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Upcoming Meeting with Dealer',
                    style: TextStyle(
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),
                  SizedBox(height: 1.2.h),
                  Text(
                    'Ready the system or template to record and share outcomes immediately.',
                    style: TextStyle(
                      fontSize: 15.sp,
                      fontWeight: FontWeight.w400,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Row(
                    children: [
                      Column(
                        children: [
                          Row(
                            children: [
                              Icon(Icons.calendar_month,
                                  size: 18.sp, color: Colors.black),
                              SizedBox(width: 2.w),
                              Text(
                                '14 May 2025',
                                style: TextStyle(
                                  fontSize: 15.sp,
                                  color: Colors.black,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(width: 2.w),
                          Text(
                            '1:30 PM',
                            style: TextStyle(
                              fontSize: 15.sp,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: 3.w, vertical: 0.6.h),
                        decoration: BoxDecoration(
                          color: const Color(0xfffdeedb),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'In Progress',
                          style: TextStyle(
                            fontSize: 13.sp,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xfff28c26),
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(
                    height: 2.h,
                  ),
                ],
              ),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 4.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: 3.h),
                  Container(
                    width: double.infinity,
                    margin: EdgeInsets.only(bottom: 1.5.h),
                    padding:
                        EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border:
                          Border.all(color: Color.fromARGB(255, 244, 243, 243)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(LucideIcons.user, size: 18),
                            SizedBox(width: 2.w),
                            Text(
                              "Dealer Name",
                              style: TextStyle(
                                fontSize: 15.sp,
                              ),
                            ),
                            Spacer(),
                            Text(
                              "PQR Singh",
                              style: TextStyle(
                                fontSize: 15.sp,
                                color: Colors.black54,
                                height: 1.4,
                              ),
                            )
                          ],
                        ),
                        SizedBox(height: 2.h),
                        Row(
                          children: [
                            Icon(LucideIcons.layers, size: 18),
                            SizedBox(width: 2.w),
                            Text(
                              "Platform",
                              style: TextStyle(
                                fontSize: 15.sp,
                              ),
                            ),
                            Spacer(),
                            Text(
                              "Surat HQ",
                              style: TextStyle(
                                fontSize: 15.sp,
                                color: Colors.black54,
                                height: 1.4,
                              ),
                            )
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    margin: EdgeInsets.only(bottom: 1.5.h),
                    padding:
                        EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border:
                          Border.all(color: Color.fromARGB(255, 244, 243, 243)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(LucideIcons.mail, size: 18),
                            SizedBox(width: 2.w),
                            Text(
                              "Email Id",
                              style: TextStyle(
                                fontSize: 15.sp,
                              ),
                            ),
                            Spacer(),
                            Text(
                              "pgr@gmail.com",
                              style: TextStyle(
                                fontSize: 15.sp,
                                color: Colors.black54,
                                height: 1.4,
                              ),
                            )
                          ],
                        ),
                        SizedBox(height: 2.h),
                        Row(
                          children: [
                            Icon(LucideIcons.layers, size: 18),
                            SizedBox(width: 2.w),
                            Text(
                              "Contact Number",
                              style: TextStyle(
                                fontSize: 15.sp,
                              ),
                            ),
                            Spacer(),
                            Text(
                              "+91 98541 25896",
                              style: TextStyle(
                                fontSize: 15.sp,
                                color: Colors.black54,
                                height: 1.4,
                              ),
                            )
                          ],
                        ),
                        SizedBox(height: 2.h),
                        Row(
                          children: [
                            Icon(LucideIcons.mapPin, size: 18),
                            SizedBox(width: 2.w),
                            Text(
                              "Address",
                              style: TextStyle(
                                fontSize: 15.sp,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(
                          height: 1.h,
                        ),
                        Text(
                          "B.35 Akshardham society near D-mart, Mota Varachha, surat.",
                          style: TextStyle(
                            fontSize: 15.sp,
                            color: Colors.black54,
                            height: 1.4,
                          ),
                        )
                      ],
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    margin: EdgeInsets.only(bottom: 1.5.h),
                    padding:
                        EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border:
                          Border.all(color: Color.fromARGB(255, 244, 243, 243)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(LucideIcons.clipboardList, size: 18),
                            SizedBox(width: 2.w),
                            Text(
                              "Notes",
                              style: TextStyle(
                                fontSize: 15.sp,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(
                          height: 1.h,
                        ),
                        Text(
                          "You can upload the image you shared into one of these platforms, select a business look template, and let the tool generate a polished headshot.",
                          style: TextStyle(
                            fontSize: 15.sp,
                            color: Colors.black54,
                            height: 1.4,
                          ),
                        )
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildInfoCard(String title, String value, IconData icon) {
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: 1.5.h),
      padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Color.fromARGB(255, 238, 237, 237)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18),
          SizedBox(width: 2.w),
          Text(
            title,
            style: TextStyle(
              fontSize: 15.sp,
            ),
          ),
          Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 15.sp,
              color: Colors.black54,
              height: 1.4,
            ),
          )
        ],
      ),
    );
  }
}
