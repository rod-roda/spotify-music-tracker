import styles from './Home.module.css'
import { useSpotifyData } from '../hooks/useSpotifyData'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3333';

export function Home() {
  const { tracks, artists, loading, error, isAuthenticated, logout } = useSpotifyData()

  if (!isAuthenticated && !loading) {
    return (
      <div className={styles.loginContainer}>
        <h1>🎵 Music Tracker</h1>
        {error && <p className={styles.error}>{error}</p>}
        <a href={`${API_URL}/auth/login`} className={styles.loginButton}>
          Login com Spotify
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Carregando seus dados do Spotify...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Erro ao carregar dados</h2>
        <p>{error}</p>
        <a href={`${API_URL}/auth/login`} className={styles.loginButton}>
          Fazer login novamente
        </a>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎵 Music Tracker</h1>
        <button onClick={logout} className={styles.logoutButton}>
          Sair
        </button>
      </div>

      <h2 className={styles.sectionTitle}>🎵 Top Músicas</h2>
      <div className={styles.trackList}>
        {tracks.map((track, i) => (
          <div key={track.id} className={styles.trackItem}>
            <span className={styles.trackRank}>#{i + 1}</span>
            <img 
              src={track.album.images[0]?.url} 
              alt={track.album.name}
              className={styles.trackCover} 
            />
            <div className={styles.trackInfo}>
              <div className={styles.trackName}>{track.name}</div>
              <div className={styles.trackArtist}>
                {track.artists.map((a) => a.name).join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>🎤 Top Artistas</h2>
      <div className={styles.artistsGrid}>
        {artists.map((artist) => (
          <div key={artist.id} className={styles.artistCard}>
            <img 
              src={artist.image} 
              alt={artist.name}
              className={styles.artistImage} 
            />
            <div className={styles.artistInfo}>
              <span className={styles.artistName}>{artist.name}</span>
              {artist.genres && artist.genres.length > 0 && (
                <span className={styles.artistGenres}>
                  {artist.genres.slice(0, 2).join(', ')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}