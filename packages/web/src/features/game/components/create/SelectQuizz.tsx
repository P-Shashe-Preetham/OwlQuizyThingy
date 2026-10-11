import type { QuizzWithId } from "@rahoot/common/types/game"

type Props = {
  quizzList: QuizzWithId[]
  onSelect: (quizzId: string) => void
}

const SelectQuizz = ({ quizzList, onSelect }: Props) => (
    <div className="flex w-full max-w-4xl flex-col gap-6 p-4">
      <h2 className="text-center text-3xl font-black text-white drop-shadow-lg mb-4">
        Select a Quiz to Host
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzList.map((quiz) => (
          <div
            key={quiz.id}
            onClick={() => onSelect(quiz.id)}
            role="button"
            tabIndex={0}
            className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/10 p-8 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:shadow-2xl cursor-pointer border border-white/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelect(quiz.id)
              }
            }}
          >
            <div className="text-center text-2xl font-bold text-white group-hover:text-primary transition-colors">
              {quiz.subject}
            </div>
            <div className="text-white/60 text-sm font-semibold">
              {quiz.questions.length} Question{quiz.questions.length !== 1 && "s"}
            </div>
          </div>
        ))}
        {quizzList.length === 0 && (
          <div className="col-span-full text-center text-white/50 text-xl font-bold py-12">
            No quizzes found. Create one to get started!
          </div>
        )}
      </div>
    </div>
)

export default SelectQuizz
