import { Navigate, Route, Routes } from "react-router-dom";
import HotelSalesPage from "../pages/Travel/Sales/HotelSalesPage";
import TicketSalesPage from "../pages/Travel/Sales/TicketSalesPage";
import OtherServicePage from "../pages/Travel/Sales/OtherServicePage";
import AirlinePage from "../pages/Travel/Sales/AirlinePage";
import RptStockPage from "../pages/Travel/SalesReport/RptCustomerSalesPage";
import RptStaffPage from "../pages/Travel/SalesReport/RptStaffPage";
import RptAirlinePage from "../pages/Travel/SalesReport/RptAirlinePage";
import RptDailyPage from "../pages/Travel/SalesReport/RptDailyPage";
import RptBspSalesTicketwisePage from "../pages/Travel/SalesReport/Rptbspsalesticketwisepage";
import RptBSPSalesAirlinewisepage from "../pages/Travel/SalesReport/RptBSPSalesAirlinewisepage";
import RptCustomerWiseProfitPage from "../pages/Travel/SalesReport/Rptcustomerwiseprofitpage";
import SupplierWiseProfitPage from "../pages/Travel/SalesReport/SupplierWiseProfitPage";
import StaffWiseProfitPage from "../pages/Travel/SalesReport/StaffWiseProfitPage";
import AirlineWiseProfitPage from "../pages/Travel/SalesReport/AirlineWiseProfitPage";
import BspBillImportExportPage from "../pages/Travel/SalesReport/BspBillImportExportPage";
import B2BInvoicePage from "../pages/Tables/B2BInvoicePage";
import B2CInvoicePage from "../pages/Tables/B2cinvoicepage";
import ServiceChargePolicy from "../pages/Travel/Setup/ServiceChargePolicy";
import ServiceTypePage from "../pages/Travel/Setup/ServiceTypePage";
import LoginPage from "../pages/Auth/LoginPage";

const AppRoute = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/ticket-sales" element={<TicketSalesPage />} />
    <Route path="/hotel-sales" element={<HotelSalesPage />} />
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
    <Route path="/Other-Service" element={<OtherServicePage />} />
    <Route path="/Airline" element={<AirlinePage />} />
    <Route path="/Report/RptCustomerSales" element={<RptStockPage />} />
    <Route path="/Report/Staff" element={<RptStaffPage />} />
    <Route path="/Report/Airline" element={<RptAirlinePage />} />
    <Route path="/Report/Daily" element={<RptDailyPage />} />
    <Route
      path="/Report/RptBspSalesTicketwisePage"
      element={<RptBspSalesTicketwisePage />}
    />
    <Route
      path="/Report/RptBspSalesAirlinewisePage"
      element={<RptBSPSalesAirlinewisepage />}
    />
    <Route
      path="/Report/CustomerWiseProfit"
      element={<RptCustomerWiseProfitPage />}
    />
    <Route
      path="/Report/SupplierWiseProfit"
      element={<SupplierWiseProfitPage />}
    />
    <Route path="/Report/StaffWiseProfit" element={<StaffWiseProfitPage />} />
    <Route
      path="/Report/AirlineWiseProfit"
      element={<AirlineWiseProfitPage />}
    />
    <Route
      path="/Report/BspBillImportExport"
      element={<BspBillImportExportPage />}
    />
    <Route path="/Tables/B2BInvoice" element={<B2BInvoicePage />} />
    <Route path="/Tables/B2CInvoice" element={<B2CInvoicePage />} />
    <Route
      path="/Setup/ServiceChargePolicy"
      element={<ServiceChargePolicy />}
    />
    <Route path="/Setup/ServiceType" element={<ServiceTypePage />} />
  </Routes>
);

export default AppRoute;
