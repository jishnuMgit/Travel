export type AirlineRecord = {
  fcoid: string;
  fairlineno: string;
  fairlinename: string;
  fairlinecode: string | null;
  fcuserid?: string | null;
  fcuserdate?: string | null;
  fmuserid?: string | null;
  fmuserdate?: string | null;
  fvatoncommission: boolean | null;
};


export type AirlinePayload = {
  StrAirlineNo: string;
  StrAirlineName: string;
  StrAirlineCode: string | null;
  ChkVatOnCommission: boolean;
  PstrUserID?: string | null;
  userdate?: string | null;
 
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

export const getAirlines = (PstrCoID : string) =>
  request<AirlineRecord[]>(`/airlines/${encode(PstrCoID )}`);

export const getAirline = (PstrCoID : string, StrAirlineNo: string) =>
  request<AirlineRecord>(`/airlines/${encode(PstrCoID )}/${encode(StrAirlineNo)}`);

export const createAirline = (PstrCoID : string, payload: AirlinePayload) =>
  request<AirlineRecord>("/airlines", {
    method: "POST",
    body: JSON.stringify({ PstrCoID , ...payload }),
  });

export const updateAirline = (
  PstrCoID : string,
  oldStrAirlineNo: string,
  payload: AirlinePayload,
) =>
  request<AirlineRecord>(`/airlines/${encode(PstrCoID )}/${encode(oldStrAirlineNo)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteAirline = (PstrCoID : string, StrAirlineNo: string,PstrYear: string,PstrUserID:String) =>
  request<{ message: string }>(
    `/airlines/${encode(PstrCoID )}/${encode(StrAirlineNo)}/${encode(PstrYear)}`,
    { method: "DELETE", 
      body: JSON.stringify({ PstrUserID }),
    },
  );
