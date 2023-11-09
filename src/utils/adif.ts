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

export const downloadQsos = (title: string, qsos: QSO[]) =>
    Object.assign(document.createElement('a'), {
        href: `data:application/JSON, ${encodeURIComponent(qsos.map(qso2adif).join('\n'))}`,
        download: title,
    }).click();
