/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import path from 'path'
import Fastify from 'fastify'
import FastifyCors from '@fastify/cors'
import { google, sheets_v4 } from 'googleapis'
import { authorize } from '../shared/googleApis.js'
import { Release } from '../types/typings.js'
import { ProperFetch } from '../shared/shared.js'

// TODO: breakup this massive file.

// TYPES
interface SpreadsheetParams {
	id: string
	range: string
}

interface StatsObject {
	numberOfReleases: string | number
	averageYear: string | number
	averageScore: string | number
	numberOfArtists: string | number
	releasesPerYear: number[]
	currentYear: number
	earliestYear: number
}

enum ReleasesIn {
	'1950s',
	'1960s',
	'1970s',
	'1980s',
	'1990s',
	'2000s',
	'2010s',
	'2020s'
}

// FAstify/ etc setup
const fastify = Fastify()
const port = 2080
let sheets: sheets_v4.Sheets
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
fastify.register(FastifyCors)

// standard variables
const spreadsheets: SpreadsheetParams[] = [
	{
		id: '1tn0BmleHcs0okzWKhUnyOCWUPD422HvutpNQNzdAAIk',
		range: 'Main!A2:F' // before
	},
	{
		id: '1dmETb3Ybqs8Dhez_kP2DHiXR_Gqw-X56qsXDHYyTH1w',
		range: 'Main!A2:F' // 2020
	},
	{
		id: '18V5oypFBW3Bu_tHxfTL-iSbb9ALYrCJlMwLhpPmp72M',
		range: 'Main!A2:G' // 2021
	},
	{
		id: '1lyFD7uLMT0mRdGkKwvbIm_2pqk2YJU7rtRQVhHq-nwU',
		range: 'Main!A2:G' // 2022
	}
]

let releasesArray: string[][]
let statsObject: StatsObject
let cachedCurrentYear: string[][]

// Declare a route
fastify.get('/Sheets', async (request: any, reply) => {
	try {
		const id = request.query.id as string
		const range = request.query.range as string
		const index = Number(request.query.index as string)
		const rows = request.query.rows as string
		const nonMusic = request.query.nonmusic as string
		let returnValue

		if (rows === 'true') {
			if (nonMusic === 'true') {
				returnValue = await getNumberOfRows(id, range, true)
			} else {
				returnValue = await getNumberOfRows(id, range)
			}
		} else if (index === 0 || index) {
			returnValue = await getRows(id, range, index)
		} else {
			returnValue = await getRows(id, range)
		}

		reply.send(returnValue)
	} catch (error) {
		console.log(`Error in /Sheets request:\n ${error}`)
	}
	// })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
fastify.get('/Releases', async (_request, reply) => {
	try {
		reply.send(releasesArray)
	} catch (error) {
		console.log(`Error in /Releases request:\n ${error}`)
	}
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
fastify.get('/Stats', async (_request, reply) => {
	try {
		reply.send(statsObject)
	} catch (error) {
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
		onStart()
	} catch (err) {
		console.log(err)
		fastify.log.error(err)
		process.exit(1)
	}
}
start()

async function onStart() {
	try {
		const sheetsTokenPath = path.join(
			process.cwd(),
			'./credentials/sheetsToken.json'
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
		throw new Error('Error in onStart(): ', error)
	}

	await initializeSheets()

	setupIntervals()
	console.log(`Listening on port: ${port}`)
}

async function initializeSheets() {
	const spreadsheetArrays = await Promise.all(
		spreadsheets.map((current) => {
			return getArray(current)
		})
	)

	cachedCurrentYear = spreadsheetArrays.at(-1)!

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

	// for readability
	function isNum(value: string) {
		return !isNaN(Number(value))
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

function setupIntervals() {
	// in 2022
	setInterval(async () => {
		const retrievedCurrentYear = await getArray(spreadsheets.at(-1)!)
		if (retrievedCurrentYear !== cachedCurrentYear) {
			initializeSheets()
		}
	}, 1_800_000) // 30 minutes
}

// TODO: decouple this from referencing itself
async function getArray(params: SpreadsheetParams): Promise<string[][]> {
	return ProperFetch(
		`https://api.danielturcich.com/Sheets?id=${params.id}&range=${params.range}`
	) as unknown as string[][]
}

async function getRows(
	spreadsheetId: string,
	range: string,
	index?: number
): Promise<string[][]> {
	// TODO refactor to async await
	return new Promise((resolve) =>
		sheets.spreadsheets.values.get(
			{
				spreadsheetId: spreadsheetId,
				range: range
			},
			(error: any, response: any) => {
				if (error || !response?.data.values) {
					console.log(`Error in getRows():\n ${error}`)
					resolve([])
				} else {
					!isNaN(index!)
						? resolve(response.data.values[index!])
						: resolve(response.data.values)
				}
			}
		)
	)
}

async function getNumberOfRows(
	spreadsheetId: string,
	range: string,
	nonMusic?: boolean
): Promise<number> {
	// TODO refactor to async await
	return new Promise((resolve) =>
		sheets.spreadsheets.values.get(
			{
				spreadsheetId: spreadsheetId,
				range: range
			},
			(_err: any, res: any) => {
				if (res && res.data.values) {
					for (let n = res.data.values.length - 1; n > 0; n--) {
						// TODO: ENHANCE THIS TO ALLOW THE BOT TO USE THINGS BESIDES MUSIC HERE
						if (rowIsFilledOut(res.data.values[n], nonMusic)) {
							resolve(n + 1)
						} else {
							console.log('Res or Res Values was undefined in getNumberOfRows.')
						}
					}
				}
			}
		)
	)
}

function rowIsFilledOut(row: string[], nonMusic?: boolean): boolean {
	if (nonMusic) {
		if (row && row[0] && row[1] && row[2] && row[3] && row[4]) {
			return true
		}
		return false
	}

	if (
		row &&
		row[Release.score] &&
		row[Release.comments] &&
		row[Release.artist] &&
		row[Release.name] &&
		row[Release.type] &&
		row[Release.year] &&
		row[Release.genre]
	) {
		return true
	}
	return false
}
