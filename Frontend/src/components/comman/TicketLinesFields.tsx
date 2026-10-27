import Select from "react-select";
import selectComponents from "./selectComponents";
import { fieldSelectProps } from "./Combo";




type DetailForm = {
  ref1: string;
  ref2: string;
  ref3: string;
  ref4: string;
  postNo: string; // read-only
  kbAmt: string;
  kbAccount: string | null;
  invNote: string;
  note: string;
};

type SetDetail = <K extends keyof DetailForm>(
  key: K,
  value: DetailForm[K],
) => void;

const inputClass =
  " w-full min-w-0 input-style";

const readOnlyClass =
  "h-[30px] w-full min-w-0 rounded-[4px] border border-[#cfd7df] bg-[#eef1f4] px-2 text-[12px] text-[#24364d] outline-none";
type Option = { value: string; label: string };
const panelClass = "border border-gray-300 rounded-sm bg-[#fcfdfe] p-3 ";
const kbAccountOptions: Option[] = [
  { value: "KB1", label: "KB ACCOUNT 1" },
  { value: "KB2", label: "KB ACCOUNT 2" },
];

/* 3b. Reference fields, Post No., KB. and notes -------------------------
   12-column grid, four column groups of 3 columns each. Every row uses the
   same label width per group, so the boxes line up.                      */
const LA = "w-[64px]"; // Ref. 1, Post No., INV. Note
const LB = "w-[84px] -ml-5"; // Ref. 2, KB. Account, Note
const LC = "w-[76px]"; // Ref. 3, Profit Amt.
const LD = "w-[52px]"; // Ref. 4

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });





const Field: React.FC<{
  label: string;
  htmlFor?: string;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, className = "", labelClassName = "", children }) => (
  <div className={`flex min-w-0 items-center gap-2 ${className}`}>
    <label
      htmlFor={htmlFor}
      className={`shrink-0 whitespace-nowrap text-right text-[12px] text-[#405066] ${labelClassName}`}
    >
      {label}
    </label>
    <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
  </div>
);
const TicketLinesFields: React.FC<{
  form: DetailForm;
  set: SetDetail;
  profitAmt: number;
}> = ({ form, set, profitAmt }) => (
  <div
    className={`${panelClass} grid grid-cols-1 items-center gap-x-4 gap-y-2.5 md:grid-cols-2 lg:grid-cols-12`}
  >
    {/* row 1 : Ref. 1 | Ref. 2 | Ref. 3 | Ref. 4 */}
    <Field
      label="Ref. 1 :"
      htmlFor="txtRef1"
      labelClassName={LA}
      className="lg:col-span-3 -ml-2"
    >
      <input
        id="txtRef1"
        value={form.ref1}
        onChange={(event) => set("ref1", event.target.value)}
        className={inputClass}
      />
    </Field>
    <Field
      label="Ref. 2 :"
      htmlFor="txtRef2"
      labelClassName={LB}
      className="lg:col-span-3"
    >
      <input
        id="txtRef2"
        value={form.ref2}
        onChange={(event) => set("ref2", event.target.value)}
        className={inputClass}
      />
    </Field>
    <Field
      label="Ref. 3 :"
      htmlFor="txtRef3"
      labelClassName={LC}
      className="lg:col-span-3"
    >
      <input
        id="txtRef3"
        value={form.ref3}
        onChange={(event) => set("ref3", event.target.value)}
        className={inputClass}
      />
    </Field>
    <Field
      label="Ref. 4 :"
      htmlFor="txtRef4"
      labelClassName={LD}
      className="lg:col-span-3"
    >
      <input
        id="txtRef4"
        value={form.ref4}
        onChange={(event) => set("ref4", event.target.value)}
        className={inputClass}
      />
    </Field>

    {/* row 2 : Post No. + KB. Amt. | KB. Account | Profit Amt. */}
    <div className="flex min-w-0 items-center gap-3 md:col-span-2 lg:col-span-3">
     
      <Field
        label="KB. Amt. :"
        htmlFor="txtKbAmt"
        className="min-w-0 flex-1"
      >
        <input
          id="txtKbAmt"
          inputMode="numeric"
          value={form.kbAmt}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            if (/^\d*\.?\d{0,2}$/.test(event.target.value))
              set("kbAmt", event.target.value);
          }}
          className={`${inputClass} text-right`}
        />
      </Field>
    </div>
    <Field label="KB. Account :" labelClassName={LB} className="lg:col-span-3">
      <div className="min-w-0 flex-1">
        <Select
          inputId="lkpKbAccount"
          instanceId="lkpKbAccount"
          components={selectComponents}
          options={kbAccountOptions}
          value={kbAccountOptions.find((o) => o.value === form.kbAccount) ?? null}
          onChange={(option) => set("kbAccount", option?.value ?? null)}
          {...fieldSelectProps}
        />
      </div>
    </Field>
    <Field label="Profit Amt. :" labelClassName={LC} className="lg:col-span-2">
      <input
        id="txtProfitAmt"
        readOnly
        tabIndex={-1}
        value={formatMoney(profitAmt)}
        className={`${readOnlyClass} text-right`}
      />
    </Field>
     <Field label="Post No. :" labelClassName={LA} className="min-w-0 md:col-span-2 lg:col-span-2 w-[80%]">
        <input
          id="txtPostNo"
          readOnly
          tabIndex={-1}
          value={form.postNo}
          className={readOnlyClass}
        />
      </Field>

    {/* row 3 : INV. Note | Note */}
    <Field
      label="INV. Note :"
      htmlFor="txtInvNote"
      labelClassName={LA}
      className="lg:col-span-4 -ml-3"
    >
      <input
        id="txtInvNote"
        value={form.invNote}
        onChange={(event) => set("invNote", event.target.value)}
        className={inputClass}
      />
    </Field>
    <Field
      label="Note :"
      htmlFor="txtNote"
      labelClassName={LB}
      className="md:col-span-2 lg:col-span-6"
    >
      <input
        id="txtNote"
        value={form.note}
        onChange={(event) => set("note", event.target.value)}
        className={inputClass}
      />
    </Field>
  </div>
);


export default TicketLinesFields