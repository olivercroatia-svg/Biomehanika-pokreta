export interface ServiceItem {
    id: string;
    name: string;
    price: string;
    duration?: string;
    description?: string;
}

export interface ServiceCategory {
    title: string;
    items: ServiceItem[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
    {
        title: "1. Dijagnostika i individualna procjena",
        items: [
            { id: 'diag-1', name: "Cjelovita klinička procjena", price: "50 €", duration: "60 min", description: "Analiza poremećaja pokreta, boli i funkcionalnih ograničenja." },
            { id: 'diag-2', name: "Analiza biomehanike tijela", price: "50 €", duration: "60 min", description: "Detaljan pregled načina na koji se tijelo kreće u prostoru." },
            { id: 'diag-3', name: "Analiza obrazaca kretanja", price: "50 €", duration: "60 min", description: "Identifikacija nepravilnih pokreta koji uzrokuju opterećenje." },
            { id: 'diag-4', name: "Procjena neuro-mišićne kontrole", price: "50 €", duration: "60 min", description: "Provjera suradnje živčanog sustava i mišića u stabilizaciji tijela." }
        ]
    },
    {
        title: "2. Fizikalne procedure i tehnologija",
        items: [
            { id: 'fiz-1', name: "TECAR terapija", price: "35 - 45 €", duration: "30-45 min", description: "Dubinska termoterapija za ubrzanu regeneraciju tkiva." },
            { id: 'fiz-2', name: "Magnetoterapija", price: "30 €", duration: "30 min", description: "Primjena magnetskog polja za smanjenje upala i brže zacjeljivanje." },
            { id: 'fiz-3', name: "Elektroterapija", price: "25 €", duration: "30 min", description: "Skup procedura za smanjenje boli i stimulaciju mišića." },
            { id: 'fiz-4', name: "Terapijski ultrazvuk", price: "25 €", duration: "15 min", description: "Primjena zvučnih valova za mikromasažu tkiva i poboljšanje cirkulacije." }
        ]
    },
    {
        title: "3. Specijalizirane manualne tehnike i koncepti",
        items: [
            { id: 'man-1', name: "Maitland koncept", price: "45 €", duration: "45 min", description: "Precizna manualna dijagnostika i mobilizacija zglobova i živčanog sustava." },
            { id: 'man-2', name: "DNS (Dinamička neuromuskularna stabilizacija)", price: "60 €", duration: "60 min", description: "Vježbe bazirane na razvojnoj kineziologiji za uspostavu pravilne stabilnosti trupa." },
            { id: 'man-3', name: "PNF (Proprioceptivna neuromuskularna facilitacija)", price: "50 €", duration: "45 min", description: "Tehnike za optimizaciju snage i motoričke kontrole kroz specifične obrasce pokreta." },
            { id: 'man-4', name: "Bobath koncept", price: "50 €", duration: "60 min", description: "Specijalizirani rad s djecom s neurorazvojnim poteškoćama." },
            { id: 'man-5', name: "Mobilizacija i manipulacija", price: "40 €", duration: "30 min", description: "Klinički utemeljene tehnike za vraćanje pokretljivosti zglobova." }
        ]
    },
    {
        title: "4. Prevencija, trening i edukacija",
        items: [
            { id: 'prev-1', name: "Prevencijski trening", price: "40 €", duration: "60 min", description: "Programi usmjereni na smanjenje rizika od ponovnih ozljeda." },
            { id: 'prev-2', name: "Rekreativni trening", price: "40 €", duration: "60 min", description: "Nastavak rehabilitacije kroz kontroliranu tjelesnu aktivnost." },
            { id: 'prev-3', name: "Edukacija klijenata", price: "40 €", duration: "45 min", description: "Osnaživanje korisnika znanjem o vlastitom tijelu radi održavanja dugoročne kvalitete života." }
        ]
    }
];
