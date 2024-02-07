// https://www.arrl.org/files/file/DXCC/2020%20Current_Deleted.txt
// https://www.qrz.com/atlas

export const continents = ["NA", "SA", "EU", "AF", "OC", "AS", "AN"] as const;
export type Continent = (typeof continents)[number];
export type CallsignData = {
    iso3: string;
    dxcc: string;
    dxccAlt?: string[];
    regexp: RegExp;
    gs: string;
    ctn: Continent;
    states?: Record<string, RegExp>;
};

export const callsigns: CallsignData[] = [
    {
        iso3: "AFG",
        dxcc: "003",
        regexp: /^(T6|YA).*/,
        gs: "MM33wv",
        ctn: "AS",
    },
    {
        iso3: "ALA",
        dxcc: "005",
        regexp: /^OH0.*/,
        gs: "KP00cd",
        ctn: "EU",
    },
    {
        iso3: "ALB",
        dxcc: "007",
        regexp: /^ZA.*/,
        gs: "KN01bd",
        ctn: "EU",
    },
    {
        iso3: "DZA",
        dxcc: "400",
        regexp: /^7(R|[T-Y]).*/,
        gs: "JL08tc",
        ctn: "AF",
    },
    {
        iso3: "ASM",
        dxcc: "009",
        regexp: /^(A|K|N|W)H8.*/,
        gs: "AH57ee",
        ctn: "OC",
    },
    {
        iso3: "AND",
        dxcc: "203",
        regexp: /^C3.*/,
        gs: "JN02tn",
        ctn: "EU",
    },
    {
        iso3: "AGO",
        dxcc: "401",
        regexp: /^D[23].*/,
        gs: "JH88wt",
        ctn: "AF",
    },
    {
        iso3: "AIA",
        dxcc: "012",
        regexp: /^VP2E.*/,
        gs: "FK88jk",
        ctn: "AF",
    },
    {
        iso3: "ATA",
        dxcc: "013",
        regexp: /^(CE9|DP[012]|ED1|EM|KC4AA[A-F]|KC4US[A-Z]|FT8Y|HF0|HL8|DT8|IA0|LU[0-9]Z|LZ0|OA0|OJ1|OR4|RI1A|VK0|VP8|3Y[0129]|ZL[59]|ZS7|Z[VX]0|8J1).*/,
        gs: "CN95ea",
        ctn: "AN",
    },
    {
        iso3: "ATG",
        dxcc: "094",
        regexp: /^V2.*/,
        gs: "FK87xi",
        ctn: "NA",
    },
    {
        iso3: "ARG",
        dxcc: "100",
        regexp: /^(A[YZ]|L[O-TVW2-9]|LU[0-9](?!Z)).*/,
        gs: "FF81fl",
        ctn: "SA",
    },
    {
        iso3: "ARM",
        dxcc: "014",
        regexp: /^EK.*/,
        gs: "LM29mx",
        ctn: "AS",
    },
    {
        iso3: "ABW",
        dxcc: "091",
        regexp: /^P4.*/,
        gs: "FK52al",
        ctn: "SA",
    },
    {
        iso3: "AUS",
        dxcc: "150",
        regexp: /^(AX|(V[H-NZ])).*/,
        gs: "PF26gj",
        ctn: "OC",
        states: {
            ACT: /^[^0-9]{2}1.*/,
            NSW: /^[^0-9]{2}2.*/,
            VIC: /^[^0-9]{2}3.*/,
            QLD: /^[^0-9]{2}4.*/,
            SA: /^[^0-9]{2}5.*/,
            WA: /^[^0-9]{2}6.*/,
            TAS: /^[^0-9]{2}7.*/,
            NT: /^[^0-9]{2}8.*/,
        },
    },
    {
        iso3: "AUT",
        dxcc: "206",
        regexp: /^OE.*/,
        gs: "JN67or",
        ctn: "EU",
    },
    {
        iso3: "AZE",
        dxcc: "018",
        regexp: /^4[KJ].*/,
        gs: "LN30tb",
        ctn: "AS",
    },
    {
        iso3: "BHS",
        dxcc: "060",
        regexp: /^C6.*/,
        gs: "FL15aj",
        ctn: "NA",
    },
    {
        iso3: "BHR",
        dxcc: "304",
        regexp: /^A9.*/,
        gs: "LL56gb",
        ctn: "AS",
    },
    {
        iso3: "BGD",
        dxcc: "305",
        regexp: /^S[23].*/,
        gs: "NL53en",
        ctn: "AS",
    },
    {
        iso3: "BRB",
        dxcc: "062",
        regexp: /^8P.*/,
        gs: "GK03fe",
        ctn: "NA",
    },
    {
        iso3: "BLR",
        dxcc: "027",
        regexp: /^E[U-W].*/,
        gs: "KO33xr",
        ctn: "EU",
    },
    {
        iso3: "BEL",
        dxcc: "209",
        regexp: /^(O[N-QST]|OR(?!4)).*/,
        gs: "JO20em",
        ctn: "EU",
    },
    {
        iso3: "BLZ",
        dxcc: "066",
        regexp: /^V3.*/,
        gs: "EK57pe",
        ctn: "NA",
    },
    {
        iso3: "BEN",
        dxcc: "416",
        regexp: /^TY.*/,
        gs: "JJ19de",
        ctn: "AF",
    },
    {
        iso3: "BMU",
        dxcc: "064",
        regexp: /^VP9.*/,
        gs: "FM72oh",
        ctn: "AF",
    },
    {
        iso3: "BTN",
        dxcc: "306",
        regexp: /^A5.*/,
        gs: "NL57fm",
        ctn: "AS",
    },
    {
        iso3: "BOL",
        dxcc: "104",
        regexp: /^CP.*/,
        gs: "FH83fq",
        ctn: "SA",
    },
    {
        iso3: "BIH",
        dxcc: "501",
        regexp: /^(E7|T9).*/,
        gs: "JN83uw",
        ctn: "SA",
    },
    {
        iso3: "BWA",
        dxcc: "402",
        regexp: /^(8O|A2).*/,
        gs: "KG27hs",
        ctn: "AF",
    },
    {
        iso3: "BVT",
        dxcc: "024",
        regexp: /^3Y(?![0129]).*/,
        gs: "JD15qn",
        ctn: "AF",
    },
    {
        iso3: "BRA",
        dxcc: "108",
        regexp: /^(P[P-Y]|Z[YZ]|Z[V-X](?!0)).*/,
        gs: "GH25tr",
        ctn: "SA",
    },
    {
        iso3: "VGB",
        dxcc: "065",
        regexp: /^VP2V.*/,
        gs: "FK78nb",
        ctn: "NA",
    },
    {
        iso3: "IOT",
        dxcc: "033",
        regexp: /^VQ9.*/,
        gs: "MI53wp",
        ctn: "AF",
    },
    {
        iso3: "BRN",
        dxcc: "345",
        regexp: /^V8.*/,
        gs: "OJ74jr",
        ctn: "OC",
    },
    {
        iso3: "BGR",
        dxcc: "212",
        regexp: /^LZ(?!0).*/,
        gs: "KN22rr",
        ctn: "EU",
    },
    {
        iso3: "BFA",
        dxcc: "480",
        regexp: /^XT.*/,
        gs: "IK92ei",
        ctn: "AF",
    },
    {
        iso3: "BDI",
        dxcc: "404",
        regexp: /^9U.*/,
        gs: "KI46wn",
        ctn: "AF",
    },
    {
        iso3: "KHM",
        dxcc: "312",
        regexp: /^XU.*/,
        gs: "OK22lm",
        ctn: "AS",
    },
    {
        iso3: "CMR",
        dxcc: "406",
        regexp: /^TJ.*/,
        gs: "JJ67dh",
        ctn: "AF",
    },
    {
        iso3: "CAN",
        dxcc: "001",
        regexp: /^(C[F-KYZ]|V[A-GOXY]|X[J-O]).*/,
        gs: "EP12ok",
        ctn: "NA",
    },
    {
        iso3: "CPV",
        dxcc: "409",
        regexp: /^D4.*/,
        gs: "HK76xa",
        ctn: "AF",
    },
    {
        iso3: "CYM",
        dxcc: "069",
        regexp: /^ZF.*/,
        gs: "EK99rm",
        ctn: "NA",
    },
    {
        iso3: "CAF",
        dxcc: "408",
        regexp: /^TL.*/,
        gs: "KJ06lq",
        ctn: "AF",
    },
    {
        iso3: "TCD",
        dxcc: "410",
        regexp: /^TT.*/,
        gs: "JK95ij",
        ctn: "AF",
    },
    {
        iso3: "CHL",
        dxcc: "112",
        regexp: /^3G.*/,
        gs: "FF43ij",
        ctn: "SA",
    },
    {
        iso3: "CHN",
        dxcc: "318",
        regexp: /^(3[H-U]|B(?![U-X])|XS|VR(?![26])).*/,
        gs: "OM25et",
        ctn: "AS",
    },
    {
        iso3: "HKG",
        dxcc: "321",
        regexp: /^VR2.*/,
        gs: "OL72bg",
        ctn: "AS",
    },
    {
        iso3: "MAC",
        dxcc: "152",
        regexp: /^XX.*/,
        gs: "LL75of",
        ctn: "AS",
    },
    {
        iso3: "CXR",
        dxcc: "035",
        regexp: /^VK9X.*/,
        gs: "OH29tm",
        ctn: "OC",
    },
    {
        iso3: "CCK",
        dxcc: "037",
        regexp: /^TI9.*/,
        gs: "NH87kx",
        ctn: "NA",
    },
    {
        iso3: "COL",
        dxcc: "116",
        regexp: /^(5[JK]|H[JK]).*/,
        gs: "FJ34mb",
        ctn: "SA",
    },
    {
        iso3: "COM",
        dxcc: "039",
        regexp: /^D6.*/,
        gs: "LH18wc",
        ctn: "AF",
    },
    {
        iso3: "COG",
        dxcc: "412",
        regexp: /^TN.*/,
        gs: "JI79ji",
        ctn: "AF",
    },
    {
        iso3: "COD",
        dxcc: "414",
        regexp: /^9[O-T].*/,
        gs: "KI05ux",
        ctn: "AF",
    },
    {
        iso3: "COK",
        dxcc: "234",
        dxccAlt: ["191"],
        regexp: /^E5.*/,
        gs: "AH94en",
        ctn: "OC",
    },
    {
        iso3: "CRI",
        dxcc: "308",
        regexp: /^T(I(?!9)|E).*/,
        gs: "EJ79vr",
        ctn: "NA",
    },
    {
        iso3: "CIV",
        dxcc: "428",
        regexp: /^TU.*/,
        gs: "IJ77fk",
        ctn: "AF",
    },
    {
        iso3: "HRV",
        dxcc: "497",
        regexp: /^9A.*/,
        gs: "JN84di",
        ctn: "EU",
    },
    {
        iso3: "CUB",
        dxcc: "070",
        regexp: /^(C[LMO]|T4).*/,
        gs: "FL01fm",
        ctn: "NA",
    },
    {
        iso3: "CYP",
        dxcc: "215",
        regexp: /^(%B|C4|H2|P3).*/,
        gs: "KM64nu",
        ctn: "AS",
    },
    {
        iso3: "CZE",
        dxcc: "503",
        regexp: /^O[KL].*/,
        gs: "JN79rt",
        ctn: "EU",
    },
    {
        iso3: "DNK",
        dxcc: "221",
        regexp: /^(5[PQ]|O[U-WZ]).*/,
        gs: "JO56eg",
        ctn: "EU",
    },
    {
        iso3: "DJI",
        dxcc: "382",
        regexp: /^J2.*/,
        gs: "LK11ft",
        ctn: "AF",
    },
    {
        iso3: "DMA",
        dxcc: "085",
        regexp: /^J7.*/,
        gs: "FK95hj",
        ctn: "NA",
    },
    {
        iso3: "DOM",
        dxcc: "072",
        regexp: /^HI.*/,
        gs: "FK48wr",
        ctn: "NA",
    },
    {
        iso3: "ECU",
        dxcc: "120",
        regexp: /^H[CD].*/,
        gs: "FJ03we",
        ctn: "SA",
    },
    {
        iso3: "EGY",
        dxcc: "478",
        regexp: /^(6[AB]|S[SU]).*/,
        gs: "KL56jt",
        ctn: "AF",
    },
    {
        iso3: "SLV",
        dxcc: "074",
        regexp: /^(HU|YS).*/,
        gs: "EK53ns",
        ctn: "NA",
    },
    {
        iso3: "GNQ",
        dxcc: "049",
        regexp: /^3C.*/,
        gs: "JJ51dp",
        ctn: "AF",
    },
    {
        iso3: "ERI",
        dxcc: "051",
        regexp: /^E3.*/,
        gs: "KK95uf",
        ctn: "AF",
    },
    {
        iso3: "EST",
        dxcc: "052",
        regexp: /^ES.*/,
        gs: "KO28un",
        ctn: "EU",
    },
    {
        iso3: "ETH",
        dxcc: "053",
        regexp: /^9[EF].*/,
        gs: "LJ09ee",
        ctn: "AF",
    },
    {
        iso3: "FRO",
        dxcc: "222",
        regexp: /^OY.*/,
        gs: "IP61mv",
        ctn: "EU",
    },
    {
        iso3: "FJI",
        dxcc: "176",
        regexp: /^3D[2N-Z].*/,
        gs: "AH02gu",
        ctn: "OC",
    },
    {
        iso3: "FIN",
        dxcc: "224",
        regexp: /^(O[FGI]|OJ(?!1)|OH(?!0)).*/,
        gs: "KP35aa",
        ctn: "EU",
    },
    {
        iso3: "FRA",
        dxcc: "227",
        regexp: /^(F(?!([GHJKMPRSWY]|T8Y))|(H[W-Y])|(T[HKMO-QV-X])).*/,
        gs: "IN85px",
        ctn: "EU",
    },
    {
        iso3: "GUF",
        dxcc: "063",
        regexp: /^FY.*/,
        gs: "GJ33kw",
        ctn: "SA",
    },
    {
        iso3: "GAB",
        dxcc: "420",
        regexp: /^TR/,
        gs: "JI59te",
        ctn: "AF",
    },
    {
        iso3: "GMB",
        dxcc: "422",
        regexp: /^C5/,
        gs: "IK23hm",
        ctn: "AF",
    },
    {
        iso3: "GEO",
        dxcc: "075",
        regexp: /^4L/,
        gs: "LN12ph",
        ctn: "AS",
    },
    {
        iso3: "DEU",
        dxcc: "230",
        regexp: /^(D[A-OQR]|DP(?![012])).*/,
        gs: "JO51gd",
        ctn: "EU",
    },
    {
        iso3: "GHA",
        dxcc: "424",
        regexp: /^9G/,
        gs: "IJ97kv",
        ctn: "AF",
    },
    {
        iso3: "GIB",
        dxcc: "233",
        regexp: /^(ZB[023]|ZG2)/,
        gs: "IM76hd",
        ctn: "EU",
    },
    {
        iso3: "GRC",
        dxcc: "236",
        regexp: /^(J4|S[V-Z])/,
        gs: "KM18qi",
        ctn: "EU",
    },
    {
        iso3: "GRL",
        dxcc: "237",
        regexp: /^(OX|XP)/,
        gs: "GQ81ou",
        ctn: "NA",
    },
    {
        iso3: "GRD",
        dxcc: "077",
        regexp: /^J3/,
        gs: "FK92ee",
        ctn: "NA",
    },
    {
        iso3: "GLP",
        dxcc: "079",
        regexp: /^FG/,
        gs: "FK96he",
        ctn: "NA",
    },
    {
        iso3: "GUM",
        dxcc: "103",
        regexp: /^[AKNW]H2/,
        gs: "QK23jk",
        ctn: "OC",
    },
    {
        iso3: "GTM",
        dxcc: "076",
        regexp: /^TD/,
        gs: "EK45vs",
        ctn: "NA",
    },
    {
        iso3: "GGY",
        dxcc: "106",
        regexp: /^(2U|[GM][PU])/,
        gs: "IN89ql",
        ctn: "EU",
    },
    {
        iso3: "GIN",
        dxcc: "107",
        regexp: /^3X/,
        gs: "IJ49gw",
        ctn: "AF",
    },
    {
        iso3: "GNB",
        dxcc: "109",
        regexp: /^J5/,
        gs: "IK21ju",
        ctn: "AF",
    },
    {
        iso3: "GUY",
        dxcc: "129",
        regexp: /^8R/,
        gs: "GJ04mt",
        ctn: "SA",
    },
    {
        iso3: "HTI",
        dxcc: "078",
        regexp: /^(4V|HH).*/,
        gs: "FK38lx",
        ctn: "NA",
    },
    {
        iso3: "VAT",
        dxcc: "295",
        regexp: /^HV.*/,
        gs: "JN61fv",
        ctn: "EU",
    },
    {
        iso3: "HND",
        dxcc: "080",
        regexp: /^HQ.*/,
        gs: "EK64ul",
        ctn: "NA",
    },
    {
        iso3: "HUN",
        dxcc: "239",
        regexp: /^H[AG].*/,
        gs: "JN97re",
        ctn: "EU",
    },
    {
        iso3: "ISL",
        dxcc: "242",
        regexp: /^TF.*/,
        gs: "IP05ma",
        ctn: "EU",
    },
    {
        iso3: "IND",
        dxcc: "324",
        regexp: /^(8[T-Y]|[AV][T-W]).*/,
        gs: "NL11jr",
        ctn: "AS",
    },
    {
        iso3: "IDN",
        dxcc: "327",
        regexp: /^(([78][A-I])|JZ|(P[K-O])|(Y[B-H])).*/,
        gs: "OI97bn",
        ctn: "OC",
    },
    {
        iso3: "IRN",
        dxcc: "330",
        regexp: /^(9[B-D]|E[PQ]).*/,
        gs: "LM62uj",
        ctn: "AS",
    },
    {
        iso3: "IRQ",
        dxcc: "333",
        regexp: /^(HN|YI).*/,
        gs: "LM13uf",
        ctn: "AS",
    },
    {
        iso3: "IRL",
        dxcc: "245",
        regexp: /^EI.*/,
        gs: "IO53xj",
        ctn: "EU",
    },
    {
        iso3: "IMN",
        dxcc: "114",
        regexp: /^2D.*/,
        gs: "IO74rf",
        ctn: "EU",
    },
    {
        iso3: "ISR",
        dxcc: "336",
        regexp: /^4[XZ].*/,
        gs: "KM71mj",
        ctn: "AS",
    },
    {
        iso3: "ITA",
        dxcc: "248",
        regexp: /^I(?!A0).*/,
        gs: "JN61hu",
        ctn: "EU",
    },
    {
        iso3: "JAM",
        dxcc: "082",
        regexp: /^6Y.*/,
        gs: "FK18ic",
        ctn: "NA",
    },
    {
        iso3: "JPN",
        dxcc: "339",
        regexp: /^(7J|8J(?!1)|[78][K-N]|J[A-S]).*/,
        gs: "PM88rg",
        ctn: "AS",
    },
    {
        iso3: "JEY",
        dxcc: "122",
        regexp: /^2J.*/,
        gs: "IN89wf",
        ctn: "EU",
    },
    {
        iso3: "JOR",
        dxcc: "342",
        regexp: /^JY.*/,
        gs: "KM81mg",
        ctn: "AS",
    },
    {
        iso3: "KAZ",
        dxcc: "130",
        regexp: /^U[N-Q].*/,
        gs: "MN38ka",
        ctn: "AS",
    },
    {
        iso3: "KEN",
        dxcc: "430",
        regexp: /^5[YZ].*/,
        gs: "KJ80wj",
        ctn: "AF",
    },
    {
        iso3: "KIR",
        dxcc: "301",
        regexp: /^T30.*/,
        gs: "BI57dq",
        ctn: "OC",
    },
    {
        iso3: "KIR",
        dxcc: "031",
        regexp: /^T31.*/,
        gs: "BI57dq",
        ctn: "OC",
    },
    {
        iso3: "KIR",
        dxcc: "048",
        regexp: /^T32.*/,
        gs: "BI57dq",
        ctn: "OC",
    },
    {
        iso3: "PRK",
        dxcc: "344",
        regexp: /^(HM|(P[5-9])).*/,
        gs: "PN30sh",
        ctn: "AS",
    },
    {
        iso3: "KOR",
        dxcc: "137",
        regexp: /^((6[K-N])|(D([7-9S]|T(?!8)))|HL(?!8)).*/,
        gs: "PM36vm",
        ctn: "AS",
    },
    {
        iso3: "KWT",
        dxcc: "348",
        regexp: /^9K(?!3).*/,
        gs: "LL39rh",
        ctn: "AS",
    },
    {
        iso3: "KGZ",
        dxcc: "135",
        regexp: /^EX.*/,
        gs: "MN71kg",
        ctn: "AS",
    },
    {
        iso3: "LAO",
        dxcc: "143",
        regexp: /^XW.*/,
        gs: "OK18we",
        ctn: "AS",
    },
    {
        iso3: "LVA",
        dxcc: "145",
        regexp: /^YL.*/,
        gs: "KO26ht",
        ctn: "EU",
    },
    {
        iso3: "LBN",
        dxcc: "354",
        regexp: /^OD.*/,
        gs: "KM73wu",
        ctn: "AS",
    },
    {
        iso3: "LSO",
        dxcc: "432",
        regexp: /^7P.*/,
        gs: "KG40bi",
        ctn: "AF",
    },
    {
        iso3: "LBR",
        dxcc: "434",
        regexp: /^5[LM].*/,
        gs: "IJ56gk",
        ctn: "AF",
    },
    {
        iso3: "LBY",
        dxcc: "436",
        regexp: /^5A.*/,
        gs: "JL86oi",
        ctn: "AF",
    },
    {
        iso3: "LIE",
        dxcc: "251",
        regexp: /^HB0.*/,
        gs: "JN47sd",
        ctn: "EU",
    },
    {
        iso3: "LTU",
        dxcc: "146",
        regexp: /^LY.*/,
        gs: "KO15vd",
        ctn: "EU",
    },
    {
        iso3: "LUX",
        dxcc: "254",
        regexp: /^LX.*/,
        gs: "JN29xs",
        ctn: "EU",
    },
    {
        iso3: "MKD",
        dxcc: "502",
        regexp: /^Z3.*/,
        gs: "KN01un",
        ctn: "EU",
    },
    {
        iso3: "MDG",
        dxcc: "438",
        regexp: /^(5[RS]|6X).*/,
        gs: "LH31ke",
        ctn: "AF",
    },
    {
        iso3: "MWI",
        dxcc: "440",
        regexp: /^7Q.*/,
        gs: "KH76cx",
        ctn: "AF",
    },
    {
        iso3: "MYS",
        dxcc: "299",
        regexp: /^(9[MW]).*/,
        gs: "OJ43tu",
        ctn: "AS",
    },
    {
        iso3: "MDV",
        dxcc: "159",
        regexp: /^8Q.*/,
        gs: "LL75of",
        ctn: "AF",
    },
    {
        iso3: "MLI",
        dxcc: "442",
        regexp: /^TZ.*/,
        gs: "IK87am",
        ctn: "AF",
    },
    {
        iso3: "MLT",
        dxcc: "257",
        regexp: /^(1A|9H).*/,
        gs: "JM75ew",
        ctn: "EU",
    },
    {
        iso3: "MHL",
        dxcc: "168",
        regexp: /^V7.*/,
        gs: "RJ56lw",
        ctn: "OC",
    },
    {
        iso3: "MTQ",
        dxcc: "084",
        regexp: /^FM.*/,
        gs: "FK94lp",
        ctn: "NA",
    },
    {
        iso3: "MRT",
        dxcc: "444",
        regexp: /^5T.*/,
        gs: "IL41ma",
        ctn: "AF",
    },
    {
        iso3: "MUS",
        dxcc: "165",
        regexp: /^3B.*/,
        gs: "MH04an",
        ctn: "AF",
    },
    {
        iso3: "MYT",
        dxcc: "169",
        regexp: /^FH.*/,
        gs: "LH27ne",
        ctn: "AF",
    },
    {
        iso3: "MEX",
        dxcc: "050",
        regexp: /^(4[A-C]|6[D-J]|X[A-I]).*/,
        gs: "DL93ap",
        ctn: "NA",
    },
    {
        iso3: "FSM",
        dxcc: "173",
        regexp: /^V6.*/,
        gs: "QJ55cn",
        ctn: "OC",
    },
    {
        iso3: "MDA",
        dxcc: "179",
        regexp: /^ER.*/,
        gs: "KN46dx",
        ctn: "EU",
    },
    {
        iso3: "MCO",
        dxcc: "260",
        regexp: /^3A.*/,
        gs: "JN33rr",
        ctn: "EU",
    },
    {
        iso3: "MNG",
        dxcc: "363",
        regexp: /^J[T-V].*/,
        gs: "ON16vt",
        ctn: "AS",
    },
    {
        iso3: "MNE",
        dxcc: "514",
        regexp: /^4O.*/,
        gs: "JN92qq",
        ctn: "EU",
    },
    {
        iso3: "MSR",
        dxcc: "096",
        regexp: /^VP2M.*/,
        gs: "FK86vr",
        ctn: "NA",
    },
    {
        iso3: "MAR",
        dxcc: "446",
        regexp: /^(5[C-G]|CN).*/,
        gs: "IL58lo",
        ctn: "AF",
    },
    {
        iso3: "MOZ",
        dxcc: "181",
        regexp: /^C[89].*/,
        gs: "KH71rl",
        ctn: "AF",
    },
    {
        iso3: "MMR",
        dxcc: "309",
        regexp: /^(X[YZ]).*/,
        gs: "NK89id",
        ctn: "AS",
    },
    {
        iso3: "NAM",
        dxcc: "464",
        regexp: /^V5.*/,
        gs: "JG97ea",
        ctn: "AF",
    },
    {
        iso3: "NRU",
        dxcc: "157",
        regexp: /^C2.*/,
        gs: "RI39ll",
        ctn: "OC",
    },
    {
        iso3: "NPL",
        dxcc: "369",
        regexp: /^9N.*/,
        gs: "NL28bj",
        ctn: "AS",
    },
    {
        iso3: "NLD",
        dxcc: "263",
        regexp: /^P[A-I].*/,
        gs: "JO22od",
        ctn: "EU",
    },
    {
        iso3: "NCL",
        dxcc: "162",
        regexp: /^FK.*/,
        gs: "RG28sr",
        ctn: "OC",
    },
    {
        iso3: "NZL",
        dxcc: "170",
        regexp: /^Z([LM][0-46-8]|K[0146-8]).*/,
        gs: "RE29fn",
        ctn: "OC",
    },
    {
        iso3: "NIC",
        dxcc: "086",
        regexp: /^(H[T67]|YN).*/,
        gs: "EK72hu",
        ctn: "NA",
    },
    {
        iso3: "NER",
        dxcc: "187",
        regexp: /^5U.*/,
        gs: "JK47bn",
        ctn: "AF",
    },
    {
        iso3: "NGA",
        dxcc: "450",
        regexp: /^5[NO].*/,
        gs: "JJ49hb",
        ctn: "AF",
    },
    {
        iso3: "NIU",
        dxcc: "188",
        regexp: /^ZK2.*/,
        gs: "AH50aw",
        ctn: "OC",
    },
    {
        iso3: "NFK",
        dxcc: "189",
        regexp: /^VK9(?!X).*/,
        gs: "RG30xw",
        ctn: "OC",
    },
    {
        iso3: "NOR",
        dxcc: "266",
        regexp: /^LA.*/,
        gs: "JP99bi",
        ctn: "EU",
    },
    {
        iso3: "OMN",
        dxcc: "370",
        regexp: /^A4.*/,
        gs: "LL71wm",
        ctn: "AS",
    },
    {
        iso3: "PAK",
        dxcc: "372",
        regexp: /^(6[P-S]|AP).*/,
        gs: "MM40qj",
        ctn: "AS",
    },
    {
        iso3: "PLW",
        dxcc: "022",
        regexp: /^T8.*/,
        gs: "JN12ln",
        ctn: "OC",
    },
    {
        iso3: "PSE",
        dxcc: "196",
        regexp: /^E4.*/,
        gs: "KM71jv",
        ctn: "AS",
    },
    {
        iso3: "PAN",
        dxcc: "088",
        regexp: /^(3[EF]|H[OP389]).*/,
        gs: "EJ98wj",
        ctn: "NA",
    },
    {
        iso3: "PNG",
        dxcc: "163",
        regexp: /^P2.*/,
        gs: "QI43gk",
        ctn: "OC",
    },
    {
        iso3: "PRY",
        dxcc: "132",
        regexp: /^ZP.*/,
        gs: "GG06sn",
        ctn: "SA",
    },
    {
        iso3: "PER",
        dxcc: "136",
        regexp: /^(4T|OA(?!0)|O[B-C]).*/,
        gs: "FI20lt",
        ctn: "SA",
    },
    {
        iso3: "PHL",
        dxcc: "375",
        regexp: /^4[D-I].*/,
        gs: "PK02wb",
        ctn: "OC",
    },
    {
        iso3: "PCN",
        dxcc: "172",
        regexp: /^V[PR]6.*/,
        gs: "CG65cm",
        ctn: "OC",
    },
    {
        iso3: "POL",
        dxcc: "269",
        regexp: /^(3Z|S[N-R]|HF(?!0)).*/,
        gs: "JO91mw",
        ctn: "EU",
    },
    {
        iso3: "PRT",
        dxcc: "272",
        regexp: /^C[Q-U].*/,
        gs: "IM69an",
        ctn: "EU",
    },
    {
        iso3: "PRI",
        dxcc: "202",
        regexp: /^[KNW]P[34].*/,
        gs: "FK68sf",
        ctn: "NA",
    },
    {
        iso3: "QAT",
        dxcc: "376",
        regexp: /^A7.*/,
        gs: "LL55oi",
        ctn: "AS",
    },
    {
        iso3: "REU",
        dxcc: "453",
        regexp: /^FR.*/,
        gs: "LG78su",
        ctn: "AF",
    },
    {
        iso3: "ROU",
        dxcc: "275",
        regexp: /^Y[O-R].*/,
        gs: "KN25lw",
        ctn: "EU",
    },
    {
        iso3: "RUS",
        dxcc: "054",
        regexp: /^(R([1-6]|[A-Z][2-6]|[A-HJ-Z]1|I1(?!A))|(U([1-6]|[A-I][1-6]))).*/,
        gs: "KP91qo",
        ctn: "EU",
    },
    {
        iso3: "RUS",
        dxcc: "015",
        regexp: /^(R([07-9]|[A-Z][07-9])|(U([07-9]|[A-I][07-9]))).*/,
        gs: "OP91so",
        ctn: "AS",
    },
    {
        iso3: "RWA",
        dxcc: "454",
        regexp: /^9X.*/,
        gs: "KI47xx",
        ctn: "AF",
    },
    {
        iso3: "BLM",
        dxcc: "516",
        regexp: /^FJ.*/,
        gs: "FK87ov",
        ctn: "NA",
    },
    {
        iso3: "SHN",
        dxcc: "250",
        regexp: /^ZD7.*/,
        gs: "IH74da",
        ctn: "AF",
    },
    {
        iso3: "KNA",
        dxcc: "249",
        regexp: /^V4.*/,
        gs: "FK87pg",
        ctn: "NA",
    },
    {
        iso3: "LCA",
        dxcc: "097",
        regexp: /^J6.*/,
        gs: "FK93mv",
        ctn: "NA",
    },
    {
        iso3: "MAF",
        dxcc: "213",
        regexp: /^FS.*/,
        gs: "FK88lb",
        ctn: "NA",
    },
    {
        iso3: "SPM",
        dxcc: "277",
        regexp: /^FP.*/,
        gs: "GN16uw",
        ctn: "NA",
    },
    {
        iso3: "VCT",
        dxcc: "098",
        regexp: /^J8.*/,
        gs: "FK93ib",
        ctn: "NA",
    },
    {
        iso3: "WSM",
        dxcc: "190",
        regexp: /^5W.*/,
        gs: "AH36wg",
        ctn: "OC",
    },
    {
        iso3: "SMR",
        dxcc: "278",
        regexp: /^T7.*/,
        gs: "JN63fw",
        ctn: "EU",
    },
    {
        iso3: "STP",
        dxcc: "219",
        regexp: /^S9.*/,
        gs: "JJ30lu",
        ctn: "AF",
    },
    {
        iso3: "SAU",
        dxcc: "378",
        regexp: /^([7H]Z|8Z(?![45])).*/,
        gs: "LL24ng",
        ctn: "AS",
    },
    {
        iso3: "SAU",
        dxcc: "226",
        regexp: /^8Z4.*/,
        gs: "LL24ng",
        ctn: "AS",
    },
    {
        iso3: "SAU",
        dxcc: "068",
        regexp: /^(8Z5|9K3).*/,
        gs: "LL24ng",
        ctn: "AS",
    },
    {
        iso3: "SEN",
        dxcc: "456",
        regexp: /^6[VW].*/,
        gs: "IK24rl",
        ctn: "AF",
    },
    {
        iso3: "SRB",
        dxcc: "296",
        regexp: /^YT.*/,
        gs: "KN04kf",
        ctn: "EU",
    },
    {
        iso3: "SYC",
        dxcc: "379",
        regexp: /^S7.*/,
        gs: "LL75of",
        ctn: "AF",
    },
    {
        iso3: "SLE",
        dxcc: "458",
        regexp: /^9L.*/,
        gs: "IJ48dj",
        ctn: "AF",
    },
    {
        iso3: "SGP",
        dxcc: "381",
        regexp: /^9V.*/,
        gs: "OJ11wg",
        ctn: "AS",
    },
    {
        iso3: "SVK",
        dxcc: "504",
        regexp: /^OM.*/,
        gs: "JN98up",
        ctn: "EU",
    },
    {
        iso3: "SVN",
        dxcc: "499",
        regexp: /^S5.*/,
        gs: "JN76nd",
        ctn: "EU",
    },
    {
        iso3: "SLB",
        dxcc: "185",
        regexp: /^H4.*/,
        gs: "RI10kx",
        ctn: "OC",
    },
    {
        iso3: "SOM",
        dxcc: "232",
        regexp: /^(6O|T5).*/,
        gs: "LJ35ae",
        ctn: "AF",
    },
    {
        iso3: "ZAF",
        dxcc: "462",
        regexp: /^(S8|Z([RTU]|S(?!7))).*/,
        gs: "KG21hn",
        ctn: "AF",
    },
    {
        iso3: "SSD",
        dxcc: "521",
        regexp: /^ST0.*/,
        gs: "KJ47tv",
        ctn: "AF",
    },
    {
        iso3: "ESP",
        dxcc: "281",
        regexp: /^(E[A-CE-H]|ED(?!1)).*/,
        gs: "IM89ju",
        ctn: "EU",
    },
    {
        iso3: "LKA",
        dxcc: "315",
        regexp: /^4[P-S].*/,
        gs: "NJ07iv",
        ctn: "AS",
    },
    {
        iso3: "SDN",
        dxcc: "466",
        regexp: /^(6[TU]|ST(?!0)).*/,
        gs: "KK55ch",
        ctn: "AF",
    },
    {
        iso3: "SUR",
        dxcc: "140",
        regexp: /^PZ.*/,
        gs: "GJ13xw",
        ctn: "SA",
    },
    {
        iso3: "SJM",
        dxcc: "259",
        regexp: /^JW.*/,
        gs: "JQ65gt",
        ctn: "EU",
    },
    {
        iso3: "SJM",
        dxcc: "118",
        regexp: /^JX.*/,
        gs: "JQ65gt",
        ctn: "EU",
    },
    {
        iso3: "SWZ",
        dxcc: "468",
        regexp: /^3D[6A-M].*/,
        gs: "KG53qm",
        ctn: "AF",
    },
    {
        iso3: "SWE",
        dxcc: "284",
        regexp: /^([78]S|S[A-M]).*/,
        gs: "JP82rf",
        ctn: "EU",
    },
    {
        iso3: "CHE",
        dxcc: "287",
        regexp: /^H(B(?!0)|E).*/,
        gs: "JN46ct",
        ctn: "EU",
    },
    {
        iso3: "SYR",
        dxcc: "384",
        regexp: /^(6C|YK).*/,
        gs: "KM94ms",
        ctn: "AS",
    },
    {
        iso3: "TWN",
        dxcc: "386",
        regexp: /^B[U-X].*/,
        gs: "PL03mp",
        ctn: "AS",
    },
    {
        iso3: "TJK",
        dxcc: "262",
        regexp: /^EY.*/,
        gs: "MM58ou",
        ctn: "AS",
    },
    {
        iso3: "TZA",
        dxcc: "470",
        regexp: /^5[HI].*/,
        gs: "KI73jp",
        ctn: "AF",
    },
    {
        iso3: "THA",
        dxcc: "387",
        regexp: /^E2.*/,
        gs: "OK03rb",
        ctn: "AS",
    },
    {
        iso3: "TLS",
        dxcc: "511",
        regexp: /^4W.*/,
        gs: "OI33lq",
        ctn: "OC",
    },
    {
        iso3: "TGO",
        dxcc: "483",
        regexp: /^5V.*/,
        gs: "JJ08kl",
        ctn: "AF",
    },
    {
        iso3: "TKL",
        dxcc: "270",
        regexp: /^ZK3.*/,
        gs: "AI41ba",
        ctn: "OC",
    },
    {
        iso3: "TON",
        dxcc: "160",
        regexp: /^A3.*/,
        gs: "AH10sg",
        ctn: "OC",
    },
    {
        iso3: "TTO",
        dxcc: "090",
        regexp: /^9[YZ].*/,
        gs: "FK90gk",
        ctn: "SA",
    },
    {
        iso3: "TUN",
        dxcc: "474",
        regexp: /^3V.*/,
        gs: "JM43st",
        ctn: "AF",
    },
    {
        iso3: "TUR",
        dxcc: "390",
        regexp: /^T[A-C].*/,
        gs: "KM78rx",
        ctn: "AS",
    },
    {
        iso3: "TKM",
        dxcc: "280",
        regexp: /^EZ.*/,
        gs: "LM99sa",
        ctn: "AS",
    },
    {
        iso3: "TCA",
        dxcc: "089",
        regexp: /^VP5.*/,
        gs: "FL41cn",
        ctn: "NA",
    },
    {
        iso3: "TUV",
        dxcc: "282",
        regexp: /^T2.*/,
        gs: "JI01as",
        ctn: "OC",
    },
    {
        iso3: "UGA",
        dxcc: "286",
        regexp: /^5X.*/,
        gs: "KJ61dj",
        ctn: "AF",
    },
    {
        iso3: "UKR",
        dxcc: "288",
        regexp: /^(E[NO]|U[R-Z]).*/,
        gs: "KN58mi",
        ctn: "EU",
    },
    {
        iso3: "ARE",
        dxcc: "391",
        regexp: /^A6.*/,
        gs: "LL64xg",
        ctn: "AS",
    },
    {
        iso3: "GBR",
        dxcc: "223",
        regexp: /^(2A|[GM](?![PU]1)|Z[NOQ]).*/,
        gs: "IO84mh",
        ctn: "EU",
    },
    {
        iso3: "USA",
        dxcc: "291",
        regexp: /^4U.*/,
        gs: "FN30ar",
        ctn: "NA",
    },
    {
        iso3: "USA",
        dxcc: "110",
        regexp: /^[AKNW]H6.*/,
        gs: "DN05hd",
        ctn: "NA",
    },
    {
        iso3: "USA",
        dxcc: "291",
        regexp: /^(K(?!(P[234]|H[28]|C4(AA|US)))|[WN](?!(H[28]|P[234]))|A[A-GI-L]|AH(?![28])).*/,
        gs: "DN05hd",
        ctn: "NA",
    },
    {
        iso3: "URY",
        dxcc: "144",
        regexp: /^C[V-X].*/,
        gs: "GF27cl",
        ctn: "SA",
    },
    {
        iso3: "UZB",
        dxcc: "292",
        regexp: /^U[J-M].*/,
        gs: "MN21fi",
        ctn: "AS",
    },
    {
        iso3: "VUT",
        dxcc: "158",
        regexp: /^YJ.*/,
        gs: "RH43cd",
        ctn: "OC",
    },
    {
        iso3: "VEN",
        dxcc: "148",
        regexp: /^(4M|Y[V-Y]).*/,
        gs: "FJ66rk",
        ctn: "SA",
    },
    {
        iso3: "VNM",
        dxcc: "293",
        regexp: /^(3W|XV).*/,
        gs: "OK25vx",
        ctn: "AS",
    },
    {
        iso3: "VIR",
        dxcc: "285",
        regexp: /^[KNW]P2.*/,
        gs: "FK78nb",
        ctn: "NA",
    },
    {
        iso3: "WLF",
        dxcc: "298",
        regexp: /^FW.*/,
        gs: "AH16kf",
        ctn: "OC",
    },
    {
        iso3: "ESH",
        dxcc: "302",
        regexp: /^S0.*/,
        gs: "IL34ce",
        ctn: "AF",
    },
    {
        iso3: "YEM",
        dxcc: "154",
        regexp: /^7O.*/,
        gs: "LK35wt",
        ctn: "AS",
    },
    {
        iso3: "ZMB",
        dxcc: "482",
        regexp: /^9[IJ].*/,
        gs: "KH36uv",
        ctn: "AF",
    },
    {
        iso3: "ZWE",
        dxcc: "452",
        regexp: /^Z2.*/,
        gs: "KH41mc",
        ctn: "AF",
    },
];
