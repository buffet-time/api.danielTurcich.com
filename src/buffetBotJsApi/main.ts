/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { google } from 'googleapis'
import type { OAuth2Client } from 'googleapis-common'
import { authorize } from '../shared/googleApis'
import Fastify from 'fastify'

const fastify = Fastify()
const port = 1080

let gmailAuthClient: OAuth2Client

fastify.get('/Email', async (request, reply) => {
	try {
		// @ts-expect-error
		const to = request.query.to as string
		// @ts-expect-error
		const subject = request.query.subject as string
		// @ts-expect-error
		const message = request.query.message as string

		void reply.send(await sendEmail(to, subject, message))
	} catch (error) {
		console.log(`Error in /Email request:\n ${error}`)
	}
})

fastify.get('/Reddit/Top/Femboy', (_request, reply) => {
	void reply.send('Command removed.')
})

// Run the server!
async function start() {
	try {
		fastify.listen({ port: port }, (error: any) => {
			if (error) {
				console.log(error)
			}
		})

		const onStart = async () => {
			try {
				const gmailTokenPath = `./credentials/emailToken.json`
				const gmailScopes = ['https://www.googleapis.com/auth/gmail.send']
				gmailAuthClient = await authorize({
					scopes: gmailScopes,
					tokenPath: gmailTokenPath
				})
			} catch (error) {
				console.log('Error in onstart', error)
				throw new Error('No emailCredentials.json, check readme.md')
			}
		}

		await onStart()
		console.log(`Buffet Bot API: Listening on port: ${port}`)
	} catch (err) {
		console.log('Error in start()', err)
		fastify.log.error(err)
		process.exit(1)
	}
}
void start()

async function sendEmail(to: string, subject: string, message: string) {
	try {
		const gmail = google.gmail({ version: 'v1', auth: gmailAuthClient })

		await gmail.users.messages.send({
			auth: gmailAuthClient,
			userId: 'buffetsbot@gmail.com',
			requestBody: {
				raw: makeBody(to, 'buffetsbot@gmail.com', subject, message)
			}
		})
		return 'good'
	} catch (error) {
		console.log('Error in sendEmail()', error)
		return 'error'
	}
}

function makeBody(to: string, from: string, subject: string, message: string) {
	return Buffer.from(
		[
			'Content-Type: text/plain; charset="UTF-8"\n',
			'MIME-Version: 1.0\n',
			'Content-Transfer-Encoding: 7bit\n',
			'to: ',
			to,
			'\n',
			'from: ',
			from,
			'\n',
			'subject: ',
			subject,
			'\n\n',
			message
		].join('')
	)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
}
