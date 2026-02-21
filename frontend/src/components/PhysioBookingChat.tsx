import React, { useState, useRef, useEffect } from "react";
import { format } from 'date-fns';
import { X } from 'lucide-react';
import type { Service, TeamMember, WorkShift, ClientAppointment } from './ClientCalendar';
import type { Client } from './ClientRegistry';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface PhysioBookingChatProps {
    services: Service[];
    teamMembers: TeamMember[];
    shifts: WorkShift[];
    appointments: ClientAppointment[];
    clients: Client[];
    onAddAppointment: (app: ClientAppointment) => void;
    onClose: () => void;
}

// ─── AI Logic ──────────────────────────────────────────────────────────────────

export default function PhysioBookingChat({
    services,
    teamMembers,
    shifts,
    appointments,
    clients,
    onAddAppointment,
    onClose
}: PhysioBookingChatProps) {

    // ─── Helpers ────────────────────────────────────────────────────────────────────

    const RADNO_VRIJEME = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

    function slobodniTermini(fizioterapeutId: number, datum: string) {
        const shift = shifts.find(s => s.staffId === fizioterapeutId && s.dateString === datum);
        if (!shift) return []; // No shift => no free slots

        const shiftStart = parseInt(shift.start.split(':')[0]);
        const shiftEnd = parseInt(shift.end.split(':')[0]);

        // Available hours based on shift
        let availableHours = RADNO_VRIJEME.filter(t => {
            const h = parseInt(t.split(':')[0]);
            return h >= shiftStart && h < shiftEnd;
        });

        // Check second shift if exists (split shift)
        if (shift.secondStart && shift.secondEnd) {
            const s2Start = parseInt(shift.secondStart.split(':')[0]);
            const s2End = parseInt(shift.secondEnd.split(':')[0]);
            const secondShiftHours = RADNO_VRIJEME.filter(t => {
                const h = parseInt(t.split(':')[0]);
                return h >= s2Start && h < s2End;
            });
            availableHours = [...availableHours, ...secondShiftHours];
        }


        // Filter out appointments
        const dayAppointments = appointments.filter(a => a.staffId === fizioterapeutId && a.dateString === datum);
        const zauzeti = dayAppointments.map(a => a.time.split(':')[0] + ":00"); // Assuming appointments start on the hour for simplicity

        return availableHours.filter(t => !zauzeti.includes(t));
    }

    function formatDatum(dateStr: string) {
        const d = new Date(dateStr);
        return d.toLocaleDateString("hr-HR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }

    function getNextDays(n = 14) {
        const days = [];
        const today = new Date();
        // Start considering from tomorrow
        today.setDate(today.getDate() + 1);

        for (let i = 0; i < n; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            // const dayOfWeek = d.getDay();
            // Optionally skip weekends if clinic is closed, but shifts dictate availability anyway, so we can include them
            // if (dayOfWeek !== 0) { // skip just sunday if needed
            days.push(format(d, 'yyyy-MM-dd'));
            // }
        }
        return days;
    }

    function pronadiKlijenta(query: string) {
        const q = query.toLowerCase().trim();
        return clients.find(k =>
            k.identification.ime_prezime.toLowerCase().includes(q) ||
            k.identification.kontakt_broj?.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
            k.identification.email?.toLowerCase().includes(q)
        );
    }

    const [messages, setMessages] = useState<any[]>([
        {
            id: 1, sender: "bot", type: "bot",
            text: "Dobrodošli u sustav za rezervacije fizioterapije! 🏥\n\nMožete me pitati za slobodne termine, a ja ću vam pomoći pronaći odgovarajuće vrijeme.\n\nKojem fizioterapeutu se želite javiti? Možete odabrati s popisa ili jednostavno upisati željenu vrstu terapije.",
        },
        { id: 2, sender: "bot", type: "fizioterapeuti_list" },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [bookingState, setBookingState] = useState<any>({
        phase: "selecting_fizioterapeut",
        selectedFizioterapeut: null as TeamMember | null,
        selectedDatum: null as string | null,
        selectedTermin: null as string | null,
        klijent: null as Client | null,
        selectedService: null as Service | null,
        selectedSubService: null as any | null
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);


    function processUserMessage(message: string, state: any, setState: any) {
        const msg = message.toLowerCase();

        // FAZA: identifikacija klijenta
        if (state.phase === "awaiting_identity") {
            const klijent = pronadiKlijenta(message.trim());
            if (klijent) {
                setState((s: any) => ({ ...s, klijent, phase: "confirmed" }));

                // DO BOOKING HERE!
                const newApp: ClientAppointment = {
                    id: Math.random().toString(), // Will be replaced by backend usually, but needed for immediately updating UI if not waiting for refresh
                    clientId: Number(klijent.id),
                    clientName: klijent.identification.ime_prezime,
                    staffId: state.selectedFizioterapeut.id,
                    dateString: state.selectedDatum,
                    time: state.selectedTermin,
                    serviceId: state.selectedSubService ? state.selectedSubService.id : (state.selectedService ? state.selectedService.id : undefined),
                    serviceName: state.selectedSubService ? state.selectedSubService.name : (state.selectedService ? state.selectedService.name : 'Terapija'),
                    duration: state.selectedSubService?.duration || state.selectedService?.duration || 30
                };

                // Call parent to add appointment
                onAddAppointment(newApp);

                return [
                    {
                        type: "success",
                        text: `✅ Identificiran korisnik: **${klijent.identification.ime_prezime}**`,
                    },
                    {
                        type: "confirm_booking",
                        text: `Uspješno spremljeno:`,
                        booking: {
                            klijent: { ime: klijent.identification.ime_prezime, prezime: '' },
                            fizioterapeut: { ime: state.selectedFizioterapeut.name },
                            datum: state.selectedDatum,
                            termin: state.selectedTermin,
                        },
                    },
                    {
                        type: 'bot',
                        text: 'Termin je uspješno rezerviran! Imate li još kakvih pitanja ili želite rezervirati još jedan termin?'
                    }
                ];
            } else {
                return [{
                    type: "error",
                    text: "❌ Nisam pronašao klijenta s tim podatkom u našem registru.\nPokušajte upisati: puno **Ime i Prezime**, **Broj mobitela** ili **Email adresu** točno kako su prijavljeni.",
                }];
            }
        }

        // FAZA: potvrda termina
        if (state.phase === "awaiting_confirm" && state.selectedTermin) {
            if (msg.includes("da") || msg.includes("potvrdi") || msg.includes("ok") || msg.includes("u redu") || msg.includes("može")) {
                setState((s: any) => ({ ...s, phase: "awaiting_identity" }));
                return [{
                    type: "bot",
                    text: `Odlično! Da bih evidentirao rezervaciju, molim vas da se identificirate.\n\nUpišite vaše **Ime i Prezime**, **Broj mobitela** ili **Email adresu**.`,
                }];
            } else if (msg.includes("ne") || msg.includes("otkaži") || msg.includes("cancel") || msg.includes("drugo")) {
                setState((s: any) => ({ ...s, phase: "selecting_termin", selectedTermin: null }));
                return [{
                    type: "bot",
                    text: "U redu, odaberite drugi termin iz ponuđenih slobodnih termina gore ili upišite drugi datum.",
                }];
            }
        }

        // FAZA: odabir usluge
        if (state.phase === "selecting_service" || (state.selectedFizioterapeut && !state.selectedService)) {
            // Find matching service
            let foundService = null;
            let foundSubService = null;

            for (const service of services) {
                if (msg.includes(service.name.toLowerCase())) {
                    foundService = service;
                    break;
                }
                if (service.subServices) {
                    for (const sub of service.subServices) {
                        if (msg.includes(sub.name.toLowerCase())) {
                            foundService = service;
                            foundSubService = sub;
                            break;
                        }
                    }
                }
                if (foundService) break;
            }

            if (foundService) {
                setState((s: any) => ({ ...s, selectedService: foundService, selectedSubService: foundSubService, phase: "selecting_datum" }));
                const datumi = getNextDays(14);
                const fizioId = state.selectedFizioterapeut.id;
                const slobodni = datumi.map(d => ({
                    datum: d,
                    termini: slobodniTermini(fizioId, d)
                })).filter(d => d.termini.length > 0);

                return [{
                    type: "bot",
                    text: `Odabrali ste: **${foundSubService ? foundSubService.name : foundService.name}**\n\nPronašao sam slobodne termine kod **${state.selectedFizioterapeut.name}**:`,
                }, {
                    type: "termini_list",
                    data: slobodni,
                }];
            }
        }

        // FAZA: odabir fizioterapeuta
        if (state.phase === "selecting_fizioterapeut" || !state.selectedFizioterapeut) {
            const fizio = teamMembers.find(f =>
                msg.includes(f.name.toLowerCase()) ||
                msg.includes(f.name.split(" ")[0].toLowerCase()) ||
                (f.name.split(" ")[1] && msg.includes(f.name.split(" ")[1].toLowerCase()))
            );
            if (fizio) {
                setState((s: any) => ({ ...s, selectedFizioterapeut: fizio, phase: "selecting_service" }));

                return [{
                    type: "bot",
                    text: `Odabrali ste fizioterapeuta: **${fizio.name}**.\n\nKoju uslugu trebate?`,
                }, {
                    type: "usluge_list",
                    data: services
                }];
            }
        }

        // FAZA: odabir datuma i termina
        if (state.phase === "selecting_datum" || state.phase === "selecting_termin") {
            if (!state.selectedFizioterapeut) return [{ type: 'bot', text: 'Molim prvo odaberite fizioterapeuta.' }];

            // Provjeri je li korisnik unio eksplicitan format vremena, npr "2026-02-23 u 15:00" ili "14h" ili "14:00"
            // First try the button format: "YYYY-MM-DD u HH:mm"
            const buttonTimeMatch = message.match(/u\s+(\d{1,2}):(\d{2})/);
            // Then try standalone time like "14h", "14:00", "14.00"
            const standaloneTimeMatch = message.match(/(?<!\d)(\d{1,2})[:.h](\d{2})?\s*(h|sat|sati)?(?!\d)/);
            const timeMatch = buttonTimeMatch || standaloneTimeMatch;

            // Provjeri je li korisnik odabrao datum
            const datumi = getNextDays(30); // check further ahead for dates
            let matchDatum = null;
            for (const datum of datumi) {
                if (msg.includes(datum) || msg.includes(formatDatum(datum).toLowerCase()) || msg.includes(format(new Date(datum), 'd.M.'))) {
                    matchDatum = datum;
                    break;
                }
            }

            // If user typed a date, show times for that date
            if (matchDatum && !timeMatch) {
                const terminiNaDan = slobodniTermini(state.selectedFizioterapeut.id, matchDatum);
                if (terminiNaDan.length > 0) {
                    setState((s: any) => ({ ...s, selectedDatum: matchDatum, phase: "selecting_termin" }));
                    return [{
                        type: "bot",
                        text: `Za ${formatDatum(matchDatum)} slobodni termini su:\n${terminiNaDan.map(t => `• **${t}**`).join("\n")}\n\nKoji termin vas zanima?`,
                    }];
                } else {
                    return [{
                        type: "bot",
                        text: `Nažalost, nema slobodnih termina za ${formatDatum(matchDatum)}. Molim odaberite drugi datum.`,
                    }];
                }
            }

            // If user typed a time, try to use it with the currently selected date or matched date
            if (timeMatch) {
                const hour = timeMatch[1].padStart(2, "0");
                const termin = `${hour}:00`;
                const activeDate = matchDatum || state.selectedDatum;

                if (!activeDate) {
                    return [{
                        type: "bot",
                        text: `Razumio sam termin ${termin}, ali niste odabrali datum. Za koji datum vas zanima?`,
                    }];
                }

                const slobodni = slobodniTermini(state.selectedFizioterapeut.id, activeDate);
                if (slobodni.includes(termin)) {
                    setState((s: any) => ({ ...s, selectedDatum: activeDate, selectedTermin: termin, phase: "awaiting_confirm" }));
                    return [{
                        type: "confirm_prompt",
                        text: `Odabrali ste:\n\n📅 **${formatDatum(activeDate)}** u **${termin}**\n👨‍⚕️ **${state.selectedFizioterapeut.name}**\n💆‍♂️ **${state.selectedSubService ? state.selectedSubService.name : (state.selectedService ? state.selectedService.name : 'Terapija')}**\n\nPotvrdite rezervaciju? (da/ne)`,
                    }];
                } else {
                    setState((s: any) => ({ ...s, selectedDatum: activeDate })); // Update date to search even if time fails
                    return [{
                        type: "error",
                        text: `❌ Termin ${termin} na datum ${format(new Date(activeDate), 'd.M.')} nije slobodan ili je izvan radnog vremena. Slobodni termini za taj dan su: ${slobodni.join(", ")}`,
                    }];
                }
            }
        }

        // Početni pozdrav / help
        if (msg.includes("zdravo") || msg.includes("hej") || msg.includes("bok") || msg.includes("dobar")) {
            setState((s: any) => ({
                ...s, phase: "selecting_fizioterapeut", selectedFizioterapeut: null,
                selectedDatum: null,
                selectedTermin: null,
                klijent: null,
                selectedService: null,
                selectedSubService: null
            }));
            return [{
                type: "bot",
                text: "Dobrodošli nazad! 👋 Idemo ispočetka.\n\nKojem fizioterapeutu se želite javiti?",
            }, {
                type: "fizioterapeuti_list",
            }];
        }

        // Default / fallback
        if (!state.selectedFizioterapeut) {
            setState((s: any) => ({ ...s, phase: "selecting_fizioterapeut" }));
            return [{
                type: "bot",
                text: "Koji fizioterapeut vas zanima? Možete upisati ime.",
            }, {
                type: "fizioterapeuti_list",
            }];
        }

        return [{
            type: "bot",
            text: "Nisam siguran da sam dobro razumio. Možete li ponoviti? Navedite samo ime fizioterapeuta, datum ('25.2.') ili jednostavno kliknite na ponuđene opcije.",
        }];
    }

    function sendMessage(text: string) {
        if (!text.trim()) return;

        const userMsg = { id: Date.now(), sender: "user", type: "user", text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        setTimeout(() => {
            let newState = { ...bookingState };
            const responses = processUserMessage(text, bookingState, (updater: any) => {
                newState = typeof updater === "function" ? updater(newState) : { ...newState, ...updater };
            });
            setBookingState(newState);

            const botMsgs = responses.map((r, i) => ({ id: Date.now() + i + 1, sender: "bot", ...r }));
            setIsTyping(false);
            setMessages(prev => [...prev, ...botMsgs]);
        }, 800 + Math.random() * 400);
    }

    // ─── Components ─────────────────────────────────────────────────────────────────

    function TypingIndicator() {
        return (
            <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "12px 16px" }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6",
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                ))}
            </div>
        );
    }

    function MessageBubble({ msg, onSelect }: { msg: any, onSelect: (text: string) => void }) {
        const isBot = msg.sender === "bot";

        const baseStyle: React.CSSProperties = {
            maxWidth: "85%",
            padding: "12px 16px",
            borderRadius: isBot ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
        };

        const botStyle = { ...baseStyle, background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", alignSelf: "flex-start" };
        const userStyle = { ...baseStyle, background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "#fff", alignSelf: "flex-end", border: "none" };

        function renderText(text: string) {
            if (!text) return null;
            // Bold markdown
            const parts = text.split(/\*\*(.*?)\*\*/g);
            return parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-gray-900 font-bold">{p}</strong> : p);
        }

        if (msg.type === "fizioterapeuti_list") {
            return (
                <div style={{ alignSelf: "flex-start", maxWidth: "100%", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {teamMembers.map(f => (
                        <button key={f.id} onClick={() => onSelect(`${f.name}`)}
                            className="bg-white border text-left p-3 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex items-center gap-3 w-full group -ml-2"
                            style={{ borderColor: "#e2e8f0" }}
                        >
                            <img src={f.image} alt={f.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                            <div className="flex-1">
                                <div className="font-bold text-gray-800 text-sm group-hover:text-purple-600 transition-colors">{f.name}</div>
                                <div className="text-xs text-gray-400">{f.role}</div>
                            </div>
                            <span className="text-purple-400 group-hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 font-bold">→</span>
                        </button>
                    ))}
                </div>
            );
        }

        if (msg.type === "usluge_list") {
            return (
                <div style={{ alignSelf: "flex-start", maxWidth: "100%", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {msg.data.map((s: Service) => (
                        <React.Fragment key={s.id}>
                            {s.subServices && s.subServices.length > 0 ? (
                                s.subServices.map(sub => (
                                    <button key={`${s.id}-${sub.name}`} onClick={() => onSelect(`${sub.name}`)}
                                        className="bg-white border border-gray-100 text-left p-2 rounded-lg shadow-sm hover:bg-purple-50 hover:border-purple-200 transition-all flex items-center justify-between group text-sm w-full -ml-2"
                                    >
                                        <span className="text-gray-700 font-medium">{sub.name}</span>
                                        <span className="text-gray-400 text-xs">({sub.duration} min)</span>
                                    </button>
                                ))
                            ) : (
                                <button key={s.id} onClick={() => onSelect(`${s.name}`)}
                                    className="bg-white border border-gray-100 text-left p-2 rounded-lg shadow-sm hover:bg-purple-50 hover:border-purple-200 transition-all flex items-center justify-between group text-sm w-full -ml-2"
                                >
                                    <span className="text-gray-700 font-medium">{s.name}</span>
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            );
        }


        if (msg.type === "termini_list") {
            return (
                <div style={{ alignSelf: "flex-start", maxWidth: "98%", display: "flex", overflowX: "auto", gap: 10, paddingBottom: 10, paddingLeft: 2, paddingTop: 2, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="custom-scrollbar-hide">
                    {msg.data.map(({ datum, termini }: any) => (
                        <div key={datum} className="bg-white border border-gray-200 rounded-xl p-3 flex-shrink-0 min-w-[140px] shadow-sm">
                            <div className="text-xs text-purple-600 font-bold mb-3 text-center uppercase tracking-wider">
                                {format(new Date(datum), 'EEE, d.M.')}
                            </div>
                            <div className="flex flex-col gap-2">
                                {termini.map((t: string) => (
                                    <button key={t} onClick={() => onSelect(`${datum} u ${t}`)}
                                        className="bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-gray-700 font-medium text-xs hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all text-center w-full shadow-sm"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (msg.type === "confirm_booking") {
            const { klijent, fizioterapeut, datum, termin } = msg.booking;
            return (
                <div style={{
                    alignSelf: "flex-start", maxWidth: "95%",
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    border: "1px solid #86efac", borderRadius: 14, padding: 16,
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.1)"
                }}>
                    <div style={{ color: "#166534", fontWeight: 800, fontSize: 16, marginBottom: 12 }} className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs">✓</span>
                        Rezervacija u kalendaru!
                    </div>
                    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                        <div className="flex justify-between items-center border-b border-green-200/50 pb-1">
                            <span style={{ color: "#166534", opacity: 0.8 }}>Klijent:</span>
                            <span style={{ color: "#166534", fontWeight: 700 }}>{klijent.ime} {klijent.prezime}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-green-200/50 pb-1">
                            <span style={{ color: "#166534", opacity: 0.8 }}>Zaposlenik:</span>
                            <span style={{ color: "#166534", fontWeight: 700 }}>{fizioterapeut.ime}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-green-200/50 pb-1">
                            <span style={{ color: "#166534", opacity: 0.8 }}>Datum:</span>
                            <span style={{ color: "#166534", fontWeight: 700 }}>{format(new Date(datum), 'dd.MM.yyyy')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span style={{ color: "#166534", opacity: 0.8 }}>Termin:</span>
                            <span style={{ color: "#15803d", fontWeight: 900, fontSize: 18 }}>{termin}</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (msg.type === 'error') {
            const errStyle = { ...baseStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", alignSelf: "flex-start" as const };
            return (
                <div style={errStyle}>
                    {renderText(msg.text)}
                </div>
            );
        }

        return (
            <div style={isBot ? botStyle : userStyle as any}>
                {renderText(msg.text)}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
            <div className="bg-white w-full h-full sm:h-[650px] sm:max-w-md sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                <style>{`
          @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
          .custom-scrollbar-sm::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar-sm::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar-sm::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        `}</style>

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-800 to-primary-purple p-4 flex items-center justify-between text-white shadow-md z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/10">
                            💬
                        </div>
                        <div>
                            <h2 className="font-bold font-sans text-lg leading-tight">AI Asistent</h2>
                            <div className="text-xs text-purple-200 flex items-center gap-1.5 font-medium tracking-wide">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                                Uvijek spreman pomoći
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Phase indicator (optional debug) */}
                        <span className="hidden opacity-50 text-[10px] uppercase font-mono tracking-tighter bg-black/20 px-1 rounded">{bookingState.phase}</span>
                        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Chat area */}
                <div className="flex-1 bg-gray-50/50 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar-sm relative" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={{
                            display: "flex",
                            justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                            animation: "fadeUp 0.3s ease forwards",
                        }}>
                            <MessageBubble msg={msg} onSelect={sendMessage} />
                        </div>
                    ))}
                    {isTyping && (
                        <div style={{ display: "flex", alignSelf: "flex-start", marginLeft: "4px" }}>
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px 18px 18px 18px", boxShadow: "0 2px 5px rgba(0,0,0,0.02)" }}>
                                <TypingIndicator />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="bg-white p-3 border-t border-gray-100 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex gap-2 items-end">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                            placeholder="Napišite poruku ovdje..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:bg-white transition-all text-sm font-medium resize-none shadow-inner"
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim()}
                            className="bg-gradient-to-r from-purple-600 to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
                            title="Pošalji poruku"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
