import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/mr/mr_app_bar.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class LiveFeedScreen extends StatefulWidget {
  const LiveFeedScreen({super.key});

  @override
  State<LiveFeedScreen> createState() => _LiveFeedScreenState();
}

class _LiveFeedScreenState extends State<LiveFeedScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: MrAppBar(
        title: 'Live Feed',
        showMenu: false,
        showBack: true,
        trailing: Padding(
          padding: EdgeInsets.only(right: 2.w),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Select State',
                style: TextStyle(color: Colors.white, fontSize: 11.sp),
              ),
              Icon(Icons.my_location, color: Colors.white, size: 20.sp),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          Container(
            color: primaryColor,
            child: Row(
              children: [
                _tabBtn('NORMAL VIEW', 0),
                _tabBtn('SATELLITE VIEW', 1),
              ],
            ),
          ),
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: _tab == 0
                          ? [
                              const Color(0xFFE8EEF2),
                              const Color(0xFF8BB4D4),
                              const Color(0xFF4A90C2),
                            ]
                          : [
                              const Color(0xFF2D4A2D),
                              const Color(0xFF4A6741),
                              const Color(0xFF6B8F5E),
                            ],
                    ),
                  ),
                  child: Center(
                    child: Text(
                      _tab == 0 ? 'GUJARAT' : 'SATELLITE — GUJARAT',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 22.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 4.w,
                  bottom: 4.h,
                  child: FloatingActionButton.small(
                    backgroundColor: primaryColor,
                    onPressed: () {},
                    child: const Icon(Icons.keyboard_arrow_up, color: Colors.white),
                  ),
                ),
                Positioned(
                  right: 4.w,
                  bottom: 4.h,
                  child: Column(
                    children: [
                      _zoomBtn(Icons.add),
                      SizedBox(height: 0.5.h),
                      _zoomBtn(Icons.remove),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _tabBtn(String label, int index) {
    final active = _tab == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _tab = index),
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 1.2.h),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: active ? Colors.white : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 11.sp,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }

  Widget _zoomBtn(IconData icon) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(4),
      child: InkWell(
        onTap: () {},
        child: SizedBox(
          width: 10.w,
          height: 10.w,
          child: Icon(icon, size: 20.sp),
        ),
      ),
    );
  }
}
