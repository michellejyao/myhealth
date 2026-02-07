import type { AttachmentEntry } from '../../../types'

interface BookAttachmentViewerProps {
  attachment: AttachmentEntry
  onClose?: () => void
}

function getPlaceholderIcon(type: string) {
  switch (type) {
    case 'image':
      return '🖼️'
    case 'video':
      return '🎬'
    case 'audio':
      return '🎵'
    default:
      return '📄'
  }
}

export function BookAttachmentViewer({ attachment, onClose }: BookAttachmentViewerProps) {
  const isImage = attachment.type === 'image'
  const icon = getPlaceholderIcon(attachment.type)

  return (
    <div className="book-attachment-viewer bg-[#f5f0e8] border border-[#e0d9cc] rounded p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-[#3d3629]">
          {attachment.file_name || `${icon} ${attachment.type}`}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[#6b6358] hover:text-[#3d3629]"
          >
            Close
          </button>
        )}
      </div>
      {isImage && attachment.storage_path ? (
        <img
          src={attachment.storage_path}
          alt={attachment.file_name || 'Attachment'}
          className="max-w-full max-h-64 object-contain rounded border border-[#e0d9cc]"
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-[#6b6358] border border-dashed border-[#d4cfc4] rounded">
          <span className="text-4xl mb-2">{icon}</span>
          <p className="text-sm">{attachment.type}</p>
          {attachment.storage_path && (
            <a
              href={attachment.storage_path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#5c4a3a] underline mt-2"
            >
              Open file
            </a>
          )}
        </div>
      )}
    </div>
  )
}
