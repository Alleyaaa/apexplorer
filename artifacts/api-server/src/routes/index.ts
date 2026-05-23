import { Router, type IRouter } from "express";
import healthRouter from "./health";
import collectionsRouter from "./collections";
import requestsRouter from "./requests";
import toolsRouter from "./tools";
import filesRouter from "./files";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(collectionsRouter);
router.use(requestsRouter);
router.use(toolsRouter);
router.use(filesRouter);
router.use(dashboardRouter);

export default router;
