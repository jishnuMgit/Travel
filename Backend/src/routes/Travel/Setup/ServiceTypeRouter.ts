import { Router } from "express";
import { GetData, getGroupOptions, SaveData } from "../../../controllers/Travel/Setup/ServiceTypeController";


const ServiceTypeRouter = Router();

ServiceTypeRouter.get("/groups", getGroupOptions);
ServiceTypeRouter.get("/", GetData);
ServiceTypeRouter.post("/save", SaveData);

export default ServiceTypeRouter;