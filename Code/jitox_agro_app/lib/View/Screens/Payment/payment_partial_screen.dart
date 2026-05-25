import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Screens/Payment/payment_models.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class PaymentPartialScreen extends StatelessWidget {
  const PaymentPartialScreen({super.key});

  static const double _total = 1205;
  static const double _paid = 800;
  static const double _remaining = 405;

  @override
  Widget build(BuildContext context) {
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
                arrowBackButton(context),
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
      body: Padding(
        padding: EdgeInsets.fromLTRB(4.w, 2.h, 4.w, 3.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'More Payment Option',
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            SizedBox(height: 2.h),
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 2.h),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.primary, width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.credit_card_rounded,
                      size: 28.sp, color: AppColors.primary),
                  SizedBox(width: 3.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Partial (Advance) Payment',
                          style: TextStyle(
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(height: 0.6.h),
                        Text(
                          'Secure your purchase with a partial payment.',
                          style: TextStyle(
                            fontSize: 13.sp,
                            color: AppColors.textSecondary,
                            height: 1.35,
                          ),
                        ),
                        SizedBox(height: 1.2.h),
                        Text(
                          'Pay ${fmtInr(_paid)} now · ${fmtInr(_remaining)} remaining',
                          style: TextStyle(
                            fontSize: 13.sp,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryDark,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.check_circle_rounded,
                      color: AppColors.primary, size: 26.sp),
                ],
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: false,
                text: 'Pay ${fmtInr(_paid)}',
                onPressed: () {
                  Navigator.pushReplacementNamed(
                    context,
                    paymentReceiptScreen,
                    arguments: const PaymentReceiptArgs(
                      total: _total,
                      paid: _paid,
                      remaining: _remaining,
                      partial: true,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
