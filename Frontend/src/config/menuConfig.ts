import React from "react";
import {
  FiFolder,
  FiBriefcase,
  FiShoppingCart,
  FiTrendingUp,
  FiDollarSign,
  FiSettings,
  FiTool,
  FiLock,
  FiShield,
} from "react-icons/fi";
import type { MenuNode } from "../types/menu";

/* =========================================================
   ROUTE MAP

   Keyed by fmenuname (the stable, non-localized column),
   confirmed against the real GET /api/menu response.

   Only entries listed here are clickable — anything else
   renders as a disabled row ("isn't available yet"), since
   tblmenu covers far more modules than currently have pages
   built. Fill this in as pages ship.

   Still unresolved (no obvious counterpart in the real data,
   not guessed):
     - Transaction-matching / Transaction-unmatching
       (mnuFinDocPost / mnuFinDocUnPost are Document
       Post/UnPost, a different feature)
========================================================= */

export const menuRouteMap: Record<string, string> = {
  travelTicketSales: "/ticket-sales",
  travelHotelSales: "/hotel-sales",
  travelOtherService: "/Other-Service",
  travelAirline: "/Airline",
  travelCustomerSales: "/Report/RptCustomerSales",
  travelStaffReport: "/Report/Staff",
  travelAirlineReport: "/Report/Airline",
  travelDailyReport: "/Report/Daily",
  travelBspTicketwise: "/Report/RptBspSalesTicketwisePage",
  travelBspAirlinewise: "/Report/RptBspSalesAirlinewisePage",
  travelCustomerProfit: "/Report/CustomerWiseProfit",
  travelSupplierProfit: "/Report/SupplierWiseProfit",
  travelStaffProfit: "/Report/StaffWiseProfit",
  travelAirlineProfit: "/Report/AirlineWiseProfit",
  travelBspBillImportExport: "/Report/BspBillImportExport",
  travelServiceChargePolicy: "/Setup/ServiceChargePolicy",
  travelServiceType: "/Setup/ServiceType",
  /* =========================================================
     PURCHASE
  ========================================================= */
  /* =========================================================
     PURCHASE - TRANSACTION
  ========================================================= */


  mnuPurchaseInvoice: "/Purchase/Transaction/PurchaseInvoicePage",
  mnuBeginningStock:"/Purchase/Transaction/BeginningStockPage",





    /* =========================================================
     PURCHASE - SETUP
  ========================================================= */



  mnuItem: "/Purchase/Setup/ItemPage",
  mnuItemGroup: "/Purchase/Setup/ItemGroupPage",
  mnuUnit:"/Purchase/Setup/UnitPage",
  mnuStaff:"/Purchase/Setup/StaffPage",
  mnuCurrency:"/Purchase/Setup/Currency",
    /* =========================================================
     PURCHASE - REPORTS
  ========================================================= */

  "mnuRrptSupplier Purchase":"/Purchase/Report/RptSupplierPurchase",
  mnuRptItemPurchase:"/Purchase/Report/RptItemPurchase",
  mnuRptPOSummary:"/Purchase/Report/RptPOSummary",
  mnuRptStaffSales:"/Purchase/Report/RptStaffSales",
  mnuRptSalesSummary:"/Purchase/Report/RptSalesSummary",
  mnuRptItemMovement:"/Purchase/Report/RptItemMovement",
  irptRptInvoicewiseProfit:"/Purchase/Report/RptInvoicewiseProfit",
  mnuRptStockReport:"/Purchase/Report/RptStockReport",
  mnuRptStockValuation:"/Purchase/Report/RptStockValuation",
  mnuRptStockVerification:"/Purchase/Report/RptStockVerification",
  mnuRptStockAgeing:"/Purchase/Report/RptStockAgeing",
  mnuRptDocumentList:"/Purchase/Report/RptDocumentList",
  mnuRptSalesPriceList:"/Purchase/Report/RptSalesPriceList",
  mnuRptItemList:"/Purchase/Report/RptItemList",
  mnuRptItemHistory:"/Purchase/Report/RptItemHistory",





/*============================================================
Sales-TRANSACTION
=============================================================*/

  mnuSalesInvoice: "/Sales/Transaction/SalesInvoicePage",
  mnuStockAdjustment:"/Sales/Transaction/StockAdjustment",
  mnuStockTransfer: "/Sales/Transaction/StockTransferPage",
  mnuStkDocumentPost:"/Sales/Transaction/StockDocumentPost",
  mnuStkDocumentRePost:"/Sales/Transaction/StockDocumentRePost",


/*============================================================
Sales-SETUP
=============================================================*/

  mnuItemEnquiry:"/Sales/Setup/ItemEnquiry",
  mnuSalesPriceList:"/Sales/Setup/SalesPriceList",
 

/*============================================================
Sales-REPORT
=============================================================*/
  mnuRptStock:"/Sales/Report/RptStock",
 "mnuRptStock Value": "/Sales/Reports/StockValue",
  mnuRptCustomerSales:"/Sales/Reports/RptCustomerSales",
  mnuRptItemSales:"/Sales/Reports/RptItemSales",

  /* =========================================================
     FINANCE 
  ========================================================= */
  /* =========================================================
     FINANCE - TRANSACTION
  ========================================================= */

  mnuReceipt: "/Finance/Transaction/Receipt",
  mnuBeginningBalance: "/Finance/Transaction/BeginningBalance",
  mnuJournal: "/Finance/Transaction/journal",
  mnuFinDocPost:"/Finance/Transaction/FinDocPost",
  mnuFinDocPrint:"/Finance/Transaction/FinDocPrint",

  /* =========================================================
     FINANCE - SETUP
  ========================================================= */

  mnuCustomer: "/Finance/Setup/CustomerPage",
  mnuChartOfAccount:"/Finance/Setup/ChartOfAccountList",
  mnuCostCenter:"/Finance/Setup/CostCenter",
 "mnuCustomer/Supplier Country":"/Finance/Setup/CustomerSupplierCountry",
  mnuInactivateAccount:"/Finance/Setup/InactivateAccount",
  /* =========================================================
     FINANCE - REPORTS
  ========================================================= */

  mnuRptChartOfAccount:"/Finance/Reports/RptChartOfAccount",
  mnuRptCustomerList:"/Finance/Reports/RptCustomerList",
  mnuRptSupplierList:"/Finance/Reports/RptSupplierList",
  mnuRptFinYearCloseBal:"/Finance/Reports/RptFinYearCloseBal",
  mnuRptExpenseSum:"/Finance/Reports/RptExpenseSum",
  mnuRptRVPVSum:"/Finance/Reports/RptRVPVSum",
  mnuRptFinDocList:"/Finance/Reports/RptFinDocList",
  mnuRptIncomeSum:"/Finance/Reports/RptIncomeSum",
  mnuRptDocumentExport:"/Finance/Reports/RptDocumentExport",
 // FINANCE - REPORTS - A/R & A/P

  mnuRptSOA: "/Finance/Reports/rptSOA",
  mnuRptReceivables:"/Finance/Reports/RptReceivables",
  mnuRptAgeingDr:"/Finance/Reports/RptAgeingDr",
  mnuRptPayables:"/Finance/Reports/RptPayables",
  mnuRptAgeingCr:"/Finance/Reports/RptAgeingCr",

  // FINANCE - REPORTS - GENERAL LEDGER
  
  mnuRptGL:"/Finance/Reports/rptGL",
  mnuRptGLGroup:"/Finance/Reports/RptGLGroup",
  mnuRptGLSum:"/Finance/Reports/RptGLSum",
  


  // FINANCE - REPORTS - FINAL ACCOUNTS

  mnuRptTB:"/Finance/Reports/rptTB",
  mnuRptBS:"/Finance/Reports/RptBS",
  mnuRptPL:"/Finance/Reports/RptPL",



  /* =========================================================
     SETTINGS
  ========================================================= */

   mnuSetDocumentNo: "/Settings/SetDocumentNo",
   mnuSetBranchInfo:"/Settings/SetBranchInfo",
   mnuSetCompanyInfo: "/Settings/SetCompanyInfo",
   mnuSetChartOfAccount: "/Settings/SetChartOfAccount",
   mnuSetStockPostingAccount:"/Settings/SetPostingAccount",
   mnuSetActivePeriod:"/Setting/SetActivePeriod",
   mnuSetDefaultBranch:"/Setting/SetDefaultBranch",
   mnuSetDrAgeingPeriod:"/Setting/SetDrAgeingPeriod",
   mnuSetDatabaseBackupPath:"/Setting/SetDatabaseBackupPath",
   mnuChangeLoginYear:"/Setting/ChangeLoginYear",

  /* =========================================================
     SECURITY
  ========================================================= */

  mnuUserLogin:"/Security/UserLogin",
  mnuUserPermissionMenu:"/Security/UserPermissionMenu",
  mnuUserPermissionBranch:"/Security/UserPermissionBranch",
  mnuRptUserAudit:"/Security/UserAudit",
  mnuRptUserTransactionAudit:"/Security/UserTransactionAudit",

  /* =========================================================
     Utility
  ========================================================= */


  mnuFinYearClose:"/Utility/FinYearClose",
  mnuYearCloseStatus:"/Utility/YearCloseStatus",
  mnuRptVerifyDocAccuracy:"/Utility/RptVerifyDocAccuracy",
  mnuRptDocsAfterYearClose:"/Utility/RptDocsAfterYearClose",
  mnuDatabaseBackup:"/Utility/DatabaseBackup",

  /* =========================================================
     ADMINISTRATION
  ========================================================= */



mnuAdministration: "/Administration",
mnuCompany: "/Administration/CompanyPage",
mnuBranch:"/Administration/Branch",
mnuYear:"/Administration/Year",
mnuDocument:"/Administration/Document",
};

