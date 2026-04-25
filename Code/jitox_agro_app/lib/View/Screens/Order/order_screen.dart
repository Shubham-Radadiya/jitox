import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class OrderModel {
  final String customerName;
  final String company;
  final String orderTitle;
  final String products;
  final String orderDate;
  final String amount;
  final String image;

  OrderModel({
    required this.customerName,
    required this.company,
    required this.orderTitle,
    required this.products,
    required this.orderDate,
    required this.amount,
    required this.image,
  });
}

final List<OrderModel> orders = [
  OrderModel(
    customerName: 'Priya Mehra',
    company: 'Zenith Ltd.',
    orderTitle: 'GTY524',
    products: '10',
    orderDate: '20 Jan, 2:30 PM',
    amount: '₹1000.00',
    image: 'assets/images/seed1.png',
  ),
  OrderModel(
    customerName: 'John Doe',
    company: 'ABC Corp',
    orderTitle: 'GTY524',
    products: '10',
    orderDate: '20 Jan, 2:30 PM',
    amount: '₹1000.00',
    image: 'assets/images/seed2.png',
  ),
  OrderModel(
    customerName: 'Neha Kapoor',
    company: 'StarTech Ltd.',
    orderTitle: 'GTY524',
    products: '10',
    orderDate: '20 Jan, 2:30 PM',
    amount: '₹1000.00',
    image: 'assets/images/seed3.png',
  ),
];

class OrderScreen extends StatelessWidget {
  final onItemTapped;
  OrderScreen({required this.onItemTapped});

