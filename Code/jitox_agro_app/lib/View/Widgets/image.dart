import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/icon_fallbacks.dart';

class CustomAssetImage extends StatelessWidget {
  final String imagePath;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Color? color;
  final BlendMode? colorBlendMode;
  final Alignment alignment;
  final double opacity;
  final BorderRadius? borderRadius;
  final BoxShape shape;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final IconData? fallbackIcon;

  const CustomAssetImage({
    super.key,
    required this.imagePath,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.color,
    this.colorBlendMode,
    this.alignment = Alignment.center,
    this.opacity = 1.0,
    this.borderRadius,
    this.shape = BoxShape.rectangle,
    this.padding,
    this.margin,
    this.fallbackIcon,
  });

  Widget _fallback() {
    final icon = fallbackIcon ?? iconFallbackForAsset(imagePath);
    final size = width ?? height ?? 24.0;
    return Icon(
      icon,
      size: size,
      color: color ?? Colors.grey.shade700,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        shape: shape,
      ),
      child: Opacity(
        opacity: opacity,
        child: Image.asset(
          imagePath,
          width: width,
          height: height,
          fit: fit,
          color: color,
          colorBlendMode: colorBlendMode,
          alignment: alignment,
          errorBuilder: (_, __, ___) => _fallback(),
        ),
      ),
    );
  }
}
