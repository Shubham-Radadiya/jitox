import React, { useMemo } from "react";
import DataTable from "../../../components/ui/table/DataTable";

const VisitLogTab = () => {
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

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        tableClassName="bg-white"
        className="border-none shadow-sm"
      />
    </div>
  );
};

export default VisitLogTab;
