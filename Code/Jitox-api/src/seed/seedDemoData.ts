import {
  User,
  Product,
  Account,
  Employee,
  Task,
  PurchaseVoucher,
  PaymentVoucher,
  ReceiptVoucher,
  ExpenseVoucher,
  CashVoucher,
  DayBook,
  JournalVoucher,
  Quotation,
  MarketingScheme,
} from "../models";

/** Prefix so seeded rows are recognizable and idempotent. */
export const DEMO_PREFIX = "JITOX-DEMO";

/**
 * Inserts realistic demo rows across collections (idempotent).
 * Safe to call on every dev server start — skips if demo data already exists.
 */
export async function seedDemoData(): Promise<void> {
  const admin = await User.findOne({ email: "admin@gmail.com" }).lean();
  const manager = await User.findOne({ email: "manager@gmail.com" }).lean();
  const adminId = admin?._id ? String(admin._id) : undefined;
  const managerId = manager?._id ? String(manager._id) : undefined;

  await seedDemoProducts();
  const products = await Product.find({
    productName: new RegExp(`^${DEMO_PREFIX}`),
  }).lean();

  if (products.length === 0) {
    console.warn("[seed-demo] No demo products found; skipping vouchers that need products.");
  }

  await seedDemoAccounts();
  await seedDemoEmployees();
  const accounts = await Account.find({
    email: new RegExp(`@jitox\\.seed$`),
  }).lean();

  if (adminId) {
    await seedDemoTasks(adminId, managerId);
  }

  await seedDemoPaymentReceipts();
  await seedDemoCashExpenseDayBook();
  await seedDemoJournal(accounts);
  await seedDemoPurchaseAndQuotation(products);
  await seedDemoMarketingSchemes();
}

async function seedDemoMarketingSchemes(): Promise<void> {
  if (await MarketingScheme.exists({ schemeName: new RegExp(`^${DEMO_PREFIX}`) }))
    return;
  await MarketingScheme.insertMany([
    {
      schemeName: `${DEMO_PREFIX} Monsoon Farmer Cashback`,
      appliedProducts: "Organic Fertilizer 50kg",
      schemeType: "Cashback",
      targetAudience: "Farmer",
      offerDetails: "Summer Offer 20% Off",
      startDate: "01 July, 2025",
      endDate: "31 July, 2025",
    },
    {
      schemeName: `${DEMO_PREFIX} Dealer Bulk Discount`,
      appliedProducts: "Hybrid Maize Seeds",
      schemeType: "Discount",
      targetAudience: "Dealer",
      offerDetails: "Cashback Bonanza ₹50",
      startDate: "01 May, 2025",
      endDate: "30 May, 2025",
    },
  ]);
  console.log("[seed-demo] Inserted demo marketing schemes");
}

