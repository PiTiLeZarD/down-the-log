import { IconName } from "../../ui/icon";
import { EventType, events } from "../../utils/event-rules";

// The Events screen is a list of these before it is anything else: nothing is preselected, because
// an operator who never touches POTA shouldn't land on it every time. Sessions and Tiles lead, since
// they are the operator's own outings; the award programs below are ways of scoring those outings.
export type EventSection = "sessions" | "tiles" | EventType;

export type EventSectionDef = {
    value: EventSection;
    label: string;
    icon: IconName;
    description: string;
};

// A record rather than a list, so adding an event type to `events` fails to compile until it has a
// name and an icon here.
const programs: Record<EventType, Omit<EventSectionDef, "value">> = {
    pota: { label: "POTA", icon: "leaf", description: "Parks on the Air" },
    wwff: { label: "WWFF", icon: "flower", description: "World Wide Flora & Fauna" },
    sota: { label: "SOTA", icon: "triangle", description: "Summits on the Air" },
    iota: { label: "IOTA", icon: "boat", description: "Islands on the Air" },
    sig: { label: "SIG", icon: "pricetag", description: "Anything else logged under a special interest group" },
};

export const eventSections: EventSectionDef[] = [
    {
        value: "sessions",
        label: "Sessions",
        icon: "time",
        description: "Every outing you've logged, to resume or export",
    },
    {
        value: "tiles",
        label: "Tiles",
        icon: "grid",
        description: "Tiles on the Air — a grid square a day, home included",
    },
    ...events.map((event) => ({ value: event, ...programs[event] })),
];

export const findEventSection = (value?: string | string[]): EventSectionDef | undefined =>
    eventSections.find((section) => section.value === value);

export const eventOfSection = (section: EventSection): EventType | undefined =>
    section === "sessions" || section === "tiles" ? undefined : section;
