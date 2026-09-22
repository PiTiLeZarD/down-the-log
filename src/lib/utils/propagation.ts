import { DateTime } from "luxon";
import { Band, bands } from "../data/bands";
import { LatLng } from "./locator";
import { rad } from "./math";

/**
 * A first-order HF propagation estimator.
 *
 * Every band-conditions widget on the web reports one set of numbers for the whole planet, which is
 * really the numbers for the northern mid-latitudes: an operator in VK4 gets told the bands are
 * shut while the sun is overhead, and gets warned about a geomagnetic storm that only ever touches
 * the aurora. The ionosphere is a local phenomenon, so everything here is worked out for the
 * operator's own grid square and the time it is there: sun angle drives the F2 layer and the D
 * layer, and geomagnetic latitude decides how much of the K index the operator actually feels.
 *
 * It is an estimate, not a prediction: no ionosonde data, no path-by-path ray tracing, no sporadic
 * E (which is what actually opens 10m and 6m in the VK summer, and is not predictable a day ahead).
 * Read it as "which band is worth trying first", not as a guarantee.
 */

const deg = (n: number): number => n * (180 / Math.PI);

// Unix epoch to J2000.0 (2000-01-01T12:00Z) in days.
const J2000_OFFSET = 10957.5;

export type SunPosition = { elevation: number; declination: number };

/**
 * Where the sun is, seen from a point on the ground. The low-precision solar position algorithm
 * from the USNO's Astronomical Almanac — good to about 0.01°, which is far finer than anything
 * downstream of it cares about.
 */
export const sunPosition = (at: DateTime, { latitude, longitude }: LatLng): SunPosition => {
    const days = at.toMillis() / 86400000 - J2000_OFFSET;
    const meanLongitude = 280.46 + 0.9856474 * days;
    const meanAnomaly = rad(357.528 + 0.9856003 * days);
    const eclipticLongitude = rad(
        meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly),
    );
    const obliquity = rad(23.439 - 0.0000004 * days);
    const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
    const rightAscension = Math.atan2(
        Math.cos(obliquity) * Math.sin(eclipticLongitude),
        Math.cos(eclipticLongitude),
    );
    // Greenwich mean sidereal time in hours, turned into the local hour angle of the sun.
    const siderealTime = 18.697374558 + 24.06570982441908 * days;
    const hourAngle = rad((siderealTime + longitude / 15) * 15 - deg(rightAscension));
    const phi = rad(latitude);
    const elevation = Math.asin(
        Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle),
    );
    return { elevation: deg(elevation), declination: deg(declination) };
};

// IGRF-13 geomagnetic north pole, epoch 2020. It moves a few km a year, which is well inside the
// slop of everything it feeds.
const MAGNETIC_POLE: LatLng = { latitude: 80.65, longitude: -72.68 };

/**
 * Geomagnetic latitude, which is what the ionosphere actually responds to. Brisbane sits at -27°
 * geographic but -34° geomagnetic; Seattle sits at 48° geographic and 54° geomagnetic, deep enough
 * into the auroral zone to lose paths in a storm that VK4 never notices.
 */
export const geomagneticLatitude = ({ latitude, longitude }: LatLng): number => {
    const phi = rad(latitude);
    const pole = rad(MAGNETIC_POLE.latitude);
    const deltaLongitude = rad(longitude - MAGNETIC_POLE.longitude);
    return deg(Math.asin(Math.sin(phi) * Math.sin(pole) + Math.cos(phi) * Math.cos(pole) * Math.cos(deltaLongitude)));
};

// The standard Kp -> ap table, indexed in thirds of a Kp unit (0, 0+, 1-, 1, 1+, ...).
const AP_FOR_KP = [
    0, 2, 3, 4, 5, 6, 7, 9, 12, 15, 18, 22, 27, 32, 39, 48, 56, 67, 80, 94, 111, 132, 154, 179, 207, 236, 300, 400,
];

export const kpToAp = (kp: number): number =>
    AP_FOR_KP[Math.min(AP_FOR_KP.length - 1, Math.max(0, Math.round(kp * 3)))];

/**
 * The A index is the day's ap values averaged, so it wants the last 24 hours — eight readings from
 * the three-hourly Kp series.
 */
export const aIndex = (kpSeries: number[]): number | undefined => {
    const day = kpSeries.slice(-8);
    if (!day.length) return undefined;
    return Math.round(day.reduce((total, kp) => total + kpToAp(kp), 0) / day.length);
};

export type RadioBlackout = { scale: 0 | 1 | 2 | 3 | 4 | 5; label: string; xray?: string };

// NOAA's X-ray classes are decade steps in W/m²: C1 is 1e-6, M1 is 1e-5, X1 is 1e-4.
const XRAY_DECADES: Record<string, number> = { A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 };

