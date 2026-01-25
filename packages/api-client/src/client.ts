/**
 * Base API client with fetch wrapper
 */

import type { ApiResponse, ApiError } from '@repo/shared-types';

/** API client configuration */
export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
  onUnauthorized?: () => void;
  timeout?: number;
}

/** Request options */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

/** HTTP methods */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Global client configuration */
let globalConfig: ApiClientConfig = {
  baseUrl: '',
};

/**
 * Initialize the API client with configuration
 */
export function initApiClient(config: ApiClientConfig): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get the current API client configuration
 */
export function getApiConfig(): ApiClientConfig {
  return globalConfig;
}

/**
 * Create a fetch request with standard configuration
 */
async function request<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { baseUrl, getToken, onUnauthorized, timeout = 30000 } = globalConfig;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: options.signal ?? controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle unauthorized
    if (response.status === 401) {
      onUnauthorized?.();
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
    }

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error ?? {
          code: 'API_ERROR',
          message: data.message ?? 'An error occurred',
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out',
        },
      };
    }

    // Handle network errors
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
}

/** GET request */
export function get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>('GET', endpoint, undefined, options);
}

/** POST request */
export function post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>('POST', endpoint, body, options);
}

/** PUT request */
export function put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>('PUT', endpoint, body, options);
}

/** PATCH request */
export function patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>('PATCH', endpoint, body, options);
}

/** DELETE request */
export function del<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  return request<T>('DELETE', endpoint, undefined, options);
}
