import clsx from "clsx"
import type {
  ButtonHTMLAttributes,
  ElementType,
  PropsWithChildren,
} from "react"

type Props = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: ElementType
  }

const AnswerButton = ({
  className,
  icon: Icon,
  children,
  ...otherProps
}: Props) => (
  <button
    className={clsx(
      "shadow-inset flex items-center rounded px-4 py-6 text-left",
      children ? "gap-3" : "justify-center",
      className,
    )}
    {...otherProps}
  >
    <Icon className={clsx(children ? "h-6 w-6" : "h-16 w-16 drop-shadow-md")} />
    {children && <span className="drop-shadow-md">{children}</span>}
  </button>
)

export default AnswerButton
