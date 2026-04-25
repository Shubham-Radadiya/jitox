import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/asset_paths.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/image.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  bool isExpanded = false;
  List<String> images = [
    'assets/images/seed1.png',
    'assets/images/seed1.png',
    'assets/images/seed1.png',
    'assets/images/seed1.png',
    'assets/images/seed1.png',
    'assets/images/seed1.png',
    'assets/images/seed1.png',
    'assets/images/seed1.png',
    'assets/images/seed1.png',
    'assets/images/seed1.png',
    'assets/images/seed1.png',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
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
                      "Order Details",
                      style: TextStyle(
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                Container(
                  width: 4.5.h,
                ),
              ],
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 2.h, horizontal: 4.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              productDetailSection(),
              SizedBox(
                height: 2.h,
              ),
              ExpandableImageRow(
                images: images,
              ),
              SizedBox(height: 2.h),
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(2.w),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding:
                          EdgeInsets.symmetric(horizontal: 2.h, vertical: 2.h),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Order Status',
                              style: TextStyle(
                                  fontSize: 17.sp,
                                  fontWeight: FontWeight.w600)),
                          Container(
                            padding: EdgeInsets.symmetric(
                                vertical: 0.8.h, horizontal: 3.w),
                            decoration: BoxDecoration(
                              color: const Color(0xffFFF3E9),
                              borderRadius: BorderRadius.circular(10.w),
                            ),
                            child: Text(
                              'Admin Approved',
                              style: TextStyle(
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xffFF9C41),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Divider(
                        height: 0.5,
                        thickness: 0.5,
                        color: Colors.grey.withOpacity(0.4)),
                    OrderStatusStepper(),
                  ],
                ),
              ),
              SizedBox(height: 2.h),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.5.h),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300, width: 0.9),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left Column
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Payment Mode: Prepaid',
                            style: TextStyle(
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(height: 1.h),
                          Text(
                            'Transaction ID: pay_QReTvhgjUtbga',
                            style: TextStyle(fontSize: 15.sp),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 2.h),
                    // Right Column
                    Column(
                      children: [
                        Icon(Icons.receipt_long,
                            color: const Color(0xff2F80ED), size: 20.sp),
                        SizedBox(height: 0.8.h),
                        Text(
                          'View Bill',
                          style: TextStyle(
                            fontSize: 15.sp,
                            color: const Color(0xff2F80ED),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: 2.h),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () =>
                      Navigator.pushNamed(context, paymentScreen),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: EdgeInsets.symmetric(vertical: 1.6.h),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Make payment',
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget productDetailSection() {
    return Column(
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
                "Product",
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500),
              ),
              Spacer(),
              Row(
                children: [
                  Text(
                    "Trial Order: ",
                    style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w400,
                        color: Colors.black54),
                  ),
                  SizedBox(
                    width: 1.w,
                  ),
                  Text(
                    "(GTY524)",
                    style:
                        TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w400),
                  ),
                ],
              ),
            ],
          ),
        ),
        Container(
          width: double.infinity,
          padding: EdgeInsets.all(2.w),
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Name",
                style: TextStyle(
                    fontWeight: FontWeight.w400, color: Colors.black54),
              ),
              Text(
                "Priya Mehra | Zenith Ltd.",
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              SizedBox(height: 1.h),
              Text(
                "Placed on",
                style: TextStyle(
                    fontWeight: FontWeight.w400, color: Colors.black54),
              ),
              Text(
                "20 Jan 2025, 2:30 PM",
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              SizedBox(height: 1.h),
              Text(
                "Shipping Address",
                style: TextStyle(
                    fontWeight: FontWeight.w400, color: Colors.black54),
              ),
              Text(
                "4517 Washington Ave. Manchester, Kentucky 39495",
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class ExpandableImageRow extends StatefulWidget {
  final List<String> images;

  const ExpandableImageRow({super.key, required this.images});

  @override
  State<ExpandableImageRow> createState() => _ExpandableImageRowState();
}

class _ExpandableImageRowState extends State<ExpandableImageRow> {
  bool isExpanded = false;

  @override
  Widget build(BuildContext context) {
    int visibleCount = isExpanded
        ? widget.images.length
        : (widget.images.length > 4 ? 4 : widget.images.length);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300, width: 0.9),
      ),
      padding: EdgeInsets.all(2.w),
      child: Column(
        children: [
          Row(
            children: [
              Text("Items: ${widget.images.length}"),
              Spacer(),
              GestureDetector(
                onTap: () {
                  setState(() {
                    isExpanded = !isExpanded;
                  });
                },
                child: Icon(
                  isExpanded
                      ? Icons.keyboard_arrow_up
                      : Icons.keyboard_arrow_down_sharp,
                ),
              )
            ],
          ),
          SizedBox(height: 1.h),
          Wrap(
            direction: Axis.horizontal,
            spacing: 2.w, // horizontal spacing
            runSpacing: 1.5.h, // vertical spacing
            children: [
              ...List.generate(
                visibleCount,
                (i) => Container(
                  height: 8.h,
                  width: (100.w - (8.w + 4.w + (2.w * 4) + 2)) / 5,
                  padding: EdgeInsets.all(2.w),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(1.h),
                    border: Border.all(color: const Color(0xffE2E2E2)),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(1.h),
                    child: Image.asset(widget.images[i], fit: BoxFit.cover),
                  ),
                ),
              ),
              if (widget.images.length > 4 && !isExpanded)
                Container(
                  height: 8.h,
                  width: (100.w - (8.w + 4.w + (2.w * 4) + 2)) / 5,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(1.h),
                    border: Border.all(color: const Color(0xffE2E2E2)),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '+${widget.images.length - 4}',
                          style: TextStyle(fontSize: 15.sp),
                        ),
                        Text(
                          'more',
                          style: TextStyle(fontSize: 15.sp),
                        ),
                      ],
                    ),
                  ),
                ),
              // if (isExpanded)
              //   GestureDetector(
              //     onTap: () {
              //       setState(() {
              //         isExpanded = false;
              //       });
              //     },
              //     child: Container(
              //       height: 8.h,
              //       width: 8.h,
              //       alignment: Alignment.center,
              //       decoration: BoxDecoration(
              //         borderRadius: BorderRadius.circular(1.h),
              //         color: const Color(0xffF5F5F5),
              //         border: Border.all(color: const Color(0xffE2E2E2)),
              //       ),
              //       child:
              //           Icon(Icons.expand_less, size: 20.sp, color: Colors.black),
              //     ),
              //   ),
            ],
          ),
        ],
      ),
    );
  }
}

