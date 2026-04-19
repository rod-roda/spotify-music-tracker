import { useMemo, useState, useEffect } from 'react'
import { Zap, Smile, Music } from 'lucide-react'
import styles from './Home.module.css'
import { useSpotifyData } from '../hooks/useSpotifyData'

const API_URL = import.meta.env.VITE_API_URL ?? '';

const EQ_BARS = 200;
const eqConfig = Array.from({ length: EQ_BARS }, (_, i) => ({
  delay: (Math.sin(i * 0.7) * 0.5 + 0.5) * 1.2,
  duration: 0.6 + Math.random() * 0.8,
  minH: 4 + Math.random() * 8,
  maxH: 20 + Math.random() * 45,
}));

const LISTENER_TYPE_COLORS: Record<string, { bg: string; accent: string; accent2: string }> = {
  mainstream:    { bg: '#1e1318', accent: '#e94560', accent2: '#f59e0b' },
  alternativo:   { bg: '#121a1f', accent: '#4ecdc4', accent2: '#818cf8' },
  explorador:    { bg: '#18131f', accent: '#c084fc', accent2: '#4ecdc4' },
  'eclético':    { bg: '#1a1520', accent: '#f59e0b', accent2: '#e94560' },
  'nostálgico':  { bg: '#1c1512', accent: '#e8956a', accent2: '#f472b6' },
  underground:   { bg: '#111a14', accent: '#a3e635', accent2: '#e879f9' },
  festeiro:      { bg: '#1a1220', accent: '#ec4899', accent2: '#06b6d4' },
  'melancólico': { bg: '#141420', accent: '#7c8cf5', accent2: '#c4748a' },
  default:       { bg: '#16141e', accent: '#818cf8', accent2: '#c084fc' },
};

const LOADING_MSGS = [
  'Carregando seus dados do Spotify...',
  'Buscando seus top artistas...',
  'Analisando seu histórico...',
  'Montando seu perfil musical...',
];

function getListenerColors(listenerType?: string) {
  if (!listenerType) return LISTENER_TYPE_COLORS.default;
  const key = listenerType.toLowerCase();
  return LISTENER_TYPE_COLORS[key] ?? LISTENER_TYPE_COLORS.default;
}

export function Home() {
  const { artists, profile, analysis, loading, analysisLoading, error, isAuthenticated, logout } = useSpotifyData()

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [prevLoading, setPrevLoading] = useState(loading);
  const [transitioning, setTransitioning] = useState(false);
  const [showCard, setShowCard] = useState(false);

  if (prevLoading !== loading) {
    setPrevLoading(loading);
    if (prevLoading && !loading && isAuthenticated && !error) {
      setTransitioning(true);
    }
  }

  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setLoadingMsgIdx(i => (i + 1) % LOADING_MSGS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [loading]);

  useEffect(() => {
    if (!transitioning) return;
    // Loading elements fade out for 1s, then show card
    const cardTimer = setTimeout(() => setShowCard(true), 900);
    const endTimer = setTimeout(() => {
      setTransitioning(false);
    }, 2200);
    return () => { clearTimeout(cardTimer); clearTimeout(endTimer); };
  }, [transitioning]);

  const colors = useMemo(
    () => getListenerColors(analysis?.analysis.listener_type),
    [analysis?.analysis.listener_type]
  );

  if (!isAuthenticated && !loading) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginGlow} />
        <div className={styles.loginContent}>
          <div className={styles.loginEqBars}>
            {eqConfig.slice(0, 5).map((b, i) => (
              <div
                key={i}
                className={styles.loginEqBar}
                style={{
                  '--dur': `${b.duration}s`,
                  '--delay': `${b.delay}s`,
                  '--max-h': `${16 + i * 6}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
          <h1 className={styles.loginTitle}>Music Tracker</h1>
          <p className={styles.loginSubtitle}>Descubra seu perfil musical</p>
          {error && <p className={styles.error}>{error}</p>}
          <a href={`${API_URL}/auth/login`} className={styles.loginButton}>
            <svg className={styles.spotifyIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Entrar com Spotify
          </a>
        </div>
        <span className={styles.loginBrand}>Music Tracker</span>
      </div>
    )
  }

  if (loading || (transitioning && !showCard)) {
    return (
      <div className={`${styles.loadingContainer}${transitioning ? ` ${styles.loadingExit}` : ''}`}>
        <div className={styles.eqLoadingBars}>
          {eqConfig.slice(0, 30).map((b, i) => (
            <div
              key={i}
              className={styles.eqLoadingBar}
              style={{
                '--min-h': `${b.minH}px`,
                '--max-h': `${b.maxH * 2.5}px`,
                '--dur':   `${b.duration}s`,
                '--delay': `${b.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
        <p className={styles.eqLoadingMsg}>{LOADING_MSGS[loadingMsgIdx]}</p>
        <div className={styles.eqDots}>
          <span>♩</span>
          <span>♩</span>
          <span>♩</span>
        </div>
        <span className={styles.eqBrand}>Music Tracker</span>
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
      className={`${styles.card}${transitioning ? ` ${styles.cardReveal}` : ''}`}
      style={{
        '--bg-color': colors.bg,
        '--accent-color': colors.accent,
        '--accent-color-2': colors.accent2,
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
                  <span className={styles.statValue}>{Math.round(analysis.stats.energy)}%</span>
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
                  <span className={styles.statValue}>{Math.round(analysis.stats.valence)}%</span>
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
                  <span className={styles.statValue}>{Math.round(analysis.stats.danceability)}%</span>
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