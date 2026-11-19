import { Router } from "express";
import authRouter from "./AuthRouter";
import companyRouter from "./CompanyRouter";
import menuRouter from "./MenuRouter";
import yearRouter from "./YearRouter";
import ServiceTypeRouter from "./Travel/Setup/ServiceTypeRouter";
import AirlineRouter from "./Travel/Sales/AirlineRoutes";
import TicketSalesRouter from "./Travel/Sales/TicketSalesRoutes";
import ServiceChargePolicyPolicy from './Travel/Setup/ServiceChargePolicyRouter'
import CustomerDivison from './Travel/Setup/CustomerDivisionRouter'
const router = Router();

router.use("/auth", authRouter);
router.use("/companies", companyRouter);
router.use("/menu", menuRouter);
router.use("/years", yearRouter);
router.use("/service-types", ServiceTypeRouter);
router.use("/airlines", AirlineRouter);
router.use("/ticket-sales", TicketSalesRouter);
router.use("/ServiceChargePolicy",ServiceChargePolicyPolicy)
router.use("/customer-division",CustomerDivison)

export default router;
