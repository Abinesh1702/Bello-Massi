import { useEffect, useState } from 'react'
import { getLocaleConfig } from '../../config/runtimeConfig'

const clock = () => {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: getLocaleConfig().timezone }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
  }
}

const Signal = () => (
  <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden><g fill="currentColor">
    <rect x="0" y="7" width="3" height="4" rx="0.8" /><rect x="4.5" y="5" width="3" height="6" rx="0.8" />
    <rect x="9" y="2.5" width="3" height="8.5" rx="0.8" /><rect x="13.5" y="0" width="3" height="11" rx="0.8" opacity="0.4" /></g></svg>
)
const Wifi = () => (
  <svg width="15" height="11" viewBox="0 0 15 11" aria-hidden><g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <path d="M1.2 3.8a9 9 0 0 1 12.6 0" /><path d="M3.6 6.3a5.6 5.6 0 0 1 7.8 0" /></g><circle cx="7.5" cy="9.2" r="1.4" fill="currentColor" /></svg>
)
const Battery = ({ level = 0.82 }) => (
  <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden>
    <rect x="0.7" y="0.7" width="21.6" height="10.6" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" />
    <rect x="2.3" y="2.3" width={18.4 * level} height="7.4" rx="1.6" fill="currentColor" />
    <rect x="23.4" y="3.8" width="1.8" height="4.4" rx="0.9" fill="currentColor" fillOpacity="0.5" />
  </svg>
)

/**
 * Phone status bar drawn by the emulator (time, network, Wi-Fi, battery) with the platform's camera cut-out.
 * Navy background so it blends with the driver / customer app headers.
 */
export default function DeviceStatusBar({ platform, height, landscape }) {
  const [time, setTime] = useState(clock)
  useEffect(() => {
    const t = window.setInterval(() => setTime(clock()), 15000)
    return () => window.clearInterval(t)
  }, [])
  const iphone = platform.id === 'iphone'
  return (
    <div className="relative flex shrink-0 items-center justify-between bg-navy text-white select-none" style={{ height, paddingInline: iphone && !landscape ? 30 : 18 }} aria-hidden>
      <span className="text-[13px] font-semibold tabular tracking-tight">{time}</span>
      {!landscape && platform.cutout === 'island' && <span className="absolute left-1/2 top-[11px] h-[30px] w-[108px] -translate-x-1/2 rounded-full bg-black" />}
      {!landscape && platform.cutout === 'punch-hole' && <span className="absolute left-1/2 top-1/2 h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black ring-2 ring-white/10" />}
      <span className="flex items-center gap-1.5">
        <Signal />
        {!iphone && <span className="text-[10px] font-semibold">5G</span>}
        <Wifi />
        <span className="flex items-center gap-1">{!iphone && <span className="text-[11px] font-medium tabular">82%</span>}<Battery /></span>
      </span>
    </div>
  )
}
