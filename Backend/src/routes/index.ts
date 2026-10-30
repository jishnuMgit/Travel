import { Router } from "express";
import authRouter from "./AuthRouter";
import companyRouter from "./CompanyRouter";
import menuRouter from "./MenuRouter";
import yearRouter from "./YearRouter";

const router = Router();

router.use("/auth", authRouter);
router.use("/companies", companyRouter);
router.use("/menu", menuRouter);
router.use("/years", yearRouter);

export default router;
