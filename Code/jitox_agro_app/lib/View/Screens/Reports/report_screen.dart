import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final List<String> _periods = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  int _periodIndex = 0;
  int _mapDay = 7;
  bool _paymentsBarView = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceMuted,
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(7.h),
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 4.w),
          color: Colors.white,
          child: SafeArea(
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => Navigator.of(context).maybePop(),
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
                    'Reports',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                InkWell(
                  onTap: () {},
                  child: Container(
                    height: 4.5.h,
                    width: 4.5.h,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Icon(Icons.download_outlined, size: 20.sp),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(4.w, 1.5.h, 4.w, 10.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _periodChips(),
            SizedBox(height: 1.h),
            Text(
              'May 15 – June 15, 2024',
              style: TextStyle(
                fontSize: 13.sp,
                color: AppColors.textSecondary,
              ),
            ),
            SizedBox(height: 2.h),
            Text(
              'Activities report',
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: 1.h),
            _mapCard(),
            SizedBox(height: 2.h),
            _workingHoursCard(),
            SizedBox(height: 2.h),
            _metricRow(),
            SizedBox(height: 2.5.h),
            _paymentsHeader(),
            SizedBox(height: 1.h),
            SizedBox(
              height: 22.h,
              child: _paymentsBarView
                  ? CustomPaint(
                      painter: _StackedBarPainter(),
                      child: const SizedBox.expand(),
                    )
                  : CustomPaint(
                      painter: _LineTrendPainter(),
                      child: const SizedBox.expand(),
                    ),
            ),
            _legend(),
            SizedBox(height: 2.5.h),
            Text(
              'Targets & achievements',
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: 1.2.h),
            _targetRow('Revenue milestone', 80, 100),
            _targetRow('Monthly sales target', 70, 100),
            _targetRow('Overall target', 75, 100),
            SizedBox(height: 2.5.h),
            Text(
              'Incentives',
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: 1.2.h),
            _incentiveRow(),
          ],
        ),
      ),
    );
  }

  Widget _periodChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(_periods.length, (i) {
          final sel = i == _periodIndex;
          return Padding(
            padding: EdgeInsets.only(right: 2.w),
            child: ChoiceChip(
              label: Text(_periods[i]),
              selected: sel,
              onSelected: (_) => setState(() => _periodIndex = i),
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(
                color: sel ? Colors.white : AppColors.textPrimary,
                fontWeight: FontWeight.w600,
                fontSize: 13.sp,
              ),
              side: BorderSide(
                color: sel ? AppColors.primary : AppColors.border,
              ),
              showCheckmark: false,
              padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 0.6.h),
            ),
          );
        }),
      ),
    );
  }

  Widget _mapCard() {
    return Container(
      height: 28.h,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: CustomPaint(
              painter: _MapBackgroundAndRoutePainter(),
            ),
          ),
          Positioned(
            top: 10,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 3.w, vertical: 0.8.h),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.directions_bike_rounded,
                        size: 18.sp, color: AppColors.primary),
                    SizedBox(width: 2.w),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '1h 43 min',
                          style: TextStyle(
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '1.65 km',
                          style: TextStyle(
                            fontSize: 11.sp,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 10,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  onPressed: () =>
                      setState(() => _mapDay = (_mapDay - 1).clamp(1, 31)),
                  icon: const Icon(Icons.chevron_left_rounded),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 1.h),
                  decoration: BoxDecoration(
                    color: AppColors.mintHero,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                  ),
                  child: Text(
                    _mapDay.toString().padLeft(2, '0'),
                    style: TextStyle(
                      fontSize: 18.sp,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primaryDark,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () =>
                      setState(() => _mapDay = (_mapDay + 1).clamp(1, 31)),
                  icon: const Icon(Icons.chevron_right_rounded),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _workingHoursCard() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(3.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withOpacity(0.45), width: 1.2),
      ),
      child: Row(
        children: [
          Expanded(
            child: _whCol('Current time', '09:12Hrs'),
          ),
          Container(width: 1, height: 5.h, color: AppColors.border),
          Expanded(
            child: _whCol('Clock out time', '05:45Hrs'),
          ),
        ],
      ),
    );
  }

  Widget _whCol(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12.sp,
            color: AppColors.textSecondary,
          ),
        ),
        SizedBox(height: 0.5.h),
        Text(
          value,
          style: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _metricRow() {
    final items = [
      (Icons.directions_bike_rounded, '12.5 km', 'Distance'),
      (Icons.schedule_rounded, '18h 40m', 'Time'),
      (Icons.restaurant_rounded, '1h 12m', 'Break'),
      (Icons.account_balance_wallet_outlined, '—', 'Expense'),
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: items.map((e) {
        return Expanded(
          child: Column(
            children: [
              Container(
                width: 14.w,
                height: 14.w,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primary.withOpacity(0.35)),
                  color: AppColors.mintHero.withOpacity(0.5),
                ),
                child: Icon(e.$1, color: AppColors.primary, size: 22.sp),
              ),
              SizedBox(height: 0.6.h),
              Text(
                e.$2,
                style: TextStyle(
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                e.$3,
                style: TextStyle(
                  fontSize: 10.sp,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _paymentsHeader() {
    return Row(
      children: [
        Expanded(
          child: Text(
            _paymentsBarView ? 'Payments' : 'Payments trend',
            style: TextStyle(
              fontSize: 16.sp,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        IconButton(
          onPressed: () =>
              setState(() => _paymentsBarView = true),
          icon: Icon(
            Icons.bar_chart_rounded,
            color: _paymentsBarView ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
        IconButton(
          onPressed: () =>
              setState(() => _paymentsBarView = false),
          icon: Icon(
            Icons.show_chart_rounded,
            color: !_paymentsBarView ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _legend() {
    Widget dot(Color c, String t) => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(color: c, shape: BoxShape.circle),
            ),
            SizedBox(width: 1.w),
            Text(t, style: TextStyle(fontSize: 11.sp)),
          ],
        );
    return Padding(
      padding: EdgeInsets.only(top: 1.h),
      child: Wrap(
        spacing: 4.w,
        runSpacing: 0.5.h,
        children: [
          dot(const Color(0xFFEF4444), 'Overdue'),
          dot(const Color(0xFFF97316), 'Pending'),
          dot(AppColors.primary, 'Received'),
        ],
      ),
    );
  }

  Widget _targetRow(String title, int pct, int max) {
    return Padding(
      padding: EdgeInsets.only(bottom: 1.5.h),
      child: Row(
        children: [
          SizedBox(
            width: 16.w,
            height: 16.w,
            child: CustomPaint(
              painter: _RingPainter(percent: pct / max.toDouble()),
            ),
          ),
          SizedBox(width: 3.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '$pct / $max units',
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${(100 * pct / max).round()}%',
            style: TextStyle(
              fontSize: 14.sp,
              fontWeight: FontWeight.w800,
              color: AppColors.primaryDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _incentiveRow() {
    final cards = [
      (const Color(0xFFDCFCE7), const Color(0xFF166534), 'Target', '₹1,00,000'),
      (const Color(0xFFDBEAFE), const Color(0xFF1D4ED8), 'Achieved', '₹95,000'),
      (const Color(0xFFFCE7F3), const Color(0xFFBE185D), 'Incentive earned', '₹5,000'),
    ];
    return Row(
      children: List.generate(cards.length, (idx) {
        final c = cards[idx];
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(
              right: idx == cards.length - 1 ? 0 : 2.w,
            ),
            padding: EdgeInsets.fromLTRB(2.w, 2.h, 2.w, 1.5.h),
            decoration: BoxDecoration(
              color: c.$1,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  c.$3,
                  style: TextStyle(
                    fontSize: 11.sp,
                    fontWeight: FontWeight.w600,
                    color: c.$2.withOpacity(0.85),
                  ),
                ),
                SizedBox(height: 0.8.h),
                Text(
                  c.$4,
                  style: TextStyle(
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w800,
                    color: c.$2,
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}

class _MapBackgroundAndRoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = const Color(0xFFF1F5F9),
    );
    final grid = Paint()
      ..color = const Color(0xFFE8ECF0)
      ..strokeWidth = 0.6;
    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }

    final path = Path()
      ..moveTo(size.width * 0.12, size.height * 0.72)
      ..quadraticBezierTo(
        size.width * 0.42,
        size.height * 0.18,
        size.width * 0.88,
        size.height * 0.58,
      );
    final line = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(path, line);

    final start = Offset(size.width * 0.12, size.height * 0.72);
    final end = Offset(size.width * 0.88, size.height * 0.58);
    canvas.drawCircle(start, 7, Paint()..color = AppColors.primary);
    canvas.drawCircle(start, 3, Paint()..color = Colors.white);
    canvas.drawCircle(end, 7, Paint()..color = const Color(0xFF1E293B));
    canvas.drawCircle(end, 3, Paint()..color = Colors.white);

    final mid = Offset(size.width * 0.52, size.height * 0.38);
    final a = (end - start).direction;
    canvas.save();
    canvas.translate(mid.dx, mid.dy);
    canvas.rotate(a);
    final arrow = Path()
      ..moveTo(8, 0)
      ..lineTo(-6, 5)
      ..lineTo(-6, -5)
      ..close();
    canvas.drawPath(arrow, Paint()..color = Colors.black87);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _StackedBarPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S'];
    final barW = size.width / (months.length + 1.5);
    final baseY = size.height * 0.78;
    final maxH = size.height * 0.55;

    for (var i = 0; i < months.length; i++) {
      final x = barW * 0.75 + i * barW;
      final hR = maxH * (0.15 + (i % 3) * 0.05);
      final hO = maxH * (0.12 + (i % 4) * 0.03);
      final hP = maxH * (0.25 + (i % 2) * 0.08);
      var y = baseY;
      void drawSeg(double h, Color c) {
        y -= h;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(x, y, barW * 0.62, h),
            const Radius.circular(3),
          ),
          Paint()..color = c,
        );
      }

      drawSeg(hR, AppColors.primary);
      drawSeg(hP, const Color(0xFFF97316));
      drawSeg(hO, const Color(0xFFEF4444));

      final tp = TextPainter(
        text: TextSpan(
          text: months[i],
          style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(x + barW * 0.15, baseY + 6));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _LineTrendPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final lines = [
      (AppColors.primary, [0.2, 0.35, 0.42, 0.5, 0.48, 0.55, 0.62, 0.58, 0.7]),
      (const Color(0xFFF97316), [0.35, 0.32, 0.4, 0.38, 0.45, 0.5, 0.48, 0.52, 0.5]),
      (const Color(0xFFEF4444), [0.15, 0.18, 0.2, 0.22, 0.2, 0.25, 0.22, 0.28, 0.3]),
    ];
    final n = 9.0;
    for (final e in lines) {
      final path = Path();
      for (var i = 0; i < e.$2.length; i++) {
        final x = size.width * (0.08 + (i / (n - 1)) * 0.84);
        final y = size.height * (0.75 - e.$2[i] * 0.55);
        if (i == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      canvas.drawPath(
        path,
        Paint()
          ..color = e.$1
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.2
          ..strokeCap = StrokeCap.round,
      );
    }
    final months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S'];
    final step = size.width * 0.84 / (n - 1);
    for (var i = 0; i < months.length; i++) {
      final tp = TextPainter(
        text: TextSpan(
          text: months[i],
          style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(size.width * 0.06 + i * step, size.height * 0.82));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _RingPainter extends CustomPainter {
  _RingPainter({required this.percent});
  final double percent;

  @override
  void paint(Canvas canvas, Size size) {
    final c = Offset(size.width / 2, size.height / 2);
    final r = math.min(size.width, size.height) / 2 - 2;
    canvas.drawCircle(
      c,
      r,
      Paint()
        ..color = AppColors.border
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5,
    );
    final sweep = 2 * math.pi * percent.clamp(0.0, 1.0);
    canvas.drawArc(
      Rect.fromCircle(center: c, radius: r),
      -math.pi / 2,
      sweep,
      false,
      Paint()
        ..color = AppColors.primary
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
