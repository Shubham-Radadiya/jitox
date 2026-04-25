import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

final List<Map<String, dynamic>> todayActivities = [
  {
    'title': 'Upcoming Meeting with Dealer',
    'location': 'Surat HQ',
    'phone': '',
    'crmSystem': '',
    'userName': 'John',
    'designation': 'Dealer',
    'time': '11:00 AM',
    'status': 'Pending',
    'icon': Icons.location_on,
  },
  {
    'title': 'Follow-up Call: Client XYZ Pvt Ltd',
    'location': '',
    'phone': 'Phone',
    'crmSystem': '',
    'userName': 'John',
    'designation': 'Farmer',
    'time': '1:30 PM',
    'status': 'In Progress',
    'icon': Icons.phone,
  },
  {
    'title': 'Lead Status Update in CRM',
    'location': '',
    'phone': '',
    'crmSystem': 'CRM System',
    'userName': 'Singh',
    'designation': 'Dealer',
    'time': 'End of Day',
    'status': 'Pending',
    'icon': Icons.desktop_windows,
  },
  {
    'title': 'Product Demo for New Retailers',
    'location': 'Online Zoom',
    'phone': '',
    'crmSystem': '',
    'userName': 'John',
    'designation': 'other',
    'time': '3:00 PM',
    'status': 'Pending',
    'icon': Icons.location_on,
  },
];

