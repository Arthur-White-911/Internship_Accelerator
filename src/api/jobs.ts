import { api } from './client';

export interface Job {
  _id: string;
  title: string;
  company: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_text: string;
  district: string;
  address: string;
  experience: string;
  education: string;
  category: string;
  job_type: string;
  publish_date: string;
  source_url: string;
  source_platform: string;
  description: string;
  tags: string[];
  company_size: string;
  company_type: string;
  created_at: string;
}

export interface JobsListResponse {
  items: Job[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  filter_stats: {
    total: number;
    avg_salary: number;
    median_salary: number;
  };
}

export interface JobsStats {
  today_count: number;
  total_count: number;
  company_count: number;
  avg_salary: number;
  top_categories: { name: string; count: number }[];
  district_stats: { name: string; count: number }[];
  salary_distribution: { label: string; count: number }[];
  top_salary_jobs: { _id: string; title: string; company: string; salary_text: string; district: string }[];
  last_updated: string | null;
}

export interface JobsFilters {
  districts: string[];
  categories: string[];
  educations: string[];
  experiences: string[];
  job_types: string[];
  source_platforms: string[];
  sort_options: { value: string; label: string }[];
}

export interface JobsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  district?: string | string[];
  category?: string | string[];
  education?: string | string[];
  experience?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  source_platform?: string;
  date?: string;
  keyword?: string;
}

function buildQueryString(params: JobsQueryParams): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val)) {
      val.forEach(v => parts.push(`${key}=${encodeURIComponent(v)}`));
    } else {
      parts.push(`${key}=${encodeURIComponent(String(val))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const jobsApi = {
  list: (params: JobsQueryParams = {}): Promise<{ success: boolean; data: JobsListResponse }> =>
    api.get(`/jobs${buildQueryString(params)}`),

  detail: (id: string): Promise<{ success: boolean; data: Job }> =>
    api.get(`/jobs/${id}`),

  stats: (): Promise<{ success: boolean; data: JobsStats }> =>
    api.get('/jobs/stats'),

  filters: (): Promise<{ success: boolean; data: JobsFilters }> =>
    api.get('/jobs/filters'),
};
