// Icon set for the blend handshake. 16 distinct stroke-only SVGs — 4×4 grid.
// Both users pick 3 icons in the same order; the resulting sequence
// becomes the pairing "token".

import { ReactNode } from "react";

export interface BlendIcon {
  id: string;
  label: string;
  svg: ReactNode;
}

const ICON_PROPS = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const BLEND_ICONS: BlendIcon[] = [
  {
    id: "star",
    label: "Star",
    svg: (
      <svg {...ICON_PROPS}>
        <polygon points="12 2 15 9 22 10 17 15 18 22 12 18 6 22 7 15 2 10 9 9" />
      </svg>
    ),
  },
  {
    id: "heart",
    label: "Heart",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
      </svg>
    ),
  },
  {
    id: "bolt",
    label: "Bolt",
    svg: (
      <svg {...ICON_PROPS}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: "moon",
    label: "Moon",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
  {
    id: "sun",
    label: "Sun",
    svg: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    id: "flame",
    label: "Flame",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c2 0 2.5-2 2.5-3.5 0-2.5-2-2.5-2-5 0-.5.5-2 2-2 0 1 1 2 2 3 2 2 2 5 0 7-1 1-3 2-4 2-3 0-5-2-5-5s2-4 2-5 2-2 2-2c0 1-1 4-1 5 0 1 2 2 2 4s-2 3-2 3z" />
      </svg>
    ),
  },
  {
    id: "drop",
    label: "Drop",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z" />
      </svg>
    ),
  },
  {
    id: "key",
    label: "Key",
    svg: (
      <svg {...ICON_PROPS}>
        <circle cx="7.5" cy="15.5" r="3.5" />
        <path d="M10 13 21 2M15 8l2 2M19 4l2 2" />
      </svg>
    ),
  },
  {
    id: "anchor",
    label: "Anchor",
    svg: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="5" r="3" />
        <path d="M12 8v13M5 12h14M5 18a7 7 0 0 0 7 3 7 7 0 0 0 7-3" />
      </svg>
    ),
  },
  {
    id: "crown",
    label: "Crown",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M3 7l4 5 5-7 5 7 4-5-2 13H5z" />
      </svg>
    ),
  },
  {
    id: "eye",
    label: "Eye",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: "leaf",
    label: "Leaf",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M20 4s-3 13-10 16c-4 2-8-2-6-6C7 7 20 4 20 4z" />
        <path d="M4 20c8-8 12-12 16-16" />
      </svg>
    ),
  },
  {
    id: "bell",
    label: "Bell",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
  {
    id: "cube",
    label: "Cube",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M12 2 3 7v10l9 5 9-5V7z" />
        <path d="M3 7l9 5 9-5M12 22V12" />
      </svg>
    ),
  },
  {
    id: "diamond",
    label: "Diamond",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M6 3h12l4 6-10 12L2 9z" />
        <path d="M6 3l4 6h4l4-6M2 9h20" />
      </svg>
    ),
  },
  {
    id: "skull",
    label: "Skull",
    svg: (
      <svg {...ICON_PROPS}>
        <path d="M4 11a8 8 0 0 1 16 0c0 3-2 5-2 5v3h-3v-2h-2v2h-2v-2H9v2H6v-3s-2-2-2-5z" />
        <circle cx="9" cy="11" r="1.3" />
        <circle cx="15" cy="11" r="1.3" />
      </svg>
    ),
  },
];

// Given an array of icon IDs, produce a stable pairing token.
// Normalized lowercase, hyphen-separated — human-readable for debugging.
export function sequenceToToken(sequence: string[]): string {
  return sequence
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .join("-");
}

export function iconById(id: string): BlendIcon | undefined {
  return BLEND_ICONS.find((i) => i.id === id);
}

export const SEQUENCE_LENGTH = 3;
