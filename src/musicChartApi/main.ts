/* eslint-disable @typescript-eslint/ban-ts-comment */
import { default as Fastify } from 'fastify'
import { lastFmApiKey } from './credentials/apiKey.js'
import { AlbumReturn, type AlbumResults } from './types'
import { default as FastifyCors } from '@fastify/cors'
import fetch from 'node-fetch'

const fastify = Fastify()
const port = 3030 //deltron

fastify.register(FastifyCors)

fastify.get('/Search', async (request: any, reply) => {
	try {
		const results: AlbumResults = await ProperFetch(
			`https://ws.audioscrobbler.com/2.0/?method=album.search&album=${request.query.album}&api_key=${lastFmApiKey}&format=json`
		)

		const massagedResponse: AlbumReturn[] =
			results.results.albummatches.album.map((album) => {
				return {
					image: album.image[3]['#text'],
					artist: album.artist,
					name: album.name
				}
			})

		reply.send(massagedResponse)
	} catch (error) {
		console.log(`Error in /Email request:\n ${error}`)
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
