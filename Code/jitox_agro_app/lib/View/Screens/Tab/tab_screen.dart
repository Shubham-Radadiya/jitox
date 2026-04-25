import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Screens/Account/account_screen.dart';
import 'package:jitox_agro_app/View/Screens/Home/home_screen.dart';
import 'package:jitox_agro_app/View/Screens/Order/all_orders_screen.dart';
import 'package:jitox_agro_app/View/Screens/Order/order_screen.dart';
import 'package:jitox_agro_app/View/Screens/Reports/report_screen.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class TabScreen extends StatefulWidget {
  TabScreen({super.key});

  @override
  State<TabScreen> createState() => _TabScreenState();
}

class _TabScreenState extends State<TabScreen> {
  final PageController _pageController = PageController(initialPage: 0);
  int pageIndex = 0;

  List pages = [];

  void _onItemTapped(int index) {
    print("_onItemTapped :: $index");
    if (index == 4) {
      pages[1]["page"] = AllOrdersScreen();
      index = 1;
    }
    setState(() {
      pageIndex = index;
      _pageController.animateToPage(
        index,
        duration: const Duration(milliseconds: 1),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void initState() {
    super.initState();
    pages = [
      {
        "id": 0,
        "icon": AppIcons.homeIcon,
        "label": "Home",
        "page": const HomeScreen(),
      },
      {
        "id": 1,
        "icon": AppIcons.orderIcon,
        "label": "Order",
        "page": OrderScreen(onItemTapped: _onItemTapped),
      },
      {
        "id": 2,
        "icon": AppIcons.chartIcon,
        "label": "Reports",
        "page": ReportScreen(),
      },
      {
        "id": 3,
        "icon": AppIcons.liUserIcon,
        "label": "Account",
        "page": AccountScreen(),
      },
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        onPageChanged: (i) {
          setState(() {
            pageIndex = i;
          });
        },
        children: pages.take(4).map((e) => e["page"] as Widget).toList(),
      ),
      bottomNavigationBar: bottomNavbar(),
    );
  }

  bottomNavbar() {
    return Container(
      height: 8.h,
      decoration: BoxDecoration(
        color: AppColors.bottomNavBg,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          ...pages.take(4).map((e) {
            return Container(
              width: 100.w / pages.length,
              decoration: BoxDecoration(
                border: pageIndex == e["id"]
                    ? Border(
                        top: BorderSide(
                          color: primaryColor,
                          width: 1.5,
                        ),
                      )
                    : null,
                gradient: pageIndex == e["id"]
                    ? LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.green.withOpacity(0.1), // light tint at top
                          Colors.transparent, // fully transparent at bottom
                        ],
                        stops: [0.0, 0.4], // 30% gradient fade
                      )
                    : null,
              ),
              child: Column(
                children: [
                  IconButton(
                    onPressed: () {
                      _onItemTapped(e["id"] as int);
                    },
                    padding: EdgeInsets.zero,
                    constraints: BoxConstraints(), // remove enforced min size
                    visualDensity:
                        VisualDensity.compact, // reduce spacing around
                    icon: CustomAssetImage(
                      imagePath: e["icon"],
                      width: 19.sp,
                      color: pageIndex != e["id"] ? Colors.black : primaryColor,
                    ),
                  ),
                  Text(
                    e["label"],
                    style: TextStyle(
                        fontSize: 15.sp,
                        color:
                            pageIndex != e["id"] ? Colors.black : primaryColor),
                  )
                ],
              ),
            );
          })
        ],
      ),
    );
  }
}

void showReminderBottomSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            margin: EdgeInsets.only(top: 8.h),
            padding: EdgeInsets.fromLTRB(4.w, 10.h, 4.w, 3.h),
            decoration: BoxDecoration(
              color: Colors.white,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 2.h,
                ),
                Text(
                  "Reminder",
                  style: TextStyle(
                    fontSize: 20.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 1.h),
                Text(
                  "Your next task begins at 11:00 PM. Get ready!",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16.sp,
                    color: Colors.grey[800],
                  ),
                ),
                SizedBox(height: 1.7.h),
                Divider(
                  color: Colors.grey[200],
                ),
                SizedBox(height: 1.7.h),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          Navigator.pop(context);
                        },
                        child: Container(
                          height: 6.5.h,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.black, width: 0.7),
                          ),
                          child: Center(
                            child: Text(
                              "Close",
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
                        onTap: () {
                          Navigator.pop(context);
                        },
                        child: Container(
                          height: 6.5.h,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: primaryColor,
                          ),
                          child: Center(
                            child: Text(
                              "Got it",
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
                SizedBox(height: 1.7.h),
              ],
            ),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                height: 18.h,
                width: 18.h,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 5,
                      spreadRadius: 3,
                      offset: Offset(0, 1),
                    ),
                  ],
                ),
                padding: EdgeInsets.all(2.h),
                child: Image.asset(
                  Images.bell,
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ),
        ],
      );
    },
  );
}
