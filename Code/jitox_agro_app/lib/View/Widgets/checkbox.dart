import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';

class CustomCheckbox extends StatelessWidget {
  final bool value;
  final void Function(bool?) onChanged;

  const CustomCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(
        checkboxTheme: CheckboxThemeData(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(5),
          ),
          side: BorderSide(
            color: Colors.grey.shade600,
            width: 1,
          ),
        ),
      ),
      child: Checkbox(
        value: value,
        onChanged: onChanged,
        activeColor: primaryColor,
        checkColor: Colors.white,
      ),
    );
  }
}
