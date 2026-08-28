export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6.2 3.6v16.8L20.6 12 6.2 3.6z" />
    </svg>
  )
}

export function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 4h4.2v16H6zM13.8 4H18v16h-4.2z" />
    </svg>
  )
}

export function SkipBackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        d="M8.4 6.8A7.2 7.2 0 1 0 12 4.8"
      />
      <path fill="currentColor" d="M8.6 3.2v5.4L4.4 6.2z" />
      <text
        x="12"
        y="15.8"
        textAnchor="middle"
        fill="currentColor"
        fontSize="7.4"
        fontWeight="700"
        fontFamily="Helvetica Neue, Arial, sans-serif"
      >
        10
      </text>
    </svg>
  )
}

export function SkipForwardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        d="M15.6 6.8A7.2 7.2 0 1 1 12 4.8"
      />
      <path fill="currentColor" d="M15.4 3.2v5.4L19.6 6.2z" />
      <text
        x="12"
        y="15.8"
        textAnchor="middle"
        fill="currentColor"
        fontSize="7.4"
        fontWeight="700"
        fontFamily="Helvetica Neue, Arial, sans-serif"
      >
        10
      </text>
    </svg>
  )
}

export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path fill="currentColor" d="M11 10h2v7h-2zm0-3h2v2h-2z" />
    </svg>
  )
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SpeakerIcon({ muted, className }: { muted?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 9.5v5h3.2L12 18.8V5.2L7.2 9.5H4z" />
      {muted ? (
        <path d="M16 9l5 6m0-6l-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path
          d="M15.2 8.8a4.2 4.2 0 010 6.4M17.4 6.6a7.2 7.2 0 010 10.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export function CaretIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 9l6 7 6-7H6z" />
    </svg>
  )
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M11 5h2v14h-2z" />
      <path fill="currentColor" d="M5 11h14v2H5z" />
    </svg>
  )
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5.5 12.5l4.2 4.2 8.8-9.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 21H5.2A1.2 1.2 0 014 19.8V11.2A1.2 1.2 0 015.2 10H8v11zm2-11.4l2.4-5.3A1.8 1.8 0 0114 3.2c.9 0 1.6.8 1.5 1.7L15 9h4.3c1.4 0 2.5 1.3 2.2 2.7l-1.3 6.2A2.4 2.4 0 0118 20h-8V9.6z"
      />
    </svg>
  )
}

export function DoubleThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        opacity="0.55"
        d="M3.2 20.2H1.4A.8.8 0 01.6 19.4v-5.6a.8.8 0 01.8-.8h1.8v6.4zm1.3-6.6l1.6-3.5A1.2 1.2 0 017.2 9c.6 0 1.1.5 1 1.1L8 12.4h2.8c.9 0 1.6.9 1.4 1.8l-.8 4.1a1.6 1.6 0 01-1.5 1.3H4.5v-6z"
      />
      <path
        fill="currentColor"
        d="M11.2 21H8.6A1.1 1.1 0 017.5 19.9v-7.6A1.1 1.1 0 018.6 11.2h2.6V21zm1.8-10.2l2.1-4.7A1.6 1.6 0 0116.6 5c.8 0 1.4.7 1.3 1.5L17.4 10h3.8c1.2 0 2.2 1.2 1.9 2.4l-1.1 5.4A2.1 2.1 0 0120 19.6h-7V10.8z"
      />
    </svg>
  )
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.4l3 1.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 11.2L12 4.6l7.5 6.6V20a.8.8 0 01-.8.8h-4.4v-5.2h-4.6V20.8H5.3A.8.8 0 014.5 20v-8.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function NewsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.2 3.4c.4 2.2-.4 3.6-1.6 4.8-1.1 1.1-1.8 2.1-1.6 3.6 1.6-1 2.6-1.2 3.8-.6-1.6 2.4.2 4.6 2.4 6.2 1.4 1 2.8 1.6 4.2 1.6-2.4 2.6-6.4 3.2-9.2 1.4C7.4 18.8 6 16.2 6 13.6 6 9.8 8.6 7.2 12.2 3.4z"
        fill="currentColor"
      />
    </svg>
  )
}

export function MyNetflixIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4.5" width="14" height="15" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.2 16.4c.8-1.4 2.1-2.1 3.8-2.1s3 .7 3.8 2.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 3h2.8A1.2 1.2 0 0120 4.2v8.6A1.2 1.2 0 0118.8 14H16V3zM14 14.4l-2.4 5.3A1.8 1.8 0 0110 20.8c-.9 0-1.6-.8-1.5-1.7L9 15H4.7C3.3 15 2.2 13.7 2.5 12.3l1.3-6.2A2.4 2.4 0 016 4h8v10.4z"
      />
    </svg>
  )
}

export function RestartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.2 7.2A7 7 0 1112 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path fill="currentColor" d="M4.2 4.8l5.2.2-.8 5.1z" />
    </svg>
  )
}

export function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5L8 12l7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 16.8V20h3.2L18.6 8.6l-3.2-3.2L4 16.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14.2 6.6l3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.5a5.2 5.2 0 015.2 5.2v2.4c0 .9.3 1.8.9 2.5l.8.9H5.1l.8-.9c.6-.7.9-1.6.9-2.5V8.7A5.2 5.2 0 0112 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9.2 18.6a2.8 2.8 0 005.6 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function FullscreenIcon({ className, exit }: { className?: string; exit?: boolean }) {
  if (exit) {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.5 8.5V6.8c0-.7.5-1.3 1.5-1.3h1.5V3h-2.2C12.4 3 11 4.6 11 6.8v1.7H9v2.7h2V21h3.2v-9.8h2.3l.5-2.7h-2.8z"
      />
    </svg>
  )
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
    </svg>
  )
}

export function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5.2h4.1l4 5.4L16.6 5.2H20l-6.3 7.6L20.4 18.8h-4.1l-4.4-5.9-4.7 5.9H3.2l6.8-8z"
      />
    </svg>
  )
}

export function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="6.5" width="18" height="11" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path fill="currentColor" d="M10.4 9.4v5.2L15.4 12z" />
    </svg>
  )
}

export function SubtitlesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6.5 14.5h5M13.5 14.5h4M6.5 11h11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function EpisodesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="3.2" rx="0.6" fill="currentColor" />
      <rect x="4" y="10.4" width="16" height="3.2" rx="0.6" fill="currentColor" />
      <rect x="4" y="15.8" width="11" height="3.2" rx="0.6" fill="currentColor" />
    </svg>
  )
}

export function SkipIntroIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 6l6.5 6L5 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 6l6.5 6-6.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function NextEpisodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 5.4v13.2L15.2 12 4 5.4z" />
      <path fill="currentColor" d="M16.4 5.4h2.6v13.2h-2.6z" />
    </svg>
  )
}

export function SpeedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.8 14.2a7.2 7.2 0 1114.4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path fill="currentColor" d="M12 14.4l5.2-6.4-2.2 7.2z" />
      <circle cx="12" cy="14.6" r="1.35" fill="currentColor" />
    </svg>
  )
}

export function ShuffleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path
        d="M3.5 7h4.2l2.4 3.1M14.2 7H20.5M17.6 4.4L20.5 7l-2.9 2.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 17h4.2l8.6-10.8M14.2 17H20.5M17.6 14.4L20.5 17l-2.9 2.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 11V8.2a4 4 0 018 0V11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4v11M7.5 11.5L12 16l4.5-4.5M5 19h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
