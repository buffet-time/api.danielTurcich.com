import filesystem from 'fs/promises'
import path from 'path'
import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
import type { OAuth2Client } from 'googleapis-common'
import type { GoogleCredentials } from '../types/googleTypes'

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const credentialsPath = path.join(
	process.cwd(),
	'../src/credentials/googleCreds.json'
)

export async function authorize({
	scopes,
	tokenPath
}: {
	scopes: string[]
	tokenPath: string
}) {
	let client = (await loadSavedCredentialsIfExist()) as OAuth2Client | null

	if (client) {
		return client
	}

	client = await authenticate({
		scopes: scopes,
		keyfilePath: credentialsPath
	})

	if (client.credentials) {
		await saveCredentials()
	}

	return client

	// This works fine, and i don't mind having a few eslinnt disables here :)
	// Reads previously authorized credentials from the save file.
	async function loadSavedCredentialsIfExist() {
		try {
			const content = await filesystem.readFile(tokenPath)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const credentials = JSON.parse(content.toString())

			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			return google.auth.fromJSON(credentials)
		} catch (err) {
			return null
		}
	}

	// Serializes credentials to a file comptible with GoogleAUth.fromJSON.
	async function saveCredentials() {
		const content = await filesystem.readFile(credentialsPath)
		const keys = JSON.parse(content.toString()) as GoogleCredentials
		const key = keys.installed || keys.web

		const payload = JSON.stringify({
			type: 'authorized_user',
			client_id: key.client_id,
			client_secret: key.client_secret,
			refresh_token: client?.credentials.refresh_token
		})

		await filesystem.writeFile(tokenPath, payload)
	}
}
