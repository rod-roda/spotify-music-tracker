import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

interface Track {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
        name: string;
        images: Array<{ url: string }>;
    };
    popularity?: number;
}

interface Artist {
    id: string;
    name: string;
    genres?: string[];
    image: string;
}

interface Profile {
    displayName: string;
    avatarUrl: string | null;
}

type ListenerType =
    | "mainstream"
    | "alternativo"
    | "explorador"
    | "eclético"
    | "nostálgico"
    | "underground"
    | "festeiro"
    | "melancólico";

interface Analysis {
    stats: {
        energy: number;
        valence: number;
        danceability: number;
    };
    persona: string;
    analysis: {
        main_genres: string[];
        mood: string;
        listener_type: ListenerType;
        summary: string;
    };
}

export function useSpotifyData()
{
    const [tracks, setTracks] = useState<Track[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        async function fetchData()
        {
            try {
                setLoading(true);
                setError(null);

                const [tracksRes, artistsRes, profileRes] = await Promise.all([
                    api.get('/me/top-tracks'),
                    api.get('/me/top-artists'),
                    api.get('/me/profile'),
                ]);

                setTracks(tracksRes.data.tracks);
                setArtists(artistsRes.data.artists);
                setProfile(profileRes.data);
                setIsAuthenticated(true);

                // Fetch analysis separately (it's slower due to AI call)
                setAnalysisLoading(true);
                try {
                    const analysisRes = await api.get('/me/analysis');
                    setAnalysis(analysisRes.data.analysis);
                } catch (err) {
                    console.error('Error fetching analysis:', err);
                } finally {
                    setAnalysisLoading(false);
                }
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        setError('Not authenticated. Please login.');
                        setIsAuthenticated(false);
                    } else if (err.response?.status === 502) {
                        setError('Failed to connect to Spotify. Please try again later.');
                    } else {
                        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch data';
                        setError(errorMsg);
                    }
                } else {
                    setError('An unexpected error occurred');
                }
                console.error('Error fetching Spotify data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const logout = async () => {
        try {
            await api.get('/auth/logout');
            setIsAuthenticated(false);
            setTracks([]);
            setArtists([]);
            setProfile(null);
            setAnalysis(null);
            setError(null);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return { tracks, artists, profile, analysis, loading, analysisLoading, error, isAuthenticated, logout };
}