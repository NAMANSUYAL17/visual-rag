import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import ImagePanel from './components/ImagePanel'
import axios from 'axios'

export default function App() {
  const [pdfs, setPdfs]               = useState([])   // { pdf_id, filename, status, page_count }
  const [activePdfId, setActivePdfId] = useState(null) // null = search all PDFs
  const [messages, setMessages]       = useState([])   // { role, text, citations, images }
  const [images, setImages]           = useState([])   // current response images
  const [loading, setLoading]         = useState(false)

  // Poll backend for ingested PDFs + their statuses
  const fetchPdfs = useCallback(async () => {
    try {
      const res = await axios.get('/pdfs')
      setPdfs(res.data.pdfs)
    } catch (e) {
      console.error('fetchPdfs error', e)
    }
  }, [])

  useEffect(() => {
    fetchPdfs()
    // Re-poll every 3s to catch async ingestion completing
    // Change 3000 to 10000 (poll every 10s instead of 3s)
    const interval = setInterval(fetchPdfs, 10000)  
    return () => clearInterval(interval)
  }, [fetchPdfs])

  // Called by Sidebar after a successful upload
  const handleUploaded = (pdf_id, filename) => {
    setPdfs(prev => [...prev, { pdf_id, filename, status: 'processing' }])
  }

  // Send query to backend
  const handleQuery = async (query) => {
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', text: query }])

    try {
      const res = await axios.post('/query', {
        query,
        pdf_id: activePdfId || null
      })

      const { answer, citations, images: imgs } = res.data

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: answer,
        citations,
        images: imgs
      }])

      setImages(imgs)
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Something went wrong. Please try again.',
        citations: [],
        images: []
      }])
    } finally {
      setLoading(false)
    }
  }

  // Delete a PDF — vectors + images
  const handleDelete = async (pdf_id) => {
    try {
      await axios.delete(`/pdf/${pdf_id}`)
      setPdfs(prev => prev.filter(p => p.pdf_id !== pdf_id))
      if (activePdfId === pdf_id) {
        setActivePdfId(null)
        setMessages([])
        setImages([])
      }
    } catch (e) {
      console.error('delete error', e)
    }
  }

  const activePdf = pdfs.find(p => p.pdf_id === activePdfId)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '260px 1fr 300px',
      height: '100vh',
      overflow: 'hidden',
      background: '#fff'
    }}>
      <Sidebar
        pdfs={pdfs}
        activePdfId={activePdfId}
        onSelect={setActivePdfId}
        onDelete={handleDelete}
        onUploaded={handleUploaded}
      />
      <ChatPanel
        messages={messages}
        loading={loading}
        onQuery={handleQuery}
        activePdf={activePdf}
      />
      <ImagePanel images={images} />
    </div>
  )
}