import { useState } from "react"

type Props = {
  onSubmit: (password: string) => void
}

const ManagerPassword = ({ onSubmit }: Props) => {
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(password)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-4 bg-white/10 p-8 rounded-2xl border border-white/20 shadow-xl max-w-sm w-full"
    >
      <h2 className="text-2xl font-bold text-white mb-4">Manager Access</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl p-4 text-xl font-bold text-black focus:outline-none focus:ring-4 focus:ring-primary/50 text-center"
        placeholder="Enter password..."
        autoFocus
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-primary py-4 text-xl font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 shadow-lg"
      >
        Sign In
      </button>
    </form>
  )
}

export default ManagerPassword
