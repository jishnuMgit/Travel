import { Router } from "express";
import { getCompanies } from "../controllers/CompanyController";

const companyRouter = Router();

companyRouter.get("/", getCompanies);

export default companyRouter;
