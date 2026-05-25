/// Shared payment navigation args and formatting (avoids circular imports).

String fmtInr(num value) {
  final v = value.toDouble();
  final sign = v < 0 ? '-' : '';
  final abs = v.abs();
  return '$sign₹${abs.toStringAsFixed(2)}';
}

class PaymentReceiptArgs {
  const PaymentReceiptArgs({
    required this.total,
    required this.paid,
    required this.remaining,
    required this.partial,
  });

  final double total;
  final double paid;
  final double remaining;
  final bool partial;
}
