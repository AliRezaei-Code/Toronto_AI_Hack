/**
 * Job management API endpoints
 */

import { get, post, del } from './client';
import type {
  ApiResponse,
  Job,
  PaginationParams,
  PaginatedResponse,
} from '@repo/shared-types';

/** Get all jobs with optional pagination */
export async function getJobs(
  params?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<Job>>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.sortBy) searchParams.set('sort_by', params.sortBy);
  if (params?.sortOrder) searchParams.set('sort_order', params.sortOrder);

  const query = searchParams.toString();
  return get<PaginatedResponse<Job>>(`/api/jobs${query ? `?${query}` : ''}`);
}

/** Get a specific job */
export async function getJob(jobId: string): Promise<ApiResponse<Job>> {
  return get<Job>(`/api/jobs/${jobId}`);
}

/** Cancel a job */
export async function cancelJob(jobId: string): Promise<ApiResponse<Job>> {
  return post<Job>(`/api/jobs/${jobId}/cancel`);
}

/** Delete a job */
export async function deleteJob(jobId: string): Promise<ApiResponse<void>> {
  return del<void>(`/api/jobs/${jobId}`);
}

/** Retry a failed job */
export async function retryJob(jobId: string): Promise<ApiResponse<Job>> {
  return post<Job>(`/api/jobs/${jobId}/retry`);
}

/** Get jobs by status */
export async function getJobsByStatus(
  status: 'queued' | 'processing' | 'completed' | 'failed'
): Promise<ApiResponse<Job[]>> {
  return get<Job[]>(`/api/jobs?status=${status}`);
}
