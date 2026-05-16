import React, { useEffect, useMemo, useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { CommonDropdown } from "../../../components/ui/CommanUI";
import { fmtRupee } from "../../../utils/voucherRowMappers";
import {
  buildFinishedProductOptions,
  buildManufacturingStatusSummary,
  buildManufacturingTrend,
  buildManufacturingTrendYears,
  buildRawMaterialBreakdown,
  buildTrendChartScale,
  formatTrendAxisValue,
  resolveManufacturingTrendYear,
} from "./manufacturingOverviewUtils";

const CHART_BAR_MAX_PX = 180;

const DONUT_CX = 80;
const DONUT_CY = 80;
const DONUT_INNER_R = 60;
const DONUT_OUTER_R = 80;

/** SVG arc cannot draw a full 360° slice — use a full ring path instead. */
function getFullDonutRingPath(
  innerRadius = DONUT_INNER_R,
  outerRadius = DONUT_OUTER_R,
  cx = DONUT_CX,
  cy = DONUT_CY
) {
  return [
    `M ${cx} ${cy - outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 ${cx - 0.001} ${cy - outerRadius}`,
    `M ${cx} ${cy - innerRadius}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 ${cx + 0.001} ${cy - innerRadius}`,
    "Z",
  ].join(" ");
}

function getDonutPath(
  startAngle,
  endAngle,
  innerRadius = DONUT_INNER_R,
  outerRadius = DONUT_OUTER_R,
  cx = DONUT_CX,
  cy = DONUT_CY
) {
  const sweep = endAngle - startAngle;
  if (sweep >= 359.99) {
    return getFullDonutRingPath(innerRadius, outerRadius, cx, cy);
  }

  const start = (startAngle * Math.PI) / 180;
  const end = (endAngle * Math.PI) / 180;
  const x1 = cx + outerRadius * Math.cos(start);
  const y1 = cy + outerRadius * Math.sin(start);
  const x2 = cx + outerRadius * Math.cos(end);
  const y2 = cy + outerRadius * Math.sin(end);
  const x3 = cx + innerRadius * Math.cos(end);
  const y3 = cy + innerRadius * Math.sin(end);
  const x4 = cx + innerRadius * Math.cos(start);
  const y4 = cy + innerRadius * Math.sin(start);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

const ManufacturingOverview = ({ rows = [] }) => {
  const productOptions = useMemo(
    () => buildFinishedProductOptions(rows),
    [rows]
  );

  const [selectedProduct, setSelectedProduct] = useState("all");
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [hoveredMaterial, setHoveredMaterial] = useState(null);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const trendYearOptions = useMemo(
    () => buildManufacturingTrendYears(rows),
    [rows]
  );

  const defaultTrendYear = useMemo(
    () => resolveManufacturingTrendYear(rows),
    [rows]
  );

  const [trendYear, setTrendYear] = useState(defaultTrendYear);

  useEffect(() => {
    setTrendYear((y) =>
      trendYearOptions.includes(y) ? y : defaultTrendYear
    );
  }, [trendYearOptions, defaultTrendYear]);

  useEffect(() => {
    if (!productOptions.some((o) => o.value === selectedProduct)) {
      setSelectedProduct("all");
    }
  }, [productOptions, selectedProduct]);

  const statusSummary = useMemo(
    () => buildManufacturingStatusSummary(rows),
    [rows]
  );

  const trendData = useMemo(
    () => buildManufacturingTrend(rows, selectedProduct, trendYear),
    [rows, selectedProduct, trendYear]
  );

  const trendScale = useMemo(
    () => buildTrendChartScale(trendData),
    [trendData]
  );

  const rawMaterialSlices = useMemo(
    () => buildRawMaterialBreakdown(rows, selectedProduct),
    [rows, selectedProduct]
  );

  const donutSegments = useMemo(() => {
    if (rawMaterialSlices.length === 1) {
      const slice = rawMaterialSlices[0];
      return [
        {
          ...slice,
          value: 100,
          startAngle: -90,
          endAngle: 270,
          middleAngle: 0,
          isFullRing: true,
          path: getFullDonutRingPath(),
        },
      ];
    }

    let currentAngle = -90;
    return rawMaterialSlices.map((slice) => {
      const startAngle = currentAngle;
      const angle = (slice.value / 100) * 360;
      const endAngle = currentAngle + angle;
      const middleAngle = (startAngle + endAngle) / 2;
      currentAngle = endAngle;
      return {
        ...slice,
        startAngle,
        endAngle,
        middleAngle,
        isFullRing: false,
        path: getDonutPath(startAngle, endAngle),
      };
    });
  }, [rawMaterialSlices]);

  const singleMaterial = rawMaterialSlices.length === 1 ? rawMaterialSlices[0] : null;

  const pausedOrFailed = statusSummary.paused + statusSummary.failed;

  return (
    <div className="min-w-0 rounded-2xl bg-white dark:bg-slate-900 flex flex-col gap-3 2xl:gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 border border-light-border rounded-2xl p-4 text-center dark:border-slate-600 dark:bg-slate-800/40">
        <div className="border-r border-light-border dark:border-slate-600">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {statusSummary.total}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Batches
          </div>
        </div>
        <div className="border-r border-light-border dark:border-slate-600">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {statusSummary.completed}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Completed Batches
          </div>
        </div>
        <div className="border-r border-light-border dark:border-slate-600">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {statusSummary.inProgress}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            In-Progress
          </div>
        </div>
        <div className="border-r border-light-border dark:border-slate-600">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {pausedOrFailed}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Failed/Paused
          </div>
        </div>
        <div className="col-span-2 text-center md:col-span-1">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {statusSummary.totalCost}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Cost
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 min-w-0">
        <div className="min-w-0 overflow-hidden border border-light-border rounded-2xl p-3 sm:p-4 dark:border-slate-600 dark:bg-slate-800/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-3 sm:mb-4">
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-semibold text-dark dark:text-slate-100">
                Manufacturing Trend
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Batch cost by month · {trendYear}
              </p>
            </div>
            <div className="flex w-full sm:w-auto items-stretch gap-2 shrink-0">
              <CommonDropdown
                options={productOptions}
                value={selectedProduct}
                addNavigateTo="/dashboard/product"
                onChange={setSelectedProduct}
                className="flex-1 min-w-0 sm:flex-none sm:w-44"
              />
              <div className="relative shrink-0">
                <DatePicker
                  picker="year"
                  format="YYYY"
                  value={dayjs().year(trendYear).startOf("year")}
                  open={yearPickerOpen}
                  onOpenChange={setYearPickerOpen}
                  onChange={(d) => {
                    if (d?.isValid()) setTrendYear(d.year());
                  }}
                  allowClear={false}
                  disabledDate={(d) =>
                    !trendYearOptions.includes(d.year())
                  }
                  placement="bottomRight"
                  getPopupContainer={(node) =>
                    node.parentElement ?? document.body
                  }
                  className="!absolute !w-0 !h-0 !min-w-0 !p-0 !m-0 !border-0 !opacity-0 overflow-hidden pointer-events-none"
                  popupClassName="jitox-picker-form"
                />
                <button
                  type="button"
                  onClick={() => setYearPickerOpen(true)}
                  className={`p-2 border rounded-lg transition-colors dark:border-slate-600 ${
                    yearPickerOpen
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-light-border hover:bg-gray-50 dark:hover:bg-slate-700/70"
                  }`}
                  aria-label={`Select chart year, currently ${trendYear}`}
                  title={`Year: ${trendYear}`}
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="relative min-w-0">
            <div className="absolute left-0 top-0 bottom-5 sm:bottom-6 w-7 sm:w-10 flex flex-col justify-between text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">
              {trendScale.ticks.map((tick) => (
                <span key={tick}>{formatTrendAxisValue(tick)}</span>
              ))}
            </div>
            <div className="absolute left-7 sm:left-10 right-0 top-0 bottom-5 sm:bottom-6 flex flex-col justify-between">
              {trendScale.ticks.map((tick) => (
                <div
                  key={`grid-${tick}`}
                  className="border-t border-gray-100 dark:border-slate-700/70"
                />
              ))}
            </div>
            <div className="ml-7 sm:ml-10 overflow-x-auto overscroll-x-contain touch-pan-x pb-1">
              <div className="flex items-end gap-1.5 sm:gap-3 h-36 sm:h-[200px] min-w-[17.5rem] sm:min-w-0 w-full max-w-full">
              {trendData.map((item) => {
                const height =
                  trendScale.chartMax > 0
                    ? Math.max(
                        item.value > 0 ? 4 : 0,
                        (item.value / trendScale.chartMax) * CHART_BAR_MAX_PX
                      )
                    : 0;
                return (
                  <div
                    key={item.month}
                    className="flex flex-1 flex-col items-center gap-1 sm:gap-2 min-w-[1.125rem] sm:min-w-[1.75rem]"
                  >
                    <div
                      className="relative z-0 flex h-full w-full max-w-[0.45rem] sm:max-w-[0.5rem] items-end justify-center"
                      onMouseEnter={() => setHoveredMonth(item)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      onClick={() =>
                        setHoveredMonth((prev) =>
                          prev?.month === item.month ? null : item
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setHoveredMonth((prev) =>
                            prev?.month === item.month ? null : item
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.month}: ${fmtRupee(item.value)}`}
                    >
                      {hoveredMonth?.month === item.month && item.value > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-dark text-white text-xs px-2 py-0.5 rounded-md shadow dark:bg-slate-700">
                          {fmtRupee(item.value)}
                        </div>
                      )}
                      <div
                        className="w-full max-h-full rounded-t-lg manufacturing-gradient transition-all duration-200"
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 dark:text-slate-400">
                      {item.month}
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
            {!trendScale.hasData && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400 px-4">
                {rows.length === 0
                  ? "No manufacturing batches yet."
                  : `No batch costs recorded for ${trendYear} with this filter.`}
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden border border-light-border rounded-2xl p-3 sm:p-4 dark:border-slate-600 dark:bg-slate-800/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-3 sm:mb-4">
            <div className="text-base sm:text-lg font-semibold text-dark dark:text-slate-100 shrink-0">
              Raw Material Overview
            </div>
            <CommonDropdown
              options={productOptions}
              value={selectedProduct}
              onChange={setSelectedProduct}
              addNavigateTo="/dashboard/product"
              className="w-full sm:w-44 shrink-0"
            />
          </div>

          {rawMaterialSlices.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {rows.length === 0
                ? "No manufacturing batches yet."
                : "No raw material lines for this filter."}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="relative mx-auto h-36 w-36 shrink-0 sm:h-40 sm:w-40">
                <svg
                  viewBox="0 0 160 160"
                  className="absolute inset-0 h-full w-full"
                  onMouseLeave={() => setHoveredMaterial(null)}
                >
                  {singleMaterial ? (
                    <circle
                      cx={DONUT_CX}
                      cy={DONUT_CY}
                      r={DONUT_OUTER_R}
                      fill={singleMaterial.color}
                      className="cursor-pointer transition-opacity hover:opacity-90"
                      onMouseEnter={() =>
                        setHoveredMaterial({
                          ...singleMaterial,
                          value: 100,
                          middleAngle: 0,
                        })
                      }
                    />
                  ) : (
                    donutSegments.map((segment) => (
                      <path
                        key={segment.label}
                        d={segment.path}
                        fill={segment.color}
                        fillRule={segment.isFullRing ? "evenodd" : "nonzero"}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onMouseEnter={() => setHoveredMaterial(segment)}
                      />
                    ))
                  )}
                </svg>
                <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center pointer-events-none dark:bg-slate-900">
                  <span className="text-base font-semibold text-dark sm:text-lg">
                    {singleMaterial || hoveredMaterial
                      ? `${(hoveredMaterial ?? singleMaterial).value}%`
                      : "100%"}
                  </span>
                  <span className="text-xs text-dark dark:text-slate-300 px-1 truncate max-w-full">
                    {singleMaterial
                      ? singleMaterial.label
                      : hoveredMaterial
                        ? hoveredMaterial.label
                        : "Total"}
                  </span>
                </div>
                {hoveredMaterial ? (
                  <div
                    className="absolute bg-dark text-white text-xs px-2 py-0.5 rounded-md shadow z-10 pointer-events-none whitespace-nowrap dark:bg-slate-700"
                    style={{
                      left: `${DONUT_CX + 95 * Math.cos((hoveredMaterial.middleAngle * Math.PI) / 180)}px`,
                      top: `${DONUT_CY + 95 * Math.sin((hoveredMaterial.middleAngle * Math.PI) / 180)}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {fmtRupee(hoveredMaterial.total)}
                  </div>
                ) : null}
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2.5 sm:flex-1">
                {rawMaterialSlices.map((item) => (
                  <div
                    key={item.label}
                    className="flex min-w-0 items-center gap-2 text-sm"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-dark flex-1 truncate dark:text-slate-200">
                      {item.label}
                    </span>
                    <span className="text-xs text-light shrink-0 dark:text-slate-400">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManufacturingOverview;
