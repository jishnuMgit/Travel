import { Router } from "express";
import {
  GetCustomer,
  GetCustomerData,
  SaveCustomerData,
} from "../../../controllers/Travel/Setup/CustomerDivisionController";
import { requireAuthentication } from "../../../middleware/AuthMiddleware";

const router = Router();

router.get("/customers/:PstrCoID", requireAuthentication, GetCustomer);
router.get("/:PstrCoID/:StrCustomerID", requireAuthentication, GetCustomerData);
router.post("/save", requireAuthentication, SaveCustomerData);

export default router;