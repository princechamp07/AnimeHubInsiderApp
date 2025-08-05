// file: getTotalEpisodes.ts
import axios from 'axios';

export async function getTotalEpisodes(seasonId: number): Promise<number | null> {
	const url = `https://www.satoru.one/ajax/episode/list/${seasonId}`;

	try {
		const res = await axios.get(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0',
				'X-Requested-With': 'XMLHttpRequest',
			},
		});

		const html = res.data?.html;

		if (!html) {
			console.warn('❌ No HTML found in response.');
			return null;
		}

		// Match all episode numbers
		const episodeMatches = [...html.matchAll(/data-number="(\d+)"/g)];
		const episodeNumbers = episodeMatches.map(match => parseInt(match[1], 10));

		if (episodeNumbers.length === 0) {
			console.warn('⚠️ No episodes found.');
			return 0;
		}

		const totalEpisodes = Math.max(...episodeNumbers);
		return totalEpisodes;
	} catch (err: any) {
		console.error('⚠️ Error fetching episode list:', err.message);
		return null;
	}
}
