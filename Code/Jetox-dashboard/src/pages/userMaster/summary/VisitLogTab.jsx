import React, { useMemo, useState } from "react";
import DataTable from "../../../components/ui/table/DataTable";
import { CalendarDays, MapPin, UserRoundSearch } from "lucide-react";
import SummaryFilterBar from "./SummaryFilterBar";

const VisitLogTab = ({ showFilterByLabel = false, filterLeading = null }) => {
  const [visitIdFilter, setVisitIdFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const columns = [
    "Visit ID",
    "Client Name",
    "Date",
    "Location",
    "Purpose",
    "Outcomes",
    "Notes",
  ];

  const data = useMemo(() => [
    {
      "Visit ID": "VS1001",
      "Client Name": "Alpha Traders",
      "Date": "Mon 15 Jan, 2025",
      "Location": "Surat",
      "Purpose": "Demo Visit",
      "Outcomes": "Interested",
      "Notes": "Follow-Up Meeting S...",
    },
    {
      "Visit ID": "VS1002",
      "Client Name": "Alpha Traders",
      "Date": "Sat 20 Feb, 2025",
      "Location": "Baroda",
      "Purpose": "Feedback Visit",
      "Outcomes": "No Interest",
      "Notes": "Product Demo Done",
    },
    {
      "Visit ID": "VS1003",
      "Client Name": "Alpha Traders",
      "Date": "Mon 05 June, 2024",
      "Location": "Rajkot",
      "Purpose": "Follow-Up",
      "Outcomes": "Order Confirmed",
      "Notes": "First-Time Meeting, Go...",
    },
    {
      "Visit ID": "VS1004",
      "Client Name": "Alpha Traders",
      "Date": "Wed 10 Aug, 2024",
      "Location": "Ahmedabad",
      "Purpose": "Inquiry",
      "Outcomes": "Price Too High",
      "Notes": "Pending Approval On Pro...",
    },
    {
      "Visit ID": "VS1005",
      "Client Name": "Alpha Traders",
      "Date": "Thu 01 Jan, 2025",
      "Location": "Surat",
      "Purpose": "Demo Visit",
      "Outcomes": "Interested",
      "Notes": "Discussed Bulk Pricing",
    }
  ], []);

  const visitIdOptions = useMemo(() => {
    const seen = new Set(data.map((d) => String(d["Visit ID"] || "").trim()).filter(Boolean));
    return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [data]);

  const dateOptions = useMemo(() => {
    const seen = new Set(data.map((d) => String(d["Date"] || "").trim()).filter(Boolean));
    return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [data]);

  const locationOptions = useMemo(() => {
    const seen = new Set(data.map((d) => String(d["Location"] || "").trim()).filter(Boolean));
    return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (visitIdFilter && String(row["Visit ID"]) !== visitIdFilter) return false;
      if (dateFilter && String(row["Date"]) !== dateFilter) return false;
      if (locationFilter && String(row["Location"]) !== locationFilter) return false;
      return true;
    });
  }, [data, visitIdFilter, dateFilter, locationFilter]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <SummaryFilterBar showFilterLabel={showFilterByLabel} leading={filterLeading}>
        <div className="relative w-full sm:w-40">
          <UserRoundSearch
            size={14}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            value={visitIdFilter}
            onChange={(e) => setVisitIdFilter(e.target.value)}
            aria-label="Filter by visit id"
          >
            <option value="">Visit ID</option>
            {visitIdOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-44">
          <CalendarDays
            size={14}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
          >
            <option value="">Date</option>
            {dateOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-40">
          <MapPin
            size={14}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter by location"
          >
            <option value="">Location</option>
            {locationOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </SummaryFilterBar>

      <DataTable columns={columns} data={filteredData} />
    </div>
  );
};

export default VisitLogTab;
