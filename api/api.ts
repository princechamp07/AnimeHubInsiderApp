import { TMDB_API_KEY } from '@/constant/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IAnime } from './types';

export interface PaginatedResult {
  results: IAnime[];
  totalPages: number;
}

export type EpisodeType = {
	episode: number;
	title: string;
	image: string;
  };

export interface Anime {
	id: string;
	title: {
		romaji: string;
		english?: string;
		native?: string;
	};
	coverImage: {
		large: string;
	};
}

  

type Episode = { episode: number; title: string; image: string };

const STORAGE_KEY_PREFIX = 'dubEpisodes_';

const API_URL = 'https://animehubinsider.com/anilist-proxy.php';

export async function fetchFromAniList(query: string, variables = {}) {
	try {
		const response = await axios.post(
			API_URL,
			{
				query,
				variables,
			},
			{
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);


		if (response.data.errors) {
			console.error('GraphQL Errors:', response.data.errors);
			throw new Error(response.data.errors[0]?.message || 'GraphQL Error');
		}

		return response.data.data;
	} catch (error) {
		console.error('Error fetching from AniList:', error);
		return { Page: { media: [] }, Media: null };
	}
}

export async function setCache<T>(key: string, data: T) {
	const cacheData = {
		timestamp: Date.now(),
		data,
	};
	try {
		await AsyncStorage.setItem(key, JSON.stringify(cacheData));
	} catch (error) {
		console.error('Error setting cache', error);
	}
}

export async function getCache<T = unknown>(key: string, maxAgeInMs: number) {
	try {
		const cache = await AsyncStorage.getItem(key);
		if (!cache) return null;

		const { timestamp, data } = JSON.parse(cache);

		if (Date.now() - timestamp < maxAgeInMs) {
			return data as T;
		} else {
			await AsyncStorage.removeItem(key);
			return null;
		}
	} catch (error) {
		console.error('Error getting cache', error);
		return null;
	}
}

export async function getOrSetCache<T>(
	key: string,
	maxAgeInMs: number,
	fetcher: () => Promise<T>,
): Promise<T> {
	try {
		const cache = await AsyncStorage.getItem(key);
		if (cache) {
			const { timestamp, data } = JSON.parse(cache);
			if (Date.now() - timestamp < maxAgeInMs) {
				return data as T;
			} else {
				await AsyncStorage.removeItem(key);
			}
		}

		const freshData = await fetcher();
		await AsyncStorage.setItem(
			key,
			JSON.stringify({ timestamp: Date.now(), data: freshData }),
		);
		return freshData;
	} catch (error) {
		console.error('Error in getOrSetCache:', error);
		return await fetcher(); // fallback to fresh fetch
	}
}


export async function fetchOngoingSeries(): Promise<IAnime[]> {
	const cacheKey = 'ongoingSeries1223123';
	const maxAge = 60 * 60 * 1000; 

	return getOrSetCache<IAnime[]>(cacheKey, maxAge, async () => {
		const query = `
      {
        Page(perPage: 12) {
          media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
            }
            coverImage {
              large
            }
            nextAiringEpisode {
              episode
              airingAt
            }
            episodes
            genres
            averageScore
          }
        }
      }
    `;

		const data = await fetchFromAniList(query);
		return data.Page.media as IAnime[];
	});
}

// Fetch latest episodes
export async function fetchLatestEpisodes() {
	const cacheKey = 'latestEpisodes';
	const cache = getCache(cacheKey, 60 * 60 * 1000); // 1 hour

	if (cache) {
		return cache;
	}

	const query = `
    {
      Page(perPage: 20) {
        media(type: ANIME, sort: UPDATED_AT_DESC) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          episodes
          genres
          averageScore
          seasonYear
        }
      }
    }
  `;

	const data = await fetchFromAniList(query);
	let media = data.Page.media;

	// Exclude anime with Hentai or Ecchi genres
	media = media.filter(
		(anime: any) =>
			!anime.genres.includes('Hentai') && !anime.genres.includes('Ecchi'),
	);

	setCache(cacheKey, media);
	return media;
}

// Fetch popular anime this week
export async function fetchPopularThisWeek() {
	const cacheKey = 'popularWeek';
	const cache = getCache(cacheKey, 60 * 60 * 1000); // 1 hour

	if (cache) {
		return cache;
	}

	const query = `
    {
      Page(perPage: 12) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          episodes
          genres
          averageScore
          seasonYear
        }
      }
    }
  `;

	const data = await fetchFromAniList(query);
	const media = data.Page.media;

	setCache(cacheKey, media);
	return media;
}

// Fetch anime movies
export async function fetchAnimeMovies() {
	const cacheKey = 'animeMovies';
	const cache = getCache(cacheKey, 60 * 60 * 1000); // 1 hour

	if (cache) {
		return cache;
	}

	const query = `
    {
      Page(perPage: 12) {
        media(type: ANIME, format: MOVIE, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          genres
          averageScore
          seasonYear
        }
      }
    }
  `;

	const data = await fetchFromAniList(query);
	const media = data.Page.media;

	setCache(cacheKey, media);
	return media;
}

// Fetch anime details by ID
export async function fetchAnimeDetails(id: string) {
	try {
		const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
          bannerImage
          description(asHtml: false)
          episodes
          nextAiringEpisode {
            episode
            airingAt
          }
          status
          seasonYear
          averageScore
          genres
          duration
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          relations {
            edges {
              relationType(version: 2)
              node {
                id
                title {
                  romaji
                }
                coverImage {
                  large
                }
                episodes
                type
                format
              }
            }
          }
          studios {
            nodes {
              name
            }
          }
        }
      }
    `;

		const variables = { id: parseInt(id) };

		const data = await fetchFromAniList(query, variables);

		if (!data || !data.Media) {
			console.error('No media data returned for ID:', id);
			return null;
		}

		return data.Media;
	} catch (error) {
		console.error(`Error fetching anime details for ID ${id}:`, error);
		return null;
	}
}

// Search anime by query
export async function searchMedia(
	query: string,
	genres: string[] = [],
	format: string = '',
) {
	const searchQuery = `
    query ($search: String, $genre_in: [String], $format: MediaFormat) {
      Page(perPage: 24) {
        media(type: ANIME, search: $search, genre_in: $genre_in, format: $format) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          episodes
          genres
          averageScore
          seasonYear
        }
      }
    }
  `;

	const variables: Record<string, any> = {
		search: query || undefined,
		genre_in: genres.length > 0 ? genres : undefined,
		format: format && format !== 'all' ? format.toUpperCase() : undefined,
	};

	const data = await fetchFromAniList(searchQuery, variables);
	return data.Page.media;
}

// Fetch anime by genre

export async function fetchMediaByGenre(genre: string) {
	const query = `
    {
      Page(perPage: 24) {
        media(type: ANIME, genre_in: ["${genre}"], sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          episodes
          genres
          averageScore
          seasonYear
        }
      }
    }
  `;

	const data = await fetchFromAniList(query);
	return {
		name: genre,
		items: data.Page.media,
	};
}

// Fetch all genres
type Genre = {
	id: string;
	name: string;
	count?: number; // optional because it's added later
};

export async function fetchGenres() {
	const cacheKey = 'genres';
	const cache = getCache(cacheKey, 24 * 60 * 60 * 1000); // 24 hours

	if (cache) {
		return cache;
	}

	const genres: Genre[] = [
		{ id: 'action', name: 'Action' },
		{ id: 'adventure', name: 'Adventure' },
		{ id: 'comedy', name: 'Comedy' },
		{ id: 'drama', name: 'Drama' },
		{ id: 'ecchi', name: 'Ecchi' },
		{ id: 'fantasy', name: 'Fantasy' },
		{ id: 'horror', name: 'Horror' },
		{ id: 'mahou_shoujo', name: 'Mahou Shoujo' },
		{ id: 'mecha', name: 'Mecha' },
		{ id: 'music', name: 'Music' },
		{ id: 'mystery', name: 'Mystery' },
		{ id: 'psychological', name: 'Psychological' },
		{ id: 'romance', name: 'Romance' },
		{ id: 'sci_fi', name: 'Sci-Fi' },
		{ id: 'slice_of_life', name: 'Slice of Life' },
		{ id: 'sports', name: 'Sports' },
		{ id: 'supernatural', name: 'Supernatural' },
		{ id: 'thriller', name: 'Thriller' },
	];

	for (const genre of genres) {
		const query = `
      {
        Page {
          media(type: ANIME, genre_in: ["${genre.name}"], sort: POPULARITY_DESC) {
            id
          }
        }
      }
    `;

		try {
			const data = await fetchFromAniList(query);
			genre.count = data.Page.media.length;
		} catch (error) {
			console.error(`Error fetching count for genre ${genre.name}:`, error);
			genre.count = 0;
		}
	}

	setCache(cacheKey, genres);
	return genres;
}

// Favorites management
export function getFavorites() {
	if (typeof window === 'undefined') return [];
	return JSON.parse(localStorage.getItem('favorites') || '[]');
}

export function toggleFavorite(anime: Anime) {
	if (typeof window === 'undefined') return false;

	let favorites = getFavorites();
	const isFavorite = favorites.some((fav: any) => fav.id === anime.id);

	if (isFavorite) {
		favorites = favorites.filter((fav: any) => fav.id !== anime.id);
	} else {
		favorites.push({
			id: anime.id,
			slug: anime.title.romaji
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, ''),
			title: anime.title.romaji,
			cover: anime.coverImage.large,
		});
	}

	localStorage.setItem('favorites', JSON.stringify(favorites));
	return !isFavorite;
}

export function isFavorite(id: string) {
	if (typeof window === 'undefined') return false;

	const favorites = getFavorites();
	return favorites.some((fav: any) => fav.id === id);
}

export function clearFavorites() {
	if (typeof window === 'undefined') return;
	localStorage.removeItem('favorites');
}

// Watch history management
export function saveWatchProgress(animeId: string, episode: number) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(`watching-${animeId}`, episode.toString());
}

export function getWatchProgress(animeId: string) {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(`watching-${animeId}`);
}

// Calculate time until next episode

// Fetch related media
export async function fetchRelatedMedia(mediaId: string, type = 'ANIME') {
	const query = `
    {
      Media(id: ${mediaId}, type: ${type}) {
        relations {
          edges {
            relationType(version: 2)
            node {
              id
              title {
                romaji
              }
              coverImage {
                large
              }
              type
              format
            }
          }
        }
      }
    }
  `;

	try {
		const data = await fetchFromAniList(query);
		const related = data.Media.relations.edges.map((edge: any) => edge.node);
		return related;
	} catch (error) {
		console.error('Failed to fetch related media:', error);
		return [];
	}
}

// lib/fetchEpisodes.ts

export async function fetchEpisodesFromOngoing(animeId: number) {
	const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
        }
        nextAiringEpisode {
          episode
        }
      }
    }
  `;

	const variables = { id: animeId };

	const response = await fetch('https://graphql.anilist.co', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({ query, variables }),
	});

	const json = await response.json();
	const nextEp = json?.data?.Media?.nextAiringEpisode?.episode;
	const episodeCount = nextEp ? nextEp - 1 : 1;

	return Array.from({ length: episodeCount }, (_, i) => ({
		episode: i + 1,
		title: `Episode ${i + 1}`,
	}));
}

