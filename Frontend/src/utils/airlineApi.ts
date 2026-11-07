export type AirlineRecord = {
  fcoid: string;
  fairlineno: string;
  fairlinename: string;
  fairlineid: string | null;
  fsuserid?: string | null;
  fsuserdate?: string | null;
  fmuserid?: string | null;
  fmuserdate?: string | null;
  fvatoncommission: boolean | null;
};

export type AirlinePayload = {
  fairlineno: string;
  fairlinename: string;
  fairlineid: string | null;
  fvatoncommission: boolean;
  fsuserid?: string | null;
  fmuserid?: string | null;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || `Request failed (${response.status})`);
  }

  return body as T;
}

const encode = (value: string) => encodeURIComponent(value);

export const getAirlines = (fcoid: string) =>
  request<AirlineRecord[]>(`/airlines/${encode(fcoid)}`);

export type TktTypeRecord = {
  ftickettypeid: string;
  ftickttypename: string | null;
};

/* Save a new ticket (tblticketsales + tblticketsalesb). */
// The payload keys are the element ids of the screen (lkp / txt / dtp / Pstr).
export type TicketLinePayload = {
  lkpLineCustomer: string | null;
  lkpLineDivision: string;
  txtLineBType: string;
  txtLineFare: number;
  txtLineTax: number;
  txtLineCDAmt: number;
  txtLineSChg: number;
  txtLineSChgV: number;
  txtLineInvAmt: number;
  txtLineVATAmt: number;
  txtLineVATPer: number;
  txtLineHCharge: number;
  txtLineHSCVATAmt: number;
  txtLineMF: number;
  txtLineMFWOVAT: number;
  txtLineMFVATAmt: number;
  txtLineSChgType: string;
  txtLineSChgPer: number;
};

export type TicketDetailPayload = {
  txtRef1: string;
  txtRef2: string;
  txtRef3: string;
  txtRef4: string;
  txtKbAmt: number;
  lkpKbAccount: string | null;
  txtInvNote: string;
  txtNote: string;
};

export type SaveTicketPayload = TicketDetailPayload & {
  PstrCoID: string;
  PstrYear: string;
  lines: TicketLinePayload[];
  [elementId: string]: unknown;
};

