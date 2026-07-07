const BASE_URL = "http://localhost:8000"

interface RequestOptions {
  requiresAuth?: boolean
  token?: string
}

export const apiClient = {
  post: async <T>(endpoint: string, body: object, options: RequestOptions = {}): Promise<T> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Something went wrong")
    }
    return res.json()
  },

  get: async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const headers: Record<string, string> = {}
    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, { headers })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Something went wrong")
    }
    return res.json()
  },

  patch: async <T>(endpoint: string, body: object, options: RequestOptions = {}): Promise<T> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Something went wrong")
    }
    return res.json()
  },

  delete: async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const headers: Record<string, string> = {}
    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Something went wrong")
    }
    return res.json()
  },
}