// lib/fetchEpisodes.ts

export async function fetchEpisodesFromAniList(animeId: number): Promise<{
	episodes: EpisodeType[];
	nextAiringEpisode?: { episode: number; airingAt: number };
  }> {
	const query = `
	  query ($id: Int) {
		Media(id: $id, type: ANIME) {
		  id
		  title {
			romaji
			english
		  }
		  coverImage {
			large
		  }
		  episodes
		  nextAiringEpisode {
			episode
			airingAt
		  }
		}
	  }
	`;
  
	const variables = {
	  id: animeId,
	};
  
	const res = await fetch('https://graphql.anilist.co', {
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	  },
	  body: JSON.stringify({
		query,
		variables,
	  }),
	});
  
	const json = await res.json();
	const media = json.data.Media;
  
	const totalEpisodes = media.episodes || media.nextAiringEpisode?.episode - 1 || 12;
  
	const episodes: EpisodeType[] = Array.from({ length: totalEpisodes }, (_, i) => ({
	  episode: i + 1,
	  title: `${media.title.english || media.title.romaji} Episode ${i + 1}`,
	  image: media.coverImage.large,
	}));
  
	return {
	  episodes,
	  nextAiringEpisode: media.nextAiringEpisode,
	};
  }


export async function getCachedDubEpisodes(animeId: string): Promise<Episode[]> {
	try {
		const raw = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${animeId}`);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export async function saveCachedDubEpisodes(animeId: string, episodes: Episode[]) {
	try {
		await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${animeId}`, JSON.stringify(episodes));
	} catch (err) {
		console.error('Error saving dub episodes:', err);
	}
}



