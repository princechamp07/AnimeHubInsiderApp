import { IAnime } from "./anime.types";

export interface IOngoingSeriesResponse {
	data: {
		Page: {
			media: IAnime[];
		};
	};
}

