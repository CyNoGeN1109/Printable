// FILE LOCATION: apps/desktop/src/renderer/components/ConfirmModal.tsx
// Shown when a new OFFLINE (cash) order arrives
// Owner sees order details + clicks "Confirm Cash Received" to queue it

import { useState } from 'react'

interface OrderFile {
  fileName: string
  fileUrl: string
  pages: number
  copies: number
  colour: boolean
  duplex: boolean
}

interface Order {
  _id: string
  orderId: string
  files: OrderFile[]
  paymentMode: 'online' | 'offline'
  status: string
  totalAmount: number
  createdAt: string
}

interface Props {
  order: Order
  onConfirm: () => Promise<void>
  onDismiss: () => void
}

export default function ConfirmModal({ order, onConfirm, onDismiss }: Props) {
  const [isConfirming, setIsConfirming] = useState(false)

  // Legacy support: Handle orders created before the multi-file update
  const files = order.files || [
    {
      fileName: (order as any).fileName || 'Untitled',
      copies: (order as any).copies || 1,
      colour: (order as any).colour || false,
      duplex: (order as any).duplex || false,
    }
  ]

  const handleConfirm = async () => {
    setIsConfirming(true)
    await onConfirm()
    setIsConfirming(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <span className="modal-icon">🔔</span>
          <h2>New Cash Order</h2>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">Order #{order.orderId}</p>

          <div className="modal-files-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
            {files.map((file, idx) => (
              <div key={idx} style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '8px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{file.fileName}</p>
                <div style={{ fontSize: '12px', opacity: 0.7, display: 'flex', gap: '8px' }}>
                  <span>{file.copies} copies</span>
                  <span>·</span>
                  <span>{file.colour ? 'Color' : 'B&W'}</span>
                  <span>·</span>
                  <span>{file.duplex ? 'Double-sided' : 'Single-sided'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-details">
            <div className="detail-row highlight" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <span className="detail-label">Total Amount</span>
              <span className="detail-value price">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <p className="modal-instruction">
            Collect <strong>₹{order.totalAmount?.toFixed(2) || '0.00'}</strong> cash from the customer,
            then confirm below to start printing.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onDismiss} disabled={isConfirming}>
            Dismiss
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Confirming…' : '✓ Confirm Cash Received'}
          </button>
        </div>
      </div>
    </div>
  )
}