import React, { useMemo, useState } from "react";
import { Button, CommonDropdown, SearchBar } from "../../../components/ui/CommanUI";

const productOptions = [
  { value: "all", label: "All Products" },
  { value: "organic-fertilizer", label: "Organic Fertilizer" },
  { value: "bio-pesticide", label: "Bio Pesticide" },
  { value: "mulch-sheet", label: "Mulch Sheet" },
];

const expenseFilterOptions = [
  { value: "all", label: "Expense Type" },
  { value: "raw", label: "Raw Material" },
  { value: "packaging", label: "Packaging" },
  { value: "labor", label: "Labor" },
];

const trendTemplate = [
  { month: "Jan", value: 1800 },
  { month: "Feb", value: 1000 },
  { month: "Mar", value: 2300 },
  { month: "Apr", value: 3348 },
  { month: "May", value: 1600 },
  { month: "Jun", value: 4200 },
  { month: "Jul", value: 1500 },
  { month: "Aug", value: 2600 },
  { month: "Sep", value: 2100 },
  { month: "Oct", value: 3800 },
  { month: "Nov", value: 1300 },
  { month: "Dec", value: 1700 },
];

const rawMaterialTemplate = [
  { label: "Urea", value: 40, color: "bg-[#FFC857]" },
  { label: "DAP", value: 20, color: "bg-[#58A4B0]" },
  { label: "Neem Cake", value: 15, color: "bg-[#9B5DE5]" },
  { label: "Green Manure", value: 15, color: "bg-[#41EAD4]" },
  { label: "Bone Meal", value: 10, color: "bg-[#F95738]" },
];

const donutColors = ["#FFC857", "#58A4B0", "#9B5DE5", "#41EAD4", "#F95738"];

