import { Release, type SpreadsheetParams } from '../types/typings'
import { sheets } from '../main'

// TODO: find a better way so i can be lazier at the beginning of the year :)
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
	},
	{
		id: '1kbSckEbjlI55bCds6qB0bE4h2osHJjbTzXfFoBHnqQA',
		range: 'Main!A2:G' // 2023
	},
	{
		id: '1c2LLIH5e7voXgWQ_tiJKrDhx14VVevPEdmi6Yv1AE84',
		range: 'Main!A2:G' // 2024
	}
]

// for readability
export function isNum(value: string) {
	return !isNaN(Number(value))
}

export async function getRows(
	spreadsheetId: string,
	range: string,
	index?: string
): Promise<string[][] | string[]> {
	return new Promise((resolve) =>
		sheets.spreadsheets.values.get(
			{
				spreadsheetId: spreadsheetId,
				range: range
			},
			(error, response) => {
				if (error ?? !response?.data.values) {
					return console.log(`Error in getRows():\n ${error as any}`)
				}

				try {
					if (index) {
						return resolve(response.data.values[Number(index)])
					}

					resolve(response.data.values)
				} catch (error: any) {
					console.log(`blargh i need to update my bad old code: ${error}`)
				}
			}
		)
	)
}
export async function getNumberOfRows(
	spreadsheetId: string,
	range: string,
	nonMusic?: boolean
): Promise<number> {
	return new Promise((resolve) =>
		sheets.spreadsheets.values.get(
			{
				spreadsheetId: spreadsheetId,
				range: range
			},
			(error, response) => {
				try {
					if (error ?? !response?.data.values) {
						return console.log(`Error in getNumberOfRows():\n ${error as any}`)
					}

					if (response?.data.values) {
						for (let n = response.data.values.length - 1; n > 0; n--) {
							if (
								rowIsFilledOut(response.data.values[n] as string[], nonMusic)
							) {
								resolve(n + 1)
							}
						}
					}
				} catch (error: any) {
					console.log(`blargh i need to update my bad old code: ${error}`)
				}
			}
		)
	)
}

export function rowIsFilledOut(row: string[], nonMusic?: boolean): boolean {
	if (nonMusic) {
		if (row[0] && row[1] && row[2] && row[3] && row[4]) {
			return true
		}
		return false
	}

	if (
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
