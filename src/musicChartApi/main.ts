/* eslint-disable @typescript-eslint/ban-ts-comment */
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

fastify.register(FastifyCors)

const searchRequestMax = 50
const searchRequestMinimum = 10
fastify.get('/Search', async (request: any, reply: any) => {
	try {
		let requestLimit = searchRequestMinimum

		// limit max to 50 and ensure its at least 10
		if (
			request.query.limit &&
			request.query.limit <= searchRequestMax &&
			request.query.limit >= searchRequestMinimum
		) {
			requestLimit = request.query.limit
		}

		const apiUrl = `${searchBaseUrl}${request.query.album}&api_key=${lastFmApiKey}&limit=${requestLimit}&format=json`
		console.log(10, apiUrl)

		const results: AlbumResults = await ProperFetch(apiUrl)

		console.log(11, results)

		const massagedResponse: AlbumReturn[] = []

		results.results.albummatches.album.forEach((album) => {
			// prevent sending back garbage results
			if (
				album.name &&
				album.artist &&
				album.image[3]['#text'] &&
				album.name !== '(null)' &&
				album.artist !== '(null)'
			) {
				massagedResponse.push({
					image: album.image[3]['#text'],
					artist: album.artist,
					name: album.name
				})
			}
		})

		reply.send(massagedResponse)
	} catch (error) {
		console.log(`Error in /Search request:\n ${error}`)
	}
})

const requestMax = 100
const requestMinimum = 1
fastify.get('/TopAlbums', async (request: any, reply: any) => {
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

		console.log('-1', requestLimit)

		const requestPeriod = request.query.period ? request.query.period : '1month'

		console.log(0, request.query.user)

		const apiUrl = `${topAlbumBaseUrl}${request.query.user}&api_key=${lastFmApiKey}&period=${requestPeriod}&limit=${requestLimit}&format=json`
		console.log(1, apiUrl)

		const results: TopAlbumsResult = await ProperFetch(apiUrl)

		console.log(2, results)

		// const massagedResponse: AlbumReturn[] = []

		const returnArray: AlbumReturn[] = []

		for (const album of results.topalbums.album) {
			console.log(album)
			const albumSearch: AlbumReturn[] = await ProperFetch(
				`http://localhost:${[port]}/Search?album=${encodeURIComponent(
					album.artist.name
				)}`
			)

			if (albumSearch.length > 0) {
				returnArray.push(albumSearch[0])
				continue
			}

			returnArray.push({
				image: grayImageUrl,
				artist: 'Placeholder',
				name: 'Placeholder'
			})
		}

		console.log(returnArray)

		reply.send(returnArray)
	} catch (error) {
		console.log(`Error in /Search request:\n ${error}`)
	}
})

start()

async function start() {
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
