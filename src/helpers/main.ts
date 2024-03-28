import { setCachedStatsObject, setReleasesArray } from '../main'
import { Release, ReleasesIn, StatsObject } from '../types/typings'
import { spreadsheets, getNumberOfRows, getRows } from './spreadsheet'

let cachedSpreadsheetCurrentYear: string[][]

// for readability
export function isNum(value: string) {
	return !isNaN(Number(value))
}

// Checks every 30 minutes to update the cached spreadsheets
export function setupIntervals() {
	setInterval(() => {
		async function checkLatestSpreadsheet() {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const params = spreadsheets.at(-1)!
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

export async function initializeSheets() {
	const spreadsheetArrays = await Promise.all(
		spreadsheets.map((current) => {
			return getSheets(current.id, current.range) as unknown as string[][]
		})
	)

	if (!spreadsheetArrays) {
		return
	}

	cachedSpreadsheetCurrentYear = spreadsheetArrays.at(-1)!

	const nonJsonReleasesArray = spreadsheetArrays
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

	nonJsonReleasesArray.forEach((current) => {
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

	setCachedStatsObject(
		JSON.stringify({
			averageScore: (tempScore / scoreCount).toFixed(2),
			numberOfArtists: artistArray.length,
			averageYear: (tempYear / yearCount).toFixed(2),
			numberOfReleases: scoreCount + questionMarkScoreCount,
			releasesPerYear: releasePerYear,
			currentYear: currentYear,
			earliestYear: earliestYear
		} satisfies StatsObject)
	)

	setReleasesArray(JSON.stringify(nonJsonReleasesArray))
}

export async function getSheets(
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