  @override
  Widget build(BuildContext context) {
    return ResponsiveSizer(
      builder: (context, orientation, screenType) {
        return Scaffold(
          backgroundColor: Colors.white,
          appBar: PreferredSize(
            preferredSize: Size.fromHeight(13.h),
            child: Container(
              color: const Color(0xfff5fcf8),
              padding: EdgeInsets.symmetric(horizontal: 4.w),
              child: SafeArea(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 1.h),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'JETOX',
                        style: TextStyle(
                          color: primaryColor,
                          fontWeight: FontWeight.w800,
                          fontSize: 20.sp,
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
                          Icons.notifications_none,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          body: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  color: const Color(0xfff5fcf8),
                  padding: EdgeInsets.only(left: 4.w, right: 4.w, top: 2.h),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Order Summary',
                            style: TextStyle(
                              fontSize: 17.sp,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Spacer(),
                          Row(
                            children: [
                              CustomAssetImage(
                                imagePath: AppIcons.calendaeTimeIcon,
                                width: 15.sp,
                                color: Colors.black87,
                              ),
                              SizedBox(
                                width: 2.w,
                              ),
                              Text(
                                '15 May, 2025',
                                style: TextStyle(
                                  fontSize: 15.sp,
                                  color: Colors.black87,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      SizedBox(height: 2.h),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: EdgeInsets.only(
                                  top: 3.5.w, bottom: 3.5.w, left: 3.5.w),
                              decoration: BoxDecoration(
                                color: Color.fromARGB(255, 233, 246, 235),
                                image: DecorationImage(
                                  image: AssetImage(Images.greencardBg),
                                  alignment: Alignment.topRight,
                                  fit: BoxFit.none,
                                ),
                                border:
                                    Border.all(width: 0.7, color: primaryColor),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '10',
                                    style: TextStyle(
                                      fontSize: 19.sp,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  SizedBox(height: 0.5.h),
                                  Text(
                                    'Total Orders',
                                    style: TextStyle(fontSize: 15.sp),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(width: 3.w),
                          Expanded(
                            child: Container(
                              padding: EdgeInsets.only(
                                  top: 3.5.w, bottom: 3.5.w, left: 3.5.w),
                              decoration: BoxDecoration(
                                color: Color(0xFFFFF6E9),
                                image: DecorationImage(
                                  image: AssetImage(Images.yellowcardBg),
                                  alignment: Alignment.topRight,
                                  fit: BoxFit.none,
                                ),
                                border: Border.all(
                                    width: 0.7, color: Colors.orange.shade700),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '5',
                                    style: TextStyle(
                                      fontSize: 19.sp,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  SizedBox(height: 0.5.h),
                                  Text(
                                    'Pending Deliveries',
                                    style: TextStyle(fontSize: 15.sp),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 3.w),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              padding: EdgeInsets.only(
                                  top: 3.5.w, bottom: 3.5.w, left: 3.5.w),
                              decoration: BoxDecoration(
                                color: Color(0XFFE5F2FF),
                                image: DecorationImage(
                                  image: AssetImage(Images.bluecardBg),
                                  alignment: Alignment.topRight,
                                  fit: BoxFit.none,
                                ),
                                border: Border.all(
                                    width: 0.7, color: Color(0xFF074785)),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '5',
                                    style: TextStyle(
                                      fontSize: 19.sp,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  SizedBox(height: 0.5.h),
                                  Text(
                                    'Orders Awaiting Payment',
                                    style: TextStyle(fontSize: 15.sp),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SizedBox(width: 3.w),
                          Expanded(
                            child: Container(
                              padding: EdgeInsets.only(
                                  top: 3.5.w, bottom: 3.5.w, left: 3.5.w),
                              decoration: BoxDecoration(
                                color: Color(0xFFFFE4E9),
                                image: DecorationImage(
                                  image: AssetImage(Images.pinkcardBg),
                                  alignment: Alignment.topRight,
                                  fit: BoxFit.none,
                                ),
                                border: Border.all(
                                    width: 0.7, color: Color(0xFFE73154)),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '3',
                                    style: TextStyle(
                                      fontSize: 19.sp,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  SizedBox(height: 0.5.h),
                                  Text(
                                    'Delivered Orders',
                                    style: TextStyle(fontSize: 15.sp),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 3.h),
                    ],
                  ),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'My Orders',
                            style: TextStyle(
                              fontSize: 17.sp,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Spacer(),
                          GestureDetector(
                            onTap: () {
                              onItemTapped(4);
                            },
                            child: Row(
                              children: [
                                Text(
                                  'View All',
                                  style: TextStyle(
                                    color: Colors.black45,
                                    fontSize: 14.5.sp,
                                  ),
                                ),
                                SizedBox(
                                  width: 1.w,
                                ),
                                Icon(
                                  Icons.arrow_forward_ios_sharp,
                                  color: Colors.black45,
                                  size: 13.8.sp,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 2.h),
                      ordersList(),
                    ],
                  ),
                ),
              ],
            ),
          ),
          floatingActionButton: Container(
            padding: EdgeInsets.all(3.5.w),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: primaryColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 10,
                  spreadRadius: 7,
                  offset: Offset(0, 1),
                ),
              ],
              border: Border.all(
                color: Colors.white,
                width: 1.5,
              ),
            ),
            child: Icon(
              Icons.add,
              color: Colors.white,
              size: 22.sp,
            ),
          ),
        );
      },
    );
  }
}

ordersList([bool isFromAllOrders = false]) {
  return ListView.builder(
    shrinkWrap: true,
    physics: isFromAllOrders
        ? BouncingScrollPhysics()
        : NeverScrollableScrollPhysics(),
    itemCount: orders.length,
    itemBuilder: (context, index) {
      final item = orders[index];
      return GestureDetector(
        onTap: () {
          Navigator.pushNamed(context, orderDetailPage);
        },
        child: Container(
          margin: EdgeInsets.only(bottom: 1.3.h),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(vertical: 1.5.h, horizontal: 3.w),
                decoration: BoxDecoration(
                  color: const Color(0xfff5fcf8),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(12),
                    topRight: Radius.circular(12),
                  ),
                ),
                child: Row(
                  children: [
                    Text(
                      item.customerName,
                      style: TextStyle(
                        fontSize: 15.sp,
                        color: Colors.black,
                      ),
                    ),
                    Text(
                      ' | ${item.company}',
                      style: TextStyle(
                        fontSize: 15.sp,
                        color: Colors.black,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      width: 4.5.h,
                      height: 4.5.h,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Icon(
                        Icons.arrow_forward,
                        color: Colors.black87,
                        size: 18.sp,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  border: Border(
                    left: BorderSide(color: Colors.grey.shade300, width: 0.9),
                    right: BorderSide(color: Colors.grey.shade300, width: 0.9),
                    bottom: BorderSide(color: Colors.grey.shade300, width: 0.9),
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(12),
                    bottomRight: Radius.circular(12),
                  ),
                ),
                child: Padding(
                  padding: EdgeInsets.all(3.w),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        alignment: Alignment.bottomCenter,
                        children: [
                          Container(
                            height: 10.h,
                            width: 18.w,
                            padding: EdgeInsets.symmetric(
                                horizontal: 2.w, vertical: 0.5.h),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade300),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(2.w),
                              child: Image.asset(
                                item.image,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: -2.w,
                            child: Container(
                              padding: EdgeInsets.symmetric(
                                  vertical: 0.5.h, horizontal: 2.w),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(50),
                                border: Border.all(color: Colors.grey.shade300),
                              ),
                              child: Text(
                                "+9 Item",
                                style: TextStyle(
                                  fontSize: 13.sp,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.black,
                                ),
                              ),
                            ),
                          )
                        ],
                      ),
                      SizedBox(width: 3.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  'Trail Order: ',
                                  style: TextStyle(
                                    fontSize: 15.sp,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.black,
                                  ),
                                ),
                                Text(
                                  item.orderTitle,
                                  style: TextStyle(
                                    fontSize: 15.sp,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.black.withOpacity(0.5),
                                  ),
                                ),
                                const Spacer(),
                                Container(
                                  padding: EdgeInsets.symmetric(
                                      vertical: 0.8.h, horizontal: 3.w),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE9F0FA),
                                    borderRadius: BorderRadius.circular(10.w),
                                  ),
                                  child: Text(
                                    'ORDER PLACED',
                                    style: TextStyle(
                                      fontSize: 13.sp,
                                      fontWeight: FontWeight.w500,
                                      color: Color.fromARGB(255, 42, 113, 198),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 0.7.h),
                            Divider(
                              color: Colors.black.withOpacity(0.1),
                              thickness: 0.1.h,
                            ),
                            SizedBox(height: 0.7.h),
                            Row(
                              children: [
                                Column(
                                  children: [
                                    Text(
                                      'Products',
                                      style: TextStyle(
                                        fontSize: 15.sp,
                                        color: Colors.black.withOpacity(0.5),
                                      ),
                                    ),
                                    Text(
                                      item.products,
                                      style: TextStyle(
                                        fontSize: 15.sp,
                                        color: Colors.black,
                                      ),
                                    ),
                                  ],
                                ),
                                const Spacer(),
                                Column(
                                  children: [
                                    Text(
                                      'Ordered on',
                                      style: TextStyle(
                                        fontSize: 15.sp,
                                        color: Colors.black.withOpacity(0.5),
                                      ),
                                    ),
                                    Text(
                                      item.orderDate,
                                      style: TextStyle(
                                        fontSize: 15.sp,
                                        color: Colors.black,
                                      ),
                                    ),
                                  ],
                                ),
                                const Spacer(),
                                Column(
                                  children: [
                                    Text(
                                      'Amount',
                                      style: TextStyle(
                                        fontSize: 15.sp,
                                        color: Colors.black.withOpacity(0.5),
                                      ),
                                    ),
                                    Text(
                                      item.amount,
                                      style: TextStyle(
                                        fontSize: 15.sp,
                                        color: Colors.black,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              )
            ],
          ),
        ),
      );
    },
  );
}
