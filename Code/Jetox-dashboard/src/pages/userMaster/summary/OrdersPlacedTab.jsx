import React, { useState, useMemo } from "react";
import DataTable from "../../../components/ui/table/DataTable";
import { useTableData } from "../../../hooks/useTableData";
import { ChevronUp, ChevronDown } from "lucide-react";

const OrdersPlacedTab = () => {
  const [expandedRow, setExpandedRow] = useState(0); // Mock first row expanded

  const columns = [
    "Order Number",
    "Date & Time",
    "Placed By",
    "Client Name",
    "Order Status",
    "Payment Status",
  ];

  const data = useMemo(() => [
    {
      id: 0,
      "Order Number": "ORD-0035",
      "Date & Time": "03 Jul 2025, 03:15 PM",
      "Placed By": "Anita Mehra",
      "Client Name": "Rajeev Sharma",
      "Order Status": "In Process",
      "Payment Status": "Pending",
      personDetails: {
        contact: "+91-9876543210",
        address: "101, Shree Residency, Surat, Gujarat",
        fullAddress: "101, Shree Residency\nNear Bus Stand\nSurat, Gujarat - 395007\nIndia",
        assignedDeliveryPerson: "Ajay Bhatt"
      },
      dispatchDetails: {
        paymentMethod: "Debit Card",
        dispatchStatus: "Pending",
        expectedDeliveryDate: "05 Jul 2025"
      },
      items: [
        { description: "Organic Fertilizer", qty: "50 Kg", rate: "₹400", amount: "20,000" },
        { description: "Liquid Pesticide", qty: "10 L", rate: "₹200", amount: "2,000" }
      ],
      total: "22,000"
    },
    {
      id: 1,
      "Order Number": "ORD-0036",
      "Date & Time": "04 Jul 2025, 11:00 AM",
      "Placed By": "Anita Mehra",
      "Client Name": "Vikas Patel",
      "Order Status": "In Process",
      "Payment Status": "In Process"
    }
  ], []);

  const renderCustomRow = (row, rowIndex) => {
    const isExpanded = expandedRow === rowIndex;
    
    return (
      <React.Fragment key={rowIndex}>
        <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors dark:border-slate-700 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900`}>
          <td className="px-4 py-4 text-sm text-gray-400 font-medium dark:text-slate-400">{row["Order Number"]}</td>
          <td className="px-4 py-4 text-sm text-gray-400 font-medium dark:text-slate-400">{row["Date & Time"]}</td>
          <td className="px-4 py-4 text-sm text-gray-400 font-medium dark:text-slate-400">{row["Placed By"]}</td>
          <td className="px-4 py-4 text-sm text-gray-400 font-medium dark:text-slate-400">{row["Client Name"]}</td>
          <td className="px-4 py-4 text-sm text-orange-400 font-semibold italic">{row["Order Status"]}</td>
          <td className="px-4 py-4 relative group">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-400 font-semibold italic">{row["Payment Status"]}</span>
              <button 
                onClick={() => setExpandedRow(isExpanded ? null : rowIndex)}
                className="text-gray-400 hover:text-dark transition-colors"
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </td>
        </tr>
        
        {isExpanded && row.personDetails && (
          <tr>
            <td colSpan={6} className="px-4 pb-6 bg-[#FDFDFD] dark:bg-slate-950/50">
              <div className="rounded-xl jitox-panel jitox-panel--shadow p-4 flex flex-col gap-4">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-12">
                  {/* Person Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-dark mb-1">Person Details</h4>
                    <div className="flex justify-between border-b border-gray-50 py-1">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">Contact</span>
                      <span className="text-xs text-dark font-bold">{row.personDetails.contact}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 py-1">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">Address</span>
                      <span
                        className="text-xs text-dark font-bold max-w-[200px] text-right truncate"
                        title={row.personDetails.fullAddress || row.personDetails.address}
                      >
                        {row.personDetails.address}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">Assigned Delivery Person</span>
                      <span className="text-xs text-dark font-bold">{row.personDetails.assignedDeliveryPerson}</span>
                    </div>
                  </div>

                  {/* Dispatch Details */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-bold text-dark mb-1">Dispatch Details</h4>
                    <div className="flex justify-between border-b border-gray-50 py-1">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">Payment Method</span>
                      <span className="text-xs text-dark font-bold">{row.dispatchDetails.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 py-1">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">Dispatch Status</span>
                      <span className="text-xs text-dark font-bold">{row.dispatchDetails.dispatchStatus}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-tight">Expected Delivery Date</span>
                      <span className="text-xs text-dark font-bold">{row.dispatchDetails.expectedDeliveryDate}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8F9FE]">
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-xs font-bold text-dark uppercase tracking-tight">Description</th>
                        <th className="px-4 py-3 text-xs font-bold text-dark uppercase tracking-tight">QTY</th>
                        <th className="px-4 py-3 text-xs font-bold text-dark uppercase tracking-tight">Rate</th>
                        <th className="px-4 py-3 text-xs font-bold text-dark uppercase tracking-tight">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50 last:border-none">
                          <td className="px-4 py-3 text-xs text-gray-500 font-medium">{item.description}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-medium">{item.qty}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-medium">{item.rate}</td>
                          <td className="px-4 py-3 text-xs text-dark font-bold italic">{item.amount}</td>
                        </tr>
                      ))}
                      <tr className="bg-white">
                        <td colSpan={3} className="px-4 py-3 text-xs font-bold text-dark">Total</td>
                        <td className="px-4 py-3 text-xs font-bold text-dark italic">{row.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        renderCustomRow={renderCustomRow}
        className="border-none shadow-sm"
      />
    </div>
  );
};

export default OrdersPlacedTab;
