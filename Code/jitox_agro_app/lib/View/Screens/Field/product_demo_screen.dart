import 'package:flutter/material.dart';
import 'package:jitox_agro_app/Constants/colors.dart';
import 'package:jitox_agro_app/View/Widgets/mr/mr_app_bar.dart';
import 'package:responsive_sizer/responsive_sizer.dart';

class ProductDemoScreen extends StatefulWidget {
  const ProductDemoScreen({super.key});

  @override
  State<ProductDemoScreen> createState() => _ProductDemoScreenState();
}

class _ProductDemoScreenState extends State<ProductDemoScreen> {
  final _cropCtrl = TextEditingController();
  final _problemCtrl = TextEditingController();
  final _waterCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();
  final _partyCtrl = TextEditingController();

  static const _crops = [
    'Moong(Pulses)',
    'Groundnut',
    'Red Chillies',
    'Sesame',
    'Castor',
  ];

  static const _problems = [
    'Stink Bug',
    'Termites',
    'White Flies',
    'Weedy Blocks',
  ];

  @override
  void dispose() {
    _cropCtrl.dispose();
    _problemCtrl.dispose();
    _waterCtrl.dispose();
    _areaCtrl.dispose();
    _partyCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cropQ = _cropCtrl.text.trim().toLowerCase();
    final problemQ = _problemCtrl.text.trim().toLowerCase();
    final showCrops = cropQ.isNotEmpty;
    final showProblems = problemQ.isNotEmpty && !showCrops;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: const MrAppBar(
        title: 'Add Product Demo',
        showMenu: false,
        showBack: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(4.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: _cropCtrl,
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Crop Name',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                    ),
                  ),
                  if (showCrops)
                    _SuggestionList(
                      items: _crops
                          .where((c) => c.toLowerCase().contains(cropQ))
                          .toList(),
                      onSelect: (v) {
                        _cropCtrl.text = v;
                        setState(() {});
                      },
                    ),
                  SizedBox(height: 1.5.h),
                  TextField(
                    controller: _problemCtrl,
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Crop Problem',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                    ),
                  ),
                  if (showProblems)
                    _SuggestionList(
                      items: _problems
                          .where((p) => p.toLowerCase().contains(problemQ))
                          .toList(),
                      onSelect: (v) {
                        _problemCtrl.text = v;
                        setState(() {});
                      },
                    ),
                  SizedBox(height: 1.5.h),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _waterCtrl,
                          decoration: InputDecoration(
                            hintText: 'Water(Ltr)',
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(6),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: 2.w),
                      Expanded(
                        child: TextField(
                          controller: _areaCtrl,
                          decoration: InputDecoration(
                            hintText: 'Up to 50 Acres',
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(6),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 1.5.h),
                  TextField(
                    controller: _partyCtrl,
                    decoration: InputDecoration(
                      hintText: 'Party Name',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Row(
                    children: List.generate(
                      3,
                      (_) => Expanded(
                        child: Padding(
                          padding: EdgeInsets.symmetric(horizontal: 1.w),
                          child: AspectRatio(
                            aspectRatio: 1,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.grey.shade300,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.photo_library_outlined,
                                      color: Colors.white, size: 28.sp),
                                  SizedBox(height: 0.5.h),
                                  Text(
                                    'Select Photo',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 10.sp,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(4.w, 1.h, 4.w, 1.5.h),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Product demo saved')),
                    );
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    padding: EdgeInsets.symmetric(vertical: 1.6.h),
                  ),
                  child: Text('SUBMIT', style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SuggestionList extends StatelessWidget {
  const _SuggestionList({required this.items, required this.onSelect});

  final List<String> items;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: EdgeInsets.only(top: 0.5.h),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(6),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: items.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade200),
        itemBuilder: (_, i) => ListTile(
          dense: true,
          title: Text(items[i], style: TextStyle(fontSize: 13.sp)),
          onTap: () => onSelect(items[i]),
        ),
      ),
    );
  }
}
