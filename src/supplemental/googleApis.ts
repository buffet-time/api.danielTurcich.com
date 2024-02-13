import filesystem from 'fs/promises'
import path from 'path'
import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
import type { OAuth2Client } from 'googleapis-common'

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

console.log(1, process.cwd())
const credentialsPath = path.join(
	process.cwd(),
	'../src/supplemental/googleCreds.json'
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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const keys = JSON.parse(content.toString())
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const key = keys.installed || keys.web

		const payload = JSON.stringify({
			type: 'authorized_user',
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			client_id: key.client_id,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			client_secret: key.client_secret,
			refresh_token: client?.credentials.refresh_token
		})

		await filesystem.writeFile(tokenPath, payload)
	}
}