export async function fetchRelatedSeasons(animeId: number) {
	const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              episodes
            }
          }
        }
      }
    }
  `;

	const variables = { id: animeId };

	const res = await fetch('https://graphql.anilist.co', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query, variables }),
	});

	const data = await res.json();
	return data.data.Media.relations.edges;
}


export async function fetchTrendingAnime() {
	const query = `
	  query {
		Page(perPage: 20) {
		  media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
			id
			title {
			  romaji
			  english
			}
			genres
			averageScore
			coverImage {
			  extraLarge
			  large
			}
		  }
		}
	  }
	`;

	const res = await fetch('https://graphql.anilist.co', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	});

	const json = await res.json();
	return json.data.Page.media;
}



export async function fetchMovies() {
	const query = `
		query {
			Page(perPage: 20) {
				media(type: ANIME, format: MOVIE, sort: POPULARITY_DESC, isAdult: false) {
					id
					title {
						romaji
						english
					}
					genres
					averageScore
					coverImage {
						extraLarge
						large
					}
				}
			}
		}
	`;

	const res = await fetch('https://graphql.anilist.co', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	});

	const json = await res.json();
	return json.data.Page.media;
}


export async function fetchRecommendedAnime(): Promise<IAnime[]> {
	const query = `
	  query {
		Page(perPage: 20) {
		  recommendations(sort: RATING_DESC) {
			mediaRecommendation {
			  id
			  title {
				romaji
				english
			  }
			  genres
			  averageScore
			  coverImage {
				large
			  }
			}
		  }
		}
	  }
	`;

	const res = await fetch('https://graphql.anilist.co', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	});

	const json = await res.json();
	const items = json.data.Page.recommendations || [];

	return items
		.map((item: any) => item.mediaRecommendation)
		.filter(Boolean)
		.map((anime: any) => ({
			id: anime.id,
			title: anime.title,
			genres: anime.genres,
			averageScore: anime.averageScore ?? 0,
			coverImage: {
				large: anime.coverImage?.large,
			},
		}));
}

export async function searchAnimeByQuery(query: string) {
	const res = await fetch('https://graphql.anilist.co', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query: `
        query ($search: String) {
          Page(perPage: 20) {
            media(search: $search, type: ANIME, isAdult: false) {
              id
              title {
                romaji
                english
              }
              coverImage {
				large
			  }
              genres
            }
          }
        }
      `,
			variables: { search: query },
		}),
	});

	const json = await res.json();

	// 👇 Map to consistent format
	return json.data.Page.media.map((anime: any) => ({
		id: anime.id,
		title: anime.title,
		image: anime.coverImage?.large || anime.coverImage?.medium || anime.coverImage?.extraLarge,
		genres: anime.genres,
	}));
}

export async function fetchRandomAnimeSuggestions(): Promise<AnimeResult[]> {
	const query = `
	  query {
		Page(perPage: 10) {
		  media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
			id
			title {
			  romaji
			  english
			}
			coverImage {
			  large
			}
			genres
		  }
		}
	  }
	`;

	const res = await fetch('https://graphql.anilist.co', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	});

	const json = await res.json();
	const media = json.data.Page.media;

	// Shuffle and pick 5 random ones
	const shuffled = media.sort(() => 0.5 - Math.random());
	return shuffled.slice(0, 5).map((anime: any) => ({
		id: anime.id,
		title: anime.title,
		image: anime.coverImage.large,
		genres: anime.genres,
	}));
}

//-------------------Fetch by category anime -------------

const ANILIST_API = 'https://graphql.anilist.co';

interface CategoryQuery {
  sort?: string[];
  status?: string;
}

const CATEGORY_QUERIES: Record<string, CategoryQuery> = {
  ongoing: {
    sort: ['POPULARITY_DESC'],
    status: 'RELEASING',
  },
  trending: {
    sort: ['TRENDING_DESC'],
  },
  popular: {
    sort: ['POPULARITY_DESC'],
  },
  recommended: {
    sort: ['SCORE_DESC'],
  },
};

const query = `
  query (
    $page: Int,
    $perPage: Int,
    $sort: [MediaSort],
    $status: MediaStatus,
    $type: MediaType,
    $isAdult: Boolean
  ) {
    Page(page: $page, perPage: $perPage) {
      media(sort: $sort, status: $status, type: $type, isAdult: $isAdult) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        episodes
        genres
        averageScore
      }
    }
  }
