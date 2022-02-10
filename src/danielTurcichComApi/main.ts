/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { google as Google, type sheets_v4 } from 'googleapis'
import { Release } from '../shared/typings.js'
import { default as Fastify } from 'fastify'
import { default as FastifyCors } from 'fastify-cors'
import { authorize } from '../shared/googleApis.js'
import FileSystem from 'fs/promises'

const fastify = Fastify()
const port = 3000
let sheets: sheets_v4.Sheets

fastify.register(FastifyCors)

// Declare a route
fastify.get('/Sheets', async (request: any, reply) => {
	try {
		const id = request.query.id as string
		const range = request.query.range as string
		const index = Number(request.query.index as string)
		const rows = request.query.rows as string
		let returnValue

		if (rows === 'true') {
			returnValue = await getNumberOfRows(id, range)
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

// Run the server!
async function start() {
	try {
		await fastify.listen(port)
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
		const sheetsTokenPath = `./credentials/sheetsToken.json`
		const sheetsCredentialsPath = `./credentials/sheetsCredentials.json`
		const sheetsScopes = [
			'https://www.googleapis.com/auth/spreadsheets.readonly'
		] // If modifying these scopes, delete token.json.

		const content = await FileSystem.readFile(sheetsCredentialsPath, 'utf-8')
		const sheetsAuthClient = await authorize({
			credentials: JSON.parse(content),
			scopes: sheetsScopes,
			tokenPath: sheetsTokenPath
		})
		sheets = Google.sheets({ version: 'v4', auth: sheetsAuthClient })
	} catch (error) {
		// TODO: readd readme.md
		throw new Error('No sheetsCredentials.json, check readme.md')
	}
	console.log(`Listening on port: ${port}`)
}

async function getRows(
	spreadsheetId: string,
	range: string,
	index?: number
): Promise<string[][]> {
	return new Promise((resolve) =>
		sheets.spreadsheets.values.get(
			{
				spreadsheetId: spreadsheetId,
				range: range
			},
			(error, response) => {
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
	range: string
): Promise<number> {
	return new Promise((resolve) =>
		sheets.spreadsheets.values.get(
			{
				spreadsheetId: spreadsheetId,
				range: range
			},
			(_err, res) => {
				if (res && res.data.values) {
					for (let n = res.data.values.length - 1; n > 0; n--) {
						if (rowIsFilledOut(res.data.values[n])) {
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

function rowIsFilledOut(row: string[]): boolean {
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
	} else {
		return false
	}
}
