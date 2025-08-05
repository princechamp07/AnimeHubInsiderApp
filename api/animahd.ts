import axios from 'axios'
import { Buffer } from 'buffer'

const BASE_URL = 'https://animahd.com/api/main'
const FOLDER_API = `${BASE_URL}/cms/getFolderData`
const WATCH_BASE_URL = 'https://watch.animahd.com/watch'

export interface AnimeItem {
	id: string
	title: string
	poster: string
	folderId: string
	slug: string
	genres: string[]
	episodes: string
	year: string
	trailer: string
}

export interface EpisodeItem {
	id: string
	name: string
	duration: string
	thumbnail: string
	driveId: string
}

export const fetchOngoingAnime = async (): Promise<AnimeItem[]> => {
	const url = `${BASE_URL}/movie/category/Ongoing%20Anime?originatedFrom=Carsoul`
	const res = await axios.get(url)
	return res.data.map((item: any) => ({
		id: item._id,
		title: item.title,
		poster: `https://animahd.com/${item.poster}`,
		folderId: item.folders?.[0]?.folderId || '',
		slug: item.url,
		genres: item.genre,
		episodes: item.episodes,
		year: item.releaseYear,
		trailer: item.trailer,
	}))
}

export const fetchEpisodeList = async (folderId: string): Promise<EpisodeItem[]> => {
	const res = await axios.get(`${FOLDER_API}/${folderId}`)
	return res.data.map((ep: any) => ({
		id: ep._id,
		name: ep.name,
		duration: ep.duration,
		thumbnail: ep.thumbnailLink,
		driveId: ep.id,
	}))
}

export const getEpisodeIframeSrc = async (ep: EpisodeItem): Promise<string | null> => {
	const baseStr = `${ep.id}:${Date.now()}:${ep.name}`
	const encoded = Buffer.from(baseStr).toString('base64')
	const watchUrl = `${WATCH_BASE_URL}/${encoded}`

	const res = await axios.get(watchUrl)
	const iframeMatch = res.data.match(/<iframe[^>]+src="([^"]+)"[^>]*id="videoFrame"/)

	iframeMatch?.[1]
	return iframeMatch ? iframeMatch[1] : null
}
