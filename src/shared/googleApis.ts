import fs from 'fs/promises'
import path from 'path'
import { authenticate } from '@google-cloud/local-auth'
import { google, Auth } from 'googleapis'

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

const credentialsPath = path.join(process.cwd(), '../shared/googleCreds.json')

export async function authorize({
	scopes,
	tokenPath
}: {
	scopes: string[]
	tokenPath: string
}) {
	let client = (await loadSavedCredentialsIfExist()) as Auth.OAuth2Client | null

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

	// Reads previously authorized credentials from the save file.
	async function loadSavedCredentialsIfExist() {
		try {
			const content = await fs.readFile(tokenPath)
			const credentials = JSON.parse(content.toString())

			return google.auth.fromJSON(credentials)
		} catch (err) {
			return null
		}
	}

	// Serializes credentials to a file comptible with GoogleAUth.fromJSON.
	async function saveCredentials() {
		const content = await fs.readFile(credentialsPath)
		const keys = JSON.parse(content.toString())
		const key = keys.installed || keys.web

		const payload = JSON.stringify({
			type: 'authorized_user',
			client_id: key.client_id,
			client_secret: key.client_secret,
			refresh_token: client?.credentials.refresh_token
		})

		await fs.writeFile(tokenPath, payload)
	}
}
