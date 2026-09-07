import { Spot } from "./types";

/**
 * SOTAwatch spots are deliberately not fetched yet.
 *
 * The SOTA API is public but conditional: https://api-db2.sota.org.uk/docs requires the developer of
 * any application touching it to be in the "API-consumers" group on the SOTA Reflector, bans
 * commercial use, and — the clause that applies to this file specifically — states that no
 * AI-generated software may connect to the API without prior approval from the SOTA Management
 * Team. This app's spots code was written with an AI assistant, so nothing here calls them until
 * that approval exists.
 *
 * When it does, the endpoint to use is
 *
 *     GET https://api-db2.sota.org.uk/api/spots/{count}/all/1
 *
 * which answers with `access-control-allow-origin: *` and carries the summit code and name, its
 * altitude and points, and the activator's callsign, frequency, mode and comments — everything the
 * `Spot` type needs. Note the trailing `/1`: the older `/api/spots/{count}/all` path now returns a
 * single stub spot with a DEPRECATED callsign instead of data.
 *
 * Until then this source stays selectable nowhere and fetching it is a no-op rather than a throw, so
 * a stored setting naming it can't break a refresh.
 */
export const sotaApprovalPending = true;

export const fetchSotaSpots = async (): Promise<Spot[]> => [];
