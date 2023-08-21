import { RequestInfo, RequestInit, Response } from 'undici/types/fetch'

// Currently need to manually define Fetch for use in node 18+ global fetch
// Nodes global fetch was pulled from undici.
declare global {
	function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>
}

// This is a wrapper around the Fetch WebAPI to handle errors without any fuss
export async function ProperFetch(
	input: RequestInfo,
	init?: RequestInit | undefined
): Promise<any> {
	try {
		console.log(100, input)
		const response = init ? await fetch(input, init) : await fetch(input)

		console.log(101, response)

		if (response.ok) {
			console.log(102, await response.json())
			return await response.json()
		}

		// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
		console.error('Responded with an error:' + (await response.json()))
		return null
	} catch (error: any) {
		console.error(`Error in fetch call: ${error}`)
		return null
	}
}
