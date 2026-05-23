/** Static demo payload for Target & Incentive tabs (kept alongside live data). */

export function getTargetIncentiveDemoPayload() {
  const chartLabels = ["2018", "2019", "2020"];
  const salesTarget = [4800, 5200, 5000];
  const salesAchieved = [4000, 4500, 4200];
  const collPlan = [4500, 5000, 4800];
  const collAchieved = [3800, 4200, 3900];

  const months = [
    {
      id: "jan",
      label: "Jan",
      salesTarget: 10_00_000,
      salesAchieved: 8_20_000,
      collPlan: 8_00_000,
      collAchieved: 6_00_000,
      pct: 82,
      managers: [
        {
          id: "m1",
          name: "Rakesh Patel",
          salesTarget: 5_00_000,
          salesAchieved: 4_10_000,
          collPlan: 4_00_000,
          collAchieved: 3_00_000,
          teamTotal: 7_10_000,
          products: [
            {
              id: "p1",
              name: "DAP RM-432",
              closingQty: 1000,
              rate: 35,
              value: 35_000,
              status: "Sufficient",
            },
            {
              id: "p2",
              name: "DAP RM-433",
              closingQty: 400,
              rate: 30,
              value: 12_000,
              status: "Out of Stock",
            },
          ],
        },
        {
          id: "m2",
          name: "Hiren Shah",
          salesTarget: 5_00_000,
          salesAchieved: 4_10_000,
          collPlan: 4_00_000,
          collAchieved: 3_00_000,
          teamTotal: 7_10_000,
          products: [],
        },
      ],
    },
    {
      id: "feb",
      label: "Feb",
      salesTarget: 9_50_000,
      salesAchieved: 5_70_000,
      collPlan: 7_50_000,
      collAchieved: 4_50_000,
      pct: 60,
      managers: [],
    },
    {
      id: "mar",
      label: "Mar",
      salesTarget: 8_00_000,
      salesAchieved: 3_36_000,
      collPlan: 6_00_000,
      collAchieved: 2_52_000,
      pct: 42,
      managers: [],
    },
  ];

  const achievementView = {
    overviewKpis: [
      { key: "totalTarget", label: "Total Target", value: "₹10L" },
      { key: "totalAchievement", label: "Total Achievement", value: "₹8L" },
      { key: "collectionPlan", label: "Collection Plan", value: "₹9L" },
      { key: "collectionAchieved", label: "Collection Achieved", value: "₹8.5L" },
    ],
    chartLabels,
    salesVsAchievement: { target: salesTarget, achieved: salesAchieved },
    collectionVsAchievement: { plan: collPlan, achieved: collAchieved },
    months,
    managers: [
      { value: "all", label: "All Managers" },
      { value: "rakesh", label: "Rakesh Patel" },
      { value: "hiren", label: "Hiren Shah" },
    ],
  };

  return {
    ...achievementView,
    teamSummaryKpis: [
      { key: "totalTarget", label: "Total Target", value: "₹10L" },
      { key: "notAchieved", label: "Not Achieved", value: "50" },
      { key: "totalPct", label: "Total Achievement%", value: "76%" },
      { key: "totalIncentive", label: "Total Incentive", value: "₹50K" },
    ],
    teamRows: [
      {
        id: "t1",
        user: "Raj Agro",
        period: "Jul 2025",
        targetType: "Sales",
        targetAmt: "₹1,00,000",
        achieved: "₹1,20,000",
        pctAchieved: 120,
        incentive: "₹7,200",
        status: "Achieved",
      },
      {
        id: "t2",
        user: "Komal Sales",
        period: "Jul 2025",
        targetType: "Collections",
        targetAmt: "₹1,00,000",
        achieved: "₹72,000",
        pctAchieved: 72,
        incentive: "₹5,760",
        status: "Not Achieved",
      },
      {
        id: "t3",
        user: "Green Growers",
        period: "Jun 2025",
        targetType: "Visits",
        targetAmt: "60 Visits",
        achieved: "25 Visits",
        pctAchieved: 42,
        incentive: "₹0",
        status: "Not Achieved",
      },
    ],
    productIncentiveRows: [
      {
        id: "r1",
        prodGroup: "Fertilizers",
        prodCategory: "NPK Fertilizers",
        prodName: "NPK 20-20-20",
        qty: "50 Bags",
        sellingAmt: 1200,
        total: 60_000,
        pctIncentive: "5%",
        incentiveValue: 1200,
      },
      {
        id: "r2",
        prodGroup: "Fertilizers",
        prodCategory: "NPK Fertilizers",
        prodName: "Urea 46%",
        qty: "80 Bags",
        sellingAmt: 620,
        total: 49_600,
        pctIncentive: "5%",
        incentiveValue: 744,
      },
      {
        id: "r3",
        prodGroup: "Seeds",
        prodCategory: "Vegetable Seeds",
        prodName: "Hybrid Tomato Seeds",
        qty: "200 Pkt",
        sellingAmt: 450,
        total: 90_000,
        pctIncentive: "2%",
        incentiveValue: 1800,
      },
    ],
    productIncentiveSummary: [
      { group: "Fertilizers", totalSales: 1_09_600, incentiveEarned: 1944 },
      { group: "Seeds", totalSales: 90_000, incentiveEarned: 1800 },
      { group: "Pesticides", totalSales: 0, incentiveEarned: 0 },
      { group: "Equipment", totalSales: 0, incentiveEarned: 0 },
    ],
  };
}