async function seedDemoProducts(): Promise<void> {
  const exists = await Product.exists({
    productName: new RegExp(`^${DEMO_PREFIX}`),
  });
  if (exists) return;

  const rows = [
    {
      productName: `${DEMO_PREFIX} Organic Fertilizer 50kg`,
      category: "Fertilizer",
      group: "Crop Nutrition",
      units: 50,
      billingRatePerUnit: 890,
      alternateUnits: "Bag",
      packingStyle: "Laminated bag",
      gstRate: "5",
      hsnCode: "31010000",
      productDescription: "NPK blend for field crops — demo stock",
      quantity: 200,
      rate: 890,
      amout: 178000,
      minimumReorderLevel: 40,
    },
    {
      productName: `${DEMO_PREFIX} Liquid Pesticide 3L`,
      category: "Pesticide",
      group: "Crop Protection",
      units: 3,
      billingRatePerUnit: 1240,
      alternateUnits: "Can",
      gstRate: "12",
      hsnCode: "38089190",
      productDescription: "Broad-spectrum demo SKU",
      quantity: 120,
      rate: 1240,
      amout: 148800,
      minimumReorderLevel: 24,
    },
    {
      productName: `${DEMO_PREFIX} Hybrid Maize Seeds 4kg`,
      category: "Seeds",
      group: "Field Seeds",
      units: 4,
      billingRatePerUnit: 2100,
      gstRate: "5",
      hsnCode: "12099100",
      quantity: 80,
      rate: 2100,
      amout: 168000,
      minimumReorderLevel: 16,
    },
    {
      productName: `${DEMO_PREFIX} Bio-Stimulant 1L`,
      category: "Nutrition",
      group: "Specialty",
      units: 1,
      billingRatePerUnit: 560,
      gstRate: "12",
      quantity: 300,
      rate: 560,
      amout: 168000,
      minimumReorderLevel: 50,
    },
    {
      productName: `${DEMO_PREFIX} Urea 45kg`,
      category: "Fertilizer",
      group: "Crop Nutrition",
      units: 45,
      billingRatePerUnit: 320,
      gstRate: "5",
      quantity: 500,
      rate: 320,
      amout: 160000,
      minimumReorderLevel: 100,
    },
    {
      productName: `${DEMO_PREFIX} Weedicide 500ml`,
      category: "Pesticide",
      group: "Crop Protection",
      units: 1,
      billingRatePerUnit: 420,
      gstRate: "12",
      quantity: 150,
      rate: 420,
      amout: 63000,
      minimumReorderLevel: 30,
    },
  ];

  await Product.insertMany(rows);
  console.log(`[seed-demo] Inserted ${rows.length} demo products`);
}

function accountRow(
  suffix: string,
  name: string,
  businessName: string,
  amount: number,
  balenceType: "Credit" | "Debit",
  city: string
) {
  const email = `demo-${suffix}@jitox.seed`;
  const streetAddress = "Plot 12, Phase 2";
  const area = `${city} Industrial Area`;
  const district = city;
  const country = "India";
  const pincode = "411001";
  const residentialAddress = [
    streetAddress,
    area,
    city,
    city,
    district,
    `Maharashtra - ${pincode}`,
    country,
  ].join(", ");
  return {
    businessName,
    accountType: "Customer",
    gstNumber: `27AAAAA0000A1Z${suffix.slice(0, 1).toUpperCase()}`,
    address: `${city} Industrial Area`,
    category: "Dealer",
    name,
    email,
    mobileNumber: `9876543${suffix.padStart(3, "0").slice(-3)}`,
    residentialAddress,
    streetAddress,
    area,
    district,
    country,
    pincode,
    residentialFullAddressBackup: `Plot 12, Phase 2, ${city}`,
    amount,
    balenceType,
    creditLimit: 500000,
    paymentTerm: "Net 30",
    city,
    taluka: city,
    state: "Maharashtra",
    pinCode: pincode,
    partyType: "Distributor",
    customerStatus: "Active" as const,
    deliveryAt: `${city} godown`,
    transportMode: suffix === "alpha" ? "Road" : suffix === "bright" ? "Courier" : "Road",
  };
}

async function seedDemoAccounts(): Promise<void> {
  const exists = await Account.exists({ email: "demo-alpha@jitox.seed" });
  if (exists) return;

  const rows = [
    accountRow("alpha", "Mr. Ramesh Mehta", "Alpha Traders", 125000, "Debit", "Pune"),
    accountRow("bright", "Bright Supplies Pvt Ltd", "Bright Supplies", 89000, "Credit", "Nashik"),
    accountRow("green", "Green Agro Hub", "Green Agro", 210000, "Debit", "Nagpur"),
    accountRow("krushi", "Krushi Kendra", "Krushi Kendra", 45000, "Credit", "Aurangabad"),
    accountRow("sai", "Sai Fertilizers", "Sai Fertilizers", 178000, "Debit", "Kolhapur"),
  ];

  await Account.insertMany(rows);
  console.log(`[seed-demo] Inserted ${rows.length} demo accounts (parties)`);
}

