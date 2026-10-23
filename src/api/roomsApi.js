/**
 * Rooms API.
 *
 * STUB: there is no backend yet, so nothing is sent anywhere. Replace the body of `createRoom`
 * with a real request when the endpoint is ready, for example:
 *
 *   const response = await fetch('/api/rooms', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(payload),
 *   });
 *   if (!response.ok) throw new Error('Could not create the room');
 *   return response.json();
 */

/**
 * @typedef {Object} CreateRoomPayload
 * @property {string} hostName                      Name of the person creating the room
 * @property {'movie' | 'tv' | null} contentType    null = no preference
 * @property {string[]} genres                      Empty = any genre
 * @property {number | null} maxDurationMin         90 | 120 | 150, null = no limit
 * @property {string[]} streamingServices           Empty = any service
 */

/**
 * @param {CreateRoomPayload} payload
 * @returns {Promise<{ code: string | null }>} the created room (invite code) - `null` until the backend exists
 */
export async function createRoom(payload) {
  if (import.meta.env.DEV) console.info('[stub] createRoom', payload);
  return { code: null };
}
