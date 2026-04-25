import React from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layouts/DashboardLayout";
import { Button } from "../../../components/ui/CommanUI";
import LoginImg from "../../../assets/login.png";

const SalesInvoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceData = location.state?.invoiceData;

  if (!invoiceData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-light">No invoice data found</p>
            <button
              onClick={() => navigate("/dashboard/accounting-voucher/sales")}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const {
    invoiceNo,
    clientDetails,
    returnInfo,
    returnedProducts,
    reasonForReturn,
    evidenceImages,
    refundDetails,
  } = invoiceData;

  return (
    <DashboardLayout>
      <div className="ds-stack-major p-3 2xl:p-4">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/accounting-voucher/sales")}
              className="text-light hover:text-dark border rounded-full border-gray-400 p-1 transition"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-lg font-semibold text-dark">
              Invoice #{invoiceNo}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="border border-gray-300 text-dark px-6 py-2 rounded-lg">
              {" "}
              Reject{" "}
            </button>
            <Button label="Approve" variant="primary" />
          </div>
        </header>

        {/* Main Content */}
        <div className="max-h-[calc(100vh-10.99rem)] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT PANEL - ONE CARD */}
            <div className="lg:col-span-2">
              <section className="bg-white border border-light-border rounded-xl p-5 space-y-8">
                {/* CLIENT DETAILS */}
                <div className="text-dark flex flex-col gap-3">
                  <div className="text-sm font-semibold">Client Details</div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Full Name:</span>
                      <span>{clientDetails.fullName}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Phone Number:</span>
                      <span>{clientDetails.phone}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span>{clientDetails.email}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Shipping Address:</span>
                      <span>{clientDetails.shippingAddress}</span>
                    </div>
                  </div>
                </div>
                <hr className="border-light-border" />

                {/* RETURN / ORDER INFORMATION */}
                <div>
                  <div className="flex justify-between text-sm">
                    <div className="flex flex-col gap-2">
                      <span className="text-light font-semibold">
                        Return ID
                      </span>
                      <span className="text-dark font-medium">
                        {returnInfo.returnId}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-light font-semibold">Order No</span>
                      <span className="text-dark text-xs">
                        {returnInfo.orderNo}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-light font-semibold">
                        Order Date
                      </span>
                      <span className="text-dark font-medium">
                        {returnInfo.orderDate}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-light font-semibold">
                        Return Date
                      </span>
                      <span className="text-dark font-medium">
                        {returnInfo.returnDate}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 items-center">
                      <span className="text-light font-semibold">
                        Return Status
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-md bg-gray text-gray2 text-xs font-medium">
                        {returnInfo.returnStatus}
                      </span>
                    </div>
                  </div>
                </div>
                {/* RETURNED PRODUCTS TABLE */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Returned Products</div>
                  <div className="border border-light-border overflow-hidden rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-headBg">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-dark">
                            Product Name ({returnedProducts.length})
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-dark">
                            Order Qty
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-dark">
                            Re. Qty
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-dark">
                            Rate
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-dark">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnedProducts.map((product, index) => (
                          <tr
                            key={index}
                            className="border-t border-light-border bg-white"
                          >
                            <td className="px-4 py-3 text-light border-r border-light-border">
                              {product.name}
                            </td>
                            <td className="px-4 py-3 text-light border-r border-light-border">
                              {product.orderQty}
                            </td>
                            <td className="px-4 py-3 text-light border-r border-light-border">
                              {product.returnQty}
                            </td>
                            <td className="px-4 py-3 text-light border-r border-light-border">
                              {product.rate}
                            </td>
                            <td className="px-4 py-3 text-light">
                              {product.subtotal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-light-border bg-headBg">
                          <td className="px-4 py-3 text-left align-middle font-medium text-dark">
                            Total
                          </td>
                          <td className="px-4 py-3 text-right align-middle tabular-nums text-light" />
                          <td className="px-4 py-3 text-right align-middle tabular-nums text-light" />
                          <td className="px-4 py-3 text-right align-middle tabular-nums text-light" />
                          <td className="px-4 py-3 text-right align-middle font-semibold tabular-nums text-dark">
                            {refundDetails.totalAmount}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* TERMS */}
                <div className="space-y-2 text-sm">
                  <div className=" text-light font-semibold ">
                    Terms & Conditions
                  </div>
                  <p className="text-dark">
                    Please pay within 15 days of receiving this invoice.
                  </p>
                </div>
              </section>
            </div>

            {/* RIGHT PANEL - ONE CARD */}
            <div className="flex flex-col gap-3">
              <section className="bg-white rounded-xl p-5 space-y-8">
                {/* REASON */}
                <div className="space-y-2">
                  <div className="font-semibold text-center font-2xl text-dark">
                    Reason for Return
                  </div>
                  <div className="border-l-2 border-red rounded-lg px-4 py-2 bg-red-50">
                    <div className="text-dark text-sm">{reasonForReturn}</div>
                  </div>
                </div>
              </section>
              <section className="bg-white rounded-xl p-5 space-y-8">
                {/* IMAGES */}
                <div className="space-y-2">
                  <div className="font-semibold font-2xl text-dark">
                    Uploaded Evidence Images
                  </div>
                  <hr className="border-light-border my-4" />
                  <div className="grid grid-cols-2 gap-3">
                    {evidenceImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square border border-light-border rounded-lg overflow-hidden group cursor-pointer bg-gray-100"
                      >
                        {image.url ? (
                          <img
                            src={LoginImg}
                            alt={image.alt || `Evidence ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-xs text-light">
                              Image {index + 1}
                            </div>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye size={20} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* REFUND DETAILS */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-dark">
                      Refund/Replacement Details
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-pink-100 text-pink-600 text-xs font-medium">
                      Not Processed
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-dark">
                      <span>Requested Option:</span>
                      <span>
                        {refundDetails.requestedOption}
                      </span>
                    </div>

                    <div className="flex justify-between text-dark text-xs">
                      <span>Refund Amount:</span>
                      <span>
                        {refundDetails.refundAmount}
                      </span>
                    </div>

                    <div className="flex justify-between text-dark text-xs">
                      <span>Refund Mode:</span>
                      <span>
                        {refundDetails.refundMode}
                      </span>
                    </div>

                    <div className="flex justify-between text-dark text-xs">
                      <span>UPI ID / Account:</span>
                      <span>
                        {refundDetails.upiId}
                      </span>
                    </div>

                    <hr className="border-light-border" />

                    <div className="flex justify-between text-dark text-sm">
                      <span>Total</span>
                      <span>
                        {refundDetails.totalAmount}
                      </span>
                    </div>

                    <div className="flex justify-between pt-2">
                      <span className="text-dark font-semibold text-lg">
                        Total Amount
                      </span>
                      <span className="text-dark font-bold text-lg">
                        {refundDetails.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalesInvoice;
