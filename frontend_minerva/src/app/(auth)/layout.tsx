export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center">

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#3daeff]/8 blur-[120px] animate-[float_10s_ease-in-out_infinite_2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>


      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 grid-bg opacity-60" />


      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
