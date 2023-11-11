import { DateTime } from 'luxon';
import uuid from 'react-native-uuid';
import { freq2band } from '../data/bands';
import cqzones from '../data/cqzones.json';
import ituzones from '../data/ituzones.json';
import { getCallsignData } from './callsign';
import { maidenhead2Latlong } from './locator';
import { findZone } from './polydec';
import { QSO } from './qso';

const field = (label: string, value?: string): string =>
    typeof value !== 'undefined' && value !== null
        ? '<' + label.toUpperCase() + ':' + ('' + value).length + '>' + value
        : '';

const parseField = (field: string): string[] => {
    const match = Array.from(field.matchAll(/[<](.+)[:]([0-9]+)[>](.*)/g));
    if (match.length == 0) return [];
    const [, fieldName, fieldLength, value] = match[0];
    if (+fieldLength !== value.length) console.info(`Invalid length for <${fieldName}:${fieldLength}>${value}`);
    return [fieldName.toLowerCase(), value];
};

export const qso2adif = (qso: QSO): string => {
    const callsignData = getCallsignData(qso.callsign);
    return (
        [
            qso.date ? field('qso_date', qso.date.toFormat('yyyyMMdd')) : null,
            qso.date ? field('time_on', qso.date.toFormat('HHmmss')) : null,

            field('band', freq2band(qso.frequency) as string),
            qso.frequency ? field('freq', String(qso.frequency)) : null,
            field('mode', qso.mode),
            qso.power ? field('tx_pwr', String(qso.power)) : null,

            field('call', qso.callsign),
            field('state', callsignData?.state),
            field('name', qso.name),

            field('qth', qso.qth),
            field('gridsquare', qso.locator),
            field('cont', callsignData?.ctn),
            qso.locator ? field('cqz', findZone(cqzones, maidenhead2Latlong(qso.locator))) : null,
            qso.locator ? field('ituz', findZone(ituzones, maidenhead2Latlong(qso.locator))) : null,
        ]
            .filter((v) => !!v)
            .join(' ') + '<EOR>'
    );
};

export const qsos2Adif = (qsos: QSO[]): string => qsos.map(qso2adif).join('\n');

export const adifLine2Qso = (adif: string): QSO | null => {
    if (!adif.endsWith('<EOR>')) return null;

    const data = Object.fromEntries(adif.replace('<EOR>', '').split(' ').map(parseField));

    const date = DateTime.fromFormat(`${data.qso_date} ${data.time_on}`, 'yyyyMMdd HHmmss');

    return {
        id: uuid.v4(),
        date,
        frequency: +data.frequency,
        mode: data.mode,
        power: +data.power,
        callsign: data.call,
        name: data.name,
        state: data.state,
        locator: data.gridsquare,
        qth: data.qth,
        myQth: data.qth,
    } as QSO;
};

export const adifFile2Qso = (adif: string): QSO[] =>
    adif
        .split('\n')
        .map(adifLine2Qso)
        .filter((q) => !!q) as QSO[];

export const downloadQsos = (title: string, qsos: QSO[]) =>
    Object.assign(document.createElement('a'), {
        href: `data:text/plain, ${encodeURIComponent(qsos2Adif(qsos))}`,
        download: title,
    }).click();
