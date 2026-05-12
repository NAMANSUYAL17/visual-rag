import { useRef, useState } from 'react'
import axios from 'axios'

export default function UploadZone({ onUploaded }) {
  const inputRef     = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)

  const upload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file.')
      return
    }
    setUploading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await axios.post('/ingest', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onUploaded(res.data.pdf_id, file.name)
    } catch (e) {
      console.error('upload error', e)
      alert('Upload failed. Is the backend running?')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current.click()}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      style={{
        margin: '10px',
        border: `1.5px dashed ${dragOver ? '#378ADD' : '#ccc'}`,
        borderRadius: '8px',
        padding: '14px',
        textAlign: 'center',
        cursor: uploading ? 'not-allowed' : 'pointer',
        background: dragOver ? '#E6F1FB' : 'transparent',
        transition: 'all 0.15s'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => upload(e.target.files[0])}
      />
      <div style={{ fontSize: 22, marginBottom: 4 }}>
        {uploading ? '⏳' : '📄'}
      </div>
      <p style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>
        {uploading ? 'Uploading…' : 'Drop PDF or click to upload'}
      </p>
    </div>
  )
}