import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Screens/Home/home_screen.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class TaskScreen extends StatefulWidget {
  const TaskScreen({super.key});

  @override
  State<TaskScreen> createState() => _TaskScreenState();
}

class _TaskScreenState extends State<TaskScreen> {
  String selected = "Dealer";

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
                      "Task List",
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
                    Icons.more_vert_outlined,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: Padding(
        padding: EdgeInsets.all(4.w),
        child: SingleChildScrollView(
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  buildButton("All"),
                  buildButton("Dealer"),
                  buildButton("Farmer"),
                  buildButton("Other"),
                ],
              ),
              SizedBox(
                height: 3.h,
              ),
              Container(
                height: 6.5.h,
                child: Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search here...',
                      hintStyle: TextStyle(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w400,
                          color: Color.fromARGB(255, 68, 67, 67)),
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
              SizedBox(
                height: 3.h,
              ),
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

  Widget buildButton(String label) {
    final isSelected = selected == label;
    return SizedBox(
      height: 4.3.h,
      width: (100.w - (8.w + 6.w)) / 4,
      child: InkWell(
        onTap: () {
          setState(() {
            selected = label;
          });
        },
        child: Container(
          decoration: BoxDecoration(
            color: isSelected ? primaryColor : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? primaryColor : Colors.grey.shade300,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 15.sp,
              fontWeight: FontWeight.w400,
              color: isSelected ? Colors.white : Colors.black,
            ),
          ),
        ),
      ),
    );
  }
}
