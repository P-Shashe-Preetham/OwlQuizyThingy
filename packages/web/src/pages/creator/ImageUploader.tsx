import { useState } from "react"
import { storage } from "@rahoot/web/lib/firebase"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"
import { v4 as uuidv4 } from "uuid"

interface Props {
  currentUrl?: string;
  onImageChange: (_url: string) => void;
  quizzId?: string;
}

export const ImageUploader = ({ currentUrl, onImageChange, quizzId = "new" }: Props) => {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleUpload = (file: File) => {
    if (!file) {return}

    if (file.size > 5 * 1024 * 1024) {
      console.error("Image size must be less than 5MB")

      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      console.error("Only JPEG, PNG, and WebP are allowed")

      return
    }

    setIsUploading(true)
    const ext = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${ext}`
    const storageRef = ref(storage, `quiz-media/${quizzId}/${fileName}`)

    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setProgress(p)
      },
      (error) => {
        console.error("Upload failed", error)
        setIsUploading(false)
        console.error("Upload failed")
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
          onImageChange(downloadURL)
          setIsUploading(false)
          setProgress(0)
        }).catch(err => {
          console.error("Failed to get download URL", err)
        })
      }
    )
  }

  const handleRemove = async () => {
    if (currentUrl && currentUrl.includes("firebasestorage.googleapis.com")) {
      try {
        const fileRef = ref(storage, currentUrl)
        await deleteObject(fileRef)
      } catch (e) {
        console.error("Failed to delete old image", e)
      }
    }

    onImageChange("")
  }

  const renderContent = () => {
    if (isUploading) {
      return (
        <div className="flex flex-col items-center">
          <span className="text-xl text-white mb-2">Uploading... {Math.round(progress)}%</span>
          <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )
    }

    if (currentUrl) {
      return (
        <>
          <img src={currentUrl} alt="Question media" className="w-full h-full object-cover rounded-3xl" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
             <label className="bg-white/20 hover:bg-white/40 px-4 py-2 rounded-lg text-white font-bold cursor-pointer">
                Replace
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUpload(e.target.files[0])
                  }
                }} />
             </label>
             <button type="button" onClick={(e) => { e.preventDefault(); handleRemove() }} className="bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-lg text-white font-bold cursor-pointer">
                Remove
             </button>
          </div>
        </>
      )
    }

    return (
        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
          <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">
            🖼️
          </span>
          <span className="text-sm font-bold">Upload Image</span>
          <span className="text-xs text-white/40 mt-1">JPEG, PNG, WebP (Max 5MB)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUpload(e.target.files[0])
              }
            }}
          />
        </label>
      )
  }

  return (
    <div className="w-80 h-48 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-400 hover:bg-white/10 transition-all group shadow-xl relative overflow-hidden">
      {renderContent()}
    </div>
  )
}
