import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class TurnOnNotification extends StatefulWidget {
  const TurnOnNotification({super.key});

  @override
  State<TurnOnNotification> createState() => _TurnOnNotificationState();
}

class _TurnOnNotificationState extends State<TurnOnNotification> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.all(4.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 5.h,
            ),
            Text(
              "Get updates on your order\nstatus and activities",
              style: TextStyle(
                fontSize: 19.sp,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(
              height: 2.h,
            ),
            Text(
              "Allow push notifications to get real-time updates\non your activity & order status.",
              style: TextStyle(fontSize: 16.sp),
            ),
            SizedBox(
              height: 3.h,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CustomAssetImage(
                  imagePath: Images.threeDAnnouncement,
                  height: 40.h,
                ),
              ],
            ),
            SizedBox(
              height: 4.h,
            ),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: false,
                text: "Turn on Notification",
                onPressed: () {},
              ),
            ),
            SizedBox(
              height: 2.h,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  "Not Now",
                  style: TextStyle(fontSize: 16.sp),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
