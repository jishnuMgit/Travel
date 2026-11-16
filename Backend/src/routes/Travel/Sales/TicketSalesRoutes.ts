import { Router } from "express";
import {
  deleteTicketSales,
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
  getTicketSalesSlNos,
  getTicketSalesStaffs,
  getTicketSalesSuppliers,
  getTicketSalesTktTypes,
  getTicketSalesVat,
  loadTicketSales,
  modifyTicketSales,
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

// Loading and saving a ticket need a login (the user id of the save comes from the session).
TicketSalesRouter.get(
  "/ticket/:PstrCoID/:PstrYear/:lkpTktType/:txtTktSLNo",
  requireAuthentication,
  loadTicketSales,
);
// The Sl. Nos saved for a Ticket No. and the next free one.
TicketSalesRouter.get(
  "/ticket/:PstrCoID/:PstrYear/:lkpTktType/:txtTktSLNo/sl-nos",
  requireAuthentication,
  getTicketSalesSlNos,
);
TicketSalesRouter.post("/", requireAuthentication, saveTicketSales);
// Modify a saved ticket (the Save button is Modify while a saved ticket is loaded).
TicketSalesRouter.put("/", requireAuthentication, modifyTicketSales);
// Delete a saved ticket and its customer line.
TicketSalesRouter.delete(
  "/ticket/:PstrCoID/:PstrYear/:lkpTktType/:txtTktSLNo",
  requireAuthentication,
  deleteTicketSales,
);

export default TicketSalesRouter;
