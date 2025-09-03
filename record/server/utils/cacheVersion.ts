const versions: Record<string, number> = { pages: Date.now() };

export function getVersion(key: string): number {
  return versions[key] ?? 0;
}

export function bumpVersion(key: string): void {
  versions[key] = Date.now();
}
