import { Router } from "express";
import {
  createAirline,
  deleteAirline,
  getAirline,
  getAirlines,
  updateAirline,
} from "../../../controllers/Travel/Sales/AirlineController";

const AirlineRouter = Router();

AirlineRouter.get("/:PstrCoID", getAirlines);
AirlineRouter.get("/:PstrCoID/:StrAirlineNo", getAirline);
AirlineRouter.post("/", createAirline);
AirlineRouter.put("/:PstrCoID/:oldStrAirlineNo", updateAirline);
AirlineRouter.delete("/:PstrCoID/:StrAirlineNo", deleteAirline);
 
export default AirlineRouter;
