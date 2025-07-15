export interface IAnime {
	id: number;
	imdbId?: string; 
	title: {
		romaji: string;
		english?: string;
	};
	coverImage: {
		large: string;
	};
	nextAiringEpisode?: {
		episode: number;
		airingAt: number;
	};
	episodes: number | null;
	genres: string[];
	averageScore: number;
}