const ManufacturingOverview = ({
  rows = []
}) => {
  const [selectedProduct, setSelectedProduct] = useState(productOptions[1].value);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [hoveredMaterial, setHoveredMaterial] = useState(null);

  const statusSummary = useMemo(() => {
    if (!rows.length) {
      return {
        total: 128,
        completed: 110,
        inProgress: 15,
        planned: 0,
        failed: 3,
        totalCost: "₹6,20,000",
      };
    }

    const completed = rows.filter((row) => row.Status === "Completed").length;
    const inProgress = rows.filter((row) => row.Status?.toLowerCase().includes("progress")).length;
    const planned = rows.filter((row) => row.Status?.toLowerCase() === "planned").length;
    const failed = rows.filter((row) => row.Status?.toLowerCase().includes("fail")).length;
    return {
      total: rows.length,
      completed,
      inProgress,
      planned,
      failed,
      totalCost: `₹${(rows.length * 52000).toLocaleString("en-IN")}`,
    };
  }, [rows]);

  // Calculate SVG path for donut segments
  const getDonutPath = (startAngle, endAngle, innerRadius, outerRadius) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    const x1 = 80 + outerRadius * Math.cos(start);
    const y1 = 80 + outerRadius * Math.sin(start);
    const x2 = 80 + outerRadius * Math.cos(end);
    const y2 = 80 + outerRadius * Math.sin(end);
    const x3 = 80 + innerRadius * Math.cos(end);
    const y3 = 80 + innerRadius * Math.sin(end);
    const x4 = 80 + innerRadius * Math.cos(start);
    const y4 = 80 + innerRadius * Math.sin(start);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  const donutSegments = useMemo(() => {
    let currentAngle = -90; // Start from top
    return rawMaterialTemplate.map((slice, index) => {
      const startAngle = currentAngle;
      const angle = (slice.value / 100) * 360;
      const endAngle = currentAngle + angle;
      const middleAngle = (startAngle + endAngle) / 2;
      currentAngle = endAngle;
      return {
        ...slice,
        color: donutColors[index],
        startAngle,
        endAngle,
        middleAngle,
        path: getDonutPath(startAngle, endAngle, 60, 80),
      };
    });
  }, []);

  return (
    <div className="bg-white rounded-2xl flex flex-col gap-3 2xl:gap-4">

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 border border-light-border rounded-2xl p-4 text-center">
        <div className="border-r border-light-border">
          <div className="text-lg font-semibold">{statusSummary.total}</div>
          <div className="text-xs">Total Batches</div>
        </div>
        <div className="border-r border-light-border">
          <div className="text-lg font-semibold">{statusSummary.completed}</div>
          <div className="text-xs">Completed Batches</div>
        </div>
        <div className="border-r border-light-border">
          <div className="text-lg font-semibold">{statusSummary.inProgress}</div>
          <div className="text-xs">In-Progress</div>
        </div>
        <div className="border-r border-light-border">
          <div className="text-lg font-semibold">{statusSummary.failed}</div>
          <div className="text-xs">Failed/Paused</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{statusSummary.totalCost}</div>
          <div className="text-xs">Total Cost</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div className="border border-light-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold text-dark ">Manufacturing Trend</div>

            </div>
            <div className="flex items-center gap-2">
              <CommonDropdown
                options={productOptions}
                value={selectedProduct}
                addNavigateTo="/dashboard/product"
                onChange={setSelectedProduct}
                className="w-44"
              />
              <button className="p-2 border border-light-border rounded-lg hover:bg-gray-50">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
            </div>
          </div>
          <div className="relative">
            {/* Y-axis labels and grid lines */}
            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-gray-400">
              <span>5k</span>
              <span>4k</span>
              <span>3k</span>
              <span>2k</span>
              <span>1k</span>
              <span>0</span>
            </div>
            
            {/* Grid lines */}
            <div className="absolute left-10 right-0 top-0 bottom-6 flex flex-col justify-between">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border-t border-gray-100" />
              ))}
            </div>

             {/* Bars */}
             <div className="ml-10 flex items-end gap-3 overflow-x-auto" style={{ height: '200px' }}>
              {trendTemplate.map((item) => {
                const height = (item.value / 5000) * 180;
                const monthNames = {
                  Jan: "Jan", Feb: "Feb", Mar: "Mar", Apr: "Apr", 
                  May: "May", Jun: "June", Jul: "July", Aug: "Aug",
                  Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Dec"
                };
                 return (
                  <div key={item.month} className="flex flex-col items-center gap-2 flex-1">
                     <div
                       className="relative h-full w-full max-w-[0.5rem] flex items-end z-[9999]"
                       onMouseEnter={() => setHoveredMonth(item)}
                       onMouseLeave={() => setHoveredMonth(null)}
                     >
                       {hoveredMonth?.month === item.month && (
                         <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-dark text-white text-xs px-2 py-0.5 rounded-md shadow">
                           ₹{item.value.toLocaleString("en-IN")}
                         </div>
                       )}
                      <div
                        className="w-full rounded-t-lg manufacturing-gradient transition-all duration-200"
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{monthNames[item.month]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          <div className="border border-light-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
               <div className="font-semibold text-dark text-lg">Raw Material Overview</div>
            <CommonDropdown
              options={productOptions}
              value={selectedProduct}
              onChange={setSelectedProduct}
              addNavigateTo="/dashboard/product"
              className="w-44"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-40 h-40">
              <svg
                width="160"
                height="160"
                viewBox="0 0 160 160"
                className="absolute inset-0"
                onMouseLeave={() => setHoveredMaterial(null)}
              >
                {donutSegments.map((segment) => (
                  <path
                    key={segment.label}
                    d={segment.path}
                    fill={segment.color}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={() => setHoveredMaterial(segment)}
                    onMouseLeave={() => setHoveredMaterial(null)}
                  />
                ))}
              </svg>
              <div className="absolute inset-4 bg-white rounded-full flex flex-col text-center items-center justify-center pointer-events-none">
                <span className="font-semibold text-dark text-lg">
                  {hoveredMaterial ? `${hoveredMaterial.value}%` : "100%"}
                </span>
                <span className="text-xs text-dark">
                  {hoveredMaterial ? hoveredMaterial.label : "Total"}
                </span>
              </div>
              {hoveredMaterial && (() => {
                // Calculate tooltip position near the segment
                const tooltipRadius = 95; // Position outside the donut
                const angleRad = (hoveredMaterial.middleAngle * Math.PI) / 180;
                const x = 80 + tooltipRadius * Math.cos(angleRad);
                const y = 80 + tooltipRadius * Math.sin(angleRad);
                return (
                  <div
                    className="absolute bg-dark text-white text-xs px-2 py-0.5 rounded-md shadow z-10 pointer-events-none whitespace-nowrap"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {hoveredMaterial.value}%
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-col gap-3">
              {rawMaterialTemplate.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className="text-dark flex-1">{item.label}</span>
                  <span className="text-xs text-light">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManufacturingOverview;

