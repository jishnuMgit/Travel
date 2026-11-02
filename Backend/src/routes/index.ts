import { Router } from "express";
import authRouter from "./AuthRouter";
import companyRouter from "./CompanyRouter";
import menuRouter from "./MenuRouter";
import yearRouter from "./YearRouter";
import ServiceTypeRouter from "./Travel/Setup/ServiceTypeRouter";

const router = Router();

router.use("/auth", authRouter);
router.use("/companies", companyRouter);
router.use("/menu", menuRouter);
router.use("/years", yearRouter);
router.use("/service-types", ServiceTypeRouter);

export default router;
