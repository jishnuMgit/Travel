import { useState } from "react";
import {
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUser,
} from "react-icons/fi";

const fieldClassName =
  "h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-[15px] text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const selectClassName =
  "h-10 w-full appearance-none rounded-md border border-slate-300 bg-white pl-10 pr-9 text-[15px] text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#edf2f4] px-4 py-8">
      <div className="w-full max-w-[540px] rounded-[14px] border border-slate-200 bg-[#f5f7f8] p-0 shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
        <div className="px-6 pt-5 pb-4">
          <h2 className="text-[22px] font-semibold text-slate-800">Login</h2>
        </div>

        <div className="border-t border-slate-200 px-6 pb-5 pt-5">
          <div className="mb-6 flex h-12 items-center justify-center rounded-md border border-emerald-200 bg-[#cfeae0] text-[15px] italic text-slate-700">
            Please login to connect
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <label className="w-28 text-right text-[15px] font-medium text-slate-700">
                User ID :
              </label>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <FiUser size={16} />
                </span>
                <input
                  type="text"
                  className={fieldClassName}
                  placeholder=""
                  aria-label="User ID"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-28 text-right text-[15px] font-medium text-slate-700">
                Password :
              </label>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <FiLock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-10 text-[15px] text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  aria-label="Password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-28 text-right text-[15px] font-medium text-slate-700">
                Company :
              </label>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <FiBriefcase size={16} />
                </span>
                <select className={selectClassName} aria-label="Company">
                  <option>TM</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  ▾
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-28 text-right text-[15px] font-medium text-slate-700">
                Year :
              </label>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <FiCalendar size={16} />
                </span>
                <select className={selectClassName} aria-label="Year">
                  <option>2026</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  ▾
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1ecb8d] text-base font-semibold text-white shadow-[0_2px_0_rgba(0,0,0,0.08)] transition hover:bg-[#1ab881]"
          >
            <FiArrowRight size={16} />
            Login
          </button>
        </div>

        <div className="border-t border-slate-200 px-3 py-4 text-center tracking-[0.15em] text-[11px] font-medium uppercase text-slate-500">
          Secure access &nbsp; | &nbsp; Reliable records &nbsp; | &nbsp; Smart decisions
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
