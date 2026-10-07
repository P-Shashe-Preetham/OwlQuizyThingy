import clsx from "clsx"
import type { SelectHTMLAttributes } from "react"

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
}

const Select = ({ label, error, className, id, ...props }: Props) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-bold text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={id}
          className={clsx(
            "w-full appearance-none rounded-md p-2.5 pr-10 text-lg font-semibold",
            "bg-white border-2 border-gray-200 outline-none transition-all",
            "focus:border-primary focus:ring-4 focus:ring-primary/20",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        >
          {props.children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-sm font-semibold text-red-500" role="alert">
          {error}
        </span>
      )}
    </div>
  )

export default Select
