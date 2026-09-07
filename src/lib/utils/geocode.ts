import axios from "axios";

export type GeocodeHit = {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    boundingbox: string[];
    lat: string;
    lon: string;
    display_name: string;
    class: string;
    type: string;
    importance: number;
};

// A QTH is free text: an unescaped `&` or `#` in it would truncate the query or graft an extra
// parameter onto the request, so it goes through encodeURIComponent like the hamqth lookup does.
export const geocode = async (address: string, key: string): Promise<GeocodeHit[]> => {
    const response = await axios.get(
        `https://geocode.maps.co/search?q=${encodeURIComponent(address)}&api_key=${key}`,
    );
    return response.data;
};
