import User from "./user.model";
import Task from "./task.model";
import Account from "./account.model";
import Product from "./product.model";
import PurchaseVoucher from "./purchaseVoucher.model";
import PurchaseReturnVoucher from "./purchaseReturnVoucher.model";
import PaymentVoucher from "./paymentVoucher.model";
import ReceiptVoucher from "./receiptVoucher.model";
import ExpenseVoucher from "./expenseVoucher.model";
import CashVoucher from "./cashVoucher.model";
import JournalVoucher from "./journalVoucher.model";
import Quotation from "./quotation.model";
import DayBook from "./dayBook.model";
import Notification from "./notification.model";
import SystemSettings, {
  getOrCreateSystemSettings,
} from "./systemSettings.model";
import Employee from "./employee.model";
import SalarySlip from "./salarySlip.model";
import OfferLetter from "./offerLetter.model";
import AppointmentLetter from "./appointmentLetter.model";
import MarketingScheme from "./marketingScheme.model";
import DocumentCategory from "./documentCategory.model";
import DocumentEntry from "./documentEntry.model";

export {
  User,
  Task,
  Notification,
  Account,
  Product,
  PurchaseVoucher,
  PurchaseReturnVoucher,
  PaymentVoucher,
  ReceiptVoucher,
  ExpenseVoucher,
  CashVoucher,
  JournalVoucher,
  Quotation,
  DayBook,
  SystemSettings,
  getOrCreateSystemSettings,
  Employee,
  SalarySlip,
  OfferLetter,
  AppointmentLetter,
  MarketingScheme,
  DocumentCategory,
  DocumentEntry,
};