export const TRAVEL_NODE: MenuNode = {
  fmenuid: "__travel__",
  fmenuname: "mnuTravel",
  fmenucaption: "Travel",
  fmenubuttons: "0",
  children: [
    {
      fmenuid: "__travel_sales__",
      fmenuname: "mnuTravelSales",
      fmenucaption: "Sales",
      fmenubuttons: "0",
      children: [
        {
          fmenuid: "__travel_sales_ticket__",
          fmenuname: "travelTicketSales",
          fmenucaption: "Ticket Sales",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_sales_hotel__",
          fmenuname: "travelHotelSales",
          fmenucaption: "Hotel Sales",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_sales_other__",
          fmenuname: "travelOtherService",
          fmenucaption: "Other Service",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_sales_airline__",
          fmenuname: "travelAirline",
          fmenucaption: "Airline",
          fmenubuttons: "0",
          children: [],
        },
      ],
    },
    {
      fmenuid: "__travel_reports__",
      fmenuname: "mnuTravelReports",
      fmenucaption: "Sales Report",
      fmenubuttons: "0",
      children: [
        {
          fmenuid: "__travel_report_customer__",
          fmenuname: "travelCustomerSales",
          fmenucaption: "Customer Sales",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_staff__",
          fmenuname: "travelStaffReport",
          fmenucaption: "Staff Report",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_airline__",
          fmenuname: "travelAirlineReport",
          fmenucaption: "Airline Report",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_daily__",
          fmenuname: "travelDailyReport",
          fmenucaption: "Daily Report",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_bsp_ticket__",
          fmenuname: "travelBspTicketwise",
          fmenucaption: "BSP Sales Ticketwise",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_bsp_airline__",
          fmenuname: "travelBspAirlinewise",
          fmenucaption: "BSP Sales Airlinewise",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_customer_profit__",
          fmenuname: "travelCustomerProfit",
          fmenucaption: "Customer Wise Profit",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_supplier_profit__",
          fmenuname: "travelSupplierProfit",
          fmenucaption: "Supplier Wise Profit",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_staff_profit__",
          fmenuname: "travelStaffProfit",
          fmenucaption: "Staff Wise Profit",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_airline_profit__",
          fmenuname: "travelAirlineProfit",
          fmenucaption: "Airline Wise Profit",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_report_bsp_bill__",
          fmenuname: "travelBspBillImportExport",
          fmenucaption: "BSP Bill Import/Export",
          fmenubuttons: "0",
          children: [],
        },
      ],
    },
    {
      fmenuid: "__travel_setup__",
      fmenuname: "mnuTravelSetup",
      fmenucaption: "Setup",
      fmenubuttons: "0",
      children: [
        {
          fmenuid: "__travel_setup_service_charge__",
          fmenuname: "travelServiceChargePolicy",
          fmenucaption: "Service Charge Policy",
          fmenubuttons: "0",
          children: [],
        },
        {
          fmenuid: "__travel_setup_service_type__",
          fmenuname: "travelServiceType",
          fmenucaption: "Service Type",
          fmenubuttons: "0",
          children: [],
        },
      ],
    },
  ],
};

