/**
 * Shamelessly took from there:
 * https://github.com/ronatskiy/country-flags-svg/blob/master/src/data/countries.ts
 *
 * for some reason the lib doesn't wanna comply with expo
 */

function createUrl(svgUrl: string) {
    return `https://upload.wikimedia.org/wikipedia/commons${svgUrl}` as const;
}

export const countries = [
    {
        name: 'Afghanistan',
        flag: createUrl('/5/5c/Flag_of_the_Taliban.svg'),
        iso3: 'AFG',
    },
    {
        name: 'Aland Islands',
        flag: createUrl('/5/52/Flag_of_%C3%85land.svg'),
        iso3: 'ALA',
    },
    {
        name: 'Albania',
        flag: createUrl('/3/36/Flag_of_Albania.svg'),
        iso3: 'ALB',
    },
    {
        name: 'Algeria',
        flag: createUrl('/7/77/Flag_of_Algeria.svg'),
        iso3: 'DZA',
    },
    {
        name: 'American Samoa',
        flag: createUrl('/8/87/Flag_of_American_Samoa.svg'),
        iso3: 'ASM',
    },
    {
        name: 'Andorra',
        flag: createUrl('/1/19/Flag_of_Andorra.svg'),
        iso3: 'AND',
    },
    {
        name: 'Angola',
        flag: createUrl('/9/9d/Flag_of_Angola.svg'),
        iso3: 'AGO',
    },
    {
        name: 'Anguilla',
        flag: createUrl('/b/b4/Flag_of_Anguilla.svg'),
        iso3: 'AIA',
    },
    {
        name: 'Antigua and Barbuda',
        flag: createUrl('/8/89/Flag_of_Antigua_and_Barbuda.svg'),
        iso3: 'ATG',
    },
    {
        name: 'Argentina',
        flag: createUrl('/1/1a/Flag_of_Argentina.svg'),
        iso3: 'ARG',
    },
    {
        name: 'Armenia',
        flag: createUrl('/2/2f/Flag_of_Armenia.svg'),
        iso3: 'ARM',
    },
    {
        name: 'Aruba',
        flag: createUrl('/f/f6/Flag_of_Aruba.svg'),
        iso3: 'ABW',
    },
    {
        name: 'Australia',
        flag: createUrl('/8/88/Flag_of_Australia_(converted).svg'),
        iso3: 'AUS',
    },
    {
        name: 'Austria',
        flag: createUrl('/4/41/Flag_of_Austria.svg'),
        iso3: 'AUT',
    },
    {
        name: 'Azerbaijan',
        flag: createUrl('/d/dd/Flag_of_Azerbaijan.svg'),
        iso3: 'AZE',
    },
    {
        name: 'Bahamas',
        flag: createUrl('/9/93/Flag_of_the_Bahamas.svg'),
        iso3: 'BHS',
    },
    {
        name: 'Bahrain',
        flag: createUrl('/2/2c/Flag_of_Bahrain.svg'),
        iso3: 'BHR',
    },
    {
        name: 'Bangladesh',
        flag: createUrl('/f/f9/Flag_of_Bangladesh.svg'),
        iso3: 'BGD',
    },
    {
        name: 'Barbados',
        flag: createUrl('/e/ef/Flag_of_Barbados.svg'),
        iso3: 'BRB',
    },
    {
        name: 'Belarus',
        flag: createUrl('/8/85/Flag_of_Belarus.svg'),
        iso3: 'BLR',
    },
    {
        name: 'Belgium',
        flag: createUrl('/6/65/Flag_of_Belgium.svg'),
        iso3: 'BEL',
    },
    {
        name: 'Belize',
        flag: createUrl('/e/e7/Flag_of_Belize.svg'),
        iso3: 'BLZ',
    },
    {
        name: 'Benin',
        flag: createUrl('/0/0a/Flag_of_Benin.svg'),
        iso3: 'BEN',
    },
    {
        name: 'Bermuda',
        flag: createUrl('/b/bf/Flag_of_Bermuda.svg'),
        iso3: 'BMU',
    },
    {
        name: 'Bhutan',
        flag: createUrl('/9/91/Flag_of_Bhutan.svg'),
        iso3: 'BTN',
    },
    {
        name: 'Bolivia',
        flag: createUrl('/5/5b/Bolivia_Flag.svg'),
        iso3: 'BOL',
    },
    {
        name: 'Bonaire, Sint Eustatius and Saba',
        flag: createUrl('/2/20/Flag_of_the_Netherlands.svg'),
        iso3: 'BES',
    },
    {
        name: 'Bosnia and Herzegovina',
        flag: createUrl('/b/bf/Flag_of_Bosnia_and_Herzegovina.svg'),
        iso3: 'BIH',
    },
    {
        name: 'Botswana',
        flag: createUrl('/f/fa/Flag_of_Botswana.svg'),
        iso3: 'BWA',
    },
    {
        name: 'Brazil',
        flag: createUrl('/0/05/Flag_of_Brazil.svg'),
        iso3: 'BRA',
    },
    {
        name: 'British Virgin Islands',
        flag: createUrl('/4/42/Flag_of_the_British_Virgin_Islands.svg'),
        iso3: 'VGB',
    },
    {
        name: 'Brunei',
        flag: createUrl('/9/9c/Flag_of_Brunei.svg'),
        iso3: 'BRN',
    },
    {
        name: 'Bulgaria',
        flag: createUrl('/9/9a/Flag_of_Bulgaria.svg'),
        iso3: 'BGR',
    },
    {
        name: 'Burkina Faso',
        flag: createUrl('/3/31/Flag_of_Burkina_Faso.svg'),
        iso3: 'BFA',
    },
    {
        name: 'Burundi',
        flag: createUrl('/5/50/Flag_of_Burundi.svg'),
        iso3: 'BDI',
    },
    {
        name: 'Cambodia',
        flag: createUrl('/8/83/Flag_of_Cambodia.svg'),
        iso3: 'KHM',
    },
    {
        name: 'Cameroon',
        flag: createUrl('/4/4f/Flag_of_Cameroon.svg'),
        iso3: 'CMR',
    },
    {
        name: 'Canada',
        flag: createUrl('/d/d9/Flag_of_Canada_(Pantone).svg'),
        iso3: 'CAN',
    },
    {
        name: 'Cape Verde',
        flag: createUrl('/3/38/Flag_of_Cape_Verde.svg'),
        iso3: 'CPV',
    },
    {
        name: 'Cayman Islands',
        flag: createUrl('/0/0f/Flag_of_the_Cayman_Islands.svg'),
        iso3: 'CYM',
    },
    {
        name: 'Central African Republic',
        flag: createUrl('/6/6f/Flag_of_the_Central_African_Republic.svg'),
        iso3: 'CAF',
    },
    {
        name: 'Chad',
        flag: createUrl('/4/4b/Flag_of_Chad.svg'),
        iso3: 'TCD',
    },
    {
        name: 'Chile',
        flag: createUrl('/7/78/Flag_of_Chile.svg'),
        iso3: 'CHL',
    },
    {
        name: 'China',
        flag: createUrl('/f/fa/Flag_of_the_People%27s_Republic_of_China.svg'),
        iso3: 'CHN',
    },
    {
        name: 'Christmas Island',
        flag: createUrl('/6/67/Flag_of_Christmas_Island.svg'),
        iso3: 'CXR',
    },
    {
        name: 'Cocos Islands',
        flag: createUrl('/7/74/Flag_of_the_Cocos_(Keeling)_Islands.svg'),
        iso3: 'CCK',
    },
    {
        name: 'Colombia',
        flag: createUrl('/2/21/Flag_of_Colombia.svg'),
        iso3: 'COL',
    },
    {
        name: 'Comoros',
        flag: createUrl('/d/df/Flag_of_the_Comoros_(3-2).svg'),
        iso3: 'COM',
    },
    {
        name: 'Congo',
        flag: createUrl('/9/92/Flag_of_the_Republic_of_the_Congo.svg'),
        iso3: 'COG',
    },
    {
        name: 'Cook Islands',
        flag: createUrl('/3/35/Flag_of_the_Cook_Islands.svg'),
        iso3: 'COK',
    },
    {
        name: 'Costa Rica',
        flag: createUrl('/b/bc/Flag_of_Costa_Rica_(state).svg'),
        iso3: 'CRI',
    },
    {
        name: "Côte d'Ivoire",
        flag: createUrl('/f/fe/Flag_of_Côte_d%27Ivoire.svg'),
        iso3: 'CIV',
    },
    {
        name: 'Croatia',
        flag: createUrl('/1/1b/Flag_of_Croatia.svg'),
        iso3: 'HRV',
    },
    {
        name: 'Cuba',
        flag: createUrl('/b/bd/Flag_of_Cuba.svg'),
        iso3: 'CUB',
    },
    {
        name: 'Curaçao',
        flag: createUrl('/b/b1/Flag_of_Curaçao.svg'),
        iso3: 'CUW',
    },
    {
        name: 'Cyprus',
        flag: createUrl('/d/d4/Flag_of_Cyprus.svg'),
        iso3: 'CYP',
    },
    {
        name: 'Czech Republic',
        flag: createUrl('/c/cb/Flag_of_the_Czech_Republic.svg'),
        iso3: 'CZE',
    },
    {
        name: 'Democratic Republic of the Congo',
        flag: createUrl('/1/11/Flag_of_the_Democratic_Republic_of_the_Congo_(3-2).svg'),
        iso3: 'COD',
    },
    {
        name: 'Denmark',
        flag: createUrl('/9/9c/Flag_of_Denmark.svg'),
        iso3: 'DNK',
    },
    {
        name: 'Djibouti',
        flag: createUrl('/3/34/Flag_of_Djibouti.svg'),
        iso3: 'DJI',
    },
    {
        name: 'Dominica',
        flag: createUrl('/c/c4/Flag_of_Dominica.svg'),
        iso3: 'DMA',
    },
    {
        name: 'Dominican Republic',
        flag: createUrl('/9/9f/Flag_of_the_Dominican_Republic.svg'),
        iso3: 'DOM',
    },
    {
        name: 'Ecuador',
        flag: createUrl('/e/e8/Flag_of_Ecuador.svg'),
        iso3: 'ECU',
    },
    {
        name: 'Egypt',
        flag: createUrl('/f/fe/Flag_of_Egypt.svg'),
        iso3: 'EGY',
    },
    {
        name: 'El Salvador',
        flag: createUrl('/3/34/Flag_of_El_Salvador.svg'),
        iso3: 'SLV',
    },
    {
        name: 'Equatorial Guinea',
        flag: createUrl('/3/31/Flag_of_Equatorial_Guinea.svg'),
        iso3: 'GNQ',
    },
    {
        name: 'Eritrea',
        flag: createUrl('/2/29/Flag_of_Eritrea.svg'),
        iso3: 'ERI',
    },
    {
        name: 'Estonia',
        flag: createUrl('/8/8f/Flag_of_Estonia.svg'),
        iso3: 'EST',
    },
    {
        name: 'Ethiopia',
        flag: createUrl('/7/71/Flag_of_Ethiopia.svg'),
        iso3: 'ETH',
    },
    {
        name: 'Falkland Islands',
        flag: createUrl('/8/83/Flag_of_the_Falkland_Islands.svg'),
        iso3: 'FLK',
    },
    {
        name: 'Faroe Islands',
        flag: createUrl('/3/3c/Flag_of_the_Faroe_Islands.svg'),
        iso3: 'FRO',
    },
    {
        name: 'Fiji',
        flag: createUrl('/b/ba/Flag_of_Fiji.svg'),
        iso3: 'FJI',
    },
    {
        name: 'Finland',
        flag: createUrl('/b/bc/Flag_of_Finland.svg'),
        iso3: 'FIN',
    },
    {
        name: 'France',
        flag: createUrl('/c/c3/Flag_of_France.svg'),
        iso3: 'FRA',
    },
    {
        name: 'French Guiana',
        flag: createUrl('/e/ed/Flag_of_France_%28Pantone%29.svg'),
        iso3: 'GUF',
    },
    {
        name: 'French Polynesia',
        flag: createUrl('/d/db/Flag_of_French_Polynesia.svg'),
        iso3: 'PYF',
    },
    {
        name: 'Gabon',
        flag: createUrl('/0/04/Flag_of_Gabon.svg'),
        iso3: 'GAB',
    },
    {
        name: 'Gambia',
        flag: createUrl('/7/77/Flag_of_The_Gambia.svg'),
        iso3: 'GMB',
    },
    {
        name: 'Georgia',
        flag: createUrl('/0/0f/Flag_of_Georgia.svg'),
        iso3: 'GEO',
    },
    {
        name: 'Germany',
        flag: createUrl('/b/ba/Flag_of_Germany.svg'),
        iso3: 'DEU',
    },
    {
        name: 'Ghana',
        flag: createUrl('/1/19/Flag_of_Ghana.svg'),
        iso3: 'GHA',
    },
    {
        name: 'Gibraltar',
        flag: createUrl('/0/02/Flag_of_Gibraltar.svg'),
        iso3: 'GIB',
    },
    {
        name: 'Greece',
        flag: createUrl('/5/5c/Flag_of_Greece.svg'),
        iso3: 'GRC',
    },
    {
        name: 'Greenland',
        flag: createUrl('/0/09/Flag_of_Greenland.svg'),
        iso3: 'GRL',
    },
    {
        name: 'Grenada',
        flag: createUrl('/b/bc/Flag_of_Grenada.svg'),
        iso3: 'GRD',
    },
    {
        name: 'Guadeloupe',
        flag: createUrl('/9/9f/Flag_of_France_%287x10%29.svg'),
        iso3: 'GLP',
    },
    {
        name: 'Guam',
        flag: createUrl('/0/07/Flag_of_Guam.svg'),
        iso3: 'GUM',
    },
    {
        name: 'Guatemala',
        flag: createUrl('/e/ec/Flag_of_Guatemala.svg'),
        iso3: 'GTM',
    },
    {
        name: 'Guernsey',
        flag: createUrl('/f/fa/Flag_of_Guernsey.svg'),
        iso3: 'GGY',
    },
    {
        name: 'Guinea-Bissau',
        flag: createUrl('/0/01/Flag_of_Guinea-Bissau.svg'),
        iso3: 'GNB',
    },
    {
        name: 'Guinea',
        flag: createUrl('/e/ed/Flag_of_Guinea.svg'),
        iso3: 'GIN',
    },
    {
        name: 'Guyana',
        flag: createUrl('/9/99/Flag_of_Guyana.svg'),
        iso3: 'GUY',
    },
    {
        name: 'Haiti',
        flag: createUrl('/5/56/Flag_of_Haiti.svg'),
        iso3: 'HTI',
    },
    {
        name: 'Holy See',
        flag: createUrl('/0/00/Flag_of_the_Vatican_City.svg'),
        iso3: 'VAT',
        altSpellings: ['Vatican'],
    },
    {
        name: 'Honduras',
        flag: createUrl('/8/82/Flag_of_Honduras.svg'),
        iso3: 'HND',
    },
    {
        name: 'Hong Kong',
        flag: createUrl('/5/5b/Flag_of_Hong_Kong.svg'),
        iso3: 'HKG',
    },
    {
        name: 'Hungary',
        flag: createUrl('/c/c1/Flag_of_Hungary.svg'),
        iso3: 'HUN',
    },
    {
        name: 'Iceland',
        flag: createUrl('/c/ce/Flag_of_Iceland.svg'),
        iso3: 'ISL',
    },
    {
        name: 'India',
        flag: createUrl('/4/41/Flag_of_India.svg'),
        iso3: 'IND',
    },
    {
        name: 'Indonesia',
        flag: createUrl('/9/9f/Flag_of_Indonesia.svg'),
        iso3: 'IDN',
    },
    {
        name: 'British Indian Ocean Territory',
        flag: createUrl('/6/65/Flag_of_the_Commissioner_of_the_British_Indian_Ocean_Territory.svg'),
        iso3: 'IOT',
    },
    {
        name: 'Iran',
        flag: createUrl('/c/ca/Flag_of_Iran.svg'),
        iso3: 'IRN',
    },
    {
        name: 'Iraq',
        flag: createUrl('/f/f6/Flag_of_Iraq.svg'),
        iso3: 'IRQ',
    },
    {
        name: 'Ireland',
        flag: createUrl('/c/c0/Republic_of_Ireland_Flag.svg'),
        iso3: 'IRL',
    },
    {
        name: 'Isle of Man',
        flag: createUrl('/b/bc/Flag_of_the_Isle_of_Man.svg'),
        iso3: 'IMN',
    },
    {
        name: 'Israel',
        flag: createUrl('/d/d4/Flag_of_Israel.svg'),
        iso3: 'ISR',
    },
    {
        name: 'Italy',
        flag: createUrl('/0/03/Flag_of_Italy.svg'),
        iso3: 'ITA',
    },
    {
        name: 'Jamaica',
        flag: createUrl('/0/0a/Flag_of_Jamaica.svg'),
        iso3: 'JAM',
    },
    {
        name: 'Japan',
        flag: createUrl('/b/bc/Flag_of_Japan%28bordered%29.svg'),
        iso3: 'JPN',
    },
    {
        name: 'Jersey',
        flag: createUrl('/1/1c/Flag_of_Jersey.svg'),
        iso3: 'JEY',
    },
    {
        name: 'Jordan',
        flag: createUrl('/c/c0/Flag_of_Jordan.svg'),
        iso3: 'JOR',
    },
    {
        name: 'Kazakhstan',
        flag: createUrl('/d/d3/Flag_of_Kazakhstan.svg'),
        iso3: 'KAZ',
    },
    {
        name: 'Kenya',
        flag: createUrl('/4/49/Flag_of_Kenya.svg'),
        iso3: 'KEN',
    },
    {
        name: 'Kiribati',
        flag: createUrl('/d/d3/Flag_of_Kiribati.svg'),
        iso3: 'KIR',
    },
    {
        name: 'Kosovo',
        flag: createUrl('/1/1f/Flag_of_Kosovo.svg'),
        iso3: 'XXK',
    },
    {
        name: 'Kuwait',
        flag: createUrl('/a/aa/Flag_of_Kuwait.svg'),
        iso3: 'KWT',
    },
    {
        name: 'Kyrgyzstan',
        flag: createUrl('/c/c7/Flag_of_Kyrgyzstan.svg'),
        iso3: 'KGZ',
    },
    {
        name: 'Laos',
        flag: createUrl('/5/56/Flag_of_Laos.svg'),
        iso3: 'LAO',
    },
    {
        name: 'Latvia',
        flag: createUrl('/8/84/Flag_of_Latvia.svg'),
        iso3: 'LVA',
    },
    {
        name: 'Lebanon',
        flag: createUrl('/5/59/Flag_of_Lebanon.svg'),
        iso3: 'LBN',
    },
    {
        name: 'Lesotho',
        flag: createUrl('/4/4a/Flag_of_Lesotho.svg'),
        iso3: 'LSO',
    },
    {
        name: 'Liberia',
        flag: createUrl('/b/b8/Flag_of_Liberia.svg'),
        iso3: 'LBR',
    },
    {
        name: 'Libya',
        flag: createUrl('/0/05/Flag_of_Libya.svg'),
        iso3: 'LBY',
    },
    {
        name: 'Liechtenstein',
        flag: createUrl('/4/47/Flag_of_Liechtenstein.svg'),
        iso3: 'LIE',
    },
    {
        name: 'Lithuania',
        flag: createUrl('/1/11/Flag_of_Lithuania.svg'),
        iso3: 'LTU',
    },
    {
        name: 'Luxembourg',
        flag: createUrl('/d/da/Flag_of_Luxembourg.svg'),
        iso3: 'LUX',
    },
    {
        name: 'Macao',
        flag: createUrl('/6/63/Flag_of_Macau.svg'),
        iso3: 'MAC',
    },
    {
        name: 'Madagascar',
        flag: createUrl('/b/bc/Flag_of_Madagascar.svg'),
        iso3: 'MDG',
    },
    {
        name: 'Malawi',
        flag: createUrl('/d/d1/Flag_of_Malawi.svg'),
        iso3: 'MWI',
    },
    {
        name: 'Malaysia',
        flag: createUrl('/6/66/Flag_of_Malaysia.svg'),
        iso3: 'MYS',
    },
    {
        name: 'Maldives',
        flag: createUrl('/0/0f/Flag_of_Maldives.svg'),
        iso3: 'MDV',
    },
    {
        name: 'Mali',
        flag: createUrl('/9/92/Flag_of_Mali.svg'),
        iso3: 'MLI',
    },
    {
        name: 'Malta',
        flag: createUrl('/7/73/Flag_of_Malta.svg'),
        iso3: 'MLT',
    },
    {
        name: 'Marshall Islands',
        flag: createUrl('/2/2e/Flag_of_the_Marshall_Islands.svg'),
        iso3: 'MHL',
    },
    {
        name: 'Martinique',
        flag: createUrl('/2/21/Flag_of_the_Territorial_Collectivity_of_Martinique.svg'),
        iso3: 'MTQ',
    },
    {
        name: 'Mauritania',
        flag: createUrl('/4/43/Flag_of_Mauritania.svg'),
        iso3: 'MRT',
    },
    {
        name: 'Mauritius',
        flag: createUrl('/7/77/Flag_of_Mauritius.svg'),
        iso3: 'MUS',
    },
    {
        name: 'Mayotte',
        flag: createUrl('/c/c3/Flag_of_France.svg'),
        iso3: 'MYT',
    },
    {
        name: 'Mexico',
        flag: createUrl('/f/fc/Flag_of_Mexico.svg'),
        iso3: 'MEX',
    },
    {
        name: 'Micronesia',
        flag: createUrl('/e/e4/Flag_of_the_Federated_States_of_Micronesia.svg'),
        iso3: 'FSM',
    },
    {
        name: 'Moldova',
        flag: createUrl('/2/27/Flag_of_Moldova.svg'),
        iso3: 'MDA',
    },
    {
        name: 'Monaco',
        flag: createUrl('/e/ea/Flag_of_Monaco.svg'),
        iso3: 'MCO',
    },
    {
        name: 'Mongolia',
        flag: createUrl('/4/4c/Flag_of_Mongolia.svg'),
        iso3: 'MNG',
    },
    {
        name: 'Montenegro',
        flag: createUrl('/6/64/Flag_of_Montenegro.svg'),
        iso3: 'MNE',
    },
    {
        name: 'Montserrat',
        flag: createUrl('/d/d0/Flag_of_Montserrat.svg'),
        iso3: 'MSR',
    },
    {
        name: 'Morocco',
        flag: createUrl('/2/2c/Flag_of_Morocco.svg'),
        iso3: 'MAR',
    },
    {
        name: 'Mozambique',
        flag: createUrl('/d/d0/Flag_of_Mozambique.svg'),
        iso3: 'MOZ',
    },
    {
        name: 'Myanmar',
        flag: createUrl('/8/8c/Flag_of_Myanmar.svg'),
        iso3: 'MMR',
    },
    {
        name: 'Namibia',
        flag: createUrl('/0/00/Flag_of_Namibia.svg'),
        iso3: 'NAM',
    },
    {
        name: 'Nauru',
        flag: createUrl('/3/30/Flag_of_Nauru.svg'),
        iso3: 'NRU',
    },
    {
        name: 'Nepal',
        flag: createUrl('/9/9b/Flag_of_Nepal.svg'),
        iso3: 'NPL',
    },
    {
        name: 'Netherlands Antilles',
        flag: createUrl('/e/eb/Flag_of_the_Netherlands_Antilles_(1959%E2%80%931986).svg'),
        iso3: 'ANT',
    },
    {
        name: 'Netherlands',
        flag: createUrl('/2/20/Flag_of_the_Netherlands.svg'),
        iso3: 'NLD',
    },
    {
        name: 'New Caledonia',
        flag: createUrl('/6/66/Flag_of_FLNKS.svg'),
        iso3: 'NCL',
    },
    {
        name: 'New Zealand',
        flag: createUrl('/3/3e/Flag_of_New_Zealand.svg'),
        iso3: 'NZL',
    },
    {
        name: 'Nicaragua',
        flag: createUrl('/1/19/Flag_of_Nicaragua.svg'),
        iso3: 'NIC',
    },
    {
        name: 'Niger',
        flag: createUrl('/f/f4/Flag_of_Niger.svg'),
        iso3: 'NER',
    },
    {
        name: 'Nigeria',
        flag: createUrl('/7/79/Flag_of_Nigeria.svg'),
        iso3: 'NGA',
    },
    {
        name: 'Niue',
        flag: createUrl('/0/01/Flag_of_Niue.svg'),
        iso3: 'NIU',
    },
    {
        name: 'Norfolk Island',
        flag: createUrl('/4/48/Flag_of_Norfolk_Island.svg'),
        iso3: 'NFK',
    },
    {
        name: 'North Korea',
        flag: createUrl('/5/51/Flag_of_North_Korea.svg'),
        iso3: 'PRK',
    },
    {
        name: 'North Macedonia',
        flag: createUrl('/7/79/Flag_of_North_Macedonia.svg'),
        iso3: 'MKD',
    },
    {
        name: 'Northern Mariana Islands',
        flag: createUrl('/e/e0/Flag_of_the_Northern_Mariana_Islands.svg'),
        iso3: 'MNP',
    },
    {
        name: 'Norway',
        flag: createUrl('/d/d9/Flag_of_Norway.svg'),
        iso3: 'NOR',
    },
    {
        name: 'Oman',
        flag: createUrl('/d/dd/Flag_of_Oman.svg'),
        iso3: 'OMN',
    },
    {
        name: 'Pakistan',
        flag: createUrl('/3/32/Flag_of_Pakistan.svg'),
        iso3: 'PAK',
    },
    {
        name: 'Palau',
        flag: createUrl('/4/48/Flag_of_Palau.svg'),
        iso3: 'PLW',
    },
    {
        name: 'Palestine',
        flag: createUrl('/f/f4/Palestine_Flag.svg'),
        iso3: 'PSE',
    },
    {
        name: 'Panama',
        flag: createUrl('/a/ab/Flag_of_Panama.svg'),
        iso3: 'PAN',
    },
    {
        name: 'Papua New Guinea',
        flag: createUrl('/e/e3/Flag_of_Papua_New_Guinea.svg'),
        iso3: 'PNG',
    },
    {
        name: 'Paraguay',
        flag: createUrl('/2/27/Flag_of_Paraguay.svg'),
        iso3: 'PRY',
    },
    {
        name: 'Peru',
        flag: createUrl('/c/cf/Flag_of_Peru.svg'),
        iso3: 'PER',
    },
    {
        name: 'Philippines',
        flag: createUrl('/9/99/Flag_of_the_Philippines.svg'),
        iso3: 'PHL',
    },
    {
        name: 'Pitcairn',
        flag: createUrl('/8/88/Flag_of_the_Pitcairn_Islands.svg'),
        iso3: 'PCN',
    },
    {
        name: 'Poland',
        flag: createUrl('/1/12/Flag_of_Poland.svg'),
        iso3: 'POL',
    },
    {
        name: 'Portugal',
        flag: createUrl('/5/5c/Flag_of_Portugal.svg'),
        iso3: 'PRT',
    },
    {
        name: 'Puerto Rico',
        flag: createUrl('/2/28/Flag_of_Puerto_Rico.svg'),
        iso3: 'PRI',
    },
    {
        name: 'Qatar',
        flag: createUrl('/6/65/Flag_of_Qatar.svg'),
        iso3: 'QAT',
    },
    {
        name: 'Réunion',
        flag: createUrl('/5/5a/Flag_of_Réunion.svg'),
        iso3: 'REU',
    },
    {
        name: 'Romania',
        flag: createUrl('/7/73/Flag_of_Romania.svg'),
        iso3: 'ROU',
    },
    {
        name: 'Russia',
        flag: createUrl('/f/f3/Flag_of_Russia.svg'),
        iso3: 'RUS',
    },
    {
        name: 'Rwanda',
        flag: createUrl('/1/17/Flag_of_Rwanda.svg'),
        iso3: 'RWA',
    },
    {
        name: 'Saint Barthélemy',
        flag: createUrl('/0/03/Saint-Barthelémy_Icône.svg'),
        iso3: 'BLM',
    },
    {
        name: 'Saint Helena, Ascension and Tristan da Cunha',
        flag: createUrl('/0/00/Flag_of_Saint_Helena.svg'),
        iso3: 'SHN',
        altSpellings: ['Saint Helenian', 'Tristanian'],
    },
    {
        name: 'Saint Kitts and Nevis',
        flag: createUrl('/f/fe/Flag_of_Saint_Kitts_and_Nevis.svg'),
        iso3: 'KNA',
        altSpellings: ['Nevisian'],
    },
    {
        name: 'Saint Lucia',
        flag: createUrl('/9/9f/Flag_of_Saint_Lucia.svg'),
        iso3: 'LCA',
    },
    {
        name: 'Saint Martin',
        flag: createUrl('/d/dd/Flag_of_Saint-Martin_%28fictional%29.svg'),
        iso3: 'MAF',
    },
    {
        name: 'Saint Pierre and Miquelon',
        flag: createUrl('/7/74/Flag_of_Saint-Pierre_and_Miquelon.svg'),
        iso3: 'SPM',
    },
    {
        name: 'Saint Vincent and the Grenadines',
        flag: createUrl('/6/6d/Flag_of_Saint_Vincent_and_the_Grenadines.svg'),
        iso3: 'VCT',
    },
    {
        name: 'Samoa',
        flag: createUrl('/3/31/Flag_of_Samoa.svg'),
        iso3: 'WSM',
    },
    {
        name: 'San Marino',
        flag: createUrl('/b/b1/Flag_of_San_Marino.svg'),
        iso3: 'SMR',
    },
    {
        name: 'Sao Tome and Principe',
        flag: createUrl('/4/4f/Flag_of_Sao_Tome_and_Principe.svg'),
        iso3: 'STP',
    },
    {
        name: 'Saudi Arabia',
        flag: createUrl('/0/0d/Flag_of_Saudi_Arabia.svg'),
        iso3: 'SAU',
    },
    {
        name: 'Senegal',
        flag: createUrl('/f/fd/Flag_of_Senegal.svg'),
        iso3: 'SEN',
    },
    {
        name: 'Serbia',
        flag: createUrl('/f/ff/Flag_of_Serbia.svg'),
        iso3: 'SRB',
    },
    {
        name: 'Seychelles',
        flag: createUrl('/f/fc/Flag_of_Seychelles.svg'),
        iso3: 'SYC',
    },
    {
        name: 'Sierra Leone',
        flag: createUrl('/1/17/Flag_of_Sierra_Leone.svg'),
        iso3: 'SLE',
    },
    {
        name: 'Singapore',
        flag: createUrl('/4/48/Flag_of_Singapore.svg'),
        iso3: 'SGP',
        altSpellings: ['SG', 'Singapura', 'Republik Singapura'],
    },
    {
        name: 'Sint Maarten',
        flag: createUrl('/d/d3/Flag_of_Sint_Maarten.svg'),
        iso3: 'SXM',
    },
    {
        name: 'Slovakia',
        flag: createUrl('/e/e6/Flag_of_Slovakia.svg'),
        iso3: 'SVK',
    },
    {
        name: 'Slovenia',
        flag: createUrl('/f/f0/Flag_of_Slovenia.svg'),
        iso3: 'SVN',
    },
    {
        name: 'Solomon Islands',
        flag: createUrl('/7/74/Flag_of_the_Solomon_Islands.svg'),
        iso3: 'SLB',
    },
    {
        name: 'Somalia',
        flag: createUrl('/a/a0/Flag_of_Somalia.svg'),
        iso3: 'SOM',
    },
    {
        name: 'South Africa',
        flag: createUrl('/a/af/Flag_of_South_Africa.svg'),
        iso3: 'ZAF',
    },
    {
        name: 'South Georgia and the South Sandwich Islands',
        flag: createUrl('/e/ed/Flag_of_South_Georgia_and_the_South_Sandwich_Islands.svg'),
        iso3: 'SGS',
    },
    {
        name: 'South Korea',
        flag: createUrl('/0/09/Flag_of_South_Korea.svg'),
        iso3: 'KOR',
        altSpellings: ['Republic of Korea'],
    },
    {
        name: 'South Sudan',
        flag: createUrl('/7/7a/Flag_of_South_Sudan.svg'),
        iso3: 'SSD',
    },
    {
        name: 'Spain',
        flag: createUrl('/9/9a/Flag_of_Spain.svg'),
        iso3: 'ESP',
    },
    {
        name: 'Sri Lanka',
        flag: createUrl('/1/11/Flag_of_Sri_Lanka.svg'),
        iso3: 'LKA',
    },
    {
        name: 'Sudan',
        flag: createUrl('/0/01/Flag_of_Sudan.svg'),
        iso3: 'SDN',
    },
    {
        name: 'Suriname',
        flag: createUrl('/6/60/Flag_of_Suriname.svg'),
        iso3: 'SUR',
    },
    {
        name: 'Svalbard and Jan Mayen',
        flag: createUrl('/d/d9/Flag_of_Norway.svg'),
        iso3: 'SJM',
    },
    {
        name: 'Swaziland',
        flag: createUrl('/f/fb/Flag_of_Eswatini.svg'),
        iso3: 'SWZ',
    },
    {
        name: 'Sweden',
        flag: createUrl('/4/4c/Flag_of_Sweden.svg'),
        iso3: 'SWE',
    },
    {
        name: 'Switzerland',
        flag: createUrl('/f/f3/Flag_of_Switzerland.svg'),
        iso3: 'CHE',
    },
    {
        name: 'Syria',
        flag: createUrl('/5/53/Flag_of_Syria.svg'),
        iso3: 'SYR',
    },
    {
        name: 'Taiwan',
        flag: createUrl('/7/72/Flag_of_the_Republic_of_China.svg'),
        iso3: 'TWN',
    },
    {
        name: 'Tajikistan',
        flag: createUrl('/d/d0/Flag_of_Tajikistan.svg'),
        iso3: 'TJK',
    },
    {
        name: 'Tanzania',
        flag: createUrl('/3/38/Flag_of_Tanzania.svg'),
        iso3: 'TZA',
    },
    {
        name: 'Thailand',
        flag: createUrl('/a/a9/Flag_of_Thailand.svg'),
        iso3: 'THA',
    },
    {
        name: 'Timor-Leste',
        flag: createUrl('/2/26/Flag_of_East_Timor.svg'),
        iso3: 'TLS',
    },
    {
        name: 'Togo',
        flag: createUrl('/6/68/Flag_of_Togo.svg'),
        iso3: 'TGO',
    },
    {
        name: 'Tokelau',
        flag: createUrl('/8/8e/Flag_of_Tokelau.svg'),
        iso3: 'TKL',
    },
    {
        name: 'Tonga',
        flag: createUrl('/9/9a/Flag_of_Tonga.svg'),
        iso3: 'TON',
    },
    {
        name: 'Trinidad and Tobago',
        flag: createUrl('/6/64/Flag_of_Trinidad_and_Tobago.svg'),
        iso3: 'TTO',
    },
    {
        name: 'Tunisia',
        flag: createUrl('/c/ce/Flag_of_Tunisia.svg'),
        iso3: 'TUN',
    },
    {
        name: 'Turkey',
        flag: createUrl('/b/b4/Flag_of_Turkey.svg'),
        iso3: 'TUR',
    },
    {
        name: 'Turkmenistan',
        flag: createUrl('/1/1b/Flag_of_Turkmenistan.svg'),
        iso3: 'TKM',
    },
    {
        name: 'Turks and Caicos Islands',
        flag: createUrl('/a/a0/Flag_of_the_Turks_and_Caicos_Islands.svg'),
        iso3: 'TCA',
    },
    {
        name: 'Tuvalu',
        flag: createUrl('/3/38/Flag_of_Tuvalu.svg'),
        iso3: 'TUV',
    },
    {
        name: 'Uganda',
        flag: createUrl('/4/4e/Flag_of_Uganda.svg'),
        iso3: 'UGA',
    },
    {
        name: 'Ukraine',
        flag: createUrl('/4/49/Flag_of_Ukraine.svg'),
        iso3: 'UKR',
    },
    {
        name: 'United Arab Emirates',
        flag: createUrl('/c/cb/Flag_of_the_United_Arab_Emirates.svg'),
        iso3: 'ARE',
        altSpellings: ['AE', 'UAE'],
    },
    {
        name: 'United Kingdom',
        flag: createUrl('/8/83/Flag_of_the_United_Kingdom_%283-5%29.svg'),
        iso3: 'GBR',
        altSpellings: ['UK'],
    },
    {
        name: 'United States Minor Outlying Islands',
        flag: createUrl('/0/05/Flag_of_the_U.S..svg'),
        iso3: 'UMI',
    },
    {
        name: 'United States',
        flag: createUrl('/a/a4/Flag_of_the_United_States.svg'),
        iso3: 'USA',
        altSpellings: ['USA'],
    },
    {
        name: 'Uruguay',
        flag: createUrl('/f/fe/Flag_of_Uruguay.svg'),
        iso3: 'URY',
    },
    {
        name: 'Uzbekistan',
        flag: createUrl('/8/84/Flag_of_Uzbekistan.svg'),
        iso3: 'UZB',
    },
    {
        name: 'Vanuatu',
        flag: createUrl('/6/6e/Flag_of_Vanuatu_(official).svg'),
        iso3: 'VUT',
    },
    {
        name: 'Venezuela',
        flag: createUrl('/7/7b/Flag_of_Venezuela_(state).svg'),
        iso3: 'VEN',
    },
    {
        name: 'Vietnam',
        flag: createUrl('/2/21/Flag_of_Vietnam.svg'),
        iso3: 'VNM',
        altSpellings: ['Viet Nam', 'Republic of Viet Nam', 'South Vietnam'],
    },
    {
        name: 'Virgin Islands of the United States',
        flag: createUrl('/f/f8/Flag_of_the_United_States_Virgin_Islands.svg'),
        iso3: 'VIR',
    },
    {
        name: 'Wallis and Futuna',
        flag: createUrl('/d/d2/Flag_of_Wallis_and_Futuna.svg'),
        iso3: 'WLF',
        altSpellings: ['Futunan'],
    },
    {
        name: 'Western Sahara',
        flag: createUrl('/2/26/Flag_of_the_Sahrawi_Arab_Democratic_Republic.svg'),
        iso3: 'ESH',
    },
    {
        name: 'Yemen',
        flag: createUrl('/8/89/Flag_of_Yemen.svg'),
        iso3: 'YEM',
    },
    {
        name: 'Zambia',
        flag: createUrl('/0/06/Flag_of_Zambia.svg'),
        iso3: 'ZMB',
    },
    {
        name: 'Zimbabwe',
        flag: createUrl('/6/6a/Flag_of_Zimbabwe.svg'),
        iso3: 'ZWE',
    },
] as const;
