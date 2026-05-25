import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/app_typography.dart';
import 'package:jitox_agro_app/Constants/colors.dart';

class CustomTextField extends StatefulWidget {
  final String hint;
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final String label;
  final String label2;
  final FocusNode? focusNode;
  final bool obscureText;
  final int maxLines;
  final Color? label2Color;
  final FontWeight? fontWeight;
  final Widget? suffixIcon;
  final bool? readOnly;

  const CustomTextField({
    super.key,
    required this.hint,
    required this.controller,
    this.validator,
    this.obscureText = false,
    this.label = "",
    this.label2 = "",
    this.focusNode,
    this.maxLines = 1,
    this.label2Color,
    this.fontWeight,
    this.suffixIcon,
    this.readOnly,
  });

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  late bool _obscureText;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.obscureText;
  }

  void _toggleObscure() {
    setState(() {
      _obscureText = !_obscureText;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label.isNotEmpty) ...[
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: widget.label,
                  style: AppTypography.bodyLgStyle(
                    color: Colors.black,
                    weight: widget.fontWeight ?? FontWeight.w600,
                  ),
                ),
                TextSpan(
                  text: widget.label2,
                  style: AppTypography.bodyLgStyle(
                    color: widget.label2Color ??
                        Colors.grey.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
        TextFormField(
          readOnly: widget.readOnly ?? false,
          focusNode: widget.focusNode,
          cursorColor: Colors.black54,
          controller: widget.controller,
          obscureText: _obscureText,
          validator: widget.validator,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          onTapOutside: (event) => FocusScope.of(context).unfocus(),
          maxLines: widget.maxLines,
          style: AppTypography.bodyLgStyle(),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: AppTypography.bodyLgStyle(color: lightFontColor),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide:
                  BorderSide(color: Colors.grey.withValues(alpha: 0.5), width: 0.7),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide:
                  BorderSide(color: Colors.grey.withValues(alpha: 0.5), width: 0.7),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide:
                  BorderSide(color: Colors.grey.withValues(alpha: 0.5), width: 0.7),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide: const BorderSide(color: Colors.red, width: 1),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(13),
              borderSide: const BorderSide(color: Colors.red, width: 2),
            ),
            suffixIcon: widget.obscureText
                ? IconButton(
                    icon: Icon(
                      _obscureText
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: Colors.grey,
                    ),
                    onPressed: _toggleObscure,
                  )
                : widget.suffixIcon,
          ),
        ),
      ],
    );
  }
}
