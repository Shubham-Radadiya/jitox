import { Request, Response } from "express";
import { TargetAchievementPlan } from "../models/index";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";
import { sendSuccess } from "../utils/apiResponse";
import { getTargetIncentiveDemoPayload } from "../utils/targetIncentiveDemo";
import {
  buildLiveTargetAchievementView,
  upsertTargetAchievementPlans,
} from "../services/targetAchievement.service";

function parseQuery(req: Request) {
  const q = req.query as Record<string, string | undefined>;
  return {
    year: q.year ? Number(q.year) : undefined,
    managerId: q.manager || q.managerId,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    source: String(q.source || "live").toLowerCase(),
  };
}

function pickAchievementView(
  live: Awaited<ReturnType<typeof buildLiveTargetAchievementView>>,
  demo: ReturnType<typeof getTargetIncentiveDemoPayload>,
  source: string
) {
  const demoView = {
    overviewKpis: demo.overviewKpis,
    chartLabels: demo.chartLabels,
    salesVsAchievement: demo.salesVsAchievement,
    collectionVsAchievement: demo.collectionVsAchievement,
    months: demo.months,
    managers: demo.managers,
  };

  const useDemo = source === "demo";
  const active = useDemo ? demoView : live;

  return {
    active,
    useDemo,
    demoView,
    liveView: {
      overviewKpis: live.overviewKpis,
      chartLabels: live.chartLabels,
      salesVsAchievement: live.salesVsAchievement,
      collectionVsAchievement: live.collectionVsAchievement,
      months: live.months,
      managers: live.managers,
      meta: live.meta,
    },
  };
}

export const getTargetIncentivePayload = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { year, managerId, dateFrom, dateTo, source } = parseQuery(req);
    const demo = getTargetIncentiveDemoPayload();
    const live = await buildLiveTargetAchievementView({
      year,
      managerId,
      dateFrom,
      dateTo,
    });

    const { active, useDemo, demoView, liveView } = pickAchievementView(
      live,
      demo,
      source
    );

    res.json({
      dataSource: useDemo ? "demo" : "live",
      overviewKpis: active.overviewKpis,
      chartLabels: active.chartLabels,
      salesVsAchievement: active.salesVsAchievement,
      collectionVsAchievement: active.collectionVsAchievement,
      months: active.months,
      managers: active.managers,
      demo: demoView,
      live: liveView,
      teamSummaryKpis: demo.teamSummaryKpis,
      teamRows: demo.teamRows,
      productIncentiveRows: demo.productIncentiveRows,
      productIncentiveSummary: demo.productIncentiveSummary,
    });
  } catch (e) {
    console.error("getTargetIncentivePayload", e);
    res.status(500).json({ message: "Failed to load target & incentive" });
  }
};

export const saveTargetAchievementPlans = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const year = Number(req.body?.year);
    if (!Number.isFinite(year)) {
      throw new AppError(HttpStatusCode.BAD_REQUEST, "year is required.");
    }
    const results = await upsertTargetAchievementPlans({
      year,
      months: Array.isArray(req.body?.months) ? req.body.months : [],
      createdByUserId: (req as Request & { user?: { id?: string } }).user?.id,
    });
    sendSuccess(res, results, "Target plans saved.");
  } catch (e) {
    console.error("saveTargetAchievementPlans", e);
    throw e;
  }
};

export const listTargetAchievementPlans = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const list = await TargetAchievementPlan.find({ year })
      .sort({ month: 1 })
      .lean();
    sendSuccess(res, list);
  } catch (e) {
    console.error("listTargetAchievementPlans", e);
    res.status(500).json({ message: "Failed to load target plans" });
  }
};
