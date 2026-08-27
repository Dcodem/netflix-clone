export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6.2 3.6v16.8L20.6 12 6.2 3.6z" />
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
