import { IAnime } from '@/api';

export function filterUniqueMovies(movies: IAnime[], usedIds: Set<number>): IAnime[] {
	return movies.filter((movie) => {
		if (usedIds.has(movie.id)) return false;
		usedIds.add(movie.id);
		return true;
	});
}
