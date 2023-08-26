/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import path from 'path'
import Fastify from 'fastify'
import FastifyCors from '@fastify/cors'
import { google, sheets_v4 } from 'googleapis'
import { authorize } from '../shared/googleApis'
import { Release, ReleasesIn, type StatsObject } from '../types/typings'
import { getNumberOfRows, getRows, isNum, spreadsheets } from './supplemental'

export let sheets: sheets_v4.Sheets

// FAstify/ etc setup
const fastify = Fastify()
const port = 2080
// @ts-expect-error
await fastify.register(FastifyCors)

let releasesArray: string[][]
let statsObject: StatsObject
// let cachedCurrentYear: string[][]

async function getSheets(
	id: string,
	range: string,
	index?: number,
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
		case (index && index >= 0):
				return await getRows(id, range, index)

		default:
			return await getRows(id, range)
	}
}

fastify.get('/Sheets', async (request, reply) => {
	try {
		// @ts-expect-error
		const id: string = request.query.id
		// @ts-expect-error
		const range: string = request.query.range
		// @ts-expect-error
		const index: number | undefined = Number(request.query.index)
		// @ts-expect-error
		const rows: string | undefined = request.query.rows
		// @ts-expect-error
		const nonMusic: string | undefined = request.query.nonmusic

		await reply.send(await getSheets(id, range, index, rows, nonMusic))
	} catch (error: any) {
		console.log(`Error in /Sheets request:\n ${error}`)
	}
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
fastify.get('/Releases', async (_request, reply) => {
	try {
		void reply.send(releasesArray)
	} catch (error) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		console.log(`Error in /Releases request:\n ${error}`)
	}
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
fastify.get('/Stats', async (_request, reply) => {
	try {
		void reply.send(statsObject)
	} catch (error) {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		console.log(`Error in /Stats request:\n ${error}`)
	}
})

// Run the server!
async function start() {
	try {
		fastify.listen({ port: port }, (error) => {
			if (error) {
				console.log(error)
			}
		})
		await onStart()
	} catch (err) {
		console.log(err)
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
			'./credentials/sheetsToken.json'
		)
		console.log(1)
		const sheetsScopes = [
			'https://www.googleapis.com/auth/spreadsheets.readonly'
		] // If modifying these scopes, delete token.json.

		console.log(2)
		const sheetsAuthClient = await authorize({
			scopes: sheetsScopes,
			tokenPath: sheetsTokenPath
		})
		console.log(3)
		sheets = google.sheets({ version: 'v4', auth: sheetsAuthClient })
		console.log(4)
	} catch (error: any) {
		throw console.log('Error in onStart(): ', error)
	}

	await initializeSheets()

	setupIntervals()
	console.log(`Listening on port: ${port}`)
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

	// cachedCurrentYear = spreadsheetArrays.at(-1)!

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
			? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
			  // @ts-expect-error
			  releasePerYear[ReleasesIn[current[Release.year].slice(0, 3) + '0s']]++
			: releasePerYear[ReleasesIn['1950s']]++
	})

	statsObject = {
		averageScore: (tempScore / scoreCount).toFixed(2),
		numberOfArtists: artistArray.length,
		averageYear: (tempYear / yearCount).toFixed(2),
		numberOfReleases: scoreCount + questionMarkScoreCount,
		releasesPerYear: releasePerYear,
		currentYear: currentYear,
		earliestYear: earliestYear
	}
}

// TODO fix this.
function setupIntervals() {
	// // in 2022
	// setInterval(() => {
	// 	async function blah() {
	// 		const retrievedCurrentYear = await getArray(spreadsheets.at(-1)!)
	// 		if (retrievedCurrentYear !== cachedCurrentYear) {
	// 			await initializeSheets()
	// 		}
	// 	}
	// 	void blah()
	// }, 1_800_000) // 30 minutes
}
