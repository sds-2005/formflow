export class APIError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(data?.detail || "An API error occurred");
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

export async function fetchProxy<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/api/proxy/${path}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  
  // We add X-Requested-With to prevent simple CSRF since SameSite=Lax might not cover all edge cases
  headers.set("X-Requested-With", "XMLHttpRequest");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: await response.text() };
    }
    throw new APIError(response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  auth: {
    createDemoWorkspace: () => 
      fetchProxy<{ session_id: string; creator_id: string; display_name: string }>("auth/demo", {
        method: "POST",
      }),
    me: () => 
      fetchProxy<{ creator_id: string; display_name: string }>("auth/me"),
  },
};
