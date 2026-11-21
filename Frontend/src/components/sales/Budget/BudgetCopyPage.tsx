import React, { useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { IoMdClose } from "react-icons/io";

import selectComponents from "../../../components/common/selectComponents";
import {
  Combo,
  fieldSelectProps,
  type Option,
} from "../../../components/common/Combo";

/* ---------------------------------------------------------------------
   DUMMY DATA  (replace with the FillCombos API later)
   --------------------------------------------------------------------- */
type YearOption = { value: string; label: string };

const DUMMY_YEARS: YearOption[] = ["2021", "2022", "2023", "2024", "2025", "2026"].map(
  (value) => ({ value, label: value }),
);

const DUMMY_BRANCHES: Option[] = [
  { value: "JD", label: "JEDDAH", secondLabel: "JD" },
  { value: "RY", label: "RIYADH", secondLabel: "RY" },
];

const DUMMY_HEAD_TYPES: Option[] = [
  { value: "E", label: "Expense", secondLabel: "E" },
  { value: "R", label: "Revenue", secondLabel: "R" },
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

const labelClass = "w-[130px] shrink-0 text-right text-[14px] text-[#405066] whitespace-nowrap  ";

const BudgetCopyPage: React.FC<BudgetCopyPageProps> = ({
  initialYear = DUMMY_YEAR,
  initialBranch = DUMMY_BRANCH,
  initialHeadType = DUMMY_HEAD_TYPE,
  onClose,
}) => {
  const [lkpYear, setYear] = useState(initialYear);
  const [lkpBranch, setlkpBranch] = useState<string | null>(initialBranch);
  const [lkpHeadType, setlkpHeadType] = useState<string | null>(initialHeadType);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");

  const handleCopy = async () => {
    if (copying) return;
    if (lkpYear.length !== 4) {
      setError("Select the year.");
      return;
    }
    if (!lkpBranch) {
      setError("Select the branch.");
      return;
    }

    setCopying(true);
    setError("");
    try {
      // dummy delay: replace with the real copy API call
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log("copy budget", { lkpYear, lkpBranch, lkpHeadType });
      toast.success("Budget copied successfully.");
    } catch {
      setError("Failed to copy budget.");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-[460px] max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <header className="flex h-7.5 items-center justify-between bg-[#9fdfbc]">
            <h1 className="m-0 ml-3.5 text-[14px] font-semibold text-[#24364d]">
              Budget Copy
            </h1>

            <button className=" mr-4 hover:bg-red-100 p-1 rounded-full cursor-pointer"><IoMdClose size={17} className=""/></button>
          </header>

          <section className="flex flex-col gap-3 px-3.5 pb-6 pt-4">
            {/* Year */}
            <div className="flex items-center gap-2 ">
              <label htmlFor="lkpYear" className={labelClass}>
                Year :
              </label>
              <div className="w-[110px] min-w-0">
                <Select<YearOption, false>
                  inputId="lkpYear"
                  instanceId="lkpYear"
                  aria-label="Year"
                  options={DUMMY_YEARS}
                  components={selectComponents}
                  value={DUMMY_YEARS.find((o) => o.value === lkpYear) ?? null}
                  isDisabled={copying}
                  onChange={(option) => {
                    setYear(option?.value ?? "");
                    setError("");
                  }}
                  {...fieldSelectProps}
                />
              </div>
            </div>

            {/* Branch */}
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor="lkpBranch" className={labelClass}>
                Branch :
              </label>
              <div className="w-[240px] min-w-0">
                <Combo
                  id="lkpBranch"
                  secondColumnExtra={56}
                  firstHeader="Name"
                  secondHeader="ID"
                  options={DUMMY_BRANCHES}
                  value={lkpBranch}
                  onChange={(value) => {
                    setlkpBranch(value);
                    setError("");
                  }}
                  className="w-full min-w-0"
                  isSearchable
                />
              </div>
            </div>

            {/* Budget Head Type (Expense / Revenue) */}
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor="lkpBudgetHeadType" className={labelClass}>
                Budget Head Type :
              </label>
              <div className="w-[240px] min-w-0">
                <Combo
                  id="lkpBudgetHeadType"
                  secondColumnExtra={56}
                  firstHeader="Name"
                  secondHeader="ID"
                  options={DUMMY_HEAD_TYPES}
                  value={lkpHeadType}
                  onChange={(value) => {
                    setlkpHeadType(value);
                    setError("");
                  }}
                  className="w-full min-w-0"
                  isSearchable
         
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            <div className="mt-3 flex justify-center gap-3">
              <button
                id="btnCopy"
                type="button"
                onClick={() => void handleCopy()}
                disabled={copying}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copying ? "Copying..." : <><u>C</u>opy</>}
              </button>
            
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default BudgetCopyPage;