async function seedDemoEmployees(): Promise<void> {
  const exists = await Employee.exists({ email: "ops.executive@jitox.seed" });
  if (exists) return;

  const joining = new Date();
  const salary = {
    basic: 35000,
    allowances: [] as { name: string; amount: number }[],
    deductions: [] as { name: string; amount: number }[],
  };
  await Employee.insertMany([
    {
      name: "Amit Operations",
      email: "ops.executive@jitox.seed",
      phone: "9000000001",
      roleDesignation: "Executive",
      department: "Operations",
      joiningDate: joining,
      salaryStructure: salary,
      status: "Active",
    },
    {
      name: "Kavya Logistics",
      email: "kavya.logistics@jitox.seed",
      phone: "9000000002",
      roleDesignation: "Coordinator",
      department: "Logistics",
      joiningDate: joining,
      salaryStructure: { ...salary, basic: 28000 },
      status: "Active",
    },
  ]);
  console.log("[seed-demo] Inserted demo employees");
}

async function seedDemoTasks(
  assignedByUserId: string,
  assigneeUserId?: string
): Promise<void> {
  const exists = await Task.exists({ taskName: `${DEMO_PREFIX} Review pending orders` });
  if (exists) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const assignee = assigneeUserId || assignedByUserId;
  await Task.insertMany([
    {
      taskName: `${DEMO_PREFIX} Review pending orders`,
      description: "Check order list tab counts vs dashboard KPIs",
      setDate: tomorrow,
      dueDate: tomorrow,
      setTime: "10:00",
      setDuration: "1h",
      setReminder: "1 day before",
      status: "pending",
      assigneeUserId: assignee,
      assignedUserIds: assignee ? [String(assignee)] : [],
      assignedByUserId,
      priority: "high",
    },
    {
      taskName: `${DEMO_PREFIX} Reconcile payables`,
      description: "Match payment vouchers with supplier statements",
      setDate: new Date(),
      dueDate: new Date(),
      setTime: "15:30",
      setDuration: "2h",
      status: "in_progress",
      assigneeUserId: assignee,
      assignedUserIds: assignee ? [String(assignee)] : [],
      assignedByUserId,
      priority: "medium",
    },
    {
      taskName: `${DEMO_PREFIX} Stock audit — fertilizers`,
      description: "Verify physical vs system for warehouse A",
      setDate: new Date(),
      dueDate: new Date(),
      setTime: "09:00",
      setDuration: "4h",
      status: "pending",
      assigneeUserId: assignee,
      assignedUserIds: assignee ? [String(assignee)] : [],
      assignedByUserId,
      priority: "low",
    },
    {
      taskName: `${DEMO_PREFIX} Field visit report`,
      description: "Upload visit notes for Alpha Traders",
      setDate: new Date(),
      dueDate: new Date(),
      setTime: "11:00",
      setDuration: "30m",
      status: "completed",
      assigneeUserId: assignee,
      assignedUserIds: assignee ? [String(assignee)] : [],
      assignedByUserId,
      priority: "medium",
    },
  ]);
  console.log("[seed-demo] Inserted 4 demo tasks");
}

async function seedDemoPaymentReceipts(): Promise<void> {
  if (await PaymentVoucher.exists({ voucherNo: `${DEMO_PREFIX}-PAY-001` })) return;

  const today = new Date();
  await PaymentVoucher.insertMany([
    {
      voucherNo: `${DEMO_PREFIX}-PAY-001`,
      date: today,
      paymentThrough: "Bank",
      paymentTo: "Green Agro Suppliers",
      amount: "45000",
      remarks: "Supplier advance — demo",
      status: "Paid",
    },
    {
      voucherNo: `${DEMO_PREFIX}-PAY-002`,
      date: today,
      paymentThrough: "Cash",
      paymentTo: "Transport — Pune route",
      amount: "3200",
      remarks: "Freight settlement",
      status: "Pending",
    },
  ]);

  await ReceiptVoucher.insertMany([
    {
      voucherNo: `${DEMO_PREFIX}-REC-001`,
      date: today,
      receiptThrough: "Bank",
      receiptFrom: "Alpha Traders",
      amount: "62000",
      remarks: "Against invoice batch — demo",
      status: "Paid",
    },
    {
      voucherNo: `${DEMO_PREFIX}-REC-002`,
      date: today,
      receiptThrough: "Cash",
      receiptFrom: "Bright Supplies",
      amount: "18500",
      status: "Pending",
    },
  ]);
  console.log("[seed-demo] Inserted demo payment & receipt vouchers");
}

