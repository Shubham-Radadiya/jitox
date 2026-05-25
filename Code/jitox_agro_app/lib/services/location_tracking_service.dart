import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:jitox_agro_app/services/tracking_api.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Sends GPS pings to the API while the field day is active.
class LocationTrackingService {
  LocationTrackingService._();
  static final LocationTrackingService instance = LocationTrackingService._();

  static const _activeKey = 'field_tracking_active';
  Timer? _timer;
  bool _busy = false;

  Future<bool> isActive() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_activeKey) ?? false;
  }

  Future<bool> ensurePermission() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) return false;

    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.denied ||
        perm == LocationPermission.deniedForever) {
      return false;
    }
    return true;
  }

  Future<Position?> _currentPosition() async {
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
    } catch (e) {
      debugPrint('LocationTrackingService position error: $e');
      return null;
    }
  }

  Future<bool> sendPing(String kind) async {
    if (_busy) {
      await Future<void>.delayed(const Duration(milliseconds: 400));
      if (_busy) return false;
    }
    _busy = true;
    try {
      final ok = await ensurePermission();
      if (!ok) return false;
      final pos = await _currentPosition();
      if (pos == null) return false;
      await TrackingApi.postPing(
        lat: pos.latitude,
        lng: pos.longitude,
        accuracy: pos.accuracy,
        kind: kind,
      );
      return true;
    } catch (e) {
      debugPrint('LocationTrackingService ping failed: $e');
      return false;
    } finally {
      _busy = false;
    }
  }

  void _startPeriodicPings() {
    if (_timer?.isActive == true) return;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(minutes: 2), (_) {
      sendPing('ping');
    });
  }

  Future<bool> startDay() async {
    final ok = await sendPing('day_start');
    if (!ok) return false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_activeKey, true);
    _startPeriodicPings();
    return true;
  }

  Future<void> endDay() async {
    _timer?.cancel();
    _timer = null;
    await sendPing('day_end');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_activeKey, false);
  }

  Future<void> restoreIfActive() async {
    if (!await isActive()) return;
    _startPeriodicPings();
    await sendPing('ping');
  }
}