`;

export async function fetchAnimeByCategory(
  category: string,
  page = 1,
  perPage = 15
): Promise<IAnime[]> {
  const categoryKey = category.toLowerCase().trim();

  const variables = {
    page,
    perPage,
    type: 'ANIME',
    isAdult: false, // ✅ Exclude NSFW
    ...CATEGORY_QUERIES[categoryKey] || CATEGORY_QUERIES['popular'],
  };

  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    const media = json?.data?.Page?.media;

    if (!Array.isArray(media)) {
      throw new Error('Invalid response from AniList');
    }

    const animeList: IAnime[] = media.map((anime: any) => ({
      id: anime.id,
      title: {
        romaji: anime.title?.romaji || 'Unknown',
        english: anime.title?.english || anime.title?.romaji || 'Unknown',
      },
      coverImage: {
        large: anime.coverImage?.large,
      },
      averageScore: anime.averageScore || 0,
      episodes: anime.episodes || 0,
      genres: anime.genres || [],
    }));

    console.log(`✅ Anime data fetched (${animeList.length} items) for category "${category}"`);
    return animeList;
  } catch (err) {
    console.error('❌ Error fetching anime by category:', err);
    return [];
  }
}



//-------------Movies Apis------------

// api/tmdb.ts

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

let genreMap: Record<number, string> = {};

async function loadGenres() {
  if (Object.keys(genreMap).length > 0) return;
  try {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    if (data?.genres) {
      data.genres.forEach((g: any) => {
        genreMap[g.id] = g.name;
      });
    }
  } catch (err) {
    console.warn("⚠️ Failed to load genres", err);
  }
}

export async function fetchBollywoodMovies(page: number = 1): Promise<{ results: IAnime[]; totalPages: number }> {
  await loadGenres();
  return fetchMoviesByLanguage('hi', page);
}


export async function fetchHollywoodMovies(page: number = 1): Promise<{ results: IAnime[]; totalPages: number }> {
  await loadGenres();
  return fetchMoviesByLanguage('en',page);
}


export async function fetchTrendingMovies(page: number = 1): Promise<{
  results: IAnime[];
  totalPages: number;
}> {
  await loadGenres(); // preload genre map
  return fetchMoviesFromMoviesApi(page); // pass page to the paginated API function
}


export async function fetchRelatedMovies(movieId: number): Promise<IAnime[]> {
  try {
      const response = await fetch(
          `${BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`
      );

      if (!response.ok) throw new Error('Failed to fetch related movies');

      const data = await response.json();
      const movies = data.results;

      const relatedWithIMDb = await Promise.all(
          movies.map(async (movie: any) => {
              let imdbId = '';
              try {
                  const externalRes = await fetch(
                      `${BASE_URL}/movie/${movie.id}/external_ids?api_key=${TMDB_API_KEY}`
                  );
                  if (externalRes.ok) {
                      const externalData = await externalRes.json();
                      imdbId = externalData.imdb_id || '';
                  }
              } catch (e) {
                  console.warn(`⚠️ Failed to fetch IMDb ID for movie ${movie.id}`);
              }

              // ✅ Fallback to TMDB movie ID as a fake IMDb ID if missing
              const fallbackImdbId = imdbId || `tmdb-${movie.id}`;

              return {
                  id: movie.id,
                  imdbId: fallbackImdbId,
                  title: {
                      romaji: movie.title,
                      english: movie.original_title || movie.title,
                  },
                  coverImage: {
                      large: movie.poster_path
                          ? `${IMAGE_BASE}${movie.poster_path}`
                          : 'https://placehold.co/500x750?text=No+Image',
                  },
                  averageScore: movie.vote_average
                      ? Number(movie.vote_average.toFixed(1))
                      : 0,
                  episodes: 1,
                  genres:
                      movie.genre_ids?.map(
                          (id: number) => genreMap[id] || `Unknown-${id}`
                      ) ?? [],
                  year: parseInt((movie.release_date || '0000').substring(0, 4)) || 0,
                  type: 'Movie',
              };
          })
      );

      return relatedWithIMDb;
  } catch (err) {
      console.error('❌ TMDB fetchRelatedMovies error:', err);
      return [];
  }
}



export async function searchMovieByQuery(query: string): Promise<IAnime[]> {
  if (!query.trim()) return [];

  await loadGenres();

  const res = await fetch(
    `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`
  );
  const data = await res.json();

  const results: IAnime[] = [];

  for (const movie of data.results.slice(0, 10)) {
    try {
      const imdbRes = await fetch(`${BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}`);
      const imdbData = await imdbRes.json();

      results.push({
        id: movie.id,
        imdbId: imdbData.imdb_id || undefined,
        title: {
          romaji: movie.title,
          english: movie.original_title || movie.title,
        },
        coverImage: {
          large: movie.poster_path
            ? `${IMAGE_BASE}${movie.poster_path}`
            : 'https://placehold.co/500x750?text=No+Image',
        },
        averageScore: movie.vote_average ? Number(movie.vote_average.toFixed(1)) : 0,
        episodes: 1,
        genres: movie.genre_ids?.map(id => genreMap[id] || `Unknown-${id}`) ?? [],
        year: parseInt((movie.release_date || '0000').substring(0, 4)) || 0,
        type: 'Movie',
      });
    } catch (err) {
      console.error(`❌ Failed search enrichment for ${movie.title}`, err);
    }
  }

  return results;
}

export async function fetchMoviesByLanguage(
  lang: string,
  page: number = 1
): Promise<PaginatedResult> {
  const results: IAnime[] = [];
  const url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${lang}&page=${page}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data?.results || data.results.length === 0) {
      return { results: [], totalPages: 0 };
    }

    for (const movie of data.results) {
      try {
        const imdbRes = await fetch(`${BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}`);
        const imdbData = await imdbRes.json();

        results.push({
          id: movie.id,
          imdbId: imdbData.imdb_id || undefined,
          title: {
            romaji: movie.title,
            english: movie.original_title || movie.title,
          },
          coverImage: {
            large: movie.poster_path
              ? `${IMAGE_BASE}${movie.poster_path}`
              : 'https://placehold.co/500x750?text=No+Image',
          },
          averageScore: movie.vote_average ? Number(movie.vote_average.toFixed(1)) : 0,
          episodes: 1,
          genres: movie.genre_ids?.map((id) => genreMap[id] || `Unknown-${id}`) ?? [],
          year: parseInt((movie.release_date || '0000').substring(0, 4)) || 0,
          type: 'Movie',
        });
      } catch (err) {
        console.error(`❌ TMDB enrichment failed for movie ID ${movie.id}`, err);
      }
    }

    return {
      results,
      totalPages: data.total_pages || 1,
    };
  } catch (err) {
    console.error(`❌ Failed to fetch movies for lang=${lang} page=${page}`, err);
    return { results: [], totalPages: 0 };
  }
}


export async function fetchMoviesFromMoviesApi(page: number = 1): Promise<{
  results: IAnime[];
  totalPages: number;
}> {
  const res = await fetch(`https://moviesapi.to/api/discover/movie?direction=desc&page=${page}`);
  const json = await res.json();

  if (!json?.result || !json?.data) {
    return { results: [], totalPages: 1 };
  }

  const movies = json.data;
  const totalPages = json.totalPages || 1;

  const enriched = await Promise.all(
    movies.map(async (movie: any) => {
      try {
        const tmdbRes = await fetch(
          `${BASE_URL}/movie/${movie.tmdbid}?api_key=${TMDB_API_KEY}`
        );
        const tmdbData = await tmdbRes.json();

        return {
          id: movie.id,
          imdbId: tmdbData.imdb_id || undefined,
          title: {
            romaji: tmdbData.title || movie.orig_title,
            english: tmdbData.original_title || tmdbData.title || movie.orig_title,
          },
          coverImage: {
            large: tmdbData.poster_path
              ? `${IMAGE_BASE}${tmdbData.poster_path}`
              : 'https://placehold.co/500x750?text=No+Image',
          },
          averageScore: tmdbData.vote_average
            ? Number(tmdbData.vote_average.toFixed(1))
            : 0,
          episodes: 1,
          genres: tmdbData.genres?.map((g: any) => g.name || `Unknown-${g.id}`) ?? [],
          year: movie.year || 0,
          type: movie.type || 'Movie',
        };
      } catch (err) {
        console.error(`❌ TMDB fetch failed for ${movie.orig_title}`, err);
        return null;
      }
    })
  );

  return {
    results: enriched.filter(Boolean) as IAnime[],
    totalPages,
  };
}




