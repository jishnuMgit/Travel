
import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import AppSidebar from "./components/comman/AppSidebar";
import HotelSalesPage from "./pages/Sales/HotelSalesPage";
import TicketSalesPage from "./pages/Sales/TicketSalesPage";
import CarRentalPage from "./pages/Sales/CarRentalPage";

const pageTitles: Record<string, string> = {
  "/ticket-sales": "Ticket Sales",
  "/hotel-sales": "Hotel Sales",
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
            <Route path="/CarRental" element={<CarRentalPage/>}/>
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
