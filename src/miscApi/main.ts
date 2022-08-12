/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type GithubTreeResponse } from '../shared/typings.js'
import { githubToken } from './credentials/credentials.js'
import { request as githubRequest } from '@octokit/request'
import { default as Fastify } from 'fastify'
import { default as FastifyCors } from 'fastify-cors'

const fastify = Fastify()
const port = 3002

// @ts-expect-error
fastify.register(FastifyCors)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
fastify.get('/Github', async (_request, reply) => {
	const pathArray = await getPaths(
		'3640b37b4e69e3acd25eeb4b1d756e06a67bb6a9',
		'https://github.com/buffet-time/testMusicFolder/blob/main'
	)
	pathArray ? reply.send(pathArray) : reply.send(['Error'])
})

// Run the server!
async function start() {
	try {
		fastify.listen(port, (error) => {
			if (error) {
				console.log(error)
			}
		})
		console.log(`Listening on port: ${port}`)
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}
start()

async function getPaths(
	treeSha: string,
	directory: string
): Promise<string[] | null> {
	const pathArray: string[] = []
	const treeResponse = await getTree(treeSha)
	if (!treeResponse) {
		return null
	}

	for (let x = 0; x < treeResponse.data.tree.length; x++) {
		const tree = treeResponse.data.tree[x]
		if (tree.type === 'tree' && tree.sha && tree.path) {
			const returnedPathArray = await getPaths(tree.sha, tree.path)

			if (returnedPathArray) {
				for (const path of returnedPathArray) {
					pathArray.push(`${directory}/${path}`)
				}
			}
		} else if (tree.type === 'blob' && tree.path) {
			pathArray.push(`${directory}/${tree.path}?raw=true`)
		}
	}

	return pathArray
}

async function getTree(treeSha: string): Promise<GithubTreeResponse | null> {
	try {
		return await githubRequest(
			'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
			{
				headers: {
					authorization: githubToken
				},
				owner: 'buffet-time',
				repo: 'testMusicFolder',
				tree_sha: treeSha
			}
		)
	} catch (error: any) {
		console.log(`Error in /Github request:\n ${error}`)
		return null
	}
}
