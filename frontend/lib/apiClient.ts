const BASE_URL = "http://localhost:8000"

interface RequestOptions {
  requiresAuth?: boolean
  token?: string
}

// Helper to format error messages
const formatError = (errorData: any): string => {
  // Handle 422 validation errors
  if (Array.isArray(errorData.detail)) {
    return errorData.detail
      .map((err: any) => {
        const field = err.loc?.join('.') || 'field'
        return `${field}: ${err.msg}`
      })
      .join('\n')
  }
  
  // Handle string error
  if (typeof errorData.detail === 'string') {
    return errorData.detail
  }
  
  // Handle message
  if (errorData.message) {
    return errorData.message
  }
  
  // Fallback
  return 'Something went wrong'
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

    const data = await res.json()

    if (!res.ok) {
      const errorMessage = formatError(data)
      console.error("API Error:", {
        status: res.status,
        endpoint,
        body,
        response: data,
        message: errorMessage
      })
      throw new Error(errorMessage)
    }
    return data
  },

  get: async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const headers: Record<string, string> = {}
    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, { headers })
    const data = await res.json()

    if (!res.ok) {
      const errorMessage = formatError(data)
      console.error("API Error:", {
        status: res.status,
        endpoint,
        response: data,
        message: errorMessage
      })
      throw new Error(errorMessage)
    }
    return data
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

    const data = await res.json()

    if (!res.ok) {
      const errorMessage = formatError(data)
      console.error("API Error:", {
        status: res.status,
        endpoint,
        body,
        response: data,
        message: errorMessage
      })
      throw new Error(errorMessage)
    }
    return data
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

    const data = await res.json()

    if (!res.ok) {
      const errorMessage = formatError(data)
      console.error("API Error:", {
        status: res.status,
        endpoint,
        response: data,
        message: errorMessage
      })
      throw new Error(errorMessage)
    }
    return data
  },
}