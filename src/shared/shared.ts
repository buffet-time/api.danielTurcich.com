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
): Promise<any | null> {
	try {
		const response = init ? await fetch(input, init) : await fetch(input)

		if (response.ok) {
			return await response.json()
		} else {
			console.error('Responded with an error:' + (await response.json()))
			return null
		}
	} catch (error) {
		console.error(`Error in fetch call: ${error}`)
		return null
	}
}
