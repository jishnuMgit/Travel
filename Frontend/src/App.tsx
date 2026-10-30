
import { useState } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import AppSidebar from "./components/comman/AppSidebar";
import LoginPage from "./pages/Auth/LoginPage";
import AppRoute from "./routes/AppRoute";

const pageTitles: Record<string, string> = {
  "/login": "Login",
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
  "/Tables/B2BInvoice": "B2B Invoice",
  "/Tables/B2CInvoice": "B2C Invoice",
  "/Setup/ServiceChargePolicy": "Service Charge Policy",
  "/Setup/ServiceType": "Service Type",
};

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation();
  const pageTitle = pageTitles[pathname] ?? "Sales";

  if (pathname === "/login") {
    return <LoginPage />;
  }

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
          <AppRoute />
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
