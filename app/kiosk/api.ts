const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

declare global {
  interface Window {
    __MOREU_API_BASE_URL__?: string;
  }
}

export type ArtRagLibrary = {
  id: string;
  name: string;
  description?: string | null;
};

export type ArtRagGenerateResponse = {
  ok: true;
  taskId: string;
  styleSource?: string;
  discoveredStyle?: {
    style?: string | null;
    period?: string | null;
    artist?: string | null;
  } | null;
  pack?: {
    referenceUrls?: string[];
    promptGuidance?: string;
    warnings?: string[];
  };
};

export type ArtRagModelId = "LegnextMidjourneyV7Image" | string;

export type ArtRagStatusResponse = {
  ok: true;
  taskId: string;
  status: string;
  expectedCount?: number;
  images?: Array<{
    url?: string;
    originalUrl?: string;
    externalUrl?: string;
    id?: string;
  } | string>;
  publishedImages?: Array<{
    url?: string;
    originalUrl?: string;
    externalUrl?: string;
    id?: string;
  } | string>;
  resultUrls?: string[];
  urls?: string[];
};

export function buildApiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

export async function listArtRagLibraries() {
  const res = await fetch(`${getApiBaseUrl()}/art-rag/libraries`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Art library list failed");
  return data as {
    ok: true;
    docs: ArtRagLibrary[];
    totalDocs?: number;
  };
}

export async function generateArtRagImage(input: {
  libraryId: string;
  query: string;
  prompt?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  resolution?: "1K" | "2K";
  outputFormat?: "jpg" | "png";
  mode?: "auto" | "random_style" | "specified_style";
  modelId?: ArtRagModelId;
}) {
  const res = await fetch(`${getApiBaseUrl()}/art-rag/test-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Art generation failed");
  return data as ArtRagGenerateResponse;
}

export async function getArtRagTaskStatus(taskId: string) {
  const res = await fetch(`${getApiBaseUrl()}/art-rag/test-generate/${taskId}/status`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Art task status failed");
  return data as ArtRagStatusResponse;
}

export function resolveApiMediaUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${getApiBaseUrl()}${url}`;
  }
  return url;
}

function getApiBaseUrl() {
  const apiBaseUrl =
    API_BASE_URL ||
    (typeof window !== "undefined" ? window.__MOREU_API_BASE_URL__ : undefined);

  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  return apiBaseUrl.replace(/\/$/, "");
}
