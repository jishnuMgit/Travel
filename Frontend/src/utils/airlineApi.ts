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
  fairlineno: string;
  fairlinename: string;
  fairlinecode: string | null;
  fvatoncommission: boolean;
  fcuserid?: string | null;
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
