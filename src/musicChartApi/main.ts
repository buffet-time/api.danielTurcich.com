/* eslint-disable @typescript-eslint/ban-ts-comment */
import { lastFmApiKey } from './credentials/apiKey.js'
import { AlbumReturn, AlbumResults } from './types'
import Fastify from 'fastify'
import FastifyCors from '@fastify/cors'
import { ProperFetch } from '../shared/shared.js'

const fastify = Fastify()
const port = 3030 //deltron
const apiBaseUrl =
	'https://ws.audioscrobbler.com/2.0/?method=album.search&album='

// @ts-expect-error
fastify.register(FastifyCors)

fastify.get('/Search', async (request: any, reply: any) => {
	try {
		// default to 10 responses unless provided more
		let requestLimit = 10

		// limit max to 50 and ensure its at least 10
		if (
			request.query.limit &&
			request.query.limit <= 50 &&
			request.query.limit >= 10
		) {
			requestLimit = request.query.limit
		}

		const apiUrl = `${apiBaseUrl}${request.query.album}&api_key=${lastFmApiKey}&limit=${requestLimit}&format=json`
		// console.log(1, apiUrl)

		const results: AlbumResults = await ProperFetch(apiUrl)

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