/* =========================================================
   ADMINISTRATION (synthetic node)

   Not a row in tblmenu — injected into the tree at render
   time in SideNav, only when the logged-in user's userType
   is "AU". Defined here, next to the route/icon maps, so
   there's one place that owns everything about this entry.

   fmenuid "99" is out of tblmenu's real id space (real
   top-level ids are 2 digits starting at "01"), chosen so
   it can never collide with a real menu row.
========================================================= */

export const ADMINISTRATION_NODE: MenuNode = {
  fmenuid: "99",
  fmenuname: "mnuAdministration",
  fmenucaption: "Administration",
  fmenubuttons: "0",
  children: [
    {
      fmenuid: "9901",
      fmenuname: "mnuCompany",
      fmenucaption: "Company",
      fmenubuttons: "0",
      children: [],
    },
    {
      fmenuid: "9902",
      fmenuname: "mnuBranch",
      fmenucaption: "Branch",
      fmenubuttons: "0",
      children: [],
    },
     {
      fmenuid: "9903",
      fmenuname: "mnuYear",
      fmenucaption: "Year",
      fmenubuttons: "0",
      children: [],
    },
     {
      fmenuid: "9904",
      fmenuname: "mnuDocument",
      fmenucaption: "Document",
      fmenubuttons: "0",
      children: [],
    },
  ],
};

