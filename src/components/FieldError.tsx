type Props = {
  message: string
}

export default function FieldError({ message }: Props) {
  return (
    <p className="mt-1.5 text-xs text-error flex items-center gap-1">
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      {message}
    </p>
  )
}
