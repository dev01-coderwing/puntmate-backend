import express from "express";
import {
  getMetrics,
  getAutomationRate,
  getEscalationRate,
  getFRT,
  getResolutionTime,
  getAgents,} from "../controllers/Admin/analytics.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.get("/metrics", getMetrics);
router.get("/automation-rate", getAutomationRate);
router.get("/escalation-rate", getEscalationRate);
router.get("/frt", getFRT);
router.get("/resolution-time", getResolutionTime);
router.get("/agents", getAgents);

export default router;
