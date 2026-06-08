import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import type { CardImage } from '@/lib/types'
import { cx } from '@/lib/utils'

interface Props {
  images: CardImage[]
  onAdd: (file: File) => void
  onRemove: (id: string) => void
}

export function ImageUpload({ images, onAdd, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      onAdd(file)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cx(
          'cursor-pointer rounded-card border-2 border-dashed flex flex-col items-center justify-center gap-1 py-6 transition-colors',
          drag ? 'border-accent bg-accent-tint' : 'border-hairline bg-cardAlt hover:border-accent'
        )}
      >
        <ImagePlus size={22} className="text-muted" />
        <p className="text-meta text-muted">Arraste imagens ou clique para enviar</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="group relative rounded-badge overflow-hidden aspect-square bg-cardAlt">
              <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
              <button
                onClick={() => onRemove(img.id)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-tint-ink/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover imagem"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
