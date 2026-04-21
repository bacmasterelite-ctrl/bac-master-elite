import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import profileRouter from "./profile";
import contentRouter from "./content";
import paymentsRouter from "./payments";
import adminRouter from "./admin";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(profileRouter);
router.use(contentRouter);
router.use(paymentsRouter);
router.use(adminRouter);
router.use(aiRouter);

export default router;
