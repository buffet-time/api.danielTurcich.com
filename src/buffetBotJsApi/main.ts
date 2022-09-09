import { google, Auth } from 'googleapis'
import { authorize } from '../shared/googleApis.js'
import { redditCredentials } from './credentials/credentials.js'
import Fastify from 'fastify'
import snoowrap from 'snoowrap'

console.log(0.1)
const reddit = new snoowrap(redditCredentials)
console.log(0.2)
const fastify = Fastify()
console.log(0.3)
const port = 1080
console.log(0.4)
let gmailAuthClient: Auth.OAuth2Client
console.log(0.5)

fastify.get('/Email', async (request: any, reply: any) => {
	try {
		const to = request.query.to as string
		const subject = request.query.subject as string
		const message = request.query.message as string

		reply.send(sendEmail(to, subject, message))
	} catch (error) {
		console.log(`Error in /Email request:\n ${error}`)
	}
})

fastify.get('/Reddit/Top/Femboy', async (_request: any, reply: any) => {
	try {
		const redditResponse = await reddit
			.getSubreddit('femboy')
			.getHot({ limit: 1 })
		// pinned messages have stickied set to true
		const topPost = redditResponse.filter(
			(post: { stickied: boolean }) => post.stickied === false
		)
		reply.send({ url: topPost[0].url })
	} catch (error) {
		console.log(`Error in /Reddit/Top/Femboy request:\n ${error}`)
	}
})

// Run the server!
async function start() {
	console.log(1)
	try {
		fastify.listen({ port: port }, (error: any) => {
			console.log(2)
			if (error) {
				console.log(error)
			}
		})

		console.log(3)
		const onStart = async () => {
			try {
				console.log(4)
				const gmailTokenPath = `./credentials/emailToken.json`
				const gmailScopes = ['https://www.googleapis.com/auth/gmail.send']
				gmailAuthClient = await authorize({
					scopes: gmailScopes,
					tokenPath: gmailTokenPath
				})
				console.log(4)
			} catch (error) {
				console.log(5, error)
				throw new Error('No emailCredentials.json, check readme.md')
			}
			console.log(`Listening on port: ${port}`)
		}

		onStart()
	} catch (err) {
		console.log(6, err)
		fastify.log.error(err)
		process.exit(1)
	}
}
start()

function sendEmail(to: string, subject: string, message: string) {
	try {
		google.gmail({ version: 'v1', auth: gmailAuthClient }).users.messages.send({
			auth: gmailAuthClient,
			userId: 'buffetsbot@gmail.com',
			requestBody: {
				raw: makeBody(to, 'buffetsbot@gmail.com', subject, message)
			}
		})
		return 'good'
	} catch (error) {
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
