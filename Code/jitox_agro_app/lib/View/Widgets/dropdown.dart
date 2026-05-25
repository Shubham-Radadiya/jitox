import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_typography.dart';
import 'package:jitox_agro_app/Constants/colors.dart';

class CustomDropdown extends StatelessWidget {
  final String? value;
  final List<String> items;
  final String hint;
  final void Function(String?) onChanged;
  final String? Function(String?)? validator;
  final String label;
  final String label2;
  final Color? label2Color;

  const CustomDropdown({
    super.key,
    required this.value,
    required this.items,
    required this.hint,
    required this.onChanged,
    this.validator,
    this.label = "",
    this.label2 = "",
    this.label2Color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label.isNotEmpty) ...[
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: label,
                  style: AppTypography.bodyLgStyle(color: Colors.black),
                ),
                TextSpan(
                  text: " $label2",
                  style: AppTypography.bodyLgStyle(
                    color: label2Color ?? Colors.grey.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
        DropdownButtonFormField<String>(
          value: value,
          validator: validator,
          isExpanded: true,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          style: AppTypography.bodyLgStyle(color: Colors.black),
          decoration: InputDecoration(
            isDense: true,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            hintText: hint,
            hintStyle: AppTypography.bodyLgStyle(color: lightFontColor),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide: BorderSide(
                color: Colors.grey.withValues(alpha: 0.5),
                width: 0.7,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide: BorderSide(
                color: Colors.grey.withValues(alpha: 0.5),
                width: 0.7,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide: BorderSide(
                color: Colors.grey.withValues(alpha: 0.5),
                width: 0.7,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide: const BorderSide(color: Colors.red, width: 1),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide: const BorderSide(color: Colors.red, width: 1.5),
            ),
          ),
          icon: Icon(
            Icons.keyboard_arrow_down_rounded,
            color: Colors.grey.shade600,
          ),
          items: items.map((e) {
            return DropdownMenuItem(value: e, child: Text(e));
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
