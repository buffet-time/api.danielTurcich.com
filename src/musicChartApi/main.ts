/* eslint-disable @typescript-eslint/ban-ts-comment */
import { default as Fastify } from 'fastify'
import { lastFmApiKey } from './credentials/apiKey.js'
import { AlbumReturn, type AlbumResults } from './types'
import { default as FastifyCors } from '@fastify/cors'
import fetch from 'node-fetch'

const fastify = Fastify()
const port = 3030 //deltron
const apiBaseUrl =
	'https://ws.audioscrobbler.com/2.0/?method=album.search&album='

fastify.register(FastifyCors)

fastify.get('/Search', async (request: any, reply) => {
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
		console.log(1, apiUrl)

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
		await fastify.listen(port)
		console.log(`Listening on port: ${port}`)
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}

// This is a wrapper around the Fetch WebAPI to handle errors without any fuss
async function ProperFetch(url: string): Promise<any | null> {
	try {
		const response = await fetch(url)

		if (response.ok) {
			return await response.json()
		} else {
			console.error('Responded with an error:' + (await response.json()))
			return null
		}
	} catch (error) {
		console.error(`Error in fetch call: ${error}`)
		return null
	}
}
