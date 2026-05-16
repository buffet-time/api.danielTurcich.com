import { join as pathJoin } from 'path'
import { google, sheets_v4 } from 'googleapis'
import { authorize } from './helpers/googleApis.js'
import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import {
	getCurrentDate,
	getSheets,
	initializeSheets,
	setupIntervals,
} from './helpers/main.helpers.js'
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { ServerType } from './types/general'

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

const server: ServerType = Fastify().withTypeProvider<JsonSchemaToTsProvider>()
await server.register(fastifyCors, {
	origin: true,
	methods: 'GET',
	allowedHeaders: 'Content-Type, Authorization',
})

await server.register(import('@fastify/rate-limit'), {
	max: 10,
	timeWindow: '1 minute',
})

server.get('/Releases', (_request, response) => {
	try {
		if (releasesArray === '') {
			response.send(`ERROR, it's empty in here`)
			return
		}
		response.send(releasesArray)
	} catch (error: any) {
		console.log(`Error in /Releases request:\n ${error}`)
		response
			.status(418)
			.send(`ah fuck I can't believe you've done this\n uh, how did this happen? ${error}`)
	}
})

server.get('/Stats', (_request, response) => {
	try {
		response.send(cachedStatsObject)
	} catch (error: any) {
		console.log(`Error in /Stats request:\n ${error}`)
		response
			.status(418)
			.send(`ah fuck I can't believe you've done this\n uh, how did this happen? ${error}`)
	}
})

// example request:
// http://localhost:2080/Sheets?id=1c2LLIH5e7voXgWQ_tiJKrDhx14VVevPEdmi6Yv1AE84&range=Main!A2:G
server.get(
	'/Sheets',
	{
		schema: {
			querystring: {
				type: 'object',
				properties: {
					// The search query
					id: { type: 'string' },
					// whether or not to return results noted as adult, defaults to false
					range: { type: 'string' },
					// year of the release to further narrow down the search, no default
					index: { type: 'string' },
					rows: { type: 'string' },
					nonmusic: { type: 'string' },
				},
				required: ['id', 'range'],
			},
		},
	},
	async (request, response) => {
		try {
			const sheetsReturn = await getSheets(
				request.query.id,
				request.query.range,
				request.query.index,
				request.query.rows,
				request.query.nonmusic,
			)

			if (sheetsReturn === null) {
				response.send(
					`Rut ro... What happened in /sheets?: ${request.query.id}, ${request.query.range}, ${request.query.index}, ${request.query.rows}, ${request.query.nonmusic}, ${sheetsReturn} ~ ${getCurrentDate()}`,
				)
			}

			response.send(JSON.stringify(sheetsReturn))
		} catch (error: any) {
			response
				.status(418)
				.send(`ah fuck I can't believe you've done this\n uh, how did this happen? ${error}`)
		}
	},
)

server
	.listen({ port: PORT })
	.then(async () => {
		await onStart()
		console.log(`Fastify server listening on port: ${PORT} ~ ${getCurrentDate()}`)
	})
	.catch((error: any) => {
		console.log(
			`Failed to start Fastify server on port ${PORT}: Error - ${error} ~ ${getCurrentDate()}`,
		)
	})

async function onStart() {
	try {
		const sheetsTokenPath = pathJoin(process.cwd(), './src/credentials/sheetsToken.json')
		const sheetsScopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'] // If modifying these scopes, delete token.json.

		const sheetsAuthClient = await authorize({
			scopes: sheetsScopes,
			tokenPath: sheetsTokenPath,
		})

		sheets = google.sheets({ version: 'v4', auth: sheetsAuthClient as any })

		google.options({
			retryConfig: {
				retry: 3,
				retryDelay: 500,
				statusCodesToRetry: [
					[100, 199],
					[429, 429],
					[500, 599],
				],
			},
		})
	} catch (error: any) {
		throw console.log(`Error in onStart(): ${error} ~ ${getCurrentDate()}`)
	}

	await initializeSheets()

	setupIntervals()
}
