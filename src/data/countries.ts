function createUrl(svgUrl: string) {
    return `https://upload.wikimedia.org/wikipedia/commons${svgUrl}` as const;
}

export const countries = [
    {
        name: "Afghanistan",
        flag: "🇦🇫",
        iso3: "AFG",
    },
    {
        name: "Aland Islands",
        flag: "🇦🇽",
        iso3: "ALA",
    },
    {
        name: "Albania",
        flag: "🇦🇱",
        iso3: "ALB",
    },
    {
        name: "Algeria",
        flag: "🇩🇿",
        iso3: "DZA",
    },
    {
        name: "American Samoa",
        flag: "🇦🇸",
        iso3: "ASM",
    },
    {
        name: "Andorra",
        flag: "🇦🇩",
        iso3: "AND",
    },
    {
        name: "Angola",
        flag: "🇦🇴",
        iso3: "AGO",
    },
    {
        name: "Anguilla",
        flag: "🇦🇮",
        iso3: "AIA",
    },
    {
        name: "Antigua and Barbuda",
        flag: "🇦🇬",
        iso3: "ATG",
    },
    {
        name: "Argentina",
        flag: "🇦🇷",
        iso3: "ARG",
    },
    {
        name: "Armenia",
        flag: "🇦🇲",
        iso3: "ARM",
    },
    {
        name: "Aruba",
        flag: "🇦🇼",
        iso3: "ABW",
    },
    {
        name: "Australia",
        flag: "🇦🇺",
        iso3: "AUS",
    },
    {
        name: "Austria",
        flag: "🇦🇹",
        iso3: "AUT",
    },
    {
        name: "Azerbaijan",
        flag: "🇦🇿",
        iso3: "AZE",
    },
    {
        name: "Antartica",
        flag: "🇦🇶",
        iso3: "ATA",
    },
    {
        name: "Bahamas",
        flag: "🇧🇸",
        iso3: "BHS",
    },
    {
        name: "Bahrain",
        flag: "🇧🇭",
        iso3: "BHR",
    },
    {
        name: "Bangladesh",
        flag: "🇧🇩",
        iso3: "BGD",
    },
    {
        name: "Barbados",
        flag: "🇧🇧",
        iso3: "BRB",
    },
    {
        name: "Belarus",
        flag: "🇧🇾",
        iso3: "BLR",
    },
    {
        name: "Belgium",
        flag: "🇧🇪",
        iso3: "BEL",
    },
    {
        name: "Belize",
        flag: "🇧🇿",
        iso3: "BLZ",
    },
    {
        name: "Benin",
        flag: "🇧🇯",
        iso3: "BEN",
    },
    {
        name: "Bouvet Island",
        flag: "🇧🇻",
        iso3: "BVT",
    },
    {
        name: "Bermuda",
        flag: "🇧🇲",
        iso3: "BMU",
    },
    {
        name: "Bhutan",
        flag: "🇧🇹",
        iso3: "BTN",
    },
    {
        name: "Bolivia",
        flag: "🇧🇴",
        iso3: "BOL",
    },
    {
        name: "Bonaire, Sint Eustatius and Saba",
        flag: "🇧🇶",
        iso3: "BES",
    },
    {
        name: "Bosnia and Herzegovina",
        flag: "🇧🇦",
        iso3: "BIH",
    },
    {
        name: "Botswana",
        flag: "🇧🇼",
        iso3: "BWA",
    },
    {
        name: "Brazil",
        flag: "🇧🇷",
        iso3: "BRA",
    },
    {
        name: "British Virgin Islands",
        flag: createUrl("/4/42/Flag_of_the_British_Virgin_Islands.svg"),
        iso3: "VGB",
    },
    {
        name: "Brunei",
        flag: "🇧🇳",
        iso3: "BRN",
    },
    {
        name: "Bulgaria",
        flag: "🇧🇬",
        iso3: "BGR",
    },
    {
        name: "Burkina Faso",
        flag: "🇧🇫",
        iso3: "BFA",
    },
    {
        name: "Heard Island and McDonald Islands",
        flag: "🇭🇲",
        iso3: "HMD",
    },
    {
        name: "Burundi",
        flag: "🇧🇮",
        iso3: "BDI",
    },
    {
        name: "Cambodia",
        flag: createUrl("/8/83/Flag_of_Cambodia.svg"),
        iso3: "KHM",
    },
    {
        name: "Cameroon",
        flag: "🇨🇲",
        iso3: "CMR",
    },
    {
        name: "Canada",
        flag: "🇨🇦",
        iso3: "CAN",
    },
    {
        name: "Cabo Verde",
        flag: "🇨🇻",
        iso3: "CPV",
    },
    {
        name: "Cayman Islands",
        flag: createUrl("/0/0f/Flag_of_the_Cayman_Islands.svg"),
        iso3: "CYM",
    },
    {
        name: "Central African Republic",
        flag: "🇨🇫",
        iso3: "CAF",
    },
    {
        name: "Chad",
        flag: createUrl("/4/4b/Flag_of_Chad.svg"),
        iso3: "TCD",
    },
    {
        name: "Chile",
        flag: "🇨🇱",
        iso3: "CHL",
    },
    {
        name: "China",
        flag: "🇨🇳",
        iso3: "CHN",
    },
    {
        name: "Christmas Island",
        flag: "🇨🇽",
        iso3: "CXR",
    },
    {
        name: "Cocos Islands",
        flag: "🇨🇨",
        iso3: "CCK",
    },
    {
        name: "Colombia",
        flag: "🇨🇴",
        iso3: "COL",
    },
    {
        name: "Comoros",
        flag: createUrl("/d/df/Flag_of_the_Comoros_(3-2).svg"),
        iso3: "COM",
    },
    {
        name: "Congo",
        flag: "🇨🇬",
        iso3: "COG",
    },
    {
        name: "Cook Islands",
        flag: "🇨🇰",
        iso3: "COK",
    },
    {
        name: "Costa Rica",
        flag: "🇨🇷",
        iso3: "CRI",
    },
    {
        name: "Côte d'Ivoire",
        flag: "🇨🇮",
        iso3: "CIV",
    },
    {
        name: "Croatia",
        flag: "🇭🇷",
        iso3: "HRV",
    },
    {
        name: "Cuba",
        flag: "🇨🇺",
        iso3: "CUB",
    },
    {
        name: "Curaçao",
        flag: "🇨🇼",
        iso3: "CUW",
    },
    {
        name: "Cyprus",
        flag: "🇨🇾",
        iso3: "CYP",
    },
    {
        name: "Czech Republic",
        flag: "🇨🇿",
        iso3: "CZE",
    },
    {
        name: "Democratic Republic of the Congo",
        flag: "🇨🇩",
        iso3: "COD",
    },
    {
        name: "Denmark",
        flag: "🇩🇰",
        iso3: "DNK",
    },
    {
        name: "Djibouti",
        flag: "🇩🇯",
        iso3: "DJI",
    },
    {
        name: "Dominica",
        flag: "🇩🇲",
        iso3: "DMA",
    },
    {
        name: "Dominican Republic",
        flag: "🇩🇴",
        iso3: "DOM",
    },
    {
        name: "Ecuador",
        flag: "🇪🇨",
        iso3: "ECU",
    },
    {
        name: "Egypt",
        flag: "🇪🇬",
        iso3: "EGY",
    },
    {
        name: "El Salvador",
        flag: createUrl("/3/34/Flag_of_El_Salvador.svg"),
        iso3: "SLV",
    },
    {
        name: "Equatorial Guinea",
        flag: "🇬🇶",
        iso3: "GNQ",
    },
    {
        name: "Eritrea",
        flag: "🇪🇷",
        iso3: "ERI",
    },
    {
        name: "Estonia",
        flag: "🇪🇪",
        iso3: "EST",
    },
    {
        name: "Ethiopia",
        flag: "🇪🇹",
        iso3: "ETH",
    },
    {
        name: "Falkland Islands",
        flag: "🇫🇰",
        iso3: "FLK",
    },
    {
        name: "Faroe Islands",
        flag: "🇫🇴",
        iso3: "FRO",
    },
    {
        name: "Fiji",
        flag: "🇫🇯",
        iso3: "FJI",
    },
    {
        name: "Finland",
        flag: "🇫🇮",
        iso3: "FIN",
    },
    {
        name: "France",
        flag: "🇫🇷",
        iso3: "FRA",
    },
    {
        name: "French Guiana",
        flag: "🇬🇫",
        iso3: "GUF",
    },
    {
        name: "French Polynesia",
        flag: createUrl("/d/db/Flag_of_French_Polynesia.svg"),
        iso3: "PYF",
    },
    {
        name: "Gabon",
        flag: "🇬🇦",
        iso3: "GAB",
    },
    {
        name: "Gambia",
        flag: "🇬🇲",
        iso3: "GMB",
    },
    {
        name: "Georgia",
        flag: "🇬🇪",
        iso3: "GEO",
    },
    {
        name: "Germany",
        flag: "🇩🇪",
        iso3: "DEU",
    },
    {
        name: "Ghana",
        flag: "🇬🇭",
        iso3: "GHA",
    },
    {
        name: "Gibraltar",
        flag: "🇬🇮",
        iso3: "GIB",
    },
    {
        name: "Greece",
        flag: "🇬🇷",
        iso3: "GRC",
    },
    {
        name: "Greenland",
        flag: "🇬🇱",
        iso3: "GRL",
    },
    {
        name: "Grenada",
        flag: "🇬🇩",
        iso3: "GRD",
    },
    {
        name: "Guadeloupe",
        flag: "🇬🇵",
        iso3: "GLP",
    },
    {
        name: "Guam",
        flag: "🇬🇺",
        iso3: "GUM",
    },
    {
        name: "Guatemala",
        flag: "🇬🇹",
        iso3: "GTM",
    },
    {
        name: "Guernsey",
        flag: "🇬🇬",
        iso3: "GGY",
    },
    {
        name: "Guinea-Bissau",
        flag: "🇬🇼",
        iso3: "GNB",
    },
    {
        name: "Guinea",
        flag: "🇬🇳",
        iso3: "GIN",
    },
    {
        name: "Guyana",
        flag: "🇬🇾",
        iso3: "GUY",
    },
    {
        name: "Haiti",
        flag: "🇭🇹",
        iso3: "HTI",
    },
    {
        name: "Holy See",
        flag: createUrl("/0/00/Flag_of_the_Vatican_City.svg"),
        iso3: "VAT",
    },
    {
        name: "Honduras",
        flag: "🇭🇳",
        iso3: "HND",
    },
    {
        name: "Hong Kong",
        flag: "🇭🇰",
        iso3: "HKG",
    },
    {
        name: "Hungary",
        flag: "🇭🇺",
        iso3: "HUN",
    },
    {
        name: "Iceland",
        flag: createUrl("/c/ce/Flag_of_Iceland.svg"),
        iso3: "ISL",
    },
    {
        name: "India",
        flag: createUrl("/4/41/Flag_of_India.svg"),
        iso3: "IND",
    },
    {
        name: "Indonesia",
        flag: "🇮🇩",
        iso3: "IDN",
    },
    {
        name: "British Indian Ocean Territory",
        flag: createUrl("/6/65/Flag_of_the_Commissioner_of_the_British_Indian_Ocean_Territory.svg"),
        iso3: "IOT",
    },
    {
        name: "Iran",
        flag: createUrl("/c/ca/Flag_of_Iran.svg"),
        iso3: "IRN",
    },
    {
        name: "Iraq",
        flag: createUrl("/f/f6/Flag_of_Iraq.svg"),
        iso3: "IRQ",
    },
    {
        name: "Ireland",
        flag: "🇮🇪",
        iso3: "IRL",
    },
    {
        name: "Isle of Man",
        flag: createUrl("/b/bc/Flag_of_the_Isle_of_Man.svg"),
        iso3: "IMN",
    },
    {
        name: "Israel",
        flag: "🇮🇱",
        iso3: "ISR",
    },
    {
        name: "Italy",
        flag: "🇮🇹",
        iso3: "ITA",
    },
    {
        name: "Jamaica",
        flag: createUrl("/0/0a/Flag_of_Jamaica.svg"),
        iso3: "JAM",
    },
    {
        name: "Japan",
        flag: "🇯🇵",
        iso3: "JPN",
    },
    {
        name: "Jersey",
        flag: createUrl("/1/1c/Flag_of_Jersey.svg"),
        iso3: "JEY",
    },
    {
        name: "Jordan",
        flag: createUrl("/c/c0/Flag_of_Jordan.svg"),
        iso3: "JOR",
    },
    {
        name: "Kazakhstan",
        flag: createUrl("/d/d3/Flag_of_Kazakhstan.svg"),
        iso3: "KAZ",
    },
    {
        name: "Kenya",
        flag: createUrl("/4/49/Flag_of_Kenya.svg"),
        iso3: "KEN",
    },
    {
        name: "Kiribati",
        flag: "🇰🇮",
        iso3: "KIR",
    },
    {
        name: "Kosovo",
        flag: createUrl("/1/1f/Flag_of_Kosovo.svg"),
        iso3: "XXK",
    },
    {
        name: "Kuwait",
        flag: createUrl("/a/aa/Flag_of_Kuwait.svg"),
        iso3: "KWT",
    },
    {
        name: "Kyrgyzstan",
        flag: createUrl("/c/c7/Flag_of_Kyrgyzstan.svg"),
        iso3: "KGZ",
    },
    {
        name: "Laos",
        flag: createUrl("/5/56/Flag_of_Laos.svg"),
        iso3: "LAO",
    },
    {
        name: "Latvia",
        flag: createUrl("/8/84/Flag_of_Latvia.svg"),
        iso3: "LVA",
    },
    {
        name: "Lebanon",
        flag: createUrl("/5/59/Flag_of_Lebanon.svg"),
        iso3: "LBN",
    },
    {
        name: "Lesotho",
        flag: createUrl("/4/4a/Flag_of_Lesotho.svg"),
        iso3: "LSO",
    },
    {
        name: "Liberia",
        flag: createUrl("/b/b8/Flag_of_Liberia.svg"),
        iso3: "LBR",
    },
    {
        name: "Libya",
        flag: createUrl("/0/05/Flag_of_Libya.svg"),
        iso3: "LBY",
    },
    {
        name: "Liechtenstein",
        flag: createUrl("/4/47/Flag_of_Liechtenstein.svg"),
        iso3: "LIE",
    },
    {
        name: "Lithuania",
        flag: createUrl("/1/11/Flag_of_Lithuania.svg"),
        iso3: "LTU",
    },
    {
        name: "Luxembourg",
        flag: createUrl("/d/da/Flag_of_Luxembourg.svg"),
        iso3: "LUX",
    },
    {
        name: "Macao",
        flag: createUrl("/6/63/Flag_of_Macau.svg"),
        iso3: "MAC",
    },
    {
        name: "Madagascar",
        flag: createUrl("/b/bc/Flag_of_Madagascar.svg"),
        iso3: "MDG",
    },
    {
        name: "Malawi",
        flag: createUrl("/d/d1/Flag_of_Malawi.svg"),
        iso3: "MWI",
    },
    {
        name: "Malaysia",
        flag: "🇲🇾",
        iso3: "MYS",
    },
    {
        name: "Maldives",
        flag: createUrl("/0/0f/Flag_of_Maldives.svg"),
        iso3: "MDV",
    },
    {
        name: "Mali",
        flag: createUrl("/9/92/Flag_of_Mali.svg"),
        iso3: "MLI",
    },
    {
        name: "Malta",
        flag: createUrl("/7/73/Flag_of_Malta.svg"),
        iso3: "MLT",
    },
    {
        name: "Marshall Islands",
        flag: createUrl("/2/2e/Flag_of_the_Marshall_Islands.svg"),
        iso3: "MHL",
    },
    {
        name: "Martinique",
        flag: "🇲🇶",
        iso3: "MTQ",
    },
    {
        name: "Mauritania",
        flag: createUrl("/4/43/Flag_of_Mauritania.svg"),
        iso3: "MRT",
    },
    {
        name: "Mauritius",
        flag: createUrl("/7/77/Flag_of_Mauritius.svg"),
        iso3: "MUS",
    },
    {
        name: "Mayotte",
        flag: createUrl("/c/c3/Flag_of_France.svg"),
        iso3: "MYT",
    },
    {
        name: "Mexico",
        flag: createUrl("/f/fc/Flag_of_Mexico.svg"),
        iso3: "MEX",
    },
    {
        name: "Micronesia",
        flag: "🇫🇲",
        iso3: "FSM",
    },
    {
        name: "Moldova",
        flag: createUrl("/2/27/Flag_of_Moldova.svg"),
        iso3: "MDA",
    },
    {
        name: "Monaco",
        flag: createUrl("/e/ea/Flag_of_Monaco.svg"),
        iso3: "MCO",
    },
    {
        name: "Mongolia",
        flag: createUrl("/4/4c/Flag_of_Mongolia.svg"),
        iso3: "MNG",
    },
    {
        name: "Montenegro",
        flag: createUrl("/6/64/Flag_of_Montenegro.svg"),
        iso3: "MNE",
    },
    {
        name: "Montserrat",
        flag: createUrl("/d/d0/Flag_of_Montserrat.svg"),
        iso3: "MSR",
    },
    {
        name: "Morocco",
        flag: createUrl("/2/2c/Flag_of_Morocco.svg"),
        iso3: "MAR",
    },
    {
        name: "Mozambique",
        flag: createUrl("/d/d0/Flag_of_Mozambique.svg"),
        iso3: "MOZ",
    },
    {
        name: "Myanmar",
        flag: createUrl("/8/8c/Flag_of_Myanmar.svg"),
        iso3: "MMR",
    },
    {
        name: "Namibia",
        flag: createUrl("/0/00/Flag_of_Namibia.svg"),
        iso3: "NAM",
    },
    {
        name: "Nauru",
        flag: createUrl("/3/30/Flag_of_Nauru.svg"),
        iso3: "NRU",
    },
    {
        name: "Nepal",
        flag: createUrl("/9/9b/Flag_of_Nepal.svg"),
        iso3: "NPL",
    },
    {
        name: "Netherlands Antilles",
        flag: createUrl("/e/eb/Flag_of_the_Netherlands_Antilles_(1959%E2%80%931986).svg"),
        iso3: "ANT",
    },
    {
        name: "Netherlands",
        flag: createUrl("/2/20/Flag_of_the_Netherlands.svg"),
        iso3: "NLD",
    },
    {
        name: "New Caledonia",
        flag: "🇳🇨",
        iso3: "NCL",
    },
    {
        name: "New Zealand",
        flag: "🇳🇿",
        iso3: "NZL",
    },
    {
        name: "Nicaragua",
        flag: createUrl("/1/19/Flag_of_Nicaragua.svg"),
        iso3: "NIC",
    },
    {
        name: "Niger",
        flag: createUrl("/f/f4/Flag_of_Niger.svg"),
        iso3: "NER",
    },
    {
        name: "Nigeria",
        flag: createUrl("/7/79/Flag_of_Nigeria.svg"),
        iso3: "NGA",
    },
    {
        name: "Niue",
        flag: createUrl("/0/01/Flag_of_Niue.svg"),
        iso3: "NIU",
    },
    {
        name: "Norfolk Island",
        flag: createUrl("/4/48/Flag_of_Norfolk_Island.svg"),
        iso3: "NFK",
    },
    {
        name: "North Korea",
        flag: createUrl("/5/51/Flag_of_North_Korea.svg"),
        iso3: "PRK",
    },
    {
        name: "North Macedonia",
        flag: createUrl("/7/79/Flag_of_North_Macedonia.svg"),
        iso3: "MKD",
    },
    {
        name: "Northern Mariana Islands",
        flag: createUrl("/e/e0/Flag_of_the_Northern_Mariana_Islands.svg"),
        iso3: "MNP",
    },
    {
        name: "Norway",
        flag: createUrl("/d/d9/Flag_of_Norway.svg"),
        iso3: "NOR",
    },
    {
        name: "Oman",
        flag: createUrl("/d/dd/Flag_of_Oman.svg"),
        iso3: "OMN",
    },
    {
        name: "Pakistan",
        flag: createUrl("/3/32/Flag_of_Pakistan.svg"),
        iso3: "PAK",
    },
    {
        name: "Palau",
        flag: createUrl("/4/48/Flag_of_Palau.svg"),
        iso3: "PLW",
    },
    {
        name: "Palestine",
        flag: createUrl("/f/f4/Palestine_Flag.svg"),
        iso3: "PSE",
    },
    {
        name: "Panama",
        flag: createUrl("/a/ab/Flag_of_Panama.svg"),
        iso3: "PAN",
    },
    {
        name: "Papua New Guinea",
        flag: createUrl("/e/e3/Flag_of_Papua_New_Guinea.svg"),
        iso3: "PNG",
    },
    {
        name: "Paraguay",
        flag: createUrl("/2/27/Flag_of_Paraguay.svg"),
        iso3: "PRY",
    },
    {
        name: "Peru",
        flag: createUrl("/c/cf/Flag_of_Peru.svg"),
        iso3: "PER",
    },
    {
        name: "Philippines",
        flag: "🇵🇭",
        iso3: "PHL",
    },
    {
        name: "Pitcairn",
        flag: createUrl("/8/88/Flag_of_the_Pitcairn_Islands.svg"),
        iso3: "PCN",
    },
    {
        name: "Poland",
        flag: createUrl("/1/12/Flag_of_Poland.svg"),
        iso3: "POL",
    },
    {
        name: "Portugal",
        flag: createUrl("/5/5c/Flag_of_Portugal.svg"),
        iso3: "PRT",
    },
    {
        name: "Puerto Rico",
        flag: createUrl("/2/28/Flag_of_Puerto_Rico.svg"),
        iso3: "PRI",
    },
    {
        name: "Qatar",
        flag: createUrl("/6/65/Flag_of_Qatar.svg"),
        iso3: "QAT",
    },
    {
        name: "Réunion",
        flag: createUrl("/5/5a/Flag_of_Réunion.svg"),
        iso3: "REU",
    },
    {
        name: "Romania",
        flag: "🇷🇴",
        iso3: "ROU",
    },
    {
        name: "Russia",
        flag: "🇷🇺",
        iso3: "RUS",
    },
    {
        name: "Rwanda",
        flag: createUrl("/1/17/Flag_of_Rwanda.svg"),
        iso3: "RWA",
    },
    {
        name: "Saint Barthélemy",
        flag: "🇧🇱",
        iso3: "BLM",
    },
    {
        name: "Saint Helena, Ascension and Tristan da Cunha",
        flag: createUrl("/0/00/Flag_of_Saint_Helena.svg"),
        iso3: "SHN",
    },
    {
        name: "Saint Kitts and Nevis",
        flag: createUrl("/f/fe/Flag_of_Saint_Kitts_and_Nevis.svg"),
        iso3: "KNA",
    },
    {
        name: "Saint Lucia",
        flag: createUrl("/9/9f/Flag_of_Saint_Lucia.svg"),
        iso3: "LCA",
    },
    {
        name: "Saint Martin",
        flag: createUrl("/d/dd/Flag_of_Saint-Martin_%28fictional%29.svg"),
        iso3: "MAF",
    },
    {
        name: "Saint Pierre and Miquelon",
        flag: createUrl("/7/74/Flag_of_Saint-Pierre_and_Miquelon.svg"),
        iso3: "SPM",
    },
    {
        name: "Saint Vincent and the Grenadines",
        flag: createUrl("/6/6d/Flag_of_Saint_Vincent_and_the_Grenadines.svg"),
        iso3: "VCT",
    },
    {
        name: "Samoa",
        flag: "🇼🇸",
        iso3: "WSM",
    },
    {
        name: "San Marino",
        flag: createUrl("/b/b1/Flag_of_San_Marino.svg"),
        iso3: "SMR",
    },
    {
        name: "Sao Tome and Principe",
        flag: createUrl("/4/4f/Flag_of_Sao_Tome_and_Principe.svg"),
        iso3: "STP",
    },
    {
        name: "Saudi Arabia",
        flag: createUrl("/0/0d/Flag_of_Saudi_Arabia.svg"),
        iso3: "SAU",
    },
    {
        name: "Senegal",
        flag: createUrl("/f/fd/Flag_of_Senegal.svg"),
        iso3: "SEN",
    },
    {
        name: "Serbia",
        flag: createUrl("/f/ff/Flag_of_Serbia.svg"),
        iso3: "SRB",
    },
    {
        name: "Seychelles",
        flag: createUrl("/f/fc/Flag_of_Seychelles.svg"),
        iso3: "SYC",
    },
    {
        name: "Sierra Leone",
        flag: createUrl("/1/17/Flag_of_Sierra_Leone.svg"),
        iso3: "SLE",
    },
    {
        name: "Singapore",
        flag: createUrl("/4/48/Flag_of_Singapore.svg"),
        iso3: "SGP",
    },
    {
        name: "Sint Maarten",
        flag: createUrl("/d/d3/Flag_of_Sint_Maarten.svg"),
        iso3: "SXM",
    },
    {
        name: "Slovakia",
        flag: createUrl("/e/e6/Flag_of_Slovakia.svg"),
        iso3: "SVK",
    },
    {
        name: "Slovenia",
        flag: createUrl("/f/f0/Flag_of_Slovenia.svg"),
        iso3: "SVN",
    },
    {
        name: "Solomon Islands",
        flag: "🇸🇧",
        iso3: "SLB",
    },
    {
        name: "Somalia",
        flag: createUrl("/a/a0/Flag_of_Somalia.svg"),
        iso3: "SOM",
    },
    {
        name: "South Africa",
        flag: createUrl("/a/af/Flag_of_South_Africa.svg"),
        iso3: "ZAF",
    },
    {
        name: "South Georgia and the South Sandwich Islands",
        flag: "🇬🇸",
        iso3: "SGS",
    },
    {
        name: "South Korea",
        flag: "🇰🇷",
        iso3: "KOR",
    },
    {
        name: "South Sudan",
        flag: createUrl("/7/7a/Flag_of_South_Sudan.svg"),
        iso3: "SSD",
    },
    {
        name: "Spain",
        flag: "🇪🇸",
        iso3: "ESP",
    },
    {
        name: "Sri Lanka",
        flag: createUrl("/1/11/Flag_of_Sri_Lanka.svg"),
        iso3: "LKA",
    },
    {
        name: "Sudan",
        flag: createUrl("/0/01/Flag_of_Sudan.svg"),
        iso3: "SDN",
    },
    {
        name: "Suriname",
        flag: createUrl("/6/60/Flag_of_Suriname.svg"),
        iso3: "SUR",
    },
    {
        name: "Svalbard and Jan Mayen",
        flag: createUrl("/d/d9/Flag_of_Norway.svg"),
        iso3: "SJM",
    },
    {
        name: "Swaziland",
        flag: createUrl("/f/fb/Flag_of_Eswatini.svg"),
        iso3: "SWZ",
    },
    {
        name: "Sweden",
        flag: createUrl("/4/4c/Flag_of_Sweden.svg"),
        iso3: "SWE",
    },
    {
        name: "Switzerland",
        flag: "🇨🇭",
        iso3: "CHE",
    },
    {
        name: "Syria",
        flag: createUrl("/5/53/Flag_of_Syria.svg"),
        iso3: "SYR",
    },
    {
        name: "Taiwan",
        flag: createUrl("/7/72/Flag_of_the_Republic_of_China.svg"),
        iso3: "TWN",
    },
    {
        name: "Tajikistan",
        flag: createUrl("/d/d0/Flag_of_Tajikistan.svg"),
        iso3: "TJK",
    },
    {
        name: "Tanzania",
        flag: createUrl("/3/38/Flag_of_Tanzania.svg"),
        iso3: "TZA",
    },
    {
        name: "Thailand",
        flag: createUrl("/a/a9/Flag_of_Thailand.svg"),
        iso3: "THA",
    },
    {
        name: "Timor-Leste",
        flag: createUrl("/2/26/Flag_of_East_Timor.svg"),
        iso3: "TLS",
    },
    {
        name: "Togo",
        flag: createUrl("/6/68/Flag_of_Togo.svg"),
        iso3: "TGO",
    },
    {
        name: "Tokelau",
        flag: createUrl("/8/8e/Flag_of_Tokelau.svg"),
        iso3: "TKL",
    },
    {
        name: "Tonga",
        flag: "🇹🇴",
        iso3: "TON",
    },
    {
        name: "Trinidad and Tobago",
        flag: createUrl("/6/64/Flag_of_Trinidad_and_Tobago.svg"),
        iso3: "TTO",
    },
    {
        name: "Tunisia",
        flag: createUrl("/c/ce/Flag_of_Tunisia.svg"),
        iso3: "TUN",
    },
    {
        name: "Turkey",
        flag: createUrl("/b/b4/Flag_of_Turkey.svg"),
        iso3: "TUR",
    },
    {
        name: "Turkmenistan",
        flag: createUrl("/1/1b/Flag_of_Turkmenistan.svg"),
        iso3: "TKM",
    },
    {
        name: "Turks and Caicos Islands",
        flag: createUrl("/a/a0/Flag_of_the_Turks_and_Caicos_Islands.svg"),
        iso3: "TCA",
    },
    {
        name: "Tuvalu",
        flag: createUrl("/3/38/Flag_of_Tuvalu.svg"),
        iso3: "TUV",
    },
    {
        name: "Uganda",
        flag: createUrl("/4/4e/Flag_of_Uganda.svg"),
        iso3: "UGA",
    },
    {
        name: "Ukraine",
        flag: "🇺🇦",
        iso3: "UKR",
    },
    {
        name: "United Arab Emirates",
        flag: "🇦🇪",
        iso3: "ARE",
    },
    {
        name: "United Kingdom",
        flag: "🇬🇧",
        iso3: "GBR",
    },
    {
        name: "United States Minor Outlying Islands",
        flag: createUrl("/0/05/Flag_of_the_U.S..svg"),
        iso3: "UMI",
    },
    {
        name: "United States",
        flag: "🇺🇸",
        iso3: "USA",
    },
    {
        name: "Uruguay",
        flag: createUrl("/f/fe/Flag_of_Uruguay.svg"),
        iso3: "URY",
    },
    {
        name: "Uzbekistan",
        flag: createUrl("/8/84/Flag_of_Uzbekistan.svg"),
        iso3: "UZB",
    },
    {
        name: "Vanuatu",
        flag: "🇻🇺",
        iso3: "VUT",
    },
    {
        name: "Venezuela",
        flag: createUrl("/7/7b/Flag_of_Venezuela_(state).svg"),
        iso3: "VEN",
    },
    {
        name: "Vietnam",
        flag: createUrl("/2/21/Flag_of_Vietnam.svg"),
        iso3: "VNM",
    },
    {
        name: "Virgin Islands of the United States",
        flag: createUrl("/f/f8/Flag_of_the_United_States_Virgin_Islands.svg"),
        iso3: "VIR",
    },
    {
        name: "Wallis and Futuna",
        flag: createUrl("/d/d2/Flag_of_Wallis_and_Futuna.svg"),
        iso3: "WLF",
    },
    {
        name: "Western Sahara",
        flag: "🇪🇭",
        iso3: "ESH",
    },
    {
        name: "Yemen",
        flag: createUrl("/8/89/Flag_of_Yemen.svg"),
        iso3: "YEM",
    },
    {
        name: "Zambia",
        flag: createUrl("/0/06/Flag_of_Zambia.svg"),
        iso3: "ZMB",
    },
    {
        name: "Zimbabwe",
        flag: createUrl("/6/6a/Flag_of_Zimbabwe.svg"),
        iso3: "ZWE",
    },
] as const;
