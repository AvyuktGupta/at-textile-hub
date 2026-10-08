import type { ApiErrorBody } from "@/types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(
  /\/$/,
  ""
);

const API_ORIGIN = new URL(API_URL).origin;

/** Uploaded files are stored as "/uploads/..." paths on the API host; external URLs pass through. */
export function resolveMediaUrl(url?: string | null) {
  if (!url) return "";
  return url.startsWith("/") ? `${API_ORIGIN}${url}` : url;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface Paginated<T> extends ApiResponse<T[]> {
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, headers, ...init } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !isFormData && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Please check your connection.");
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = data as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      error?.message || `Request failed with status ${response.status}`,
      error?.details
    );
  }

  return data as T;
}
