export interface AlbumReturn {
	image: string
	name: string
	artist: string
}

export interface AlbumResults {
	'opensearch:Query': {
		'#text': string
		role: string
		searchTerms: string
		startPage: string
	}
	'opensearch:totalResults': string
	'opensearch:startIndex': string
	'opensearch:itemsPerPage': string
	albummatches: {
		album: Album[]
	}
	'@attr': {
		for: string
	}
}

export interface Album {
	name: string
	artist: string
	url: string
	image: [
		{
			'#text': string
			size: 'small'
		},
		{
			'#text': string
			size: 'medium'
		},
		{
			'#text': string
			size: 'large'
		},
		// use this one image[3]
		{
			'#text': string
			size: 'extralarge'
		}
	]
	streamable: string
	mbid: string
}
