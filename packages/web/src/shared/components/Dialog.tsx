import clsx from "clsx"
import { type ReactNode, useEffect, useRef } from "react"

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

const Dialog = ({ isOpen, onClose, title, children, className }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (isOpen && dialog && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }

    dialog?.addEventListener("cancel", handleCancel)


return () => dialog?.removeEventListener("cancel", handleCancel)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className={clsx(
        "backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm",
        "bg-white rounded-xl shadow-2xl p-0 max-w-lg w-full outline-none",
        "open:animate-in open:fade-in-0 open:zoom-in-95",
        className
      )}
      aria-labelledby="dialog-title"
    >
      <div className="flex flex-col">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 id="dialog-title" className="text-xl font-bold text-slate-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </header>
        <div className="p-6">
          {children}
        </div>
      </div>
    </dialog>
  )
}

export default Dialog