//---------------------Fetch Movies for see all by category----------

export async function fetchMoviesByCategory(
  category: string,
  page: number = 1,
  limit: number = 20
): Promise<{ results: IAnime[]; totalPages: number }> {
  console.log(`📥 [Category Fetch] Requested category: "${category}", page: ${page}, limit: ${limit}`);

  const normalized = category.toLowerCase().trim();
  console.log(`🔍 Normalized category: "${normalized}"`);

  const staticCategoryMap: Record<string, (page: number) => Promise<{ results: IAnime[]; totalPages: number }>> = {
    bollywood: fetchBollywoodMovies,
    hollywood: fetchHollywoodMovies,
    trending: fetchTrendingMovies,
    all: fetchAllMovies,
  };

  if (normalized in staticCategoryMap) {
    const { results, totalPages } = await staticCategoryMap[normalized](page);
    return { results, totalPages };
  }

  let results: IAnime[] = [];
  let totalPages = 1;


  const validMovies = results.filter((m): m is IAnime => !!m && !!m.coverImage?.large);

  console.log(`✅ Fetched: ${validMovies.length}, Page: ${page} of ${totalPages}`);
  return {
    results: validMovies,
    totalPages,
  };
}


export async function fetchMoviesByGenre(genreName: string): Promise<IAnime[]> {
  const allMovies: IAnime[] = [];
  let page = 1;
  const resultsPerPage = 30;
  const normalizedGenre = genreName.toLowerCase().trim();

  while (true) {
    const url = `https://moviesapi.to/api/discover/movie?direction=desc&page=${page}&resultsPerPage=${resultsPerPage}`;

    try {
      const res = await fetch(url);
      const json = await res.json();

      if (!json?.data || json.data.length === 0) break;

      const filtered = json.data.filter((movie: any) =>
        movie.genres?.some((g: string) => g.toLowerCase() === normalizedGenre)
      );

      const enriched = await Promise.all(
        filtered.map(async (movie: any) => {
          try {
            const tmdbRes = await fetch(
              `https://api.themoviedb.org/3/movie/${movie.tmdbid}?api_key=${TMDB_API_KEY}`
            );
            const tmdbData = await tmdbRes.json();

            return {
              id: movie.id,
              imdbId: tmdbData.imdb_id || undefined,
              title: {
                romaji: tmdbData.title || movie.orig_title,
                english: tmdbData.original_title || tmdbData.title || movie.orig_title,
              },
              coverImage: {
                large: tmdbData.poster_path
                  ? `${IMAGE_BASE}${tmdbData.poster_path}`
                  : 'https://placehold.co/500x750?text=No+Image',
              },
              averageScore: tmdbData.vote_average
                ? Number(tmdbData.vote_average.toFixed(1))
                : 0,
              episodes: 1,
              genres: tmdbData.genres?.map((g: any) => g.name) ?? [],
              year: parseInt((tmdbData.release_date || '0000').substring(0, 4)) || 0,
              type: 'Movie',
            };
          } catch (err) {
            console.error(`❌ TMDB fetch failed for ${movie.orig_title}`, err);
            return null;
          }
        })
      );

      allMovies.push(...enriched.filter(Boolean));

      if (json.data.length < resultsPerPage) break; // Last page
      page++;
    } catch (err) {
      console.error(`❌ Error fetching page ${page} from moviesapi.to`, err);
      break;
    }
  }

  return allMovies;
}



