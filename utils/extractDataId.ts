import axios from 'axios';

export async function extractDataId(slug: string): Promise<string | null> {
	const url = `https://www.satoru.one/watch/${slug}`;

	try {
		const { data: html } = await axios.get(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0',
			},
		});

		const regex = new RegExp(
			`<a[^>]+href=["']https://www\\.satoru\\.one/watch/${slug}["'][^>]+class=["'][^"']*film-poster-ahref item-qtip[^"']*["'][^>]*data-id=["'](\\d+)["']`,
			'i'
		);

		const match = html.match(regex);
		return match?.[1] || null;
	} catch (err) {
		console.error('Error extracting data-id:', err.message);
		return null;
	}
}