final List<Map<String, dynamic>> completedActivities = [
  {
    'title': 'Lead Status Update in CRM',
    'location': '',
    'phone': '',
    'crmSystem': 'CRM System',
    'otherDetails': 'Mark contacted & pending leads',
    'designation': '',
    'time': 'End of Day',
    'status': 'Completed',
    'icon': Icons.desktop_windows,
  },
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _clockedIn = false;
  bool _onBreak = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceMuted,
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(12.h),
        child: Container(
          color: AppColors.surfaceMuted,
          padding: EdgeInsets.symmetric(horizontal: 4.w),
          child: SafeArea(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 1.h),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'JETOX',
                    style: TextStyle(
                      color: primaryColor,
                      fontWeight: FontWeight.w800,
                      fontSize: 20.sp,
                      letterSpacing: 0.5,
                    ),
                  ),
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      InkWell(
                        onTap: () => Navigator.pushNamed(
                          context,
                          notificationScreen,
                        ),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          width: 4.5.h,
                          height: 4.5.h,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
                            color: Colors.white,
                          ),
                          child: Icon(
                            Icons.notifications_none_rounded,
                            color: AppColors.textPrimary,
                            size: 22.sp,
                          ),
                        ),
                      ),
                      Positioned(
                        right: 6,
                        top: 6,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFFE5463E),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: Padding(
        padding: EdgeInsets.only(left: 4.w, right: 4.w, bottom: 1.h, top: 0),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: EdgeInsets.fromLTRB(4.w, 2.h, 4.w, 2.5.h),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.mintHero,
                      AppColors.mintHeroEnd,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: primaryColor.withOpacity(0.12)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 18.sp,
                          color: AppColors.textSecondary,
                        ),
                        SizedBox(width: 1.w),
                        Text(
                          'Surat HQ',
                          style: TextStyle(
                            fontSize: 13.5.sp,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 1.h),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Good Morning, XYZ John',
                                style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 14.sp,
                                ),
                              ),
                              SizedBox(height: 0.4.h),
                              Text(
                                'Let’s go to work!',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 21.sp,
                                  fontWeight: FontWeight.w700,
                                  height: 1.15,
                                ),
                              ),
                            ],
                          ),
                        ),
                        CustomAssetImage(
                          imagePath: AppIcons.clockIcon,
                          width: 22.w,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: 2.5.h),
              _buildClockActions(),
              SizedBox(height: 3.h),
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(2.h),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: primaryColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Total working hour',
                          style: TextStyle(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        InkWell(
                          onTap: () => Navigator.pushNamed(
                            context,
                            leaveRequestPage,
                          ),
                          child: Row(
                            children: [
                              Text(
                                'Apply Leave',
                                style: TextStyle(
                                  color: AppColors.link,
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Icon(
                                size: 19.sp,
                                Icons.chevron_right_rounded,
                                color: AppColors.link,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 2.h),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: EdgeInsets.symmetric(vertical: 1.h),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade200),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Padding(
                              padding: EdgeInsets.only(left: 4.w),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Current Time',
                                    style: TextStyle(
                                      color: Colors.black45,
                                      fontSize: 13.8.sp,
                                    ),
                                  ),
                                  SizedBox(height: 0.5.h),
                                  Text(
                                    '00:00Hrs',
                                    style: TextStyle(
                                      fontSize: 16.sp,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 3.w),
                        Expanded(
                          child: Container(
                            padding: EdgeInsets.symmetric(vertical: 1.h),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade200),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Padding(
                              padding: EdgeInsets.only(left: 4.w),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Break Time',
                                    style: TextStyle(
                                      color: Colors.black45,
                                      fontSize: 13.8.sp,
                                    ),
                                  ),
                                  SizedBox(height: 0.5.h),
                                  Text(
                                    '00:00Hrs',
                                    style: TextStyle(
                                      fontSize: 16.sp,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  ],
                ),
              ),
              SizedBox(height: 3.h),
              Container(
                padding: EdgeInsets.all(2.h),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Add your Task',
                          style: TextStyle(
                            color: Colors.black45,
                            fontSize: 13.8.sp,
                          ),
                        ),
                        SizedBox(height: 0.5.h),
                        Text(
                          'May 12th, 2025',
                          style: TextStyle(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () =>
                            Navigator.pushNamed(context, addTaskScreen),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 5.w,
                            vertical: 0.8.h,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: primaryColor),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '+ Add Task',
                            style: TextStyle(
                              color: primaryColor,
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 3.h),
              Row(
                children: [
                  Text(
                    'Today’s Activity',
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, taskScreen),
                    child: Text(
                      'View All',
                      style: TextStyle(
                        color: Colors.black45,
                        fontSize: 13.8.sp,
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 1.5.h),
              ListView.builder(
                physics: NeverScrollableScrollPhysics(),
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemCount: todayActivities.length,
                itemBuilder: (context, index) {
                  return activity(
                    title: todayActivities[index]["title"],
                    status: todayActivities[index]["status"],
                    icon: todayActivities[index]["location"] != ""
                        ? AppIcons.locationIcon
                        : todayActivities[index]["phone"] != ""
                            ? AppIcons.phoneIcon
                            : todayActivities[index]["crmSystem"] != ""
                                ? AppIcons.crmIcon
                                : AppIcons.userIcon,
                    designation: todayActivities[index]["designation"],
                    time: todayActivities[index]["time"],
                    location: todayActivities[index]["location"],
                    phone: todayActivities[index]["phone"],
                    crmSystem: todayActivities[index]["crmSystem"],
                    userName: todayActivities[index]["userName"],
                  );
                },
              ),
              SizedBox(height: 2.h),
              Text(
                'Completed',
                style: TextStyle(
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 1.5.h),
              ListView.builder(
                physics: NeverScrollableScrollPhysics(),
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemCount: completedActivities.length,
                itemBuilder: (context, index) {
                  return activity(
                    title: completedActivities[index]["title"],
                    status: completedActivities[index]["status"],
                    icon: completedActivities[index]["location"] != ""
                        ? AppIcons.locationIcon
                        : completedActivities[index]["phone"] != ""
                            ? AppIcons.phoneIcon
                            : completedActivities[index]["crmSystem"] != ""
                                ? AppIcons.crmIcon
                                : AppIcons.userIcon,
                    designation: completedActivities[index]["designation"],
                    time: completedActivities[index]["time"],
                    location: completedActivities[index]["location"],
                    phone: completedActivities[index]["phone"],
                    crmSystem: completedActivities[index]["crmSystem"],
                    userName: completedActivities[index]["otherDetails"],
                    isCompleted: true,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildClockActions() {
    if (!_clockedIn) {
      return SizedBox(
        width: double.infinity,
        child: CustomButton(
          isOutlined: false,
          text: 'Clock In',
          onPressed: () => setState(() => _clockedIn = true),
        ),
      );
    }
    final primaryLabel = _onBreak ? 'Back to Work' : 'Take a Break';
    void primaryAction() {
      setState(() => _onBreak = !_onBreak);
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: CustomButton(
            isOutlined: false,
            text: primaryLabel,
            onPressed: primaryAction,
          ),
        ),
        SizedBox(width: 3.w),
        Expanded(
          child: CustomButton(
            isOutlined: true,
            text: 'Clock Out',
            onPressed: () => setState(() {
              _clockedIn = false;
              _onBreak = false;
            }),
          ),
        ),
      ],
    );
  }
}

activity({
  required String title,
  required String status,
  required String icon,
  required String location,
  required String phone,
  required String crmSystem,
  required String userName,
  required String designation,
  required String time,
  bool isCompleted = false,
}) {
  return Container(
    margin: EdgeInsets.only(bottom: 1.h),
    padding: EdgeInsets.symmetric(vertical: 1.h, horizontal: 4.w),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: Colors.grey.shade200),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16.sp,
                ),
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: 2.w,
                vertical: 0.3.h,
              ),
              decoration: BoxDecoration(
                color: status == "Completed"
                    ? AppColors.primary.withOpacity(0.1)
                    : status == "In Progress"
                        ? AppColors.progressBadge
                        : AppColors.pendingBadge,
                borderRadius: BorderRadius.circular(30),
              ),
              child: Text(
                status,
                style: TextStyle(
                  color: status == "Completed"
                      ? AppColors.primaryDark
                      : status == "In Progress"
                          ? AppColors.progressText
                          : AppColors.pendingText,
                  fontSize: 13.7.sp,
                  fontWeight: FontWeight.w500,
                ),
              ),
            )
          ],
        ),
        SizedBox(height: 1.2.h),
        Row(
          children: [
            CustomAssetImage(
                imagePath: location != ""
                    ? AppIcons.locationIcon
                    : phone != ""
                        ? AppIcons.phoneIcon
                        : crmSystem != ""
                            ? AppIcons.crmIcon
                            : AppIcons.userIcon,
                width: 17.sp),
            SizedBox(width: 1.w),
            Text(
              location != ""
                  ? location
                  : phone != ""
                      ? phone
                      : crmSystem != ""
                          ? crmSystem
                          : "",
              style: TextStyle(
                fontSize: 14.sp,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        SizedBox(height: 1.h),
        Row(
          children: [
            CustomAssetImage(
              imagePath: isCompleted ? AppIcons.doneIcon : AppIcons.liUserIcon,
              width: 17.sp,
            ),
            SizedBox(width: 1.w),
            Expanded(
              child: Text(
                '$userName ($designation)',
                style: TextStyle(
                  fontSize: 14.sp,
                  color: Colors.black87,
                ),
              ),
            ),
            Icon(Icons.access_time, size: 17.sp),
            SizedBox(width: 0.5.w),
            Text(
              time,
              style: TextStyle(
                fontSize: 14.sp,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ],
    ),
  );
}
