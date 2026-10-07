import { useState } from "react"

type Props = {
  quizzId: string;
  onConfirm: (
    _quizzId: string,
    _settings: { classicMode: boolean; showLobbyInfo: boolean },
  ) => void;
  onCancel: () => void;
};

const GameSettingsModal = ({ quizzId, onConfirm, onCancel }: Props) => {
  const [classicMode, setClassicMode] = useState(false)
  const [showLobbyInfo, setShowLobbyInfo] = useState(true)

  return (
    <div className="z-10 flex w-full max-w-md flex-col gap-6 rounded-md bg-white p-6 shadow-xl">
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Game Settings</h1>

        <div className="w-full space-y-4">
          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              checked={classicMode}
              onChange={(e) => setClassicMode(e.target.checked)}
            />
            <div className="flex flex-col">
              <span className="font-bold text-gray-700">Classic Mode</span>
              <span className="text-sm text-gray-500">
                Enable legacy display style for answers.
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              checked={showLobbyInfo}
              onChange={(e) => setShowLobbyInfo(e.target.checked)}
            />
            <div className="flex flex-col">
              <span className="font-bold text-gray-700">Show Lobby Info</span>
              <span className="text-sm text-gray-500">
                Display QR code and PIN on the waiting screen.
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(quizzId, { classicMode, showLobbyInfo })}
          className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors cursor-pointer"
        >
          Launch Game
        </button>
      </div>
    </div>
  )
}

export default GameSettingsModal
