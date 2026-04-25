import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Screens/Order/order_screen.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class AllOrdersScreen extends StatefulWidget {
  const AllOrdersScreen({super.key});

  @override
  State<AllOrdersScreen> createState() => _AllOrdersScreenState();
}

class _AllOrdersScreenState extends State<AllOrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<String> tabTitles = [
    'All Orders',
    'Order Placed',
    'Admin Approved',
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
                      "All Orders",
                      style: TextStyle(
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                Container(
                  height: 4.5.h,
                  width: 4.5.h,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      width: 1,
                      color: Color.fromARGB(255, 224, 224, 224),
                    ),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(1.h),
                    child: CustomAssetImage(
                      imagePath: AppIcons.calendaeTimeIcon,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: Padding(
        padding: EdgeInsets.all(4.w),
        child: Column(
          children: [
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: Color.fromARGB(255, 238, 237, 237),
                  width: 1,
                ),
              ),
              padding: EdgeInsets.symmetric(horizontal: 2.w, vertical: 1.h),
              child: Column(
                children: [
                  Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.h),
                    decoration: BoxDecoration(
                      color: Color(0xfff5fcf8),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: EdgeInsets.all(2.w),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: primaryColor, width: 0.1),
                          ),
                          child: CustomAssetImage(
                            imagePath: AppIcons.boxIcon,
                            height: 3.w,
                          ),
                        ),
                        SizedBox(width: 2.w),
                        Text(
                          "Orders",
                          style: TextStyle(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Spacer(),
                        Text(
                          "10 Orders",
                          style: TextStyle(
                            fontSize: 14.5.sp,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 1.h),
                  TextField(
                    onTapOutside: (event) => FocusScope.of(context).unfocus(),
                    decoration: InputDecoration(
                      hintText: 'Search your product code here...',
                      contentPadding: EdgeInsets.symmetric(vertical: 1.5.h),
                      hintStyle: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w400,
                        color: Color.fromARGB(255, 146, 145, 145),
                      ),
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
                ],
              ),
            ),
            SizedBox(
              height: 2.h,
            ),
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 4.5.h,
                    color: Colors.white,
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        double totalTabBarWidth = constraints.maxWidth;
                        double tabWidth = totalTabBarWidth / tabTitles.length;

                        return TabBar(
                          controller: _tabController,
                          labelColor: primaryColor,
                          unselectedLabelColor: Colors.black45,
                          labelPadding: EdgeInsets.zero,
                          indicator: UnderlineTabIndicator(
                            borderSide:
                                BorderSide(width: 1.4, color: primaryColor),
                            insets: EdgeInsets.symmetric(horizontal: tabWidth),
                          ),
                          tabs: tabTitles
                              .map(
                                (title) => Container(
                                  alignment: Alignment.center,
                                  width:
                                      tabWidth, // force each tab to equal width
                                  child: Text(
                                    title,
                                    style: TextStyle(
                                      fontSize: 14.sp,
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                        );
                      },
                    ),
                  ),
                ),
                SizedBox(width: 2.w),
                GestureDetector(
                  onTap: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (context) => FilterBottomSheet(),
                    );
                  },
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
                    child: Padding(
                      padding: EdgeInsets.all(1.3.h),
                      child: CustomAssetImage(
                        imagePath: AppIcons.filterIcon,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(
              height: 2.h,
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  ordersList(true),
                  ordersList(true),
                  ordersList(true),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class FilterBottomSheet extends StatefulWidget {
  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  final List<String> statusOptions = [
    'Confirmed',
    'Cancelled',
    'Returned',
  ];

  final List<String> timeFilters = [
    'Last 30 Days',
    'Last 3 Months',
    'Last 6 Months',
    'Anytime',
  ];

  Set<String> selectedStatus = {'Confirmed'};
  String selectedTime = 'Anytime';

  void resetFilters() {
    setState(() {
      selectedStatus = {'Confirmed'};
      selectedTime = 'Anytime';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100.w,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(2.h)),
      ),
      padding: EdgeInsets.symmetric(horizontal: 5.w, vertical: 3.h),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Filter',
                  style:
                      TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w500)),
              Spacer(),
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
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
              ),
            ],
          ),
          SizedBox(height: 1.2.h),
          Divider(
            color: Colors.grey[200],
          ),
          SizedBox(height: 1.5.h),
          Text('Status',
              style: TextStyle(fontSize: 17.sp, fontWeight: FontWeight.w500)),
          SizedBox(height: 2.h),
          ...statusOptions.map((status) => CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(status, style: TextStyle(fontSize: 16.sp)),
                value: selectedStatus.contains(status),
                activeColor: primaryColor,
                checkColor: Colors.white,
                onChanged: (v) {
                  setState(() {
                    v!
                        ? selectedStatus.add(status)
                        : selectedStatus.remove(status);
                  });
                },
                controlAffinity: ListTileControlAffinity.leading,
              )),
          SizedBox(height: 1.5.h),
          Divider(
            color: Colors.grey[200],
          ),
          SizedBox(height: 1.5.h),
          Text('Time',
              style: TextStyle(fontSize: 17.sp, fontWeight: FontWeight.w500)),
          SizedBox(height: 2.h),
          ...timeFilters.map((time) => RadioListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(time, style: TextStyle(fontSize: 16.sp)),
                value: time,
                groupValue: selectedTime,
                activeColor: primaryColor,
                onChanged: (v) => setState(() => selectedTime = v.toString()),
              )),
          Divider(
            color: Colors.grey[200],
          ),
          SizedBox(height: 1.7.h),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    resetFilters();
                  },
                  child: Container(
                    height: 6.5.h,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(13),
                      border: Border.all(color: Colors.black, width: 0.7),
                    ),
                    child: Center(
                      child: Text(
                        "Clear Filter",
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
                  onTap: () {},
                  child: Container(
                    height: 6.5.h,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(13),
                      color: primaryColor,
                    ),
                    child: Center(
                      child: Text(
                        "Apply",
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
        ],
      ),
    );
  }
}