export const xrayFlux = (xray?: string): number | undefined => {
    const match = xray?.trim().toUpperCase().match(/^([ABCMX])([0-9]*\.?[0-9]+)$/);
    if (!match) return undefined;
    return XRAY_DECADES[match[1]] * +match[2];
};

/**
 * The NOAA R scale. A flare ionises the D layer within seconds on the sunlit half of the planet and
 * nowhere else, so the caller still has to check whether the sun is actually up here.
 */
export const radioBlackout = (xray?: string): RadioBlackout => {
    const flux = xrayFlux(xray);
    const scale = !flux
        ? 0
        : flux >= 2e-3
          ? 5
          : flux >= 1e-3
            ? 4
            : flux >= 1e-4
              ? 3
              : flux >= 5e-5
                ? 2
                : flux >= 1e-5
                  ? 1
                  : 0;
    const labels = [
        "None",
        "R1 Minor",
        "R2 Moderate",
        "R3 Strong",
        "R4 Severe",
        "R5 Extreme",
    ];
    return { scale: scale as RadioBlackout["scale"], label: labels[scale], xray };
};

export type ConditionLabel = "Good" | "Fair" | "Poor" | "Closed";

export const conditionLabel = (score: number): ConditionLabel =>
    score >= 70 ? "Good" : score >= 45 ? "Fair" : score >= 20 ? "Poor" : "Closed";

/**
 * How well one frequency sits between the two walls that bracket every HF path: the MUF above,
 * where the F2 layer stops bending the signal back down, and the LUF below, where D layer
 * absorption swallows it on the way through.
 */
export const bandScore = (frequency: number, muf: number, luf: number): number => {
    if (muf <= 0) return 0;
    const ratio = frequency / muf;
    // A little scatter survives just over the top of the MUF, then nothing does.
    if (ratio > 1) return Math.max(0, Math.round(55 - 400 * (ratio - 1)));
    // The sweet spot is the stretch just under the MUF: longest hops, shallowest angles, least
    // absorption. Below that a band still works, it just wastes the opening.
    const base = ratio >= 0.9 ? 100 - 450 * (ratio - 0.9) : ratio >= 0.55 ? 100 : 45 + 100 * ratio;
    // Absorption goes as 1/f², so the wall at the bottom is steep rather than a cutoff.
    const absorbed = frequency < luf ? Math.pow(frequency / luf, 2) : 1;
    return Math.max(0, Math.round(base * absorbed));
};

export type PathType = "dx" | "local";

export type BandCondition = {
    band: Band;
    frequency: number;
    scores: Record<PathType, number>;
    labels: Record<PathType, ConditionLabel>;
};

export type Daylight = "day" | "greyline" | "night";

export type PropagationInput = {
    sfi?: number;
    kp?: number;
    xray?: string;
    at: DateTime;
    location: LatLng;
};

export type Propagation = {
    at: DateTime;
    sunElevation: number;
    daylight: Daylight;
    geomagneticLatitude: number;
    /** 0-1: how much of the current K index this location actually feels. */
    auroralImpact: number;
    blackout: RadioBlackout;
    /** F2 critical frequency, MHz — the vertical-incidence number everything else scales off. */
    foF2: number;
    muf: Record<PathType, number>;
    luf: Record<PathType, number>;
    bands: BandCondition[];
    best: Record<PathType, BandCondition | undefined>;
};

// The bands the F2 layer can plausibly carry. 6m is left out on purpose: outside solar maximum it
// opens on sporadic E, which this model has no way to see, so a permanent "Closed" would be a lie.
const MODELLED_BANDS: Band[] = ["160m", "80m", "60m", "40m", "30m", "20m", "17m", "15m", "12m", "10m"];

// M(3000)F2 — the factor between vertical incidence and a full-length hop. ~3.2 for the 3000 km
// hop that makes up a DX path, and much closer to 1 for the near-vertical bounce that covers your
// own state.
const M_FACTOR: Record<PathType, number> = { dx: 3.2, local: 1.5 };

