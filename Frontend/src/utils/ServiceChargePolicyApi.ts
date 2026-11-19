export type ServiceChargePolicyApiRow = {
  fservicetypeid: string;
  fservicetypename?: string | null;
  fslno?: number | string | null;
  fpositionno?: number | string | null;
  fmf?: number | string | null;
  fmerchantfeeper?: number | string | null;
  fd_servicechargetype?: string | null;
  fd_servicechargeper?: number | string | null;
  fd_servicechgper?: number | string | null;
  fd_servicecchargeper?: number | string | null;
  fd_minservicechargeamt?: number | string | null;
  fd_minservicechgamt?: number | string | null;
  fd_servicechargeamt?: number | string | null;
  fd_servicechgamt?: number | string | null;
  fi_servicechargetype?: string | null;
  fi_servicechargeper?: number | string | null;
  fi_servicechgper?: number | string | null;
  fi_minservicechargeamt?: number | string | null;
  fi_minservicechgamt?: number | string | null;
  fi_servicechargeamt?: number | string | null;
  fi_servicechgamt?: number | string | null;
};

export type ServiceChargePolicyRequest = {
  StrMode: string;
  PstrCoID: string;
  StrCustomerID?: string | null;
  StrSR?: "S" | "R" | null;
  NumMerchantFeePer?: number;
  StrUserID?: string | null;
  StrMenuName?: string | null;
  Rows?: ServiceChargePolicySaveRow[];
};

export type CopyServiceChargePolicyRequest = {
  PstrCoID: string;
  StrCustomerID: string;
  StrSourceCustomerID: string;
  StrMenuName?: string | null;
  OverwriteExisting?: boolean;
};

export type CopyServiceChargePolicyResponse = {
  success: boolean;
  message: string;
  requiresOverwriteConfirmation?: boolean;
};

export type ServiceChargePolicySaveRow = {
  intSlNo: number;
  Original_fSlNo: number;
  StrServiceTypeID: string;
  lkpDServiceChargeType: "A" | "P";
  StrDServiceChargePre: string;
  StrDMinServiceChargeAmt: string;
  StrDServiceChargeAmt: string;
  lkpIServiceChargeType: "A" | "P";
  StrIServiceChargePer: string;
  StrIMinServiceChargeAmt: string;
  StrIServiceChargeAmt: string;
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

export const copyServiceChargePolicy = (
  payload: CopyServiceChargePolicyRequest,
) =>
  request<CopyServiceChargePolicyResponse>(
    "/ServiceChargePolicy/copyServiceChargePolicy",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );