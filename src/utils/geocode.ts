import axios from "axios";

const API_KEY = "65a75c71db028165322267qlje2e6e7";

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

export const geocode = async (address: string): Promise<GeocodeHit[]> => {
    const response = await axios.get(`https://geocode.maps.co/search?q=${address}&api_key=${API_KEY}`);
    return response.data;
};
