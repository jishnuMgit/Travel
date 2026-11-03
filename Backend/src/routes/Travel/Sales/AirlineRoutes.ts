import { Router } from "express";
import {
  createAirline,
  deleteAirline,
  getAirline,
  getAirlines,
  updateAirline,
} from "../../../controllers/Travel/Sales/AirlineController";

const AirlineRouter = Router();

AirlineRouter.get("/:fcoid", getAirlines);
AirlineRouter.get("/:fcoid/:fairlineno", getAirline);
AirlineRouter.post("/", createAirline);
AirlineRouter.put("/:fcoid/:oldFairlineno", updateAirline);
AirlineRouter.delete("/:fcoid/:fairlineno", deleteAirline);

export default AirlineRouter;