/* Rpt Statement of Account (synthetic node)
   Hardcoded in the frontend, injected as a child of
   Finance > Report (fmenuid "1103").
   "110399" is outside the real 1103xx id space (110301–110315). */
// export const RPT_STATEMENT_OF_ACCOUNT_NODE: MenuNode = {
//   fmenuid: "110399",
//   fmenuname: "mnuRptStatementOfAccount",
//   fmenucaption: "Rpt Statement of Account",
//   fmenubuttons: "OA",
//   children: [],
// };

/* Returns a new tree with `child` added under the node whose
   fmenuid is `parentId`. Does nothing if it's already there. */
export function injectChild(
  nodes: MenuNode[],
  parentId: string,
  child: MenuNode,
): MenuNode[] {
  return nodes.map((node) => {
    if (node.fmenuid === parentId) {
      const exists = node.children.some((c) => c.fmenuid === child.fmenuid);
      return exists
        ? node
        : { ...node, children: [...node.children, child] };
    }
    return { ...node, children: injectChild(node.children, parentId, child) };
  });
}

/* =========================================================
   ICON MAP

   Only applied at depth 0 (top-level categories). Keyed by
   fmenuname, matched against the real top-level rows seen
   so far: Purchase (01), Sales (02), Finance (11),
   Setting (91), Utility (92), Security (93). Falls back to
   a generic folder icon for anything not listed — add an
   entry here the first time a new top-level category shows
   up in a menu response.
========================================================= */

const topLevelIconMap: Record<string, React.ReactNode> = {
  mnuTravel: React.createElement(FiBriefcase, { size: 18 }),
  mnuPurchase: React.createElement(FiShoppingCart, { size: 18 }),
  mnuSales: React.createElement(FiTrendingUp, { size: 18 }),
  mnuFinance: React.createElement(FiDollarSign, { size: 18 }),
  mnu91Setting: React.createElement(FiSettings, { size: 18 }),
  mnuTools: React.createElement(FiTool, { size: 18 }), // caption: "Utility"
  mnuSecurity: React.createElement(FiLock, { size: 18 }),
  mnuAdministration: React.createElement(FiShield, { size: 18 }),
};

const defaultTopLevelIcon = React.createElement(FiFolder, { size: 18 });

export function getMenuIcon(node: MenuNode, depth: number): React.ReactNode {
  if (depth !== 0) {
    return null;
  }

  return topLevelIconMap[node.fmenuname] ?? defaultTopLevelIcon;
}

export function getMenuRoute(node: MenuNode): string | undefined {
  return menuRouteMap[node.fmenuname];
}
