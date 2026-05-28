export interface CheckboxFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function CheckboxField({
  label,
  checked,
  onChange,
  className = '',
}: CheckboxFieldProps) {
  return (
    <label className={`flex items-center gap-1.5 text-sm ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-showdown-accent"
      />
      {label}
    </label>
  )
}
