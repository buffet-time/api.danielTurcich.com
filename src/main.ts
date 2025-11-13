import { join as pathJoin } from 'path'
import { google, sheets_v4 } from 'googleapis'
import { authorize } from './helpers/googleApis.js'
import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import {
	getCurrentDate,
	getSheets,
	initializeSheets,
	setupIntervals
} from './helpers/main.helpers.js'

let releasesArray: string
let cachedStatsObject: string

export let sheets: sheets_v4.Sheets
export const PORT = 2080

export function setReleasesArray(newVal: string) {
	releasesArray = newVal
}

export function setCachedStatsObject(newVal: string) {
	cachedStatsObject = newVal
}

const fastify = Fastify()
await fastify.register(fastifyCors, {
	origin: true,
	methods: 'GET',
	allowedHeaders: 'Content-Type, Authorization'
})

fastify.get('/Releases', (_request, response) => {
	try {
		response.send(releasesArray)
	} catch (error: any) {
		console.log(`Error in /Releases request:\n ${error}`)
		response
			.status(418)
			.send(
				`ah fuck I can't believe you've done this\n uh, how did this happen? ${error}`
			)
	}
})

fastify.get('/Stats', (_request, response) => {
	try {
		response.send(cachedStatsObject)
	} catch (error: any) {
		console.log(`Error in /Stats request:\n ${error}`)
		response
			.status(418)
			.send(
				`ah fuck I can't believe you've done this\n uh, how did this happen? ${error}`
			)
	}
})

// example request:
// http://localhost:2080/Sheets?id=1c2LLIH5e7voXgWQ_tiJKrDhx14VVevPEdmi6Yv1AE84&range=Main!A2:G
fastify.get('/Sheets', async (request: any, response) => {
	try {
		const id = request.query.id
		const range = request.query.range as string
		const index = request.query.index as string | undefined
		const rows = request.query.rows as string | undefined
		const nonMusic = request.query.nonmusic as string | undefined

		if (!id || !range || typeof id !== 'string' || typeof range !== 'string') {
			response
				.status(418)
				.send(
					`ah fuck I can't believe you've done this\nincorrect query params there bud`
				)
			return
		}

		const sheetsReturn = await getSheets(id, range, index, rows, nonMusic)

		if (sheetsReturn === null) {
			response.send(
				`Rut ro... What happened in /sheets?: ${id}, ${range}, ${index}, ${rows}, ${nonMusic}, ${sheetsReturn} ~ ${getCurrentDate()}`
			)
		}

		response.send(JSON.stringify(sheetsReturn))
	} catch (error: any) {
		response
			.status(418)
			.send(
				`ah fuck I can't believe you've done this\n uh, how did this happen? ${error}`
			)
	}
})

fastify
	.listen({ port: PORT })
	.then(async () => {
		await onStart()
		console.log(
			`Fastify server listening on port: ${PORT} ~ ${getCurrentDate()}`
		)
	})
	.catch((error: any) => {
		console.log(
			`Failed to start Fastify server on port ${PORT}: Error - ${error} ~ ${getCurrentDate()}`
		)
	})

async function onStart() {
	try {
		const sheetsTokenPath = pathJoin(
			process.cwd(),
			'./src/credentials/sheetsToken.json'
		)
		const sheetsScopes = [
			'https://www.googleapis.com/auth/spreadsheets.readonly'
		] // If modifying these scopes, delete token.json.

		const sheetsAuthClient = await authorize({
			scopes: sheetsScopes,
			tokenPath: sheetsTokenPath
		})
		sheets = google.sheets({ version: 'v4', auth: sheetsAuthClient })
	} catch (error: any) {
		throw console.log(`Error in onStart(): ${error} ~ ${getCurrentDate()}`)
	}

	await initializeSheets()

	setupIntervals()
}
