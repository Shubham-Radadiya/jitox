import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getStoredUser, canAccessModule, isAdminUser } from "../utils/authSession";

function TasksIndexRedirect() {
  const u = getStoredUser();
  return (
    <Navigate
      to={isAdminUser(u) ? "/dashboard/tasks/all" : "/dashboard/tasks/my"}
      replace
    />
  );
}

function RequireTasksAccess({ children }) {
  const u = getStoredUser();
  if (!canAccessModule(u, "tasks")) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

const Login = lazy(() => import("../pages/auth/Login"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const DashboardHome = lazy(() => import("../pages/dashboard/DashboardHome"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const Register = lazy(() => import("../pages/auth/Register"));
const VerifyCode = lazy(() => import("../pages/auth/VerifyCode"));
const MessageBox = lazy(() => import("../pages/auth/MessageBox"));
const AccountIndex = lazy(() => import("../pages/accountMaster/AccountIndex"));
const LedgerTable = lazy(() => import("../pages/accountMaster/LedgerTable"));
const ProductIndex = lazy(() => import("../pages/productMaster/ProductIndex"));
const VoucherPage = lazy(() => import("../pages/accountVoucher/VoucherPage"));
const AddPurchase = lazy(() =>
  import("../pages/accountVoucher/purchase/AddPurchase")
);
const AddQuotation = lazy(() =>
  import("../pages/accountVoucher/quotation/AddQuotation")
);
const SalesInvoice = lazy(() =>
  import("../pages/accountVoucher/sales/SalesInvoice")
);
const AddManufacturing = lazy(() =>
  import("../pages/accountVoucher/manufacturing/AddManufacturing")
);
const DayBookIndex = lazy(() => import("../pages/daybook/DayBookIndex"));
const OrderListIndex = lazy(() => import("../pages/orderList/OrderListIndex"));
const InvoiceGeneratePage = lazy(() =>
  import("../pages/orderList/InvoiceGeneratePage")
);
const EmployeeTrackIndex = lazy(() =>
  import("../pages/employeeTracking/EmployeeTrackIndex")
);
const HrmDashboard = lazy(() => import("../pages/hrm/HrmDashboard"));
const HrmEmployeeManagement = lazy(() =>
  import("../pages/hrm/EmployeeManagementPage")
);
const HrmEmployeeProfile = lazy(() =>
  import("../pages/hrm/EmployeeProfilePage")
);
const HrmSalarySlips = lazy(() => import("../pages/hrm/SalarySlipsPage"));
const HrmAutoSalary = lazy(() => import("../pages/hrm/AutoSalaryPage"));
const HrmOfferLetter = lazy(() => import("../pages/hrm/OfferLetterPage"));
const HrmAppointmentLetter = lazy(() =>
  import("../pages/hrm/AppointmentLetterPage")
);
const ReceivableIndex = lazy(() => import("../pages/receivable/ReceivableIndex"));
const PayableIndex = lazy(() => import("../pages/payable/PayableIndex"));
const StockIndex = lazy(() => import("../pages/stock/StockIndex"));
const UserMasterIndex = lazy(() => import("../pages/userMaster/UserMasterIndex"));
const TerritoryIndex = lazy(() => import("../pages/territories/TerritoryIndex"));
const UserSummaryIndex = lazy(() =>
  import("../pages/userMaster/summary/UserSummaryIndex")
);
const SchemeIndex = lazy(() => import("../pages/schemeMaster/SchemeIndex"));
const DocumentsIndex = lazy(() => import("../pages/documents/DocumentsIndex"));
const ReportsIndex = lazy(() => import("../pages/reports/ReportsIndex"));
const TargetAchievementPage = lazy(() =>
  import("../pages/targetIncentive/TargetAchievementPage")
);
const TargetTeamPage = lazy(() =>
  import("../pages/targetIncentive/TargetTeamPage")
);
const TargetAssignPage = lazy(() =>
  import("../pages/targetIncentive/TargetAssignPage")
);
const TargetProductIncentivePage = lazy(() =>
  import("../pages/targetIncentive/TargetProductIncentivePage")
);
const TasksLayout = lazy(() => import("../pages/tasks/TasksLayout"));
const AllTasksPage = lazy(() => import("../pages/tasks/AllTasksPage"));
const MyTasksPage = lazy(() => import("../pages/tasks/MyTasksPage"));
const TaskAnalyticsPage = lazy(() => import("../pages/tasks/TaskAnalyticsPage"));
const NotificationsPage = lazy(() => import("../pages/tasks/NotificationsPage"));
const NotFound = lazy(() => import("../pages/NotFound"));

function RouteTree() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/message-box" element={<MessageBox />} />

      <Route path="/dashboard" element={<DashboardHome />} />
      <Route path="/dashboard/account" element={<AccountIndex />} />
      <Route path="/dashboard/account/ledger" element={<LedgerTable />} />
      <Route path="/dashboard/product" element={<ProductIndex />} />
      <Route
        path="/dashboard/accounting-voucher"
        element={<Navigate to="/dashboard/accounting-voucher/purchase" replace />}
      />
      <Route
        path="/dashboard/accounting-voucher/add-purchase"
        element={<AddPurchase />}
      />
      <Route
        path="/dashboard/accounting-voucher/add-quotation"
        element={<AddQuotation />}
      />
      <Route
        path="/dashboard/accounting-voucher/add-manufacturing"
        element={<AddManufacturing />}
      />
      <Route
        path="/dashboard/accounting-voucher/sales-invoice"
        element={<SalesInvoice />}
      />
      <Route
        path="/dashboard/accounting-voucher/:voucherSlug"
        element={<VoucherPage />}
      />
      <Route
        path="/dashboard/employee-tracking"
        element={<EmployeeTrackIndex />}
      />
      <Route path="/dashboard/hrm" element={<HrmDashboard />} />
      <Route
        path="/dashboard/hrm/employees"
        element={<HrmEmployeeManagement />}
      />
      <Route
        path="/dashboard/hrm/employees/:id"
        element={<HrmEmployeeProfile />}
      />
      <Route path="/dashboard/hrm/salary-slips" element={<HrmSalarySlips />} />
      <Route path="/dashboard/hrm/auto-salary" element={<HrmAutoSalary />} />
      <Route path="/dashboard/hrm/offer-letter" element={<HrmOfferLetter />} />
      <Route
        path="/dashboard/hrm/appointment-letter"
        element={<HrmAppointmentLetter />}
      />

      <Route path="/dashboard/daybook" element={<DayBookIndex />} />
      <Route
        path="/dashboard/order-list/invoice"
        element={<InvoiceGeneratePage />}
      />
      <Route path="/dashboard/order-list" element={<OrderListIndex />} />
      <Route path="/dashboard/receivable" element={<ReceivableIndex />} />
      <Route path="/dashboard/payable" element={<PayableIndex />} />
      <Route path="/dashboard/stock" element={<StockIndex />} />
      <Route path="/dashboard/user-master" element={<UserMasterIndex />} />
      <Route path="/dashboard/territories" element={<TerritoryIndex />} />
      <Route
        path="/dashboard/user-master/summary/:userId/:tab"
        element={<UserSummaryIndex />}
      />
      <Route path="/dashboard/scheme-master" element={<SchemeIndex />} />
      <Route path="/dashboard/documents" element={<DocumentsIndex />} />
      <Route
        path="/dashboard/target-incentive"
        element={<TargetAchievementPage />}
      />
      <Route
        path="/dashboard/target-incentive/team"
        element={<TargetTeamPage />}
      />
      <Route
        path="/dashboard/target-incentive/assign"
        element={<TargetAssignPage />}
      />
      <Route
        path="/dashboard/target-incentive/products"
        element={<TargetProductIncentivePage />}
      />
      <Route path="/dashboard/reports" element={<ReportsIndex />} />

      <Route
        path="/dashboard/tasks"
        element={
          <RequireTasksAccess>
            <TasksLayout />
          </RequireTasksAccess>
        }
      >
        <Route index element={<TasksIndexRedirect />} />
        <Route path="all" element={<AllTasksPage />} />
        <Route path="my" element={<MyTasksPage />} />
        <Route path="analytics" element={<TaskAnalyticsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route
        path="/dashboard/notifications"
        element={<Navigate to="/dashboard/tasks/notifications" replace />}
      />

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center text-sm text-gray-500"
          role="status"
          aria-live="polite"
          aria-label="Loading page"
        >
          Loading…
        </div>
      }
    >
      <RouteTree />
    </Suspense>
  );
}
