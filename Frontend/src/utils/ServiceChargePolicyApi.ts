export type ServiceChargePolicyApiRow = {
  fserviceid: string;
  fservicename?: string | null;
  fslno?: number | string | null;
  fpositionno?: number | string | null;
  fmerchantfeeper?: number | string | null;
  fd_servicechargetype?: string | null;
  fd_servicechgper?: number | string | null;
  fd_minservicechgamt?: number | string | null;
  fd_servicechgamt?: number | string | null;
  fi_servicechargetype?: string | null;
  fi_servicechgper?: number | string | null;
  fi_minservicechgamt?: number | string | null;
  fi_servicechgamt?: number | string | null;
};

export type ServiceChargePolicyRequest = {
  StrMode: string;
  PstrCoID: string;
  StrCustomerID?: string | null;
  StrSOrR?: "S" | "R" | null;
  NumMerchantFeePer?: number;
  StrUserID?: string | null;
  StrMenuName?: string | null;
  Rows?: ServiceChargePolicySaveRow[];
};

export type ServiceChargePolicySaveRow = {
  intSlNo: number;
  Original_fSlNo: number;
  StrServiceTypeID: string;
  lkpDSCType: "A" | "P";
  StrDSCPre: string;
  StrMinDSCAmt: string;
  StrDSCAmt: string;
  lkpISCType: "A" | "P";
  StrISCPer: string;
  StrIMinSCAmt: string;
  StrISCAmt: string;
};

export type ServiceChargePolicyResponse<T = ServiceChargePolicyApiRow[]> = {
  success: boolean;
  message: string;
  data: T;
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
export const runServiceChargePolicy = <T = ServiceChargePolicyApiRow[]>(
  payload: ServiceChargePolicyRequest,
) =>
  request<ServiceChargePolicyResponse<T>>("/ServiceChargePolicy", {
    method: "POST",
    body: JSON.stringify(payload),
  });