export const saveTicketSales = (payload: SaveTicketPayload) =>
  request<{ success: boolean; message: string }>("/ticket-sales", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export type ComTypeRecord = {
  fpid: string;
  fpname: string | null;
};

export const getTicketSalesComTypes = () =>
  request<ComTypeRecord[]>("/ticket-sales/com-types");

export type PaxTypeRecord = {
  fpid: string;
  fpname: string | null;
};

export const getTicketSalesPaxTypes = () =>
  request<PaxTypeRecord[]>("/ticket-sales/pax-types");

export type DiRecord = {
  fpid: string;
  fpname: string | null;
};

export const getTicketSalesDi = () => request<DiRecord[]>("/ticket-sales/di");

export type MerchantRecord = {
  fpid: string;
  fpname: string | null;
};

export const getTicketSalesMerchants = () =>
  request<MerchantRecord[]>("/ticket-sales/merchants");

export type TicketSalesVat = {
  txtSCVATPer: number;
  txtCommVATPer: number;
  chkVATOnCommission: boolean;
};

export const getTicketSalesVat = (
  PstrCoID: string,
  params: { lkpDI: string; dtpDate: string; lkpAirlineNo: string },
) =>
  request<TicketSalesVat>(
    `/ticket-sales/vat/${encode(PstrCoID)}?${new URLSearchParams(params).toString()}`,
  );

export type FopRecord = {
  ffop: string;
  ffopname: string | null;
};

export const getTicketSalesFop = (PstrCoID: string) =>
  request<FopRecord[]>(`/ticket-sales/fop/${encode(PstrCoID)}`);

export type GdsRecord = {
  fgdsid: string;
  fgdsname: string | null;
};

export const getTicketSalesGds = (PstrCoID: string) =>
  request<GdsRecord[]>(`/ticket-sales/gds/${encode(PstrCoID)}`);

export type ServiceTypeRecord = {
  fservicetypeid: string;
  fservicetypename: string | null;
};

export const getTicketSalesServiceTypes = (PstrCoID: string) =>
  request<ServiceTypeRecord[]>(`/ticket-sales/service-types/${encode(PstrCoID)}`);

export type CustomerRecord = {
  fcsaccountid: string;
  fcsaccountname: string | null;
  fisservicechargepolicy?: boolean; // the customer has a service charge policy
};

export type ServiceChargePolicyRecord = {
  fcustomerid: string;
  fservicetypeid: string;
  fmf: string | null;
  fd_servicechargetype: string | null;
  fd_servicechgper: string | null;
  fd_minservicechgamt: string | null;
  fd_servicechgamt: string | null;
  fi_servicechargetype: string | null;
  fi_servicechgper: string | null;
  fi_minservicechgamt: string | null;
  fi_servicechgamt: string | null;
};

export const getTicketSalesServiceChargePolicies = (PstrCoID: string) =>
  request<ServiceChargePolicyRecord[]>(
    `/ticket-sales/service-charge-policies/${encode(PstrCoID)}`,
  );

export type CustomerDivisionRecord = {
  fdivid: string;
  fdivname: string | null;
};

export const getTicketSalesCustomers = (PstrCoID: string) =>
  request<CustomerRecord[]>(`/ticket-sales/customers/${encode(PstrCoID)}`);

export const getTicketSalesCustomerDivisions = (
  PstrCoID: string,
  CustomerID: string,
) =>
  request<CustomerDivisionRecord[]>(
    `/ticket-sales/customer-divisions/${encode(PstrCoID)}/${encode(CustomerID)}`,
  );

export type SupplierRecord = {
  fcsaccountid: string;
  fcsaccountname: string | null;
};

export const getTicketSalesSuppliers = (PstrCoID: string) =>
  request<SupplierRecord[]>(`/ticket-sales/suppliers/${encode(PstrCoID)}`);

export type StaffRecord = {
  fstaffid: string;
  fstaffname: string | null;
};

export const getTicketSalesStaffs = (PstrCoID: string) =>
  request<StaffRecord[]>(`/ticket-sales/staffs/${encode(PstrCoID)}`);

export type IataRecord = {
  fiatacode: string;
  fiataname: string | null;
};

export const getTicketSalesIatas = (PstrCoID: string) =>
  request<IataRecord[]>(`/ticket-sales/iatas/${encode(PstrCoID)}`);

export type BranchRecord = {
  fbrid: string;
  fbrname: string | null;
};

export const getTicketSalesBranches = (PstrCoID: string) =>
  request<BranchRecord[]>(`/ticket-sales/branches/${encode(PstrCoID)}`);

export const getTicketSalesTktTypes = (PstrCoID: string) =>
  request<TktTypeRecord[]>(`/ticket-sales/tkt-types/${encode(PstrCoID)}`);

export const getTicketSalesAirlines = (PstrCoID: string) =>
  request<AirlineRecord[]>(`/ticket-sales/airlines/${encode(PstrCoID)}`);

export const getAirline = (fcoid: string, fairlineno: string) =>
  request<AirlineRecord>(`/airlines/${encode(fcoid)}/${encode(fairlineno)}`);

export const createAirline = (fcoid: string, payload: AirlinePayload) =>
  request<AirlineRecord>("/airlines", {
    method: "POST",
    body: JSON.stringify({ fcoid, ...payload }),
  });

export const updateAirline = (
  fcoid: string,
  oldFairlineno: string,
  payload: AirlinePayload,
) =>
  request<AirlineRecord>(`/airlines/${encode(fcoid)}/${encode(oldFairlineno)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteAirline = (fcoid: string, fairlineno: string) =>
  request<{ message: string }>(
    `/airlines/${encode(fcoid)}/${encode(fairlineno)}`,
    { method: "DELETE" },
  );
