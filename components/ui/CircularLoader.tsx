interface Props {
  size?: number
  color?: string
  className?: string
}

/**
 * A rotating, "breathing" circular loader — the web equivalent of the
 * Compose EmeraldCircularLoader (continuous rotation + an arc whose length
 * animates in and out, rather than a plain static spinner). Uses two CSS
 * keyframes defined in globals.css: `loader-rotate` for the spin, and
 * `loader-dash` for the growing/shrinking arc.
 */
export default function CircularLoader({
  size = 40,
  color = "#3A78FF", // brand blue — same value as --color-primary in globals.css
  className,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      className={`[animation:loader-rotate_1.4s_linear_infinite] ${className ?? ""}`}
    >
      <circle
        cx="22"
        cy="22"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        className="[animation:loader-dash_1.4s_ease-in-out_infinite]"
      />
    </svg>
  )
}