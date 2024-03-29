import path from 'path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { google, sheets_v4 } from 'googleapis'
import { authorize } from './supplemental/googleApis.js'
import { Release, ReleasesIn, type StatsObject } from './types/typings.js'
import {
	getNumberOfRows,
	getRows,
	isNum,
	spreadsheets
} from './supplemental/supplemental.js'
import type { GetSheets } from './types/fastifyTypes.js'

export let sheets: sheets_v4.Sheets

// FAstify/ etc setup
const fastify = Fastify()
const port = 2080
await fastify.register(cors)

let releasesArray: string[][]
let cachedStatsObject: StatsObject
let cachedSpreadsheetCurrentYear: string[][]

async function getSheets(
	id: string,
	range: string,
	index?: string,
	rows?: string,
	nonMusic?: string
) {
	switch (true) {
		// prettier-ignore
		case (rows === 'true' && nonMusic === 'true'):
				return await getNumberOfRows(id, range, true)
		// prettier-ignore
		case (rows === 'true'): 
				return await getNumberOfRows(id, range)

		// prettier-ignore
		case (Boolean(index)):
				return await getRows(id, range, index)

		default:
			return await getRows(id, range)
	}
}

fastify.get<GetSheets>('/Sheets', async (request, reply) => {
	try {
		const id: string = request.query.id
		const range: string = request.query.range
		const index: string | undefined = request.query.index
		const rows: string | undefined = request.query.rows
		const nonMusic: string | undefined = request.query.nonmusic

		await reply.send(await getSheets(id, range, index, rows, nonMusic))
	} catch (error: any) {
		console.log(`Error in /Sheets request:\n ${error}`)
	}
})

fastify.get('/Releases', async (_request, reply) => {
	try {
		await reply.send(releasesArray)
	} catch (error: any) {
		console.log(`Error in /Releases request:\n ${error}`)
	}
})

fastify.get('/Stats', async (_request, reply) => {
	try {
		await reply.send(cachedStatsObject)
	} catch (error: any) {
		console.log(`Error in /Stats request:\n ${error}`)
	}
})

// Run the server!
async function start() {
	try {
		fastify.listen({ port: port }, (error) => {
			if (error) {
				console.log('Error in fastify.listen()', error)
			}
		})
		await onStart()
	} catch (err: any) {
		console.log('Error in onstart', err)
		fastify.log.error(err)
		process.exit(1)
	}
}
await start()

async function onStart() {
	try {
		console.log('onstart')
		const sheetsTokenPath = path.join(
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
		throw console.log('Error in onStart(): ', error)
	}

	await initializeSheets()

	setupIntervals()
	console.log(`Fastify serve listening on port: ${port}`)
}

async function initializeSheets() {
	const spreadsheetArrays = await Promise.all(
		spreadsheets.map((current) => {
			return getSheets(current.id, current.range) as unknown as string[][]
		})
	)

	if (!spreadsheetArrays) {
		return
	}

	cachedSpreadsheetCurrentYear = spreadsheetArrays.at(-1)!

	releasesArray = spreadsheetArrays
		.flat()
		.filter((current: string[], index) => {
			// makes sure to trim whitespaces of data coming in from the most recent year
			// in sheets select all cells > data > data cleanup > trim whitespace
			if (index === spreadsheetArrays.length - 1) {
				current.forEach((element) => {
					element.trim()
				})
			}
			// makes sure to not include any not fully written reviews
			return current.length > 5 && current[Release.score]
		})

	const artistArray: string[] = []
	const currentYear = new Date().getFullYear()
	let earliestYear = currentYear

	let scoreCount = 0
	let questionMarkScoreCount = 0
	let yearCount = 0
	let tempScore = 0
	let tempYear = 0

	const releasePerYear: number[] = []

	// returns the values of the enum and them in reverse so divide by 2
	for (let x = 0; x < Object.keys(ReleasesIn).length / 2; x++) {
		releasePerYear.push(0)
	}

	releasesArray.forEach((current) => {
		if (!artistArray.includes(current[Release.artist])) {
			artistArray.push(current[Release.artist])
		}

		const curYear = Number(current[Release.year])

		if (curYear < earliestYear) {
			earliestYear = curYear
		}

		tempYear += curYear
		yearCount++

		if (isNum(current[Release.score])) {
			tempScore += Number(current[Release.score])
			scoreCount++
		} else if (current[Release.score] == '?') {
			questionMarkScoreCount++
		}

		curYear > 1959
			? // @ts-expect-error - blah blah
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				releasePerYear[ReleasesIn[current[Release.year].slice(0, 3) + '0s']]++
			: releasePerYear[ReleasesIn['1950s']]++
	})

	cachedStatsObject = {
		averageScore: (tempScore / scoreCount).toFixed(2),
		numberOfArtists: artistArray.length,
		averageYear: (tempYear / yearCount).toFixed(2),
		numberOfReleases: scoreCount + questionMarkScoreCount,
		releasesPerYear: releasePerYear,
		currentYear: currentYear,
		earliestYear: earliestYear
	}
}

// Checks every 30 minutes to update the cached spreadsheets
function setupIntervals() {
	setInterval(() => {
		async function checkLatestSpreadsheet() {
			const params = spreadsheets.at(-1)!
			const retrievedSpreadsheetCurrentYear = await getSheets(
				params.id,
				params.range
			)
			if (retrievedSpreadsheetCurrentYear !== cachedSpreadsheetCurrentYear) {
				await initializeSheets()
			}
		}
		void checkLatestSpreadsheet()
	}, 1_800_000)
}
