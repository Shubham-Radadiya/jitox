import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/services/tracking_api.dart';
import 'package:jitox_agro_app/View/Widgets/mr/mr_app_bar.dart';
import 'package:latlong2/latlong.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class LiveFeedScreen extends StatefulWidget {
  const LiveFeedScreen({super.key});

  @override
  State<LiveFeedScreen> createState() => _LiveFeedScreenState();
}

class _LiveFeedScreenState extends State<LiveFeedScreen>
    with SingleTickerProviderStateMixin {
  final MapController _mapController = MapController();
  List<LatLng> _path = [];
  List<LatLng> _traveledPath = [];
  LatLng? _current;
  double _totalKm = 0;
  int _pingCount = 0;
  bool _followsRoads = false;
  bool _loading = true;
  String? _error;
  Timer? _refreshTimer;
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat();
    _load();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) _load(silent: true);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  List<LatLng> _parsePath(dynamic raw) {
    final path = <LatLng>[];
    if (raw is List) {
      for (final p in raw) {
        if (p is List && p.length >= 2) {
          path.add(LatLng(
            (p[0] as num).toDouble(),
            (p[1] as num).toDouble(),
          ));
        }
      }
    }
    return path;
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final data = await TrackingApi.myToday();
      final path = _parsePath(data['path']);
      final traveled = _parsePath(data['traveledPath']);
      final traveledPath = traveled.length >= 2 ? traveled : path;

      LatLng? cur;
      final cp = data['currentPosition'];
      if (cp is Map) {
        final lat = cp['lat'];
        final lng = cp['lng'];
        if (lat != null && lng != null) {
          cur = LatLng(
            (lat as num).toDouble(),
            (lng as num).toDouble(),
          );
        }
      }

      if (!mounted) return;
      setState(() {
        _path = path;
        _traveledPath = traveledPath;
        _current = cur ?? (path.isNotEmpty ? path.last : null);
        _totalKm = (data['totalPathKm'] as num?)?.toDouble() ?? 0;
        _pingCount = (data['pingCount'] as num?)?.toInt() ?? path.length;
        _followsRoads = data['followsRoads'] == true;
        _loading = false;
        _error = null;
      });
      _fitMapToPath(path.isNotEmpty ? path : traveledPath, cur);
    } catch (e) {
      if (!mounted) return;
      if (!silent) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  void _fitMapToPath(List<LatLng> path, LatLng? current) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      try {
        if (path.length >= 2) {
          final bounds = LatLngBounds.fromPoints(path);
          _mapController.fitCamera(
            CameraFit.bounds(
              bounds: bounds,
              padding: EdgeInsets.all(4.w),
            ),
          );
        } else if (current != null) {
          _mapController.move(current, 14);
        }
      } catch (_) {}
    });
  }

  @override
  Widget build(BuildContext context) {
    final hasRoute = _path.length >= 2 || _traveledPath.length >= 2;
    final hasPoint = _current != null;
    final center = _current ??
        (_traveledPath.isNotEmpty
            ? _traveledPath.last
            : (_path.isNotEmpty ? _path.last : const LatLng(23.0225, 72.5714)));

    return Scaffold(
      backgroundColor: AppColors.surfaceMuted,
      appBar: const MrAppBar(
        title: 'Live Feed',
        showMenu: false,
        showBack: true,
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.2.h),
            color: AppColors.mintHero,
            child: Text(
              _pingCount > 0
                  ? 'Today: ${_totalKm.toStringAsFixed(1)} km · $_pingCount GPS points'
                      '${_followsRoads ? ' · on roads' : ''}'
                  : 'Tap Day Start on Home to begin GPS tracking',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12.sp,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: EdgeInsets.all(6.w),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_error!, textAlign: TextAlign.center),
                              SizedBox(height: 2.h),
                              FilledButton(
                                onPressed: () => _load(),
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : !hasPoint
                        ? Center(
                            child: Padding(
                              padding: EdgeInsets.all(8.w),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.map_outlined,
                                    size: 48.sp,
                                    color: AppColors.textSecondary,
                                  ),
                                  SizedBox(height: 2.h),
                                  Text(
                                    'No route yet today.\nStart your day from the Home screen.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 14.sp,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : FlutterMap(
                            mapController: _mapController,
                            options: MapOptions(
                              initialCenter: center,
                              initialZoom: hasRoute ? 12 : 14,
                              interactionOptions: const InteractionOptions(
                                flags: InteractiveFlag.all,
                              ),
                            ),
                            children: [
                              TileLayer(
                                urlTemplate:
                                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName: 'com.jitox.agro',
                              ),
                              if (_path.length >= 2)
                                PolylineLayer(
                                  polylines: [
                                    Polyline(
                                      points: _path,
                                      color: AppColors.primary
                                          .withValues(alpha: 0.25),
                                      strokeWidth: 4,
                                    ),
                                  ],
                                ),
                              if (_traveledPath.length >= 2)
                                PolylineLayer(
                                  polylines: [
                                    Polyline(
                                      points: _traveledPath,
                                      color: AppColors.primary,
                                      strokeWidth: 6,
                                    ),
                                  ],
                                ),
                              MarkerLayer(
                                markers: [
                                  if (_path.isNotEmpty)
                                    Marker(
                                      point: _path.first,
                                      width: 36,
                                      height: 36,
                                      child: _MapPin(
                                        color: Colors.green.shade700,
                                        icon: Icons.flag,
                                        label: 'Start',
                                      ),
                                    ),
                                  if (_current != null)
                                    Marker(
                                      point: _current!,
                                      width: 48,
                                      height: 48,
                                      child: AnimatedBuilder(
                                        animation: _pulseController,
                                        builder: (context, child) {
                                          final t = _pulseController.value;
                                          final ring = 8 + t * 14;
                                          return Stack(
                                            alignment: Alignment.center,
                                            children: [
                                              Container(
                                                width: ring,
                                                height: ring,
                                                decoration: BoxDecoration(
                                                  shape: BoxShape.circle,
                                                  color: AppColors.primary
                                                      .withValues(
                                                    alpha: 0.35 * (1 - t),
                                                  ),
                                                ),
                                              ),
                                              child!,
                                            ],
                                          );
                                        },
                                        child: Container(
                                          width: 36,
                                          height: 36,
                                          decoration: BoxDecoration(
                                            color: AppColors.primary,
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: Colors.white,
                                              width: 3,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: AppColors.primary
                                                    .withValues(alpha: 0.4),
                                                blurRadius: 8,
                                                spreadRadius: 1,
                                              ),
                                            ],
                                          ),
                                          child: Icon(
                                            Icons.navigation,
                                            color: Colors.white,
                                            size: 20.sp,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () => _load(),
        tooltip: 'Refresh route',
        child: const Icon(Icons.refresh, color: Colors.white),
      ),
    );
  }
}

class _MapPin extends StatelessWidget {
  const _MapPin({
    required this.color,
    required this.icon,
    required this.label,
  });

  final Color color;
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
            boxShadow: const [
              BoxShadow(color: Colors.black26, blurRadius: 2),
            ],
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 9.sp,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ),
        Icon(icon, color: color, size: 28.sp),
      ],
    );
  }
}
