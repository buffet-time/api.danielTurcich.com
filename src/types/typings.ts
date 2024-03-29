export enum Release {
	artist,
	name,
	score,
	type,
	year,
	genre,
	comments
}

export interface AlbumReturn {
	image: string
	name: string
	artist: string
}

export interface AlbumResults {
	results: {
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
}

interface Album {
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

export interface SpreadsheetParams {
	id: string
	range: string
}

export interface StatsObject {
	numberOfReleases: string | number
	averageYear: string | number
	averageScore: string | number
	numberOfArtists: string | number
	releasesPerYear: number[]
	currentYear: number
	earliestYear: number
}

export enum ReleasesIn {
	'1950s',
	'1960s',
	'1970s',
	'1980s',
	'1990s',
	'2000s',
	'2010s',
	'2020s'
}

interface TopAlbumsArrayImageObject {
	size: string
	'#text': ''
}

interface TopAlbumsArrayObject {
	artist: {
		url: string
		name: string
		mbid: string
	}
	image: TopAlbumsArrayImageObject[]
	mbid: string
	url: string
	playcount: string
	'@attr': { rank: string }
	name: string
}

export interface TopAlbumsResult {
	topalbums: {
		album: TopAlbumsArrayObject[]
		'@attr': {
			user: string
			totalPages: string
			page: string
			perPage: string
			total: string
		}
	}
}
