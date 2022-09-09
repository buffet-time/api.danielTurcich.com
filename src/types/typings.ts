import { OctokitResponse } from '@octokit/types'

export enum Release {
	artist,
	name,
	score,
	type,
	year,
	genre,
	comments
}

export type GithubTreeResponse = OctokitResponse<
	{
		sha: string
		url: string
		truncated: boolean
		tree: {
			path?: string | undefined
			mode?: string | undefined
			type?: string | undefined
			sha?: string | undefined
			size?: number | undefined
			url?: string | undefined
		}[]
	},
	200
>

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
