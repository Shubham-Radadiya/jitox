import 'package:flutter/material.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

PreferredSizeWidget customAppBar(String title, BuildContext context) =>
    PreferredSize(
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
                    title,
                    style: TextStyle(
                      fontSize: 18.sp,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 4.5.h),
            ],
          ),
        ),
      ),
    );

Widget arrowBackButton(context) => GestureDetector(
      onTap: () => Navigator.pop(context),
      child: Container(
        height: 4.5.h,
        width: 4.5.h,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            width: 1,
            color: Color.fromARGB(255, 224, 224, 224),
          ),
        ),
        child: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 2.h),
          onPressed: () {},
        ),
      ),
    );
