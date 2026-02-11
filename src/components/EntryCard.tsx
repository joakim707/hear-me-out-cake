import type { Entry, Player } from '../types'

interface EntryCardProps {
  entry: Entry
  player?: Player
  imageUrl?: string
  showVoteButton?: boolean
  onVoteWildest?: () => void
  isHighlighted?: boolean
}

export function EntryCard({
  entry,
  player,
  imageUrl,
  showVoteButton,
  onVoteWildest,
  isHighlighted,
}: EntryCardProps) {
  return (
    <article className={`entry-card ${isHighlighted ? 'entry-card-highlighted' : ''}`}>
      {imageUrl && (
        <div className="entry-image-wrapper">
          <img src={imageUrl} alt={entry.title} className="entry-image" />
        </div>
      )}
      <header className="entry-header">
        <h3>{entry.title}</h3>
        {player && <p className="entry-author">by {player.name}</p>}
      </header>
      <p className="entry-caption">{entry.caption}</p>
      {showVoteButton && onVoteWildest && (
        <button type="button" className="button-ghost" onClick={onVoteWildest}>
          Vote &quot;Wildest&quot;
        </button>
      )}
    </article>
  )
}

