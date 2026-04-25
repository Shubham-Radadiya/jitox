import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Screens/Profile/personal_details_screen.dart';
import 'package:jitox_agro_app/View/Screens/Profile/professional_details_screen.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class ProfileInfoScreen extends StatefulWidget {
  const ProfileInfoScreen({super.key});

  @override
  State<ProfileInfoScreen> createState() => _ProfileInfoScreenState();
}

class _ProfileInfoScreenState extends State<ProfileInfoScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<String> tabTitles = [
    'Personal Details',
    'Professional Details',
  ];

  @override
  void initState() {
    _tabController = TabController(length: tabTitles.length, vsync: this);
    super.initState();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: customAppBar("Profile Info", context),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: primaryColor,
              unselectedLabelColor: Colors.black45,
              indicator: UnderlineTabIndicator(
                borderSide: BorderSide(width: 1.4, color: primaryColor),
                insets: EdgeInsets.symmetric(
                    horizontal: 38.w), // <-- control width here
              ),
              tabs: tabTitles
                  .map((title) => Tab(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                PersonalDetailScreen(),
                ProfessionalDetailsScreen(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(String title) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(2.h),
      ),
      child: Center(
        child: Text(
          title,
          style: TextStyle(
            fontSize: 2.5.h,
            fontWeight: FontWeight.bold,
            color: Colors.grey[600],
          ),
        ),
      ),
    );
  }
}
