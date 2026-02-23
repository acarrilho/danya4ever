export default function DanyaLogo() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Daniel Naroditsky portrait illustration"
      className="text-stone-800"
    >
      {/* Circular frame */}
      <circle cx="36" cy="36" r="34" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.15" />
      <circle cx="36" cy="36" r="30" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.08" />

      {/* Head shape */}
      <path
        d="M24 30 C24 20 48 20 48 30 L49 42 C49 50 44 56 36 57 C28 56 23 50 23 42 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinejoin="round"
      />

      {/* Hair top */}
      <path
        d="M24.5 30 C24 24 27 20 31 19 C35 17.5 40 18 43 20 C46 22 48 25 47.5 30"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />

      {/* Left eye */}
      <ellipse cx="30" cy="35" rx="2.2" ry="1.4" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="30.4" cy="35" r="0.7" fill="currentColor" />

      {/* Right eye */}
      <ellipse cx="42" cy="35" rx="2.2" ry="1.4" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="42.4" cy="35" r="0.7" fill="currentColor" />

      {/* Eyebrows */}
      <path d="M27.5 32.5 C28.5 31.8 31 31.8 32.5 32.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M39.5 32.5 C40.5 31.8 43 31.8 44.5 32.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M36 36 L34.5 42 C35 43 37 43 37.5 42 Z" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round" />

      {/* Mouth - slight smile */}
      <path d="M31.5 46 C33 47.5 39 47.5 40.5 46" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Ear left */}
      <path d="M23.5 35 C21.5 35 21 39 23.5 40" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Ear right */}
      <path d="M48.5 35 C50.5 35 51 39 48.5 40" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Neck */}
      <path d="M32 57 L32 63 M40 57 L40 63" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Shoulders */}
      <path d="M18 68 C20 62 28 61 32 63 M40 63 C44 61 52 62 54 68"
        stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* Chess piece — a small queen/king at bottom as motif */}
      <path d="M33 64.5 L39 64.5" stroke="currentColor" strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
    </svg>
  )
}
