/// Pending signup data held between register form and OTP verification.
class RegistrationDraft {
  const RegistrationDraft({
    required this.email,
    required this.payload,
  });

  final String email;
  final Map<String, dynamic> payload;
}
