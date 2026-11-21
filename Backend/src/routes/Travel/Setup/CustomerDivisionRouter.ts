import { Router } from "express";
import {
  GetCustomer,
  GetCustomerData,
  SaveCustomerData,
  CreateCustomerDivision,
  UpdateCustomerDivision,
  DeleteCustomerDivision,
} from "../../../controllers/Travel/Setup/CustomerDivisionController";
import { requireAuthentication } from "../../../middleware/AuthMiddleware";

const router = Router();

router.get("/customers/:PstrCoID", requireAuthentication, GetCustomer);
router.get("/:PstrCoID/:StrCustomerID", requireAuthentication, GetCustomerData);
router.post("/save", requireAuthentication, SaveCustomerData);
router.post("/row", requireAuthentication, CreateCustomerDivision);
router.put(
  "/row/:PstrCoID/:StrCustomerID/:StrDivID",
  requireAuthentication,
  UpdateCustomerDivision,
);
router.delete(
  "/row/:PstrCoID/:StrCustomerID/:StrDivID",
  requireAuthentication,
  DeleteCustomerDivision,
);

export default router;