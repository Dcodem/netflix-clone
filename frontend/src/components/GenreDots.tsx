export function GenreDots({
  genres,
  className,
  onSelect,
}: {
  genres: string[]
  className?: string
  onSelect?: (genre: string) => void
}) {
  if (!genres.length) return null
  return (
    <ul className={className ? `genre-dots ${className}` : 'genre-dots'}>
      {genres.map((genre) => (
        <li key={genre}>
          {onSelect ? (
            <button type="button" className="genre-dot-link" onClick={() => onSelect(genre)}>
              {genre}
            </button>
          ) : (
            genre
          )}
        </li>
      ))}
    </ul>
  )
}
