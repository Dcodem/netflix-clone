export function GenreDots({ genres, className }: { genres: string[]; className?: string }) {
  if (!genres.length) return null
  return (
    <ul className={className ? `genre-dots ${className}` : 'genre-dots'}>
      {genres.map((genre) => (
        <li key={genre}>{genre}</li>
      ))}
    </ul>
  )
}
