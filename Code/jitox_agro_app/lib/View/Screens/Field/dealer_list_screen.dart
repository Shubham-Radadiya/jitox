import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/mr/mr_app_bar.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class DealerListScreen extends StatefulWidget {
  const DealerListScreen({super.key});

  @override
  State<DealerListScreen> createState() => _DealerListScreenState();
}

class _DealerListScreenState extends State<DealerListScreen> {
  final _searchCtrl = TextEditingController();

  static const _dealers = [
    _Dealer(
      name: 'DEALER NAME 382',
      phone: '753628917',
      location: 'Modasa, Tal: MODASA, Dist: ARAVALLI',
      balance: '4876.06 Dr',
      creditLimit: '0.0',
    ),
    _Dealer(
      name: 'DEALER NAME 384',
      phone: '540934559',
      location: 'Vijapur, Tal: Vijapur, Dist: mahesana',
      balance: '21.00 Dr',
      creditLimit: '0.0',
    ),
    _Dealer(
      name: 'DEALER NAME 385',
      phone: '1805000907',
      location: 'Tintoi, Tal: Modasa, Dist: Sabarkantha',
      balance: '357749.00 Dr',
      creditLimit: '0.0',
    ),
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = _searchCtrl.text.trim().toLowerCase();
    final filtered = _dealers.where((d) {
      if (q.isEmpty) return true;
      return d.name.toLowerCase().contains(q) ||
          d.phone.contains(q) ||
          d.location.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const MrAppBar(
        title: 'Dealer List',
        showMenu: false,
        showBack: true,
      ),
      body: Column(
        children: [
          Container(
            color: primaryColor,
            padding: EdgeInsets.fromLTRB(4.w, 0, 4.w, 1.5.h),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Search Here',
                      hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 13.sp),
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.2.h),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 2.w),
                Column(
                  children: [
                    Material(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(6),
                      child: InkWell(
                        onTap: () => setState(() {}),
                        borderRadius: BorderRadius.circular(6),
                        child: Padding(
                          padding: EdgeInsets.all(1.5.w),
                          child: Icon(Icons.refresh, color: Colors.white, size: 22.sp),
                        ),
                      ),
                    ),
                    Text(
                      'Refresh',
                      style: TextStyle(color: Colors.white, fontSize: 9.sp),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              itemCount: filtered.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade300),
              itemBuilder: (context, i) {
                final d = filtered[i];
                return ListTile(
                  contentPadding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 0.8.h),
                  title: Text(
                    d.name,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13.sp,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(height: 0.5.h),
                      Row(
                        children: [
                          Icon(Icons.phone, size: 14.sp, color: AppColors.textSecondary),
                          SizedBox(width: 1.w),
                          Text(d.phone, style: TextStyle(fontSize: 12.sp)),
                        ],
                      ),
                      SizedBox(height: 0.3.h),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.location_on_outlined,
                              size: 14.sp, color: AppColors.textSecondary),
                          SizedBox(width: 1.w),
                          Expanded(
                            child: Text(
                              d.location,
                              style: TextStyle(fontSize: 11.5.sp, color: AppColors.textSecondary),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 0.5.h),
                      Row(
                        children: [
                          Text(
                            'Bal.: ${d.balance}',
                            style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w500),
                          ),
                          const Spacer(),
                          Text(
                            'C.L.: ${d.creditLimit}',
                            style: TextStyle(fontSize: 12.sp, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                  trailing: PopupMenuButton<String>(
                    icon: Icon(Icons.more_vert, color: AppColors.textPrimary),
                    itemBuilder: (_) => [
                      const PopupMenuItem(value: 'pay', child: Text('Add Payment')),
                      const PopupMenuItem(value: 'order', child: Text('New Order')),
                    ],
                    onSelected: (v) {
                      if (v == 'pay') {
                        Navigator.pushNamed(
                          context,
                          addDealerPaymentScreen,
                          arguments: d.name,
                        );
                      }
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _Dealer {
  const _Dealer({
    required this.name,
    required this.phone,
    required this.location,
    required this.balance,
    required this.creditLimit,
  });

  final String name;
  final String phone;
  final String location;
  final String balance;
  final String creditLimit;
}
