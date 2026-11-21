export type ServiceChargePolicyApiRow = {
  fservicetypeid: string;
  fservicetypename?: string | null;
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
  StrCopyToCustomerID: string;
  StrMenuName?: string | null;
  OverwriteExisting?: boolean;
};

export type CopyServiceChargePolicyResponse = {
  success: boolean;
  message: string;
  requiresOverwriteConfirmation?: boolean;
};

export type ServiceChargePolicyAttachment = {
  fSlNo: number;
  fNote: string | null;
  fDoxName: string | null;
  fDoxType: string | null;
  mimeType: string;
  fDox: string | null;
};

export type ServiceChargePolicyAttachmentSave = {
  fSlNo: number;
  fNote: string | null;
  fDoxName: string | null;
  fDoxType: string | null;
  fDox: string | null;
  originalSlNo?: number;
  rowState: "added" | "modified" | "deleted" | "unchanged";
};

export type ServiceChargePolicySaveRow = {
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
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api").replace(/\/$/, "");

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

export const getServiceChargePolicyAttachments = (
  PstrCoID: string,
  StrCustomerID: string,
  StrSR: "S" | "R",
) => {
  const query = new URLSearchParams({ PstrCoID, StrCustomerID, StrSR });
  return request<ServiceChargePolicyAttachment[]>(
    `/ServiceChargePolicy/attachments?${query.toString()}`,
  );
};

export const getServiceChargePolicyAttachmentFile = async (
  PstrCoID: string,
  StrCustomerID: string,
  StrSR: "S" | "R",
  slNo: number,
): Promise<Blob> => {
  const query = new URLSearchParams({ PstrCoID, StrCustomerID, StrSR });
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(
      `${API_BASE_URL}/ServiceChargePolicy/attachments/file/${slNo}?${query.toString()}`,
      {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || `Request failed (${response.status})`);
    }
    return await response.blob();
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Timed out while loading the attachment file.", {
        cause: error,
      });
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const saveServiceChargePolicyAttachments = (payload: {
  PstrCoID: string;
  StrCustomerID: string;
  StrSR: "S" | "R";
  Rows: ServiceChargePolicyAttachmentSave[];
}) =>
  request<{ success: boolean; message: string }>(
    "/ServiceChargePolicy/attachments",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );