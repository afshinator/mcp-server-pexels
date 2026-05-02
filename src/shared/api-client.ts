import type {
  PexelsPhoto,
  PexelsVideo,
  PexelsSearchResponse,
  PhotoSearchParams,
  VideoSearchParams,
} from './types.js';

const API_BASE = 'https://api.pexels.com';
const API_KEY = process.env.PEXELS_API_KEY;

if (!API_KEY) {
  console.error('WARNING: PEXELS_API_KEY environment variable is not set');
}

async function fetchPexels<T>(endpoint: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  if (!API_KEY) {
    throw new Error('PEXELS_API_KEY environment variable is required. Set it in your environment or .env file.');
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: API_KEY || '',
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchPhotoSearch(
  params: PhotoSearchParams,
): Promise<PexelsSearchResponse<PexelsPhoto>> {
  return fetchPexels<PexelsSearchResponse<PexelsPhoto>>('/v1/search', params as unknown as Record<string, string | number | boolean | undefined>);
}

export async function fetchVideoSearch(
  params: VideoSearchParams,
): Promise<PexelsSearchResponse<PexelsVideo>> {
  return fetchPexels<PexelsSearchResponse<PexelsVideo>>('/videos/search', params as unknown as Record<string, string | number | boolean | undefined>);
}

export async function fetchPhotoDetails(id: number): Promise<PexelsPhoto> {
  return fetchPexels<PexelsPhoto>(`/v1/photos/${id}`, {});
}

export async function fetchVideoDetails(id: number): Promise<PexelsVideo> {
  return fetchPexels<PexelsVideo>(`/videos/videos/${id}`, {});
}