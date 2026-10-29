
import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import AppSidebar from "./components/comman/AppSidebar";
import HotelSalesPage from "./pages/Sales/HotelSalesPage";
import TicketSalesPage from "./pages/Sales/TicketSalesPage";
import OtherServicePage from "./pages/Sales/OtherServicePage";
import AirlinePage from "./pages/Sales/AirlinePage";
import RptStockPage from "./pages/Report/RptStockPage";
import RptStaffPage from "./pages/Report/RptStaffPage";
import RptAirlinePage from "./pages/Report/RptAirlinePage";
import RptDailyPage from "./pages/Report/RptDailyPage";
import RptBspSalesTicketwisePage from "./pages/Report/Rptbspsalesticketwisepage";
import RptBSPSalesAirlinewisepage from "./pages/Report/RptBSPSalesAirlinewisepage";
import RptCustomerWiseProfitPage from "./pages/Report/Rptcustomerwiseprofitpage";
import SupplierWiseProfitPage from "./pages/Report/SupplierWiseProfitPage";
import StaffWiseProfitPage from "./pages/Report/StaffWiseProfitPage";
import AirlineWiseProfitPage from "./pages/Report/AirlineWiseProfitPage";
import BspBillImportExportPage from "./pages/Report/BspBillImportExportPage";

const pageTitles: Record<string, string> = {
  "/ticket-sales": "Ticket Sales",
  "/hotel-sales": "Hotel Sales",
  "/Report/Stock": "Stock Sales",
  "/Report/Staff": "Staff Sales",
  "/Report/Airline": "Airline Sales",
  "/Report/Daily": "Daily Sales",
  "/Report/RptBspSalesTicketwisePage": "BSP Sales Ticketwise",
  "/Report/RptBspSalesAirlinewisePage": "BSP Sales Airlinewise",
  "/Report/CustomerWiseProfit": "Customer wise Profit",
  "/Report/SupplierWiseProfit": "Supplier wise Profit",
  "/Report/StaffWiseProfit": "Staff wise Profit",
  "/Report/AirlineWiseProfit": "Airline wise Profit",
  "/Report/BspBillImportExport": "BSP Bill Import/Export",
};

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation();
  const pageTitle = pageTitles[pathname] ?? "Sales";

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <AppSidebar
        isDesktopOpen={isSidebarOpen}
        onDesktopClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white px-7 md:flex">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <FiMenu size={17} />
            </button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Sales workspace
              </p>
              <h1 className="mt-0.5 text-base font-semibold text-slate-800">
                {pageTitle}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Workspace active
          </div>
        </header>
        <main className="min-w-0 flex-1">
          <Routes>
            <Route path="/ticket-sales" element={<TicketSalesPage />} />
            <Route path="/hotel-sales" element={<HotelSalesPage />} />
            <Route path="/" element={<Navigate to="/ticket-sales" replace />} />
            <Route path="*" element={<Navigate to="/ticket-sales" replace />} />
            <Route path="/Other-Service" element={<OtherServicePage/>}/>
            <Route path="/Airline" element={<AirlinePage/>}/>
            <Route path="/Report/Stock" element={<RptStockPage/>}/>
            <Route path="/Report/Staff" element={<RptStaffPage/>}/>
            <Route path="/Report/Airline" element={<RptAirlinePage/>}/>
            <Route path="/Report/Daily" element={<RptDailyPage/>}/>
            <Route path="/Report/RptBspSalesTicketwisePage" element={<RptBspSalesTicketwisePage/>}/>
            <Route path="/Report/RptBspSalesAirlinewisePage" element={<RptBSPSalesAirlinewisepage/>}/>
            <Route path="/Report/CustomerWiseProfit" element={<RptCustomerWiseProfitPage/>}/>
            <Route path="/Report/SupplierWiseProfit" element={<SupplierWiseProfitPage/>}/>
            <Route path="/Report/StaffWiseProfit" element={<StaffWiseProfitPage/>}/>
            <Route path="/Report/AirlineWiseProfit" element={<AirlineWiseProfitPage/>}/>
            <Route path="/Report/BspBillImportExport" element={<BspBillImportExportPage/>}/>
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
