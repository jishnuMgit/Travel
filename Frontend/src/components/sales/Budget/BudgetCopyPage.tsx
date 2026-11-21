import React, { useState } from "react";
import Select from "react-select";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import { fieldSelectProps } from "../../common/Combo";

/* ---------------------------------------------------------------------
   DUMMY DATA  (replace with the FillCombos API later)
   --------------------------------------------------------------------- */
type SelectOption = { value: string; label: string };

const DUMMY_BRANCHES: SelectOption[] = [
  { value: "JD", label: "JEDDAH" },
  { value: "RY", label: "RIYADH" },
];

const DUMMY_HEAD_TYPES: SelectOption[] = [
  { value: "E", label: "Expense" },
  { value: "R", label: "Revenue" },
];

const DUMMY_YEAR = "2026";
const DUMMY_BRANCH = "JD";
const DUMMY_HEAD_TYPE = "R";

/* ---------------------------------------------------------------------
   PAGE
   --------------------------------------------------------------------- */
type BudgetCopyPageProps = {
  /** values coming from the Budget page (dummy defaults for now) */
  initialYear?: string;
  initialBranch?: string;
  initialHeadType?: string;
  onClose?: () => void;
};

const BudgetCopyPage: React.FC<BudgetCopyPageProps> = ({
  initialYear = DUMMY_YEAR,
  initialBranch = DUMMY_BRANCH,
  initialHeadType = DUMMY_HEAD_TYPE,
  onClose,
}) => {
  const [year, setYear] = useState(initialYear); // txtYear
  const [branch, setBranch] = useState<string | null>(initialBranch); // lkpBranch
  const [headType] = useState<string | null>(initialHeadType); // lkpBudgetHeadType (locked)
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");

  const handleCopy = async () => {
    if (copying) return;
    if (year.length !== 4) {
      setError("Enter a valid 4 digit year.");
      return;
    }
    if (!branch) {
      setError("Select the branch.");
      return;
    }

    setCopying(true);
    setError("");
    try {
      // dummy delay: replace with the real copy API call
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log("copy budget", { year, branch, headType });
      toast.success("Budget copied successfully.");
    } catch {
      setError("Failed to copy budget.");
    } finally {
      setCopying(false);
    }
  };

  const labelClass =
    "w-[130px] shrink-0 text-right text-[12px] text-[#405066]";

  return (
    <div className="flex min-h-full w-full items-start justify-center bg-white px-4 py-4">
      <div className="w-[420px] max-w-full overflow-hidden rounded-md border border-[#91a7bb] bg-[#f0eff4] shadow-md">
        {/* title bar */}
        <div className="flex h-[34px] items-center justify-between bg-white px-3">
          <h1 className="m-0 text-[13px] font-normal text-[#24364d]">
            Budget Copy
          </h1>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-[#24364d] hover:bg-gray-100"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* form */}
        <div className="flex flex-col gap-3 px-4 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <label htmlFor="txtYear" className={labelClass}>
              Year :
            </label>
            <input
              id="txtYear"
              inputMode="numeric"
              maxLength={4}
              value={year}
              disabled={copying}
              onChange={(event) => {
                if (/^\d{0,4}$/.test(event.target.value)) {
                  setYear(event.target.value);
                  setError("");
                }
              }}
              className="h-[30px] w-[82px] rounded-sm border border-[#B7C7D7] bg-white px-2 text-[12px] text-[#24364d] outline-none focus:border-[#64c995]"
            />
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="lkpBranch" className={labelClass}>
              Branch :
            </label>
            <div className="min-w-0 flex-1">
              <Select<SelectOption, false>
                inputId="lkpBranch"
                instanceId="lkpBranch"
                aria-label="Branch"
                options={DUMMY_BRANCHES}
                value={DUMMY_BRANCHES.find((o) => o.value === branch) ?? null}
                onChange={(option) => {
                  setBranch(option?.value ?? null);
                  setError("");
                }}
                isDisabled={copying}
                // isClearable={false}
                {...fieldSelectProps}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="lkpBudgetHeadType" className={labelClass}>
              Budget Head Type :
            </label>
            <div className="min-w-0 flex-1">
              <Select<SelectOption, false>
                inputId="lkpBudgetHeadType"
                instanceId="lkpBudgetHeadType"
                aria-label="Budget Head Type"
                options={DUMMY_HEAD_TYPES}
                value={DUMMY_HEAD_TYPES.find((o) => o.value === headType) ?? null}
                isDisabled
                // isClearable={false}
                {...fieldSelectProps}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="m-0 text-center text-[12px] text-[#c0392b]">
              {error}
            </p>
          )}

          {/* buttons */}
          <div className="mt-3 flex justify-center gap-3">
            <button
              id="btnCopy"
              type="button"
              onClick={() => void handleCopy()}
              disabled={copying}
              className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copying ? "Copying..." : "Copy"}
            </button>
            <button
              id="btnClose"
              type="button"
              onClick={onClose}
              disabled={copying}
              className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCopyPage;