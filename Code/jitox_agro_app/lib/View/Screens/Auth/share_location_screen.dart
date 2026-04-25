import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

const Color blueColor = Color(0xFF074785);

class ShareLocationScreen extends StatelessWidget {
  ShareLocationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: customAppBar('Share Your Location', context),
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: 4.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 1.h,
            ),
            Container(
              height: 6.5.h,
              child: Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search Your location here...',
                    hintStyle: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w400,
                        color: Color.fromARGB(255, 146, 145, 145)),
                    prefixIcon: Icon(
                      CupertinoIcons.search,
                      color: Color.fromARGB(255, 146, 145, 145),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(50),
                      borderSide: BorderSide(
                        color: Color.fromARGB(255, 238, 237, 237),
                        width: 1,
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(50),
                      borderSide: BorderSide(
                        color: Color.fromARGB(255, 238, 237, 237),
                        width: 1,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(50),
                      borderSide: BorderSide(
                        color: Color.fromARGB(255, 238, 237, 237),
                        width: 1,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            SizedBox(height: 3.h),

            Row(
              children: [
                CircleAvatar(
                  radius: 2.9.h,
                  backgroundColor: const Color(0xFFEEF3FF),
                  child: CustomAssetImage(
                    imagePath: AppIcons.currentLocationIcon,
                    height: 3.5.h,
                    color: Color(0xFF242424),
                  ),
                ),
                SizedBox(
                  width: 4.w,
                ),
                Text(
                  'Use my current location',
                  style: TextStyle(
                    fontSize: 16.sp,
                    color: blueColor,
                  ),
                ),
                Spacer(),
                Icon(Icons.arrow_forward_ios, size: 1.5.h),
              ],
            ),
            SizedBox(height: 2.h),

            Row(
              children: [
                CircleAvatar(
                  radius: 2.9.h,
                  backgroundColor: const Color(0xFFEEF3FF),
                  child: Icon(Icons.add, size: 3.h, color: Color(0xFF242424)),
                ),
                SizedBox(
                  width: 4.w,
                ),
                Text(
                  'Add new address',
                  style: TextStyle(
                    fontSize: 16.sp,
                    color: blueColor,
                  ),
                ),
              ],
            ),
            SizedBox(height: 3.h),

            // Saved Addresses label
            Text(
              'Saved Addresses',
              style: TextStyle(
                fontSize: 16.sp,
                color: Color.fromARGB(255, 146, 145, 145),
              ),
            ),
            SizedBox(height: 1.5.h),

            // Saved Address Tiles
            const SavedAddressTile(
              address: '4517 Washington Ave. Manchester, Kentucky 39495',
            ),
            const SavedAddressTile(
              address: '2972 Westheimer Rd. Santa Ana, Illinois 85486',
            ),
          ],
        ),
      ),
    );
  }
}

class SavedAddressTile extends StatelessWidget {
  final String address;

  const SavedAddressTile({super.key, required this.address});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 1.8.h),
      decoration: const BoxDecoration(
        border: Border(
          bottom:
              BorderSide(color: Color.fromARGB(255, 238, 237, 237), width: 1),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 2.9.h,
            backgroundColor: const Color(0xFFEEF3FF),
            child:
                Icon(Icons.location_on_rounded, size: 2.7.h, color: blueColor),
          ),
          SizedBox(width: 3.w),
          Expanded(
            child: Text(
              address,
              style: TextStyle(fontSize: 16.sp),
            ),
          ),
        ],
      ),
    );
  }
}
