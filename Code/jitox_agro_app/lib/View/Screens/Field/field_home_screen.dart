import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/mr/mr_app_bar.dart';
import 'package:jitox_agro_app/View/Widgets/mr/mr_drawer.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

/// Main dashboard — MR Employee Tracker style (reference videos).
class FieldHomeScreen extends StatefulWidget {
  const FieldHomeScreen({super.key});

  @override
  State<FieldHomeScreen> createState() => _FieldHomeScreenState();
}

class _FieldHomeScreenState extends State<FieldHomeScreen> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _dayStarted = false;

  static const _menuItems = [
    _MenuItem('Dealer List', Icons.list_alt, dealerListScreen),
    _MenuItem('Dealer Order', Icons.edit_note, orderDetailPage),
    _MenuItem('Dealer Payment', Icons.payments_outlined, addDealerPaymentScreen),
    _MenuItem('Dealer Visit', Icons.map_outlined, null),
    _MenuItem('New Party(Dealer)', Icons.person_add_alt_1, null),
    _MenuItem('Reminder', Icons.alarm, null),
    _MenuItem('Customer(Farmer)', Icons.agriculture, null),
    _MenuItem('Meeting Schedule', Icons.event_note, null),
    _MenuItem('Product Demo', Icons.science_outlined, productDemoScreen),
    _MenuItem('Expense', Icons.receipt_long, null),
    _MenuItem('Calendar', Icons.calendar_month, null),
    _MenuItem('Print', Icons.print_outlined, null),
  ];

  String _nowLabel() {
    final n = DateTime.now();
    final h = n.hour > 12 ? n.hour - 12 : (n.hour == 0 ? 12 : n.hour);
    final ampm = n.hour >= 12 ? 'PM' : 'AM';
    final m = n.minute.toString().padLeft(2, '0');
    final s = n.second.toString().padLeft(2, '0');
    return '${n.day.toString().padLeft(2, '0')}/${n.month.toString().padLeft(2, '0')}/${n.year} '
        '${h.toString().padLeft(2, '0')}:$m:$s $ampm';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.white,
      drawer: const MrDrawer(),
      appBar: MrAppBar(
        title: 'MR Employee Tracker',
        onMenuTap: () => _scaffoldKey.currentState?.openDrawer(),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(4.w, 1.5.h, 4.w, 1.h),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _infoLine('Code', 'KANT-10'),
                        _infoLine('Name', 'Mr. Mayurkumar B. Shilu'),
                        _infoLine('Mobile', '8141931512'),
                        Text(
                          'Date : ${_nowLabel()}',
                          style: TextStyle(
                            fontSize: 11.sp,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() => _dayStarted = !_dayStarted),
                    child: Container(
                      width: 22.w,
                      height: 22.w,
                      decoration: BoxDecoration(
                        color: primaryColor,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withOpacity(0.35),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _dayStarted ? 'DAY\nEND' : 'DAY\nSTART',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w800,
                          height: 1.1,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 0.5.h),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _QuickLink(
                    label: 'Live Feed',
                    icon: Icons.sensors,
                    onTap: () => Navigator.pushNamed(context, liveFeedScreen),
                  ),
                  _QuickLink(
                    label: 'Achievement',
                    icon: Icons.emoji_events_outlined,
                    onTap: () {},
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: Colors.grey.shade300),
            Padding(
              padding: EdgeInsets.fromLTRB(3.w, 1.5.h, 3.w, 2.h),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 1.5.h,
                  crossAxisSpacing: 2.w,
                  childAspectRatio: 0.92,
                ),
                itemCount: _menuItems.length,
                itemBuilder: (context, index) {
                  final item = _menuItems[index];
                  return _MenuTile(
                    label: item.label,
                    icon: item.icon,
                    onTap: () {
                      if (item.route != null) {
                        Navigator.pushNamed(context, item.route!);
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('${item.label} — coming soon')),
                        );
                      }
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoLine(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 0.3.h),
      child: RichText(
        text: TextSpan(
          style: TextStyle(fontSize: 12.sp, color: AppColors.textPrimary),
          children: [
            TextSpan(
              text: '$label : ',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            TextSpan(text: value),
          ],
        ),
      ),
    );
  }
}

class _MenuItem {
  const _MenuItem(this.label, this.icon, this.route);
  final String label;
  final IconData icon;
  final String? route;
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFF8F8F8),
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 2.w, vertical: 1.h),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: primaryColor, size: 28.sp),
              SizedBox(height: 0.8.h),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10.5.sp,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                  height: 1.15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickLink extends StatelessWidget {
  const _QuickLink({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 0.8.h),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: EdgeInsets.all(1.2.w),
              decoration: BoxDecoration(
                color: primaryColor,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 18.sp),
            ),
            SizedBox(width: 2.w),
            Text(
              label,
              style: TextStyle(
                fontSize: 13.sp,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
