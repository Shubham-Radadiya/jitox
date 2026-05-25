import 'package:flutter/material.dart';

/// Standard horizontal padding and scroll behavior for field-app pages.
class ScreenContent extends StatelessWidget {
  const ScreenContent({
    super.key,
    required this.child,
    this.padding,
    this.refresh,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Future<void> Function()? refresh;

  static const EdgeInsets pagePadding =
      EdgeInsets.fromLTRB(16, 12, 16, 24);

  @override
  Widget build(BuildContext context) {
    final body = Padding(
      padding: padding ?? pagePadding,
      child: child,
    );
    if (refresh == null) return body;
    return RefreshIndicator(
      onRefresh: refresh!,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: body,
      ),
    );
  }
}
