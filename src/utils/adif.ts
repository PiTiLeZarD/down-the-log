import { DateTime } from 'luxon';
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

const parseField = (adif: string): string[] => {
    let remaining = adif.trim();
    const match = remaining.match(/[<]([^:]+)[:]([0-9]+)[>]/);
    if (!match) {
        console.error('Error while parsing line');
        console.error(remaining);
        return [];
    }
    const [, tagName, tagLength] = match;
    remaining = remaining.slice(`<${tagName}:${tagLength}>`.length);
    const value = remaining.slice(0, +tagLength);
    remaining = remaining.slice(+tagLength);
    return [remaining, tagName.toLowerCase(), value];
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

    const qsoData: Record<string, string> = {};
    let tagName: string, value: string;
    let remaining = adif.trim();

    while (remaining != '<EOR>' && remaining.length) {
        const field = parseField(remaining);
        if (field.length === 0) {
            remaining = '';
            continue;
        }

        [remaining, tagName, value] = field;
        qsoData[tagName] = value;
    }

    const date = DateTime.fromFormat(`${qsoData.qso_date} ${qsoData.time_on}`, 'yyyyMMdd HHmmss');

    return {
        date,
        frequency: +qsoData.freq,
        mode: qsoData.mode,
        power: +qsoData.tx_pwr,
        callsign: qsoData.call,
        name: qsoData.name,
        state: qsoData.state,
        locator: qsoData.gridsquare,
        qth: qsoData.qth,
        myQth: qsoData.qth,
    } as any as QSO;
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
