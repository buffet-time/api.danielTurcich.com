import { lastFmApiKey } from './credentials/apiKey'
import type {
	AlbumReturn,
	AlbumResults,
	TopAlbumsResult
} from '../types/typings'
import Fastify from 'fastify'
import FastifyCors from '@fastify/cors'
import { ProperFetch } from '../shared/shared'

const fastify = Fastify()
const port = 3030 //deltron
const apiBaseUrl = 'https://ws.audioscrobbler.com/2.0/'
const grayImageUrl = 'https://i.imgur.com/5IYcmZz.jpeg'

const searchBaseUrl = `${apiBaseUrl}?method=album.search&album=`
const topAlbumBaseUrl = `${apiBaseUrl}?method=user.gettopalbums&user=`
//  /2.0/?method=user.gettopalbums&user=rj&api_key=YOUR_API_KEY&format=json

type LastfmPeriod =
	| 'overall'
	| '7day'
	| '1month'
	| '3month'
	| '6month'
	| '12month'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
await fastify.register(FastifyCors)

const searchRequestMax = 50
const searchRequestMinimum = 10
fastify.get<{
	Querystring: {
		limit: number
		album: string
	}
	IReply: AlbumReturn[]
}>('/Search', async (request, reply) => {
	try {
		// console.log(10)
		let requestLimit = searchRequestMinimum

		// limit max to 50 and ensure its at least 10
		if (
			request.query.limit &&
			request.query.limit <= searchRequestMax &&
			request.query.limit >= searchRequestMinimum
		) {
			// console.log(11)
			requestLimit = request.query.limit
		}

		const apiUrl = `${searchBaseUrl}${request.query.album}&api_key=${lastFmApiKey}&limit=${requestLimit}&format=json`

		console.log(12, apiUrl)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const results: AlbumResults = await ProperFetch(apiUrl)
		// console.log(13, results.results.albummatches.album[0])
		// console.table(14, )

		const massagedResponse: AlbumReturn[] = []
		// console.log(14, massagedResponse)

		results.results.albummatches.album.forEach((album) => {
			massagedResponse.push({
				image: album.image[3]['#text'] ? album.image[3]['#text'] : grayImageUrl,
				artist: album.artist ? album.artist : 'Placeholder Artist',
				name: album.name ? album.name : 'Placeholder Album'
			})
		})

		// console.log(15, massagedResponse)

		await reply.send(massagedResponse)
	} catch (error: any) {
		console.log(`Error in /Search request:\n ${error}`)
	}
})

const requestMax = 100
const requestMinimum = 1
fastify.get<{
	Querystring: {
		period: LastfmPeriod
		limit: number
		user: string
	}
}>('/TopAlbums', async (request, reply) => {
	try {
		let requestLimit = requestMinimum

		// limit max to 100 and ensure its at least 1
		if (
			request.query.limit &&
			request.query.limit <= requestMax &&
			request.query.limit >= requestMinimum
		) {
			requestLimit = request.query.limit
		}

		const requestPeriod = request.query.period ? request.query.period : '1month'
		const apiUrl = `${topAlbumBaseUrl}${request.query.user}&api_key=${lastFmApiKey}&period=${requestPeriod}&limit=${requestLimit}&format=json`
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const results: TopAlbumsResult = await ProperFetch(apiUrl)

		const values = (await Promise.all(
			results.topalbums.album.map((album) =>
				ProperFetch(
					`http://localhost:${port}/Search?album=${encodeURIComponent(
						album.artist.name
					)}`
				)
			)
		)) as AlbumReturn[]

		const returnArray: AlbumReturn[] = values.map((album) => album)

		void reply.send(returnArray)
	} catch (error: any) {
		console.log(`Error in /Search request:\n ${error}`)
	}
})

start()

function start() {
	try {
		fastify.listen({ port: port }, (error: any) => {
			if (error) {
				console.log(error)
			}
		})
		console.log(`Listening on port: ${port}`)
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}
