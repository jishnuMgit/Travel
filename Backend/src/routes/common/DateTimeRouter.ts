import { Router } from "express";
import { getServerDate } from "../../controllers/common/DateTimeController";

const DateTimeRouter = Router();

DateTimeRouter.get("/server-date", getServerDate);

export default DateTimeRouter;