async function seedDemoCashExpenseDayBook(): Promise<void> {
  if (await CashVoucher.exists({ voucherNumber: `${DEMO_PREFIX}-CV-001` })) return;

  const today = new Date();
  await CashVoucher.insertMany([
    {
      voucherNumber: `${DEMO_PREFIX}-CV-001`,
      amount: 8000,
      debitFrom: "Cash-in-hand",
      creditTo: "Petty cash",
      narration: "Petty cash top-up",
      particulars: "Demo cash transfer",
    },
  ]);

  await ExpenseVoucher.insertMany([
    {
      startDate: today,
      expenseType: "Travel",
      description: "Dealer visit — Nashik",
      paidTo: "Driver allowance",
      paymentMode: "UPI",
      amount: 2400,
    },
    {
      startDate: today,
      expenseType: "Fuel",
      description: "Diesel — delivery van",
      paidTo: "HP Petrol Pump",
      paymentMode: "Card",
      amount: 5100,
    },
    {
      startDate: today,
      expenseType: "supplies",
      description: "Warehouse labels & tape",
      paidTo: "Stationery Mart",
      paymentMode: "Cash",
      amount: 890,
    },
  ]);

  await DayBook.insertMany([
    {
      voucherNumber: `${DEMO_PREFIX}-DB-001`,
      debitAmount: "62000",
      creditAmount: "62000",
      voucherType: "Receipt",
      particulars: "Alpha Traders — bank receipt (demo)",
    },
    {
      voucherNumber: `${DEMO_PREFIX}-DB-002`,
      debitAmount: "45000",
      creditAmount: "45000",
      voucherType: "Payment",
      particulars: "Supplier payment — demo",
    },
  ]);
  console.log("[seed-demo] Inserted demo cash, expense, day book entries");
}

async function seedDemoJournal(
  accounts: { _id: unknown; name?: string }[]
): Promise<void> {
  if (await JournalVoucher.exists({ voucherNo: `${DEMO_PREFIX}-JV-001` })) return;
  if (accounts.length < 2) {
    console.warn("[seed-demo] Skipping journal voucher — need 2+ demo accounts");
    return;
  }

  const a = accounts[0];
  const b = accounts[1];
  await JournalVoucher.create({
    voucherNo: `${DEMO_PREFIX}-JV-001`,
    date: new Date(),
    paymentBy: a._id,
    paymentTo: b._id,
    debitAmount: 10000,
    creditAmount: 10000,
    remarks: "Inter-party adjustment — demo",
    status: "Paid",
  });
  console.log("[seed-demo] Inserted demo journal voucher");
}