//---------------All Movies ---------------

export async function fetchAllMovies(page: number = 1): Promise<{ results: IAnime[]; totalPages: number }> {
  try {
    console.log("📥 Fetching all movies, page:", page);

    const res = await fetch(`https://moviesapi.to/api/discover/movie?direction=desc&page=${page}`);
    const json = await res.json();
    console.log("📦 API raw JSON:", json);

    if (!json?.data || !json?.data.length) {
      return { results: [], totalPages: 1 };
    }

    const movies = json.data;
    const totalPages = json.last_page || 1;  // ✅ Corrected here

    const enriched = await Promise.all(
      movies.map(async (movie: any) => {
        try {
          const tmdbRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.tmdbid}?api_key=${TMDB_API_KEY}`
          );
          const tmdbData = await tmdbRes.json();

          return {
            id: movie.id,
            imdbId: tmdbData.imdb_id || undefined,
            title: {
              romaji: tmdbData.title || movie.orig_title,
              english: tmdbData.original_title || tmdbData.title || movie.orig_title,
            },
            coverImage: {
              large: tmdbData.poster_path
                ? `${IMAGE_BASE}${tmdbData.poster_path}`
                : 'https://placehold.co/500x750?text=No+Image',
            },
            averageScore: tmdbData.vote_average ? Number(tmdbData.vote_average.toFixed(1)) : 0,
            episodes: 1,
            genres:
              tmdbData.genres?.map((g: any) => g.name) ??
              (tmdbData.genre_ids?.map((id: number) => genreMap[id] || 'Unknown') ?? []),
            year: movie.year,
            type: movie.type || 'Movie',
          };
        } catch (err) {
          console.error(`❌ TMDB fetch failed for ${movie.orig_title}`, err);
          return null;
        }
      })
    );

    return {
      results: enriched.filter(Boolean) as IAnime[],
      totalPages,
    };
  } catch (error) {
    console.error('❌ Failed to fetch all movies:', error);
    return { results: [], totalPages: 1 };
  }
}


export type SpotlightAnime = {
	_id: string;
	title: string;
	cover: string;
	storyLine: string;
	genre: string[];
};

export async function fetchSpotlightAnime(): Promise<SpotlightAnime[]> {
	try {
		const postsRes = await axios.get(
			'https://toonhub4u.me/wp-json/wp/v2/posts?categories=46&per_page=10&_embed'
		);
		const posts = postsRes.data;

		const formatted: SpotlightAnime[] = posts.map((post: any) => {
			const cover =
				post.uagb_featured_image_src?.['large']?.[0] ||
				post.rttpg_featured_image_url?.['large']?.[0] ||
				post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
				post.jetpack_featured_media_url ||
				'https://placehold.co/600x300?text=No+Image';

			const genres = post.rttpg_category
				? Array.from(post.rttpg_category.matchAll(/>(.*?)<\/a>/g)).map((m) => m[1])
				: [];

			return {
				_id: post.id.toString(),
				title: post.title.rendered,
				cover,
				storyLine: '',
				genre: genres,
			};
		});

		return formatted;
	} catch (error) {
		console.error('❌ Error fetching spotlight:', error);
		return [];
	}
}

// api.ts


export type ActionAdventureAnime = {
	_id: string;
	title: string;
	cover: string;
	storyLine: string;
	genre: string[];
};

export async function fetchActionAdventure(): Promise<ActionAdventureAnime[]> {
	try {
		const postsRes = await axios.get(
			'https://toonhub4u.me/wp-json/wp/v2/posts?categories=47&per_page=10&_embed'
		);
		const posts = postsRes.data;

		const formatted: ActionAdventureAnime[] = posts.map((post: any) => {
			const cover =
				post.uagb_featured_image_src?.['large']?.[0] ||
				post.rttpg_featured_image_url?.['large']?.[0] ||
				post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
				post.jetpack_featured_media_url ||
				'https://placehold.co/600x300?text=No+Image';

			const genres = post.rttpg_category
				? Array.from(post.rttpg_category.matchAll(/>(.*?)<\/a>/g)).map((m) => m[1])
				: [];

			return {
				_id: post.id.toString(),
				title: post.title.rendered,
				cover,
				storyLine: '',
				genre: genres,
			};
		});

		return formatted;
	} catch (error) {
		console.error('❌ Error fetching spotlight:', error);
		return [];
	}
}



export async function fetchAmazonPrime(): Promise<ActionAdventureAnime[]> {
	try {
		const postsRes = await axios.get(
			'https://toonhub4u.me/wp-json/wp/v2/posts?categories=40655&per_page=10&_embed'
		);
		const posts = postsRes.data;

		const formatted: ActionAdventureAnime[] = posts.map((post: any) => {
			const cover =
				post.uagb_featured_image_src?.['large']?.[0] ||
				post.rttpg_featured_image_url?.['large']?.[0] ||
				post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
				post.jetpack_featured_media_url ||
				'https://placehold.co/600x300?text=No+Image';

			const genres = post.rttpg_category
				? Array.from(post.rttpg_category.matchAll(/>(.*?)<\/a>/g)).map((m) => m[1])
				: [];

			return {
				_id: post.id.toString(),
				title: post.title.rendered,
				cover,
				storyLine: '',
				genre: genres,
			};
		});

		return formatted;
	} catch (error) {
		console.error('❌ Error fetching spotlight:', error);
		return [];
	}
}

export async function fetchCartoonShows(): Promise<ActionAdventureAnime[]> {
	try {
		const postsRes = await axios.get(
			'https://toonhub4u.me/wp-json/wp/v2/posts?categories=39050&per_page=10&_embed'
		);
		const posts = postsRes.data;

		const formatted: ActionAdventureAnime[] = posts.map((post: any) => {
			const cover =
				post.uagb_featured_image_src?.['large']?.[0] ||
				post.rttpg_featured_image_url?.['large']?.[0] ||
				post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
				post.jetpack_featured_media_url ||
				'https://placehold.co/600x300?text=No+Image';

			const genres = post.rttpg_category
				? Array.from(post.rttpg_category.matchAll(/>(.*?)<\/a>/g)).map((m) => m[1])
				: [];

			return {
				_id: post.id.toString(),
				title: post.title.rendered,
				cover,
				storyLine: '',
				genre: genres,
			};
		});

		return formatted;
	} catch (error) {
		console.error('❌ Error fetching spotlight:', error);
		return [];
	}
}

export async function fetchCrunchyRoll(): Promise<ActionAdventureAnime[]> {
	try {
		const postsRes = await axios.get(
			'https://toonhub4u.me/wp-json/wp/v2/posts?categories=40&per_page=10&_embed'
		);
		const posts = postsRes.data;

		const formatted: ActionAdventureAnime[] = posts.map((post: any) => {
			const cover =
				post.uagb_featured_image_src?.['large']?.[0] ||
				post.rttpg_featured_image_url?.['large']?.[0] ||
				post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
				post.jetpack_featured_media_url ||
				'https://placehold.co/600x300?text=No+Image';

			const genres = post.rttpg_category
				? Array.from(post.rttpg_category.matchAll(/>(.*?)<\/a>/g)).map((m) => m[1])
				: [];

			return {
				_id: post.id.toString(),
				title: post.title.rendered,
				cover,
				storyLine: '',
				genre: genres,
			};
		});

		return formatted;
	} catch (error) {
		console.error('❌ Error fetching spotlight:', error);
		return [];
	}
}

export async function fetchAllAnimes(): Promise<ActionAdventureAnime[]> {
	try {
		const postsRes = await axios.get(
			'https://toonhub4u.me/wp-json/wp/v2/posts?per_page=10&_embed'

		);
		const posts = postsRes.data;

		const formatted: ActionAdventureAnime[] = posts.map((post: any) => {
			const cover =
				post.uagb_featured_image_src?.['large']?.[0] ||
				post.rttpg_featured_image_url?.['large']?.[0] ||
				post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
				post.jetpack_featured_media_url ||
				'https://placehold.co/600x300?text=No+Image';

			const genres = post.rttpg_category
				? Array.from(post.rttpg_category.matchAll(/>(.*?)<\/a>/g)).map((m) => m[1])
				: [];

			return {
				_id: post.id.toString(),
				title: post.title.rendered,
				cover,
				storyLine: '',
				genre: genres,
			};
		});

		return formatted;
	} catch (error) {
		console.error('❌ Error fetching spotlight:', error);
		return [];
	}
}

export async function searchAnimes(query: string): Promise<ActionAdventureAnime[]> {
	try {
		const postsRes = await axios.get(
			'https://toonhub4u.me/wp-json/wp/v2/posts',
			{
				params: {
					search: query,
					per_page: 10,
					_embed: true,
					orderby: 'relevance',
					order: 'desc',
				},
			}
		);

		const posts = postsRes.data;

		const formatted: ActionAdventureAnime[] = posts.map((post: any) => {
			const cover =
				post.uagb_featured_image_src?.['large']?.[0] ||
				post.rttpg_featured_image_url?.['large']?.[0] ||
				post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
				post.jetpack_featured_media_url ||
				'https://placehold.co/600x300?text=No+Image';

			const genres = post.rttpg_category
				? Array.from(post.rttpg_category.matchAll(/>(.*?)<\/a>/g)).map((m) => m[1])
				: [];

			return {
				_id: post.id.toString(),
				title: post.title.rendered,
				cover,
				storyLine: '',
				genre: genres,
			};
		});

		return formatted;
	} catch (error) {
		console.error('❌ Error searching animes:', error);
		return [];
	}
}