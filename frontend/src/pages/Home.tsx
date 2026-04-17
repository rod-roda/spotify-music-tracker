import { useMemo } from 'react'
import { Zap, Smile, Music } from 'lucide-react'
import styles from './Home.module.css'
import { useSpotifyData } from '../hooks/useSpotifyData'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3333';

const EQ_BARS = 200;
const eqConfig = Array.from({ length: EQ_BARS }, (_, i) => ({
  delay: (Math.sin(i * 0.7) * 0.5 + 0.5) * 1.2,
  duration: 0.6 + Math.random() * 0.8,
  minH: 4 + Math.random() * 8,
  maxH: 20 + Math.random() * 45,
}));

const LISTENER_TYPE_COLORS: Record<string, { bg: string; accent: string }> = {
  mainstream:   { bg: '#2d1b3d', accent: '#e94560' },
  alternativo:  { bg: '#0c2a2a', accent: '#4ecdc4' },
  explorador:   { bg: '#2a0845', accent: '#c084fc' },
  'eclético':   { bg: '#1a1530', accent: '#f59e0b' },
  'nostálgico':  { bg: '#2b1d0e', accent: '#e0a458' },
  underground:  { bg: '#0a1628', accent: '#22d3ee' },
  festeiro:     { bg: '#2d0a1e', accent: '#f43f5e' },
  'melancólico': { bg: '#0f172a', accent: '#64748b' },
  default:      { bg: '#1a1035', accent: '#818cf8' },
};

function getListenerColors(listenerType?: string) {
  if (!listenerType) return LISTENER_TYPE_COLORS.default;
  const key = listenerType.toLowerCase();
  return LISTENER_TYPE_COLORS[key] ?? LISTENER_TYPE_COLORS.default;
}

function getStatLabel(value: number) {
  if (value >= 75) return 'Alto';
  if (value >= 40) return 'Médio';
  return 'Baixo';
}

export function Home() {
  const { artists, profile, analysis, loading, analysisLoading, error, isAuthenticated, logout } = useSpotifyData()

  const colors = useMemo(
    () => getListenerColors(analysis?.analysis.listener_type),
    [analysis?.analysis.listener_type]
  );

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
        <div className={styles.spinner} />
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

  const topArtist = artists[0];
  const top5Artists = artists.slice(0, 5);

  return (
    <div
      className={styles.card}
      style={{
        '--bg-color': colors.bg,
        '--accent-color': colors.accent,
      } as React.CSSProperties}
    >
      {/* Background artist image */}
      {topArtist?.image && (
        <div className={styles.artistBg}>
          <img src={topArtist.image} alt="" />
        </div>
      )}

      {/* Genres floating on left side */}
      {analysis && (
        <div className={styles.genresCloud}>
          {analysis.analysis.main_genres.map((genre, i) => (
            <span
              key={genre}
              className={styles.genreTag}
              style={{ '--i': i } as React.CSSProperties}
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Header: profile photo + username */}
      <header className={styles.header}>
        <div className={styles.profileSection}>
          {profile?.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className={styles.avatar}
            />
          )}
          <h1 className={styles.username}>{profile?.displayName ?? 'Usuário'}</h1>
        </div>
        <button onClick={logout} className={styles.logoutButton} title="Sair">
          ✕
        </button>
      </header>

      {/* Persona + mood + listener type */}
      <section className={styles.personaSection}>
        {analysisLoading ? (
          <div className={styles.analysisLoading}>Analisando seu perfil musical...</div>
        ) : analysis ? (
          <>
            <p className={styles.persona}>{analysis.persona}</p>
            <div className={styles.tags}>
              <span className={styles.moodTag}>{analysis.analysis.mood}</span>
              <span className={styles.tagSep}>·</span>
              <span className={styles.listenerTag}>{analysis.analysis.listener_type}</span>
            </div>
          </>
        ) : null}
      </section>

      {/* Main content: top artists + stats */}
      <section className={styles.mainContent}>
        <div className={styles.topArtists}>
          <h2 className={styles.sectionTitle}>Top Artistas</h2>
          <ol className={styles.artistList}>
            {top5Artists.map((artist, i) => (
              <li
                key={artist.id}
                className={styles.artistItem}
                style={{ '--i': i } as React.CSSProperties}
              >
                <span className={styles.artistRank}>{i + 1}</span>
                <img
                  src={artist.image}
                  alt={artist.name}
                  className={styles.artistThumb}
                />
                <span className={styles.artistName}>{artist.name}</span>
              </li>
            ))}
          </ol>
        </div>

        {analysis && (
          <div className={styles.statsSection}>
            <h2 className={styles.sectionTitle}>Stats</h2>
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>
                    <Zap size={16} className={styles.statIcon} />
                    Energy
                  </span>
                  <span className={styles.statValue}>{getStatLabel(analysis.stats.energy)}</span>
                </div>
                <div className={styles.statBar}>
                  <div
                    className={styles.statFill}
                    style={{ width: `${analysis.stats.energy}%` }}
                  />
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>
                    <Smile size={16} className={styles.statIcon} />
                    Valence
                  </span>
                  <span className={styles.statValue}>{getStatLabel(analysis.stats.valence)}</span>
                </div>
                <div className={styles.statBar}>
                  <div
                    className={styles.statFill}
                    style={{ width: `${analysis.stats.valence}%` }}
                  />
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>
                    <Music size={16} className={styles.statIcon} />
                    Danceability
                  </span>
                  <span className={styles.statValue}>{getStatLabel(analysis.stats.danceability)}</span>
                </div>
                <div className={styles.statBar}>
                  <div
                    className={styles.statFill}
                    style={{ width: `${analysis.stats.danceability}%` }}
                  />
                </div>
              </div>
            </div>
            <div className={styles.summary}>
              <p>{analysis.analysis.summary}</p>
            </div>
          </div>
        )}
      </section>

      {/* Equalizer bars at bottom */}
      <div className={styles.equalizer}>
        {eqConfig.map((bar, i) => (
          <div
            key={i}
            className={styles.eqBar}
            style={{
              '--delay': `${bar.delay}s`,
              '--duration': `${bar.duration}s`,
              '--min-h': `${bar.minH}px`,
              '--max-h': `${bar.maxH}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}