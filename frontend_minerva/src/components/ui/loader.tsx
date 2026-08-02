export function Loader({ progress = 0 }: { progress?: number }) {
  const angle = progress * 3.6

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">

      <div className="absolute inset-0 rounded-full bg-primary/20 blur-md" />


      <div
        className="absolute h-full w-full rounded-full transition-all duration-200"
        style={{
          background: `conic-gradient(
            #1456f0 0deg,
            #3daeff ${angle}deg,
            #e5e7eb ${angle}deg
          )`,
        }}
      />


      <div className="relative h-[calc(100%-10px)] w-[calc(100%-10px)] rounded-full bg-background flex items-center justify-center shadow-sm">
        <span className="text-sm font-bold text-primary tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}
