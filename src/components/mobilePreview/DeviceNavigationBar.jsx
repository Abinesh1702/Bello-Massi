/** Bottom system gesture area: a home-indicator pill (iPhone) or gesture handle (Android). */
export default function DeviceNavigationBar({ platform, height }) {
  return (
    <div className="flex shrink-0 items-center justify-center bg-surface" style={{ height }} aria-hidden>
      <span className={platform.id === 'iphone' ? 'h-[5px] w-[134px] rounded-full bg-ink/85' : 'h-[4px] w-[96px] rounded-full bg-ink/55'} />
    </div>
  )
}
