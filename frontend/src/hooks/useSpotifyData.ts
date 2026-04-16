import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3333';

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

export function useSpotifyData()
{
    const [tracks, setTracks] = useState<Track[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        async function fetchData()
        {
            try {
                setLoading(true);
                setError(null);

                const [tracksRes, artistsRes] = await Promise.all([
                    api.get('/me/top-tracks'),
                    api.get('/me/top-artists')
                ]);

                setTracks(tracksRes.data.tracks);
                setArtists(artistsRes.data.artists);
                setIsAuthenticated(true);
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
            await api.post('/auth/logout');
            setIsAuthenticated(false);
            setTracks([]);
            setArtists([]);
            setError(null);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return { tracks, artists, loading, error, isAuthenticated, logout };
}