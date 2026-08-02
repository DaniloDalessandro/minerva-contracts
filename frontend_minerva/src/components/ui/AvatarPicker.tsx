"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AvatarOption {
  id: string
  color: string
  src: string
  label: string
}

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/lorelei/svg"

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "av_1",  color: "oklch(0.52 0.265 285)", src: `${DICEBEAR_BASE}?seed=Aurora`,   label: "Aurora"   },
  { id: "av_2",  color: "oklch(0.54 0.22 250)",  src: `${DICEBEAR_BASE}?seed=Bruno`,    label: "Bruno"    },
  { id: "av_3",  color: "oklch(0.55 0.18 145)",  src: `${DICEBEAR_BASE}?seed=Camila`,   label: "Camila"   },
  { id: "av_4",  color: "oklch(0.68 0.18 80)",   src: `${DICEBEAR_BASE}?seed=Diego`,    label: "Diego"    },
  { id: "av_5",  color: "oklch(0.53 0.22 15)",   src: `${DICEBEAR_BASE}?seed=Elena`,    label: "Elena"    },
  { id: "av_6",  color: "oklch(0.58 0.17 210)",  src: `${DICEBEAR_BASE}?seed=Felipe`,   label: "Felipe"   },
  { id: "av_7",  color: "oklch(0.44 0.24 270)",  src: `${DICEBEAR_BASE}?seed=Giovanna`, label: "Giovanna" },
  { id: "av_8",  color: "oklch(0.63 0.20 45)",   src: `${DICEBEAR_BASE}?seed=Hugo`,     label: "Hugo"     },
  { id: "av_9",  color: "oklch(0.54 0.15 185)",  src: `${DICEBEAR_BASE}?seed=Isabela`,  label: "Isabela"  },
  { id: "av_10", color: "oklch(0.58 0.23 340)",  src: `${DICEBEAR_BASE}?seed=Jonas`,    label: "Jonas"    },
  { id: "av_11", color: "oklch(0.63 0.14 225)",  src: `${DICEBEAR_BASE}?seed=Karen`,    label: "Karen"    },
  { id: "av_12", color: "oklch(0.47 0.25 300)",  src: `${DICEBEAR_BASE}?seed=Lucas`,    label: "Lucas"    },
  { id: "av_13", color: "oklch(0.54 0.17 165)",  src: `${DICEBEAR_BASE}?seed=Marina`,   label: "Marina"   },
  { id: "av_14", color: "oklch(0.66 0.16 125)",  src: `${DICEBEAR_BASE}?seed=Nicolas`,  label: "Nicolas"  },
  { id: "av_15", color: "oklch(0.55 0.20 55)",   src: `${DICEBEAR_BASE}?seed=Olivia`,   label: "Olivia"   },
  { id: "av_16", color: "oklch(0.56 0.22 330)",  src: `${DICEBEAR_BASE}?seed=Pedro`,    label: "Pedro"    },
]

export function getAvatarOption(id: string): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.id === id) ?? AVATAR_OPTIONS[0]
}

interface AvatarDisplayProps {
  avatarId: string
  size?: number
  className?: string
}

export function AvatarDisplay({ avatarId, size = 36, className }: AvatarDisplayProps) {
  const av = getAvatarOption(avatarId || "av_1")
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden", className)}
      style={{ width: size, height: size, background: av.color }}
      aria-label={av.label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={av.src}
        alt={av.label}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        draggable={false}
      />
    </span>
  )
}

interface AvatarPickerProps {
  value: string
  onChange: (id: string) => void
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="flex items-center gap-4">
      <AvatarDisplay avatarId={value} size={52} className="shrink-0 shadow-sm" />

      <div className="grid grid-cols-8 gap-2 flex-1">
        {AVATAR_OPTIONS.map((av) => {
          const selected = value === av.id
          return (
            <button
              key={av.id}
              type="button"
              title={av.label}
              onClick={() => onChange(av.id)}
              className={cn(
                "relative flex items-center justify-center rounded-full overflow-hidden transition-all duration-150",
                "w-9 h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                  : "hover:scale-105 hover:ring-2 hover:ring-primary/40 hover:ring-offset-1 hover:ring-offset-background opacity-80 hover:opacity-100"
              )}
              style={{ background: av.color }}
              aria-pressed={selected}
              aria-label={av.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={av.src}
                alt={av.label}
                width={36}
                height={36}
                className="w-full h-full"
                draggable={false}
              />
              {selected && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary border-[1.5px] border-background">
                  <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
