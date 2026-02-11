import type { Entry } from '../types'

interface CakeCanvasProps {
  entries: Entry[]
  revealIndex: number
  status: 'lobby' | 'reveal' | 'voting' | 'done'
}

export function CakeCanvas({ entries, revealIndex, status }: CakeCanvasProps) {
  if (!entries.length) {
    return <p className="hint">No entries yet — add some cake chaos first!</p>
  }

  const radius = 130
  const centerX = 180
  const centerY = 180

  return (
    <div className="cake-canvas">
      <div className="cake-base" />
      {entries.map((entry, index) => {
        const angle = (index / entries.length) * Math.PI * 2 - Math.PI / 2
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)

        const isRevealed = status === 'reveal' && index === revealIndex
        const isVoting = status === 'voting' || status === 'done'

        const blurred =
          status === 'reveal'
            ? !isRevealed
            : status === 'lobby'
              ? true
              : false

        return (
          <div
            key={entry.id}
            className={`cake-slice ${blurred ? 'cake-slice-blurred' : ''} ${
              isVoting ? 'cake-slice-voting' : ''
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
            }}
          >
            <span className="cake-slice-label">{index + 1}</span>
          </div>
        )
      })}
    </div>
  )
}