class OrderStatusStepper extends StatelessWidget {
  final List<Map<String, dynamic>> steps = [
    {
      'title': 'Order Placed',
      'date': '20 Jan 2025',
      'icon': AppIcons.timeIcon,
      'isCompleted': true,
    },
    {
      'title': 'Admin Approved',
      'date': '20 Jan 2025',
      'icon': AppIcons.doubleTickIcon,
      'isCompleted': true,
    },
    {
      'title': 'Dispatched',
      'date': '20 Jan 2025',
      'icon': AppIcons.truckIcon,
      'isCompleted': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: steps.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final step = steps[index];
        final isLast = index == steps.length - 1;

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Timeline icon + connector
            Column(
              children: [
                Container(
                  width: 11.w,
                  height: 11.w,
                  decoration: BoxDecoration(
                    color: step['isCompleted'] ? primaryColor : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: primaryColor, width: 0.3),
                  ),
                  child: Center(
                    child: CustomAssetImage(
                      imagePath: step['icon'],
                      color: step['isCompleted'] ? Colors.white : primaryColor,
                      width: 6.w,
                    ),
                  ),
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 5.h,
                    color: const Color(0xFF00A550),
                  ),
              ],
            ),
            SizedBox(width: 4.w),
            // Text content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      step['title'],
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                    ),
                    SizedBox(height: 0.7.h),
                    Text(
                      step['date'],
                      style: TextStyle(
                        fontSize: 15.sp,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
