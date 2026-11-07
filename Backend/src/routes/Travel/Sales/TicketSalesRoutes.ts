import { Router } from "express";
import {
  getTicketSalesAirlines,
  getTicketSalesBranches,
  getTicketSalesCustomerDivisions,
  getTicketSalesComTypes,
  getTicketSalesCustomers,
  getTicketSalesDi,
  getTicketSalesFop,
  getTicketSalesGds,
  getTicketSalesIatas,
  getTicketSalesMerchants,
  getTicketSalesPaxTypes,
  getTicketSalesServiceChargePolicies,
  getTicketSalesServiceTypes,
  getTicketSalesStaffs,
  getTicketSalesSuppliers,
  getTicketSalesTktTypes,
  getTicketSalesVat,
  saveTicketSales,
} from "../../../controllers/Travel/Sales/TicketSalesController";
import { requireAuthentication } from "../../../middleware/AuthMiddleware";

const TicketSalesRouter = Router();

TicketSalesRouter.get("/airlines/:PstrCoID", getTicketSalesAirlines);
TicketSalesRouter.get("/tkt-types/:PstrCoID", getTicketSalesTktTypes);
TicketSalesRouter.get("/branches/:PstrCoID", getTicketSalesBranches);
TicketSalesRouter.get("/iatas/:PstrCoID", getTicketSalesIatas);
TicketSalesRouter.get("/staffs/:PstrCoID", getTicketSalesStaffs);
TicketSalesRouter.get("/gds/:PstrCoID", getTicketSalesGds);
TicketSalesRouter.get("/fop/:PstrCoID", getTicketSalesFop);
TicketSalesRouter.get("/vat/:PstrCoID", getTicketSalesVat);
TicketSalesRouter.get("/merchants", getTicketSalesMerchants);
TicketSalesRouter.get("/di", getTicketSalesDi);
TicketSalesRouter.get("/pax-types", getTicketSalesPaxTypes);
TicketSalesRouter.get("/com-types", getTicketSalesComTypes);
TicketSalesRouter.get("/service-types/:PstrCoID", getTicketSalesServiceTypes);
TicketSalesRouter.get("/suppliers/:PstrCoID", getTicketSalesSuppliers);
TicketSalesRouter.get("/customers/:PstrCoID", getTicketSalesCustomers);
TicketSalesRouter.get(
  "/service-charge-policies/:PstrCoID",
  getTicketSalesServiceChargePolicies,
);
TicketSalesRouter.get(
  "/customer-divisions/:PstrCoID/:CustomerID",
  getTicketSalesCustomerDivisions,
);

// Saving needs a login: the user id comes from the session.
TicketSalesRouter.post("/", requireAuthentication, saveTicketSales);

export default TicketSalesRouter;
