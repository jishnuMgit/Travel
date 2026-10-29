
type ActionButtonProps = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  id,
  label,
  onClick,
  disabled = false,
}) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="btn-style min-w-20 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {label}
  </button>
);
export type HotelActionName =
  | "copy"
  | "save"
  | "search"
  | "delete"
  | "printSv"
  | "print"
  | "customerAttach"
  | "supplierAttach"
  | "cancel"
  | "close"
  | "cc"
  | "inv"
  | "ci";


const HotelActions: React.FC<{
  onAction: (name: HotelActionName) => void;
  onSave: () => void;
  onSearch: () => void;
  onCancel: () => void;
  onClose: () => void;
}> = ({ onAction, onSave, onSearch, onCancel, onClose }) => (
  <div className="flex flex-col items-stretch gap-3 border border-[#d5dce2] bg-white p-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-6 md:gap-y-2">
    <div className="flex flex-wrap gap-2">
      <ActionButton
        id="btnCopy"
        label="Copy"
        disabled
        onClick={() => onAction("copy")}
      />
    </div>

    <div className="flex flex-wrap gap-2">
      <ActionButton id="btnSave" label="Save" onClick={onSave} />
      <ActionButton id="btnsearch" label="Search" onClick={onSearch} />
      <ActionButton
        id="btnDelete"
        label="Delete"
        onClick={() => onAction("delete")}
      />
      <ActionButton
        id="btnPrintSV"
        label="Print SV"
        onClick={() => onAction("printSv")}
      />
      <ActionButton
        id="btnPrint"
        label="Print"
        onClick={() => onAction("print")}
      />
      
      <ActionButton
        id="btnCancel"
        label="Cancel"
        onClick={onCancel}
      />
      <ActionButton
        id="btnClose"
        label="Close"
        onClick={onClose}
      />
    </div>

    <div className="flex flex-wrap gap-2">
      <ActionButton
        id="btnCC"
        label="CC"
        disabled
        onClick={() => onAction("cc")}
      />
      <ActionButton
        id="btnINV"
        label="INV"
        disabled
        onClick={() => onAction("inv")}
      />
      <ActionButton
        id="btnCI"
        label="CI"
        disabled
        onClick={() => onAction("ci")}
      />
    </div>
  </div>
);

export default HotelActions;