export default function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-[#4169E1]/35 blur-[130px] animate-[drift_18s_ease-in-out_infinite]" />
      <div className="absolute top-1/4 -right-48 w-[480px] h-[480px] rounded-full bg-[#7C3AED]/30 blur-[130px] animate-[drift_22s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10rem] left-1/4 w-[520px] h-[520px] rounded-full bg-[#2563EB]/20 blur-[140px] animate-[drift_26s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#8B5CF6]/10 blur-[160px]" />
    </div>
  )
}