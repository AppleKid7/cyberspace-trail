export interface RegionDef {
  id: string;
  name: string;
  length: number;
  storeName: string;
  landmarkName: string;
  signatureAilment: string;
}

export const REGIONS: RegionDef[] = [
  {
    id: 'reddit',
    name: 'Reddit',
    length: 450,
    storeName: 'Wiki Outpost',
    landmarkName: 'AMA Rock',
    signatureAilment: 'got_ratioed',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    length: 400,
    storeName: 'Trend Shop',
    landmarkName: 'Duet Springs',
    signatureAilment: 'brain_rot',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    length: 450,
    storeName: 'Networking Mixer',
    landmarkName: 'Thought Leader Peak',
    signatureAilment: 'cringe',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    length: 400,
    storeName: 'Merch Table',
    landmarkName: 'Like & Subscribe Falls',
    signatureAilment: 'burnout',
  },
  {
    id: 'x',
    name: 'X',
    length: 300,
    storeName: '',
    landmarkName: 'Last Post Bluff',
    signatureAilment: '',
  },
];

export const CROSSINGS = [
  { id: 'repost_river', name: 'Repost River', afterRegion: 0 },
  { id: 'rebrand_river', name: 'Rebrand River', afterRegion: 1 },
  { id: 'algorithm_river', name: 'Algorithm River', afterRegion: 2 },
];

export function regionAtDistance(distance: number): number {
  let acc = 0;
  for (let i = 0; i < REGIONS.length; i++) {
    const region = REGIONS[i];
    if (!region) {
      continue;
    }
    if (distance < acc + region.length) {
      return i;
    }
    acc += region.length;
  }
  return REGIONS.length - 1;
}

export function distanceToRegionStart(distance: number): number {
  let start = 0;
  for (const region of REGIONS) {
    if (distance < start + region.length) {
      return start;
    }
    start += region.length;
  }
  return start;
}

export function landmarkDistance(regionIndex: number): number {
  let d = 0;
  for (let i = 0; i <= regionIndex; i++) {
    const region = REGIONS[i];
    if (!region) {
      continue;
    }
    if (i === regionIndex) {
      return d + Math.floor(region.length * 0.6);
    }
    d += region.length;
  }
  return d;
}

export function storeDistance(regionIndex: number): number {
  let d = 0;
  for (let i = 0; i < regionIndex; i++) {
    const region = REGIONS[i];
    if (region) {
      d += region.length;
    }
  }
  return d + 20;
}

export function crossingDistance(afterRegion: number): number {
  let d = 0;
  for (let i = 0; i <= afterRegion; i++) {
    const region = REGIONS[i];
    if (region) {
      d += region.length;
    }
  }
  return d;
}
