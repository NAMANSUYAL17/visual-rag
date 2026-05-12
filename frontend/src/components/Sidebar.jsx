import UploadZone from './UploadZone'

const STATUS_COLOR = {
  done:       '#639922',
  processing: '#BA7517',
  error:      '#E24B4A',
  unknown:    '#aaa'
}

export default function Sidebar({ pdfs, activePdfId, onSelect, onDelete, onUploaded }) {
  return (
    <div style={{
      borderRight: '0.5px solid #e5e5e3',
      display: 'flex',
      flexDirection: 'column',
      background: '#fafaf8',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid #e5e5e3',
        fontSize: 13,
        fontWeight: 500
      }}>
        Visual RAG
      </div>

      <UploadZone onUploaded={onUploaded} />

      {/* All PDFs option */}
      <div
        onClick={() => onSelect(null)}
        style={{
          margin: '0 8px 4px',
          padding: '8px 10px',
          borderRadius: 8,
          fontSize: 12,
          cursor: 'pointer',
          fontWeight: 500,
          background: activePdfId === null ? '#E6F1FB' : 'transparent',
          color:      activePdfId === null ? '#0C447C' : '#666',
          border:     activePdfId === null ? '0.5px solid #B5D4F4' : '0.5px solid transparent'
        }}
      >
        Search all PDFs
      </div>

      {/* PDF list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {pdfs.length === 0 && (
          <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 24 }}>
            No PDFs yet. Upload one above.
          </p>
        )}

        {pdfs.map(pdf => (
          <div
            key={pdf.pdf_id}
            onClick={() => pdf.status === 'done' && onSelect(pdf.pdf_id)}
            style={{
              padding: '9px 10px',
              borderRadius: 8,
              marginBottom: 3,
              cursor: pdf.status === 'done' ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activePdfId === pdf.pdf_id ? '#fff' : 'transparent',
              border: activePdfId === pdf.pdf_id
                ? '0.5px solid #d0d0cc'
                : '0.5px solid transparent'
            }}
          >
            {/* PDF icon */}
            <div style={{
              width: 28, height: 34,
              background: '#E6F1FB',
              borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: '#0C447C', flexShrink: 0
            }}>
              PDF
            </div>

            {/* Name + status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: '#1a1a1a'
              }}>
                {pdf.filename}
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>
                {pdf.status === 'done'       && `${pdf.chunk_count ?? '–'} chunks`}
                {pdf.status === 'processing' && 'Ingesting…'}
                {pdf.status === 'error'      && 'Error — retry'}
              </div>
            </div>

            {/* Status dot */}
            <div style={{
              width: 7, height: 7,
              borderRadius: '50%',
              background: STATUS_COLOR[pdf.status] ?? '#aaa',
              flexShrink: 0
            }} />

            {/* Delete button */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(pdf.pdf_id) }}
              title="Delete PDF"
              style={{
                width: 20, height: 20,
                border: 'none', background: 'transparent',
                cursor: 'pointer', borderRadius: 4,
                color: '#aaa', fontSize: 15, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}