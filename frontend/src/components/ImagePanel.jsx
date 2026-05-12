export default function ImagePanel({ images }) {
  return (
    <div style={{
      borderLeft: '0.5px solid #e5e5e3',
      display: 'flex',
      flexDirection: 'column',
      background: '#fafaf8',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid #e5e5e3',
        fontSize: 13,
        fontWeight: 500,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        Related images
        {images.length > 0 && (
          <span style={{
            fontSize: 11,
            padding: '1px 7px',
            background: '#E6F1FB',
            color: '#0C447C',
            borderRadius: 20
          }}>
            {images.length}
          </span>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        {images.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#bbb',
            fontSize: 12,
            textAlign: 'center',
            gap: 8,
            paddingTop: 60
          }}>
            <div style={{ fontSize: 28 }}>🖼️</div>
            <p>Images associated with<br />retrieved text appear here</p>
          </div>
        ) : (
          images.map((url, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                border: '0.5px solid #e5e5e3',
                borderRadius: 8,
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '5px 10px',
                fontSize: 11,
                color: '#999',
                borderBottom: '0.5px solid #f0f0ee'
              }}>
                Image {i + 1}
              </div>

              <img
                src={url}
                alt={'Retrieved figure ' + (i + 1)}
                style={{
                  width: '100%',
                  display: 'block',
                  objectFit: 'contain',
                  maxHeight: 220,
                  background: '#fff',
                  padding: 8
                }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />

              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  padding: '5px 10px',
                  fontSize: 11,
                  color: '#378ADD',
                  textDecoration: 'none',
                  borderTop: '0.5px solid #f0f0ee'
                }}
              >
                Open full size
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
