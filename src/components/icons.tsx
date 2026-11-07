/**
 * Ark 线性图标集 — 1.5–2px 描边、方角几何、纯几何抽象
 */
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = (props: P) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'square' as const,
  'aria-hidden': true,
  ...props,
})

export const IconList = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 12h10M4 18h16" />
  </svg>
)

export const IconLocate = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="5.5" />
    <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
    <path d="M12 10.5v3l1.5-1.5" strokeWidth={1.4} />
  </svg>
)

export const IconPick = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v18M3 12h18" />
    <rect x="9.5" y="9.5" width="5" height="5" />
  </svg>
)

export const IconEdit = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20h16" />
    <path d="M6 16.5 15.5 7l1.5-1.5a2.1 2.1 0 0 1 3 3L8.5 20H6v-3.5Z" />
  </svg>
)

export const IconLink = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6M20 4l-8.5 8.5" />
    <path d="M18 13v6H5V6h6" />
  </svg>
)

export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMinus = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
)

export const IconReset = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 10 12 4l8 6M6.5 9v10h11V9" />
  </svg>
)

export const IconClose = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconBack = (p: P) => (
  <svg {...base(p)}>
    <path d="M11 5l-7 7 7 7M4 12h16" />
  </svg>
)

export const IconWalk = (p: P) => (
  <svg {...base(p)}>
    <circle cx="13" cy="4.5" r="1.8" />
    <path d="M13 7l-2.5 5 2 2.5V20M10.5 12 8 14l-1.5 4M13 9.5l3 2 2.5-.5" />
  </svg>
)

export const IconDrive = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 13 6.5 8h11L19 13M5 13h14v5h-2M5 13v5h2m0 0h10m-10 0a1.5 1.5 0 1 0 .01 0M17 18a1.5 1.5 0 1 0 .01 0" />
  </svg>
)

export const IconTransit = (p: P) => (
  <svg {...base(p)}>
    <rect x="6" y="4" width="12" height="13" />
    <path d="M6 10h12M9 4v6M15 4v6M9 21l1-4h4l1 4M8.5 17h7" />
  </svg>
)

export const IconCopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" />
    <path d="M15 9V4H4v11h5" />
  </svg>
)

export const IconTarget = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="5" width="14" height="14" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
)
