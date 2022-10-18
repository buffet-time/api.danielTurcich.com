/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ProperFetch } from '../shared/shared'
import { Release, type SpreadsheetParams } from '../types/typings'
import { sheets } from './main'

export const spreadsheets: SpreadsheetParams[] = [
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

// for readability
export function isNum(value: string) {
	return !isNaN(Number(value))
}

// TODO: decouple this from referencing itself
export async function getArray(params: SpreadsheetParams): Promise<string[][]> {
	return ProperFetch(
		`https://api.danielturcich.com/Sheets?id=${params.id}&range=${params.range}`
	) as unknown as string[][]
}

export async function getRows(
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
				}

				!isNaN(index!)
					? resolve(response.data.values[index!])
					: resolve(response.data.values)
			}
		)
	)
}

export async function getNumberOfRows(
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
						}
					}
				}
			}
		)
	)
}

export function rowIsFilledOut(row: string[], nonMusic?: boolean): boolean {
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
