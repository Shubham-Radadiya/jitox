import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class LanguageScreen extends StatefulWidget {
  const LanguageScreen({super.key});

  @override
  State<LanguageScreen> createState() => _LanguageScreenState();
}

class _LanguageScreenState extends State<LanguageScreen> {
  String _selected = 'Hindi';

  static const _languages = [
    ('English', 'English'),
    ('Hindi', 'हिंदी'),
    ('Gujarati', 'ગુજરાતી'),
    ('Tamil', 'தமிழ்'),
    ('Sinhala', 'සිංහල'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: AppColors.textPrimary,
        title: Text(
          'Select Language',
          style: TextStyle(
            fontSize: 17.sp,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.separated(
              itemCount: _languages.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade300),
              itemBuilder: (context, i) {
                final (id, label) = _languages[i];
                final selected = _selected == id;
                return RadioListTile<String>(
                  value: id,
                  groupValue: _selected,
                  activeColor: primaryColor,
                  title: Text(label, style: TextStyle(fontSize: 15.sp)),
                  onChanged: (v) => setState(() => _selected = v ?? id),
                  selected: selected,
                );
              },
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(4.w, 1.h, 4.w, 3.h),
            child: Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 1.4.h),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                child: Text(
                  'Next',
                  style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
