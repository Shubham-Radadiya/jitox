import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/mr/mr_app_bar.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class AddDealerPaymentScreen extends StatefulWidget {
  const AddDealerPaymentScreen({super.key, this.dealerName = 'DEALER NAME 382'});

  final String dealerName;

  @override
  State<AddDealerPaymentScreen> createState() => _AddDealerPaymentScreenState();
}

class _AddDealerPaymentScreenState extends State<AddDealerPaymentScreen> {
  final _bankCtrl = TextEditingController(text: 'SBI Commercial & International Bank');
  final _locationCtrl = TextEditingController(text: 'rajkot');
  final _refCtrl = TextEditingController(text: '00055');
  final _amount1Ctrl = TextEditingController(text: '5000');
  final _amount2Ctrl = TextEditingController(text: '5000');
  final _totalCtrl = TextEditingController(text: '10000.0');
  final _remarkCtrl = TextEditingController();
  String _paymentType = 'General';

  @override
  void dispose() {
    _bankCtrl.dispose();
    _locationCtrl.dispose();
    _refCtrl.dispose();
    _amount1Ctrl.dispose();
    _amount2Ctrl.dispose();
    _totalCtrl.dispose();
    _remarkCtrl.dispose();
    super.dispose();
  }

  InputDecoration _fieldDeco(String? hint) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: Colors.white,
        contentPadding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 1.4.h),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: BorderSide(color: Colors.grey.shade400),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(6),
          borderSide: BorderSide(color: Colors.grey.shade400),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: MrAppBar(
        title: 'Add Payments',
        showMenu: false,
        showBack: true,
        subtitle: '${widget.dealerName} Payments',
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(4.w),
              child: Column(
                children: [
                  TextField(controller: _bankCtrl, decoration: _fieldDeco(null)),
                  SizedBox(height: 1.5.h),
                  TextField(controller: _locationCtrl, decoration: _fieldDeco(null)),
                  SizedBox(height: 1.5.h),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: TextField(controller: _refCtrl, decoration: _fieldDeco(null)),
                      ),
                      SizedBox(width: 2.w),
                      Expanded(
                        flex: 3,
                        child: TextField(
                          readOnly: true,
                          decoration: _fieldDeco(null).copyWith(
                            hintText: '10-10-2021',
                            suffixIcon: Container(
                              margin: EdgeInsets.all(0.5.w),
                              decoration: BoxDecoration(
                                color: primaryColor,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Icon(Icons.calendar_month, color: Colors.white, size: 20.sp),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 1.5.h),
                  TextField(
                    controller: _amount1Ctrl,
                    keyboardType: TextInputType.number,
                    decoration: _fieldDeco('Old Remaining Payment'),
                  ),
                  SizedBox(height: 1.5.h),
                  TextField(
                    controller: _amount2Ctrl,
                    keyboardType: TextInputType.number,
                    decoration: _fieldDeco(null),
                  ),
                  SizedBox(height: 1.5.h),
                  TextField(
                    controller: _totalCtrl,
                    keyboardType: TextInputType.number,
                    decoration: _fieldDeco(null),
                  ),
                  SizedBox(height: 1.5.h),
                  TextField(controller: _remarkCtrl, decoration: _fieldDeco('Remark')),
                  SizedBox(height: 1.5.h),
                  DropdownButtonFormField<String>(
                    value: _paymentType,
                    decoration: _fieldDeco('Payment Type'),
                    items: ['General', 'Regular Payment', 'Scheme']
                        .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                        .toList(),
                    onChanged: (v) => setState(() => _paymentType = v ?? 'General'),
                  ),
                  SizedBox(height: 2.h),
                  InkWell(
                    onTap: () {},
                    child: Container(
                      height: 14.h,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade400),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.folder_open, size: 36.sp, color: Colors.grey.shade600),
                          SizedBox(height: 0.5.h),
                          Text(
                            'Select Bill',
                            style: TextStyle(
                              fontSize: 14.sp,
                              color: Colors.grey.shade700,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(4.w, 1.h, 4.w, 1.5.h),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Payment submitted')),
                    );
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    padding: EdgeInsets.symmetric(vertical: 1.6.h),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  child: Text(
                    'SUBMIT',
                    style: TextStyle(
                      fontSize: 15.sp,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
