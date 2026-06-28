const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function publicAsset(assetPath: string): string {
  return `${publicBasePath}${assetPath}`;
}
