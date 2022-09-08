import fs from 'fs/promises'
import { authenticate } from '@google-cloud/local-auth'
import { google, Auth } from 'googleapis'

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

export async function authorize({
	credentials,
	scopes,
	tokenPath
}: {
	credentials: string
	scopes: string[]
	tokenPath: string
}) {
	let client = (await loadSavedCredentialsIfExist(
		tokenPath
	)) as Auth.OAuth2Client | null

	if (client) {
		return client
	}

	client = await authenticate({
		scopes: scopes,
		keyfilePath: credentials
	})

	if (client.credentials) {
		await saveCredentials(client, credentials, tokenPath)
	}

	return client
}

// Reads previously authorized credentials from the save file.
async function loadSavedCredentialsIfExist(tokenPath: string) {
	try {
		const content = await fs.readFile(tokenPath)
		const credentials = JSON.parse(content.toString())

		return google.auth.fromJSON(credentials)
	} catch (err) {
		return null
	}
}

// Serializes credentials to a file comptible with GoogleAUth.fromJSON.
async function saveCredentials(
	client: Auth.OAuth2Client,
	credentials: string,
	tokenPath: string
) {
	const content = await fs.readFile(credentials)
	const keys = JSON.parse(content.toString())
	const key = keys.installed || keys.web
	const payload = JSON.stringify({
		type: 'authorized_user',
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token
	})

	await fs.writeFile(tokenPath, payload)
}
