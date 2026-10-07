import clsx from "clsx"
import type { ButtonHTMLAttributes, PropsWithChildren } from "react"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & PropsWithChildren

const Button = ({ children, className, disabled, ...otherProps }: Props) => (
  <button
    className={clsx(
      "btn-shadow bg-primary rounded-md p-2 text-lg font-semibold text-white transition-opacity",
      disabled && "opacity-50 cursor-not-allowed",
      className,
    )}
    disabled={disabled}
    {...otherProps}
  >
    <span>{children}</span>
  </button>
)

export default Button
