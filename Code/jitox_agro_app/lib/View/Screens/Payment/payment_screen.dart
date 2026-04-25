import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/Constants/route_names.dart';
import 'package:jitox_agro_app/View/Widgets/appbar.dart';
import 'package:jitox_agro_app/View/Widgets/button.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

/// Formats INR with aligned decimals (mockup-style).
String fmtInr(num value) {
  final v = value.toDouble();
  final sign = v < 0 ? '-' : '';
  final abs = v.abs();
  return '$sign₹${abs.toStringAsFixed(2)}';
}

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _summaryOpen = true;
  String? _method; // gpay | cash | check | partial

  static const double _total = 1205;
  static const double _combo = 1000;
  static const double _gst = 185;
  static const double _tax = -5;
  static const double _platform = 20;

  void _continue() {
    if (_method == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a payment method')),
      );
      return;
    }
    if (_method == 'partial') {
      Navigator.pushNamed(context, paymentPartialScreen);
      return;
    }
    Navigator.pushNamed(
      context,
      paymentReceiptScreen,
      arguments: const PaymentReceiptArgs(
        total: _total,
        paid: _total,
        remaining: 0,
        partial: false,
      ),
    );
  }

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
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                InkWell(
                  onTap: () {},
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    height: 4.5.h,
                    width: 4.5.h,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Icon(Icons.history_rounded, size: 20.sp),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(4.w, 1.5.h, 4.w, 3.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _summaryCard(),
            SizedBox(height: 2.h),
            Text(
              'Preferred Payment',
              style: TextStyle(
                fontSize: 15.sp,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
              ),
            ),
            SizedBox(height: 1.h),
            _radioTile(
              id: 'gpay',
              title: 'GPay',
              icon: Icons.account_balance_wallet_outlined,
            ),
            _radioTile(
              id: 'cash',
              title: 'Cash',
              icon: Icons.payments_outlined,
            ),
            _radioTile(
              id: 'check',
              title: 'Check',
              icon: Icons.receipt_long_outlined,
            ),
            SizedBox(height: 1.5.h),
            Text(
              'More Payment Option',
              style: TextStyle(
                fontSize: 15.sp,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondary,
              ),
            ),
            SizedBox(height: 1.h),
            _radioTile(
              id: 'partial',
              title: 'Partial (Advance) Payment',
              subtitle: 'Secure your purchase with a partial payment.',
              icon: Icons.credit_card_outlined,
            ),
            SizedBox(height: 3.h),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                isOutlined: false,
                text: 'Continue',
                onPressed: _continue,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _summaryOpen = !_summaryOpen),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.4.h),
              decoration: BoxDecoration(
                color: AppColors.mintHero,
                borderRadius: BorderRadius.vertical(
                  top: const Radius.circular(11),
                  bottom: _summaryOpen
                      ? Radius.zero
                      : const Radius.circular(11),
                ),
              ),
              child: Row(
                children: [
                  Text(
                    'Payment Summary',
                    style: TextStyle(
                      fontSize: 15.sp,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    fmtInr(_total),
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primaryDark,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  SizedBox(width: 1.w),
                  Icon(
                    _summaryOpen
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
            ),
          ),
          if (_summaryOpen) ...[
            _moneyRow('Combo Pack', _combo),
            _moneyRow('GST (18%)', _gst),
            _moneyRow('Tax', _tax),
            _moneyRow('Platform Fee', _platform),
            Divider(height: 1, color: AppColors.border.withOpacity(0.8)),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.2.h),
              child: Row(
                children: [
                  Text(
                    'Total Amount',
                    style: TextStyle(
                      fontSize: 15.sp,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    fmtInr(_total),
                    style: TextStyle(
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primaryDark,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _moneyRow(String label, double amount) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 0.9.h),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14.sp,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Text(
            fmtInr(amount),
            style: TextStyle(
              fontSize: 14.sp,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _radioTile({
    required String id,
    required String title,
    required IconData icon,
    String? subtitle,
  }) {
    final selected = _method == id;
    return Padding(
      padding: EdgeInsets.only(bottom: 1.h),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: () => setState(() => _method = id),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.4.h),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: selected ? AppColors.primary : AppColors.border,
                width: selected ? 1.5 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(icon, size: 22.sp, color: AppColors.textPrimary),
                SizedBox(width: 3.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 15.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (subtitle != null) ...[
                        SizedBox(height: 0.3.h),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Radio<String>(
                  value: id,
                  groupValue: _method,
                  onChanged: (v) => setState(() => _method = v),
                  activeColor: AppColors.primary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
