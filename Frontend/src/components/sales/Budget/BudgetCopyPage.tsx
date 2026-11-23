import React, { useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import { IoMdClose } from "react-icons/io";

import selectComponents from "../../../components/common/selectComponents";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import { copyBudget } from "../../../utils/Api";
import {
  Combo,
  fieldSelectProps,
  type Option,
} from "../../../components/common/Combo";

type YearOption = { value: string; label: string };

/* ---------------------------------------------------------------------
   PAGE
   --------------------------------------------------------------------- */
type BudgetCopyPageProps = {
  sourceCompanyId?: string;
  sourceYear?: string;
  sourceBranch?: string | null;
  sourceHeadType?: string | null;
  userId?: string | null;
  yearOptions?: YearOption[];
  branchOptions?: Option[];
  headTypeOptions?: Option[];
  onClose?: () => void;
};

const labelClass = "w-[130px] shrink-0 text-right text-[14px] text-[#405066] whitespace-nowrap  ";

const BudgetCopyPage: React.FC<BudgetCopyPageProps> = ({
  sourceCompanyId = "",
  sourceYear = "",
  sourceBranch = null,
  sourceHeadType = null,
  userId = null,
  yearOptions = [],
  branchOptions = [],
  headTypeOptions = [],
  onClose = () => {},
}) => {
  const [lkpYear, setYear] = useState(sourceYear);
  const [lkpBranch, setlkpBranch] = useState<string | null>(sourceBranch);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialog: confirmDialog } = useConfirmModal();

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
    if (!sourceCompanyId) {
      setError("Company ID (PstrCoID) was not found.");
      return;
    }
    if (sourceYear.length !== 4 || !sourceBranch || !sourceHeadType) {
      setError("Select the source year, branch, and budget head type.");
      return;
    }

    setError("");
    const payload = {
      p_pstrcoid: sourceCompanyId,
      p_pstryear: sourceYear,
      p_strbrid: sourceBranch,
      p_strbudgetheadtype: sourceHeadType,
      p_strcopytoyear: lkpYear,
      p_strcopytobrid: lkpBranch,
      p_strcopytotype: sourceHeadType,
      p_pstruserid: userId,
    };

    setCopying(true);
    try {
      let result = await copyBudget(payload);
      if (result.requiresOverwrite) {
        const overwrite = await confirm({
          title: "Overwrite Budget?",
          message:
            " Do you want to overwrite it ?",
          confirmLabel: "Yes",
          cancelLabel: "No",
        });
        if (!overwrite) return;
        result = await copyBudget({ ...payload, overwrite: true });
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to copy budget.");
      }

      toast.success(result.message || "Budget copied successfully.");
      onClose();
    } catch (copyError) {
      setError(
        copyError instanceof Error
          ? copyError.message
          : "Failed to copy budget.",
      );
    } finally {
      setCopying(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-3"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !copying) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-copy-title"
          className="min-h-fit w-115 max-w-full bg-white p-0 shadow-lg"
        >
          <main className="w-full overflow-hidden border border-gray-400 bg-white">
            <header className="flex h-7.5 items-center justify-between bg-[#9fdfbc]">
              <h1
                id="budget-copy-title"
                className="m-0 ml-3.5 text-[14px] font-semibold text-[#24364d]"
              >
                Budget Copy
              </h1>

              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={copying}
                className="mr-4 cursor-pointer rounded-full p-1 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <IoMdClose size={17} />
              </button>
            </header>

            <section className="flex flex-col gap-3 px-3.5 pb-6 pt-4">
              {/* Year */}
              <div className="flex items-center gap-2 ">
                <label htmlFor="copyToYear" className={labelClass}>
                  Year :
                </label>
                <div className="w-27.5 min-w-0">
                  <Select<YearOption, false>
                    inputId="copyToYear"
                    instanceId="copyToYear"
                    aria-label="Year"
                    options={yearOptions}
                    components={selectComponents}
                    value={yearOptions.find((o) => o.value === lkpYear) ?? null}
                    onChange={(option) => {
                      setYear(option?.value ?? "");
                      setError("");
                    }}
                    isDisabled={copying}
                    {...fieldSelectProps}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 70 }),
                    }}
                  />
                </div>
              </div>

              {/* Branch */}
              <div className="flex min-w-0 items-center gap-2">
                <label htmlFor="copyToBranch" className={labelClass}>
                  Branch :
                </label>
                <div className="w-60 min-w-0">
                  <Combo
                    id="copyToBranch"
                    secondColumnExtra={56}
                    firstHeader="Name"
                    secondHeader="ID"
                    options={branchOptions}
                    value={lkpBranch}
                    onChange={(value) => {
                      setlkpBranch(value);
                      setError("");
                    }}
                    className="w-full min-w-0"
                    isSearchable
                    disabled={copying}
                  />
                </div>
              </div>

              {/* Budget Head Type (Expense / Revenue) */}
              <div className="flex min-w-0 items-center gap-2">
                <label htmlFor="copyToBudgetHeadType" className={labelClass}>
                  Budget Head Type :
                </label>
                <div className="w-60 min-w-0">
                  <Combo
                    id="copyToBudgetHeadType"
                    secondColumnExtra={56}
                    firstHeader="Name"
                    secondHeader="ID"
                    options={headTypeOptions}
                    value={sourceHeadType}
                    className="w-full min-w-0"
                    isSearchable
                    disabled
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
                  id="btnCopySubmit"
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
      {confirmDialog}
    </>
  );
};

export default BudgetCopyPage;