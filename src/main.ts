import path from 'path'
import { google, sheets_v4 } from 'googleapis'
import { authorize } from './helpers/googleApis.js'
import HyperExpress from 'hyper-express'
import {
	getCurrentDate,
	getSheets,
	initializeSheets,
	setupIntervals
} from './helpers/main.helpers.js'
import Cors from 'cors'

let releasesArray: string
let cachedStatsObject: string

export let sheets: sheets_v4.Sheets
export const port = 2080

export function setReleasesArray(newVal: string) {
	releasesArray = newVal
}

export function setCachedStatsObject(newVal: string) {
	cachedStatsObject = newVal
}

const hyperExpress = new HyperExpress.Server()

hyperExpress.get('/Releases', (_request, response) => {
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

hyperExpress.get('/Stats', (_request, response) => {
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
hyperExpress.get('/Sheets', async (request, response) => {
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

hyperExpress.get('/Asset', (request, response) => {
	try {
		const fileName = request.query.fileName

		if (!fileName || typeof fileName !== 'string') {
			response.status(418).send(`invalid file name :/`)
			return
		}

		switch (fileName) {
			case 'croc':
				response.sendFile('croc.mp4')
				break

			case 'gary':
				response.sendFile('gary.png')
				break

			default:
				response.status(418).send(`invalid file name :/`)
				break
		}
	} catch (error: any) {
		response
			.status(418)
			.send(
				`ah fuck I can't believe you've done this\n uh, how did this happen? ${error}`
			)
	}
})

hyperExpress
	.use(Cors())
	.listen(port)
	.then(async () => {
		await onStart()
		console.log(
			`Hyper-Express server listening on port: ${port} ~ ${getCurrentDate()}`
		)
	})
	.catch((error: any) => {
		console.log(
			`Failed to start Hyper-Express server on port ${port}: Error - ${error} ~ ${getCurrentDate()}`
		)
	})

async function onStart() {
	try {
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
		throw console.log(`Error in onStart(): ${error} ~ ${getCurrentDate()}`)
	}

	await initializeSheets()

	setupIntervals()
}