async function seedDemoPurchaseAndQuotation(
  products: { _id: unknown; productName?: unknown; group?: unknown; category?: unknown }[]
): Promise<void> {
  if (products.length === 0) return;
  if (await PurchaseVoucher.exists({ voucherNo: `${DEMO_PREFIX}-PV-001` })) return;

  const p0 = products[0];
  const qty = 40;
  const rate = 850;
  const subtotal = qty * rate;
  const gstAmount = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + gstAmount;

  await PurchaseVoucher.create({
    partyName: "Alpha Traders",
    transportDetails: "Road — LR #DEMO-7788",
    deliveryAt: "Pune godown",
    orderby: "Mr. Ramesh Mehta",
    shipToAndBillTo: "JITOX HQ",
    voucherNo: `${DEMO_PREFIX}-PV-001`,
    voucherDate: new Date(),
    items: [
      {
        product: p0._id,
        quantity: qty,
        rateParUnit: rate,
        group: String(p0.group || "Crop Nutrition"),
        category: String(p0.category || "Fertilizer"),
        unit: "Bag",
        subtotal,
      },
    ],
    gstAmount,
    totalAmount,
    paymentMode: "Credit",
    stockDetails: {
      stockQuantity: true,
      generetePurchaseBill: true,
      updateStockAfterOrderPlaced: false,
    },
  });

  if (products.length >= 2) {
    const p1 = products[1];
    const q2 = 18;
    const r2 = 1180;
    const st2 = q2 * r2;
    const gst2 = Math.round(st2 * 0.12);
    await PurchaseVoucher.create({
      partyName: "Bright Supplies",
      transportDetails: "Courier — AWB DEMO-9921",
      deliveryAt: "Nashik godown",
      orderby: "Bright Supplies Pvt Ltd",
      shipToAndBillTo: "Bright Supplies — Nashik billing",
      voucherNo: `${DEMO_PREFIX}-PV-002`,
      voucherDate: new Date(Date.now() - 2 * 864e5),
      items: [
        {
          product: p1._id,
          quantity: q2,
          rateParUnit: r2,
          group: String(p1.group || "Crop Protection"),
          category: String(p1.category || "Pesticide"),
          unit: "Can",
          subtotal: st2,
        },
      ],
      gstAmount: gst2,
      totalAmount: st2 + gst2,
      paymentMode: "Online",
      stockDetails: { stockQuantity: true },
    });
  }

  if (products.length >= 3) {
    const p2 = products[2];
    const q3 = 60;
    const r3 = 2050;
    const st3 = q3 * r3;
    const gst3 = Math.round(st3 * 0.05);
    await PurchaseVoucher.create({
      partyName: "Green Agro",
      transportDetails: "Self pickup",
      deliveryAt: "Nagpur godown",
      orderby: "Green Agro Hub",
      shipToAndBillTo: "Green Agro — Nagpur",
      voucherNo: `${DEMO_PREFIX}-PV-003`,
      voucherDate: new Date(Date.now() - 5 * 864e5),
      items: [
        {
          product: p2._id,
          quantity: q3,
          rateParUnit: r3,
          group: String(p2.group || "Field Seeds"),
          category: String(p2.category || "Seeds"),
          unit: "Bag",
          subtotal: st3,
        },
      ],
      gstAmount: gst3,
      totalAmount: st3 + gst3,
      paymentMode: "Cash",
      stockDetails: { stockQuantity: true },
    });
  }

  if (products.length >= 2 && !(await Quotation.exists({ voucherNo: `${DEMO_PREFIX}-QT-001` }))) {
    const p1 = products[1];
    const qQty = 25;
    const qRate = 1200;
    const qSub = qQty * qRate;
    const qGst = Math.round(qSub * 0.12);
    await Quotation.create({
      partyName: "Alpha Traders",
      voucherDate: new Date(),
      voucherNo: `${DEMO_PREFIX}-QT-001`,
      invoiceNo: `${DEMO_PREFIX}-INV-QT-001`,
      transportDetails: "Customer pickup",
      deliveryAt: "Pune depot",
      orderby: "Sales desk",
      shipToAndBillTo: "Alpha Traders — Pune",
      items: [
        {
          product: p1._id,
          quantity: qQty,
          rateParUnit: qRate,
          group: String(p1.group || "Crop Protection"),
          category: String(p1.category || "Pesticide"),
          unit: "Can",
          subtotal: qSub,
        },
      ],
      paymentMode: "Credit",
      dueDate: new Date(Date.now() + 15 * 864e5),
      gstAmount: qGst,
      basePrice: qSub,
      totalAmount: qSub + qGst,
      stockDetails: { stockQuantity: true },
    });
  }

  console.log("[seed-demo] Inserted demo purchase voucher (+ quotation if applicable)");
}
