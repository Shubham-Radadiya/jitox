import React, { useMemo } from "react";
import DataTable from "../../../components/ui/table/DataTable";
import { Plus, Paperclip, Edit3 } from "lucide-react";

const ExpensesTab = () => {
  const columns = [
    "Date",
    "Expense Type",
    "Description",
    "Paid To",
    "Amount",
    "Mode",
    "Proof",
    "Action",
  ];

  const data = useMemo(() => [
    {
      "Date": "02 Jan 2025",
      "Expense Type": "Logistics",
      "Description": "Courier Charges",
      "Paid To": "DTDC",
      "Amount": "₹3,000",
      "Mode": "UPI",
      "Proof": "View",
      "Action": true
    },
    {
      "Date": "02 Feb 2025",
      "Expense Type": "Office Supplies",
      "Description": "Printer Toner",
      "Paid To": "Stationery Mart",
      "Amount": "₹2,500",
      "Mode": "Cash",
      "Proof": "-",
      "Action": true
    },
    {
      "Date": "22 Jan 2025",
      "Expense Type": "Fuel",
      "Description": "Travel To Client Site",
      "Paid To": "BP Petrol Pump",
      "Amount": "₹800",
      "Mode": "UPI",
      "Proof": "View",
      "Action": true
    },
    {
      "Date": "20 Feb 2025",
      "Expense Type": "Internet",
      "Description": "Monthly Recharge",
      "Paid To": "Jio",
      "Amount": "₹1,200",
      "Mode": "Credit Card",
      "Proof": "-",
      "Action": true
    }
  ], []);

  const renderRowCell = (colKey, value, row, rowIndex) => {
    if (colKey === "Proof") {
      return (
        <td key={colKey} className="px-4 py-4 text-xs font-medium">
          {value === "View" ? (
            <span className="text-blue-500 underline cursor-pointer">View</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      );
    }
    if (colKey === "Amount") {
      return <td key={colKey} className="px-4 py-4 text-xs text-dark font-bold italic">{value}</td>;
    }
    return (
      <td key={colKey} className="px-4 py-4 text-xs text-gray-500 font-medium">
        {value}
      </td>
    );
  };

  const renderExpenseAction = () => (
    <td className="px-3 py-2.5 align-middle border-b border-gray-200">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          title="Edit expense"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-emerald-600"
          onClick={(e) => e.stopPropagation()}
        >
          <Edit3 size={16} />
        </button>
        <button
          type="button"
          title="Attachment"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-emerald-600"
          onClick={(e) => e.stopPropagation()}
        >
          <Paperclip size={16} />
        </button>
      </div>
    </td>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Table Title and Actions */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold text-dark">Expenses</h3>
        <div className="flex items-center gap-3">
          <button className="bg-primary p-2.5 rounded-lg text-white hover:bg-primary/90 transition-colors shadow-sm">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl jitox-panel jitox-panel--shadow overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          renderRowCell={renderRowCell}
          renderAction={renderExpenseAction}
          className="border-none shadow-none"
        />
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <div className="text-sm font-bold text-dark">
            Total Expenses Incurred: <span className="italic">₹1,75,000</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
             <span>Results per page:</span>
             <select className="border-none outline-none font-bold text-dark cursor-pointer bg-transparent">
                <option>4</option>
             </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesTab;
