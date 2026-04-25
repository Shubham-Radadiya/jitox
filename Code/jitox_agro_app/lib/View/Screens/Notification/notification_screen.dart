import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class NotificationModel {
  final IconData icon;
  final String title;
  final String subtitle;
  final String time;
  final bool isHighlight;
  final bool hasViewDetails;

  NotificationModel({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.time,
    this.isHighlight = false,
    this.hasViewDetails = false,
  });
}

class NotificationsScreen extends StatelessWidget {
  final List<NotificationModel> notifications = [
    NotificationModel(
      icon: Icons.alarm,
      title: 'Reminder!',
      subtitle: 'Your next task begins at 11:00 PM. Get ready!',
      time: '10 min',
      isHighlight: true,
    ),
    NotificationModel(
      icon: Icons.task_alt,
      title: 'Task Assign',
      subtitle: 'Task Alert: You\'ve received a new assignment!',
      time: '30 min',
      isHighlight: true,
    ),
    NotificationModel(
      icon: Icons.event,
      title: 'Meeting',
      subtitle: 'Upcoming Meeting at 4:40 pm: Don’t be late!',
      time: '1 hour',
    ),
    NotificationModel(
      icon: Icons.checklist_sharp,
      title: 'Admin Approval',
      subtitle: 'Admin Approved Your Request.',
      time: '6 hour',
    ),
    NotificationModel(
      icon: Icons.checklist_sharp,
      title: 'Admin Approval',
      subtitle: 'Update: Admin has reviewed and approved your submission.',
      time: '1 day',
    ),
    NotificationModel(
      icon: Icons.info_outline,
      title: 'Payment Received',
      subtitle:
          '₹2,500 received from Rahul Traders via UPI. Order #ORD1245 marked as paid.',
      time: '1 day',
      hasViewDetails: true,
    ),
    NotificationModel(
      icon: Icons.info_outline,
      title: 'Payment Due Soon',
      subtitle:
          'Payment of ₹3,200 is due from Green Agro Pvt. Ltd. for Order #ORD1190. Expected by Tomorrow (20 May).',
      time: '1 day',
      hasViewDetails: true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ResponsiveSizer(
      builder: (context, orientation, screenType) {
        return Scaffold(
          appBar: PreferredSize(
            preferredSize: Size.fromHeight(7.h),
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 4.w),
              decoration: const BoxDecoration(
                color: Colors.white,
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    arrowBackButton(context),
                    Expanded(
                      child: Center(
                        child: Text(
                          "Notifications",
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
          body: notifications.isEmpty
              ? noNotifications()
              : ListView.builder(
                  padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
                  itemCount: notifications.length,
                  itemBuilder: (context, index) {
                    final item = notifications[index];
                    return Container(
                      padding: EdgeInsets.all(3.w),
                      margin: EdgeInsets.only(bottom: 0.5.h),
                      decoration: BoxDecoration(
                        color: item.isHighlight
                            ? Colors.blue.withOpacity(0.06)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(3),
                        border: Border(
                          bottom: BorderSide(color: Colors.grey.shade200),
                        ),
                      ),
                      child: Column(
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(item.icon,
                                  size: 17.sp, color: Colors.black54),
                              SizedBox(width: 3.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.title,
                                      style: TextStyle(
                                        fontSize: 16.sp,
                                      ),
                                    ),
                                    SizedBox(height: 0.5.h),
                                    Text(
                                      item.subtitle,
                                      style: TextStyle(
                                        fontSize: 15.sp,
                                        color: Colors.black54,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(width: 2.w),
                              Text(
                                item.time,
                                style: TextStyle(
                                    fontSize: 14.sp, color: Colors.black54),
                              ),
                            ],
                          ),
                          if (item.hasViewDetails)
                            Padding(
                              padding: EdgeInsets.only(top: 1.h),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  SizedBox(width: 6.w),
                                  Text(
                                    'View Details',
                                    style: TextStyle(
                                      fontSize: 14.sp,
                                      color: Color.fromARGB(255, 21, 123, 206),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}

noNotifications() {
  return SingleChildScrollView(
    child: SizedBox(
      height: 90.h,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CustomAssetImage(
            imagePath: Images.noNotification,
            width: 60.w,
          ),
          SizedBox(
            height: 4.h,
          ),
          Text(
            "Nothing to display here!",
            style: TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 21.sp,
            ),
          ),
          SizedBox(
            height: 1.h,
          ),
          Center(
            child: Text(
              "We’ll notify you once we have new\nnotifications.",
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.black54,
              ),
            ),
          )
        ],
      ),
    ),
  );
}
