import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Screens/Payment/payment_screen.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class PaymentReceiptArgs {
  const PaymentReceiptArgs({
    required this.total,
    required this.paid,
    required this.remaining,
    required this.partial,
  });

  final double total;
  final double paid;
  final double remaining;
  final bool partial;
}

void _closeReceipt(BuildContext context) {
  final nav = Navigator.of(context);
  nav.pop();
  if (nav.canPop()) nav.pop();
}

class PaymentReceiptScreen extends StatelessWidget {
  const PaymentReceiptScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments as PaymentReceiptArgs?;
    final total = args?.total ?? 1205;
    final paid = args?.paid ?? 800;
    final remaining = args?.remaining ?? 405;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(7.h),
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 4.w),
          color: Colors.white,
          child: SafeArea(
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => _closeReceipt(context),
                  child: Container(
                    height: 4.5.h,
                    width: 4.5.h,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Icon(Icons.arrow_back_ios_new_rounded, size: 18.sp),
                  ),
                ),
                Expanded(
                  child: Text(
                    'Payment',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                SizedBox(width: 4.5.h),
              ],
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(4.w, 1.5.h, 4.w, 3.h),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.fromLTRB(4.w, 2.5.h, 4.w, 2.h),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    fmtInr(total),
                    style: TextStyle(
                      fontSize: 32.sp,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  SizedBox(height: 0.3.h),
                  Text(
                    'Total Amount',
                    style: TextStyle(
                      fontSize: 14.sp,
                      color: Colors.white.withOpacity(0.92),
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Row(
                    children: [
                      Expanded(
                        child: _amountPill(
                          label: 'Paid Amount',
                          value: paid,
                        ),
                      ),
                      SizedBox(width: 3.w),
                      Expanded(
                        child: _amountPill(
                          label: 'Remaining Amount',
                          value: remaining,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: 2.5.h),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _kv('Sender', 'XYZ John'),
                  _divider(),
                  _kv('Email', 'xyz.john@email.com'),
                  _divider(),
                  _kv('Recipient', 'Priya Mehra'),
                  _divider(),
                  _kv('Email', 'priya@zenith.com'),
                  _divider(),
                  _kv('Phone No', '+91 45785 85621'),
                  _divider(),
                  _kv('Group', 'Zenith Ltd.'),
                  _divider(),
                  _kv('Amount Paid', fmtInr(paid), emphasize: true),
                  _divider(),
                  _kv('Remaining Amount', fmtInr(remaining), emphasize: true),
                  _divider(),
                  _kv('Transaction ID', '2157845784'),
                  _divider(),
                  _kv('Reference ID', 'G54DH545'),
                ],
              ),
            ),
            SizedBox(height: 2.5.h),
            Text(
              'This receipt is proof of a valid transaction.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12.sp,
                color: AppColors.textSecondary,
              ),
            ),
            SizedBox(height: 0.8.h),
            Text(
              'Jitox Agro',
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
            ),
            SizedBox(height: 2.h),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: false,
                text: 'Done',
                onPressed: () => _closeReceipt(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _amountPill({required String label, required double value}) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 1.4.h, horizontal: 2.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(
            fmtInr(value),
            style: TextStyle(
              fontSize: 17.sp,
              fontWeight: FontWeight.w800,
              color: AppColors.primaryDark,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          SizedBox(height: 0.3.h),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11.sp,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _kv(String k, String v, {bool emphasize = false}) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.3.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              k,
              style: TextStyle(
                fontSize: 13.sp,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              v,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 13.sp,
                fontWeight: emphasize ? FontWeight.w700 : FontWeight.w500,
                color: AppColors.textPrimary,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() => Divider(height: 1, thickness: 0.7, color: AppColors.border);
}
