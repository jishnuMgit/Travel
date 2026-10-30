import { Router } from "express";
import { getYears } from "../controllers/YearController";

const yearRouter = Router();

yearRouter.get("/", getYears);

export default yearRouter;
