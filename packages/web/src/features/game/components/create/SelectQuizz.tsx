import type { QuizzWithId } from "@rahoot/common/types/game"
import Button from "@rahoot/web/features/game/components/Button"
import clsx from "clsx"
import { useState } from "react"
import { useNavigate } from "react-router"
import toast from "react-hot-toast"
import { useSocket } from "@rahoot/web/features/game/contexts/socketProvider"

type Props = {
  quizzList: QuizzWithId[]
  onSelect: (_id: string) => void
}

const SelectQuizz = ({ quizzList, onSelect }: Props) => {
  const [selected, setSelected] = useState<string | null>(null)
  const navigate = useNavigate()
  const { socket } = useSocket()

  const handleSelect = (id: string) => () => {
    if (selected === id) {
      setSelected(null)
    } else {
      setSelected(id)
    }
  }

  const handleEdit = (quizz: QuizzWithId, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate("/creator", { state: { quizz } })
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this quiz?")) {
      socket?.emit("manager:deleteQuizz", id)
    }
  }

  const handleSubmit = () => {
    if (!selected) {
      toast.error("Please select a quizz")
      return
    }
    onSelect(selected)
  }

  return (
    <div className="z-10 flex w-full max-w-md flex-col gap-4 rounded-md bg-white p-4 shadow-sm">
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-2 text-2xl font-bold">Select a quizz</h1>
        <div className="w-full space-y-2">
          {quizzList.map((quizz) => (
            <div
              key={quizz.id}
              className={clsx(
                "flex w-full items-center justify-between rounded-md p-3 outline outline-gray-300 transition-colors hover:bg-gray-50 cursor-pointer",
                selected === quizz.id && "bg-blue-50/50"
              )}
              onClick={handleSelect(quizz.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    "h-5 w-5 rounded outline outline-offset-3 outline-gray-300",
                    selected === quizz.id &&
                      "bg-primary border-primary/80 shadow-inset",
                  )}
                ></div>
                <span className="font-bold">{quizz.subject}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded font-semibold text-gray-700 transition-colors cursor-pointer"
                  onClick={(e) => handleEdit(quizz, e)}
                >
                  Edit
                </button>
                <button 
                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded font-semibold text-red-600 transition-colors cursor-pointer"
                  onClick={(e) => handleDelete(quizz.id, e)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  )
}

export default SelectQuizz
