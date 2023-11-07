export const bands = {
    '2.2km': [135, 138],
    '630m': [472, 479],
    '160m': [1800, 1875],
    '80m': [3500, 3800],
    '60m': [5325, 5425],
    '40m': [7000, 7300],
    '30m': [10100, 10150],
    '20m': [14000, 14350],
    '17m': [18068, 18168],
    '15m': [21000, 21450],
    '12m': [24890, 24990],
    '10m': [28000, 29700],
    '6m': [50000, 54000],
    '4m': [70000, 70500],
    '2m': [144000, 148000],
    '1.25m': [220000, 225000],
    '70cm': [420000, 450000],
    '23cm': [1240000, 1300000],
    '13cm': [2300000, 2450000],
    '9cm': [3300000, 3600000],
    '6cm': [5650000, 5850000],
    '3cm': [10000000, 10500000],
    '12mm': [24000000, 24250000],
    '6mm': [47000000, 47200000],
    '4mm': [76000000, 81000000],
};

export type Band = keyof typeof bands;

export const freq2band = (freq?: number): Band | null =>
    freq
        ? Object.entries(bands).reduce<Band | null>(
              (acc: Band | null, [band, [low, high]]) => acc || (freq >= low && freq <= high ? (band as Band) : acc),
              null
          )
        : null;
