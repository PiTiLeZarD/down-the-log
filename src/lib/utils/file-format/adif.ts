import {
    FileFormatAPI,
    Header,
    Honeypot,
    QSORecord,
    RecordField,
    allFields,
    qso2record,
    unsanitize,
} from "./common";

// ADIF is length-prefixed, so a value goes out exactly as it is: no escaping. This app used to write
// XML entities here, which reached LoTW, eQSL and Club Log as a literal `&amp;` — and made an eQSL
// password with an `&` in it a wrong password.
const adifField = (label: string, value?: string | number): string =>
    typeof value !== "undefined" && value !== null ? `<${label.toUpperCase()}:${String(value).length}>${value}` : "";

// Exports from before that fix carry the entities, so a file of ours still gets them decoded. Nobody
// else's does: `&amp;` in another logger's file is what the operator typed.
const escapedByUs = (header: Honeypot) => header.programid?.toLowerCase() === "down-the-log";

// `<NAME:LENGTH>`, `<NAME:LENGTH:TYPE>`, or a bare marker such as `<EOH>` and `<EOR>`.
const TAG = /<([^:<>\s]+)(?::(\d+)(?::[^<>]*)?)?>/g;
// A field tag inside a value: where a byte-counted length overran into the next field.
const EMBEDDED_TAG = /<[^:<>\s]+:\d+(?::[^<>]*)?>|<eor>/i;

type Field = { tag: string; value?: string };

// Walks the text tag by tag and takes each value by its declared length, which is the only thing
// that says where a value holding a `<` ends. Whatever sits between fields — line breaks, a header's
// free text, a stray comment — is skipped. Markers come through with no value.
const scan = (text: string, onField: (field: Field) => void) => {
    const tag = new RegExp(TAG);
    let match: RegExpExecArray | null;
    while ((match = tag.exec(text))) {
        const name = match[1].toLowerCase();
        if (match[2] === undefined) {
            onField({ tag: name });
            continue;
        }
        const start = tag.lastIndex;
        const end = start + +match[2];
        let value = text.slice(start, end);
        // Some loggers count UTF-8 bytes, so a non-ASCII value claims more characters than it has and
        // the slice runs into the next tag. A value whose length lands mid-tag is cut back to where
        // that tag starts; one that ends cleanly keeps any tag-like text it really contains.
        if (!/^\s*(<|$)/.test(text.slice(end, end + 64))) {
            const next = text.slice(start, end + 64).search(EMBEDDED_TAG);
            if (next !== -1 && next < value.length) value = value.slice(0, next);
        }
        tag.lastIndex = start + value.length;
        onField({ tag: name, value });
    }
};

const toQsoRecord = (fields: Field[], decode: boolean): QSORecord => {
    const record = { honeypot: {} } as QSORecord;
    fields.forEach(({ tag, value }) => {
        if (value === undefined) return;
        const v = decode ? unsanitize(value) : value;
        if (allFields.includes(tag as any)) record[tag as RecordField] = v;
        else record.honeypot[tag] = v;
    });
    return record;
};

const toHoneypot = (fields: Field[]): Honeypot =>
    Object.fromEntries(fields.filter((f) => f.value !== undefined).map(({ tag, value }) => [tag, value as string]));

const headerToAdif = (header: Header) =>
    [
        header.note,
        adifField("adif_ver", "3.1.4"),
        ...(header.fields ? Object.entries(header.fields).map(([k, v]) => adifField(k, v)) : [""]),
        "<EOH>",
        "",
        "",
    ].join("\n");

// Everything before <EOH> is the header. No <EOH> means no header at all: the file starts on its
// first record.
const parseAdifHeader = (fileContent: string): Honeypot => {
    const eoh = fileContent.search(/<eoh>/i);
    if (eoh === -1) return {};
    const fields: Field[] = [];
    scan(fileContent.slice(0, eoh), (field) => fields.push(field));
    const parsed = toHoneypot(fields);
    return escapedByUs(parsed) ? Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, unsanitize(v)])) : parsed;
};

export const AdifAPI: FileFormatAPI = {
    toRecord: (from, decode = false) => {
        const fields: Field[] = [];
        scan(from as string, (field) => field.tag !== "eor" && fields.push(field));
        return toQsoRecord(fields, decode);
    },
    fromRecord: (record) =>
        Object.entries(record)
            .filter(([k, v]) => v !== undefined)
            .map(([k, v]) =>
                k == "honeypot"
                    ? Object.entries(v as Honeypot).map(([hpk, hpv]) => adifField(hpk, hpv))
                    : adifField(k, v as string | undefined),
            )
            .flat()
            .join(" ") + "<EOR>",

    // One pass over the file, a record at a time. Only groups holding at least one valued field are
    // records: what trails the last <EOR> is often something else entirely — LoTW ends its report with
    // a bare <APP_LoTW_EOF>.
    parseFile: (fileContent) => {
        const records: QSORecord[] = [];
        let current: Field[] = [];
        let decode = false;
        const flush = () => {
            if (current.some((f) => f.value !== undefined)) records.push(toQsoRecord(current, decode));
            current = [];
        };
        scan(fileContent, (field) => {
            if (field.tag === "eoh") {
                decode = escapedByUs(toHoneypot(current));
                current = [];
            } else if (field.tag === "eor") flush();
            else current.push(field);
        });
        flush();
        return records;
    },
    parseHeader: parseAdifHeader,
    generateFile: (qsos, header, massage = (r) => r) =>
        [headerToAdif(header), ...qsos.map((q) => AdifAPI.fromRecord(massage(qso2record(q))))].join("\n"),
};
