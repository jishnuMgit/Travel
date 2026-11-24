import React, { useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import selectComponents from "../../../components/common/selectComponents";
import { fieldSelectProps } from "../../../components/common/Combo";

/* =====================================================================
   FILE MAP
   1. Types, constants, sample options (replace with your API data)
   2. Styles shared with the Budget / Staff / IATA pages
   3. LookupField : label above a dropdown
   4. SetBranchSalesPage : owns the state and renders the form

   Layout (from the sketch, table tblBranch):
     Branch                        [ dropdown ]
     Cash Sales Account            [ dropdown ]
     Pax Credit Card Sales Account [ dropdown ]
     Void Sales Account            [ dropdown ]
     [Save] [Clear]
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE OPTIONS
   --------------------------------------------------------------------- */
type Option = { value: string; label: string };

type BranchAccounts = {
  cash: string | null;
  paxCard: string | null;
  voidSales: string | null;
};

const EMPTY_ACCOUNTS: BranchAccounts = {
  cash: null,
  paxCard: null,
  voidSales: null,
};

/* TODO: replace with the API list of branches */
const BRANCH_OPTIONS: Option[] = [
  { value: "B001", label: "Head Office" },
  { value: "B002", label: "City Branch" },
  { value: "B003", label: "Airport Branch" },
];

/* TODO: replace with the API list of ledger accounts */
const ACCOUNT_OPTIONS: Option[] = [
  { value: "4001", label: "4001 - Cash Sales" },
  { value: "4002", label: "4002 - Credit Card Sales" },
  { value: "4003", label: "4003 - Void Sales" },
  { value: "4004", label: "4004 - Other Sales" },
];

/* ---------------------------------------------------------------------
   2. STYLES (same look as the other pages)
   --------------------------------------------------------------------- */
/* the menu is drawn on <body> so it is never clipped by the card */
const portalStyles = {
  menuPortal: (base: object) => ({ ...base, zIndex: 9999 }),
};

const labelClass = "text-[12px] text-[#405066]";

/* ---------------------------------------------------------------------
   3. PARTS
   --------------------------------------------------------------------- */

/* label above a dropdown */
const LookupField: React.FC<{
  id: string;
  label: string;
  options: Option[];
  value: string | null;
  widthClass: string;
  onChange: (value: string | null) => void;
}> = ({ id, label, options, value, widthClass, onChange }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className={labelClass}>
      {label}
    </label>
    <div className={`${widthClass} min-w-0 max-w-full`}>
      <Select<Option, false>
        inputId={id}
        instanceId={id}
        aria-label={label}
        options={options}
        components={selectComponents}
        value={options.find((o) => o.value === value) ?? null}
        onChange={(option) => onChange(option?.value ?? null)}
        styles={portalStyles}
        {...fieldSelectProps}
      />
    </div>
  </div>
);

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts
   --------------------------------------------------------------------- */
const SetBranchSalesPage: React.FC = () => {
  const [branch, setBranch] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BranchAccounts>(EMPTY_ACCOUNTS);
  /* accounts per branch, kept in memory until your API is connected */
  const [savedByBranch, setSavedByBranch] = useState<
    Record<string, BranchAccounts>
  >({});
  const [error, setError] = useState("");

  const handleBranchChange = (value: string | null) => {
    setBranch(value);
    setError("");
    /* TODO: load the saved accounts for this branch from your API */
    setAccounts(value ? (savedByBranch[value] ?? EMPTY_ACCOUNTS) : EMPTY_ACCOUNTS);
  };

  const setAccount = (patch: Partial<BranchAccounts>) => {
    setError("");
    setAccounts((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    if (!branch) {
      setError("Select a Branch.");
      return;
    }
    if (!accounts.cash) {
      setError("Select the Cash Sales Account.");
      return;
    }
    if (!accounts.paxCard) {
      setError("Select the Pax Credit Card Sales Account.");
      return;
    }
    if (!accounts.voidSales) {
      setError("Select the Void Sales Account.");
      return;
    }
    setError("");
    /* TODO: call your save API here with `branch` and `accounts` */
    setSavedByBranch((prev) => ({ ...prev, [branch]: accounts }));
    toast.success("Branch sales accounts saved successfully.");
  };

  const handleClear = () => {
    setBranch(null);
    setAccounts(EMPTY_ACCOUNTS);
    setError("");
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-200 bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <header className="flex h-7.5 items-center justify-between bg-[#9fdfbc] pr-3.5">
            <h1 className="m-0 ml-3.5 text-[17px] font-semibold text-[#24364d]">
              Set Branch Sales
            </h1>
            <span className="text-[11px] text-[#405066]">tblBranch</span>
          </header>

          <section className="flex flex-col gap-4 px-3.5 pb-6 pt-3">
            <LookupField
              id="lkpBranch"
              label="Branch"
              options={BRANCH_OPTIONS}
              value={branch}
              widthClass="w-72"
              onChange={handleBranchChange}
            />
            <LookupField
              id="lkpCashSalesAccount"
              label="Cash Sales Account"
              options={ACCOUNT_OPTIONS}
              value={accounts.cash}
              widthClass="w-96"
              onChange={(value) => setAccount({ cash: value })}
            />
            <LookupField
              id="lkpPaxCardSalesAccount"
              label="Pax Credit Card Sales Account"
              options={ACCOUNT_OPTIONS}
              value={accounts.paxCard}
              widthClass="w-96"
              onChange={(value) => setAccount({ paxCard: value })}
            />
            <LookupField
              id="lkpVoidSalesAccount"
              label="Void Sales Account"
              options={ACCOUNT_OPTIONS}
              value={accounts.voidSales}
              widthClass="w-96"
              onChange={(value) => setAccount({ voidSales: value })}
            />

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              <button
                id="btnSave"
                type="button"
                onClick={handleSave}
                className="btn-style"
              >
                <u>S</u>ave
              </button>
              <button
                id="btnClear"
                type="button"
                onClick={handleClear}
                className="btn-style"
              >
                <u>C</u>lear
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SetBranchSalesPage;