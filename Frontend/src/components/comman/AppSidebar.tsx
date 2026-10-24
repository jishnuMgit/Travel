import { useState } from "react";
import {
  FiBriefcase,
  FiChevronRight,
  FiCreditCard,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { GiCommercialAirplane } from "react-icons/gi";

import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Ticket Sales", to: "/ticket-sales", icon: FiCreditCard },
  { label: "Hotel Sales", to: "/hotel-sales", icon: FiBriefcase },
   { label: "Other Service", to: "/Other-Service", icon: FaCar },
   {label:"Airline",to:"/Airline",icon:GiCommercialAirplane}
];

const AppSidebar: React.FC<{
  isDesktopOpen: boolean;
  onDesktopClose: () => void;
}> = ({ isDesktopOpen, onDesktopClose }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebar = (
    <aside className="sticky top-0 flex h-screen w-[264px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-sm shadow-emerald-200">
          T
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight text-slate-800">
            Travel Desk
          </p>
          <p className="text-[11px] font-medium text-slate-400">
            SALES WORKSPACE
          </p>
        </div>
      </div>

      <div className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Workspace
      </div>
      <nav aria-label="Main navigation" className="mt-3 space-y-1">
        {navigation.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => {
              setIsMobileOpen(false);
              onDesktopClose();
            }}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "bg-slate-100 text-slate-500 group-hover:bg-white"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="flex-1">{label}</span>
                <FiChevronRight
                  aria-hidden="true"
                  className={`transition-transform ${
                    isActive
                      ? "text-emerald-600"
                      : "text-slate-300 group-hover:translate-x-0.5"
                  }`}
                  size={15}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
        <p className="text-xs font-semibold text-slate-700">Need a hand?</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">
          Your sales workspace is ready whenever you are.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 px-2 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          TD
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-700">
            Travel Desk
          </p>
          <p className="truncate text-[11px] text-slate-400">
            Sales operator
          </p>
        </div>
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      </div>
    </aside>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
        <button
          type="button"
          aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          {isMobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          T
        </div>
        <span className="text-sm font-semibold text-slate-800">
          Travel Desk
        </span>
      </div>

      {isDesktopOpen && <div className="hidden md:block">{sidebar}</div>}

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Dismiss navigation overlay"
            onClick={() => setIsMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/30"
          />
          <div className="relative h-full w-fit shadow-xl">{sidebar}</div>
        </div>
      )}
    </>
  );
};

export default AppSidebar;