// The F2 layer decays after sunset rather than switching off, so the night floor is a fraction of
// the noon value rather than zero. Modelled symmetrically around the horizon, which makes dawn look
// like dusk: in reality the pre-dawn ionosphere is the thinner of the two.
const NIGHT_FLOOR = 0.45;
const NIGHT_DUSK = 0.62;
const NIGHT_DEPTH = 35;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const estimatePropagation = ({ sfi, kp, xray, at, location }: PropagationInput): Propagation => {
    const flux = Math.max(64, sfi ?? 70);
    const { elevation } = sunPosition(at, location);
    const magLatitude = geomagneticLatitude(location);
    const blackout = radioBlackout(xray);

    // Sun up, sun down, or the hour either side of the horizon where the low bands get their
    // best DX of the day.
    const daylight: Daylight = elevation > 6 ? "day" : elevation > -8 ? "greyline" : "night";

    // Noon foF2 tracks the solar flux almost linearly over the range the 10.7 cm flux ever takes:
    // ~6 MHz at the bottom of a cycle, ~13 MHz at the top.
    const noonFoF2 = 2.0 + 0.055 * flux;
    // Thickest either side of the magnetic equator, thinnest over the poles.
    const latitudeFactor = 1.08 - 0.3 * Math.pow(Math.abs(magLatitude) / 90, 2);
    const dayTerm = elevation > 0 ? Math.pow(Math.sin(rad(elevation)), 0.25) : 0;
    const nightTerm = NIGHT_FLOOR + (NIGHT_DUSK - NIGHT_FLOOR) * (1 - clamp(-elevation / NIGHT_DEPTH));

    // Only the auroral latitudes feel the K index. The threshold is where the auroral oval reaches
    // on a disturbed day; below it a storm is somebody else's problem, which is the whole reason
    // a global band-conditions widget reads wrong from VK or ZL.
    const exposure = clamp((Math.abs(magLatitude) - 30) / 35);
    const auroralImpact = exposure * (clamp((kp ?? 0) - 3, 0, 4) / 4);

    const foF2 = Math.max(1.5, noonFoF2 * latitudeFactor * Math.max(dayTerm, nightTerm)) * (1 - 0.25 * auroralImpact);

    // D layer absorption follows the sun directly and clears within an hour of sunset. The flare
    // term only counts while the sun is up, because that is the only half of the planet a flare
    // reaches.
    const sunlit = elevation > 0 ? Math.pow(Math.sin(rad(elevation)), 0.75) : 0;
    const flareTerm = sunlit > 0 ? blackout.scale * 0.45 : 0;
    const absorption = sunlit * (0.6 + 0.4 * (flux / 100));
    const dxLuf = 1.8 + 4.2 * absorption + flareTerm + 2.5 * auroralImpact;

    const muf: Record<PathType, number> = { dx: foF2 * M_FACTOR.dx, local: foF2 * M_FACTOR.local };
    // A short path crosses the D layer twice at a steep angle; a DX path crosses it twice per hop
    // at a shallow one, so the same absorption costs it several times as much.
    const luf: Record<PathType, number> = { dx: dxLuf, local: dxLuf * 0.75 };

    const conditions: BandCondition[] = MODELLED_BANDS.map((band) => {
        const [low, high] = bands[band];
        const frequency = (low + high) / 2;
        const scores = { dx: bandScore(frequency, muf.dx, luf.dx), local: bandScore(frequency, muf.local, luf.local) };
        return {
            band,
            frequency,
            scores,
            labels: { dx: conditionLabel(scores.dx), local: conditionLabel(scores.local) },
        };
    });

    // On a tie DX takes the higher band — longer hop, quieter noise floor — while a local path
    // takes the lower one, because the lower band's shallower skip distance covers the ground in
    // between as well as the far edge.
    const bestFor = (path: PathType) =>
        conditions.reduce<BandCondition | undefined>((best, candidate) => {
            if (candidate.scores[path] < 45) return best;
            if (!best) return candidate;
            if (path === "local") return candidate.scores[path] > best.scores[path] ? candidate : best;
            return candidate.scores[path] >= best.scores[path] ? candidate : best;
        }, undefined);

    return {
        at,
        sunElevation: elevation,
        daylight,
        geomagneticLatitude: magLatitude,
        auroralImpact,
        blackout,
        foF2,
        muf,
        luf,
        bands: conditions,
        best: { dx: bestFor("dx"), local: bestFor("local") },
    };
};

/** The one-line "try this first" at the bottom of the panel. */
export const takeaway = ({ best, daylight, blackout, auroralImpact }: Propagation): string => {
    const parts: string[] = [];
    if (best.local) parts.push(`${best.local.band} locally`);
    if (best.dx && best.dx.band !== best.local?.band) parts.push(`${best.dx.band} for distance`);
    const bands = parts.length ? parts.join(", ") : "nothing above 160m is open — try digital modes";
    const notes: string[] = [];
    if (daylight === "greyline") notes.push("grey line now: low bands peak for the next hour or so");
    if (blackout.scale > 0 && daylight !== "night") notes.push(`${blackout.label} blackout on the sunlit side`);
    if (auroralImpact > 0.3) notes.push("polar and high-latitude paths are degraded");
    return [bands, ...notes].join(". ") + ".";
};
