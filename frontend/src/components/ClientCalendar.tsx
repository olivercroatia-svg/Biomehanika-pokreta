import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, subMonths, subWeeks, addMonths, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Client } from './ClientRegistry';

// Interfaces aligned with App.tsx
interface Service {
    id: number;
    name: string;
    description: string;
    duration: number;
    price: number;
    images: string[];
    staffIds: number[];
}

interface TeamMember {
    id: number;
    name: string;
    role: string;
    education: string;
    specialty: string[];
    bio: string;
    image: string;
}

interface ClientAppointment {
    id: string;
    clientName: string;
    serviceId?: number;
    staffId?: number;
    serviceName: string;
    dateString: string;
    time: string; // HH:mm simplified for grid placement
    duration: number; // minutes
}

interface ClientCalendarProps {
    staff?: TeamMember[];
    services?: Service[];
    clients?: Client[];
}

const ClientCalendar: React.FC<ClientCalendarProps> = ({ staff = [], services = [], clients = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('week');
    const [appointments, setAppointments] = useState<ClientAppointment[]>([]);

    const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointment | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // New Appointment State
    const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
    const [newAppDate, setNewAppDate] = useState<Date | null>(null);
    const [newAppTime, setNewAppTime] = useState<string>('');
    const [newClientName, setNewClientName] = useState('');
    const [newServiceId, setNewServiceId] = useState<number | ''>('');
    const [newStaffId, setNewStaffId] = useState<number | ''>('');

    // Mock data generation
    useEffect(() => {
        const apps: ClientAppointment[] = [];
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });

        // Generate heavy load for demo
        days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            // Generate some random appointments
            for (let i = 0; i < 25; i++) {
                const hour = Math.floor(Math.random() * (20 - 7 + 1)) + 7;
                const minute = Math.random() > 0.5 ? '00' : '30';
                const time = `${hour.toString().padStart(2, '0')}:${minute}`;

                // Randomly assign service and available staff
                const randomService = services.length > 0 ? services[Math.floor(Math.random() * services.length)] : null;
                let randomStaff = null;

                if (randomService && randomService.staffIds.length > 0) {
                    const possibleStaffIds = randomService.staffIds;
                    const randomStaffId = possibleStaffIds[Math.floor(Math.random() * possibleStaffIds.length)];
                    randomStaff = staff.find(s => s.id === randomStaffId);
                } else if (staff.length > 0) {
                    randomStaff = staff[Math.floor(Math.random() * staff.length)];
                }

                apps.push({
                    id: Math.random().toString(),
                    clientName: `Klijent ${i + 1}`,
                    serviceName: randomService ? randomService.name : 'Terapija',
                    serviceId: randomService?.id,
                    staffId: randomStaff?.id,
                    dateString: dateStr,
                    time,
                    duration: randomService ? randomService.duration : 30
                });
            }
        });
        setAppointments(apps);
    }, [services.length, staff.length]); // Regenerate only when dependencies change meaningfully

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);

    const startDate = startOfWeek(view === 'month' ? monthStart : currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(view === 'month' ? monthEnd : currentDate, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 to 20

    const handlePrev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, -1));
    };

    // Helper for adding days
    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    const handleNext = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const handleAppointmentDoubleClick = (app: ClientAppointment, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedAppointment(app);
        setIsEditModalOpen(true);
    };

    const handleSlotDoubleClick = (date: Date, hour: number, staffId?: number) => {
        setNewAppDate(date);
        setNewAppTime(`${hour.toString().padStart(2, '0')}:00`);
        setNewClientName('');
        setNewServiceId('');
        // If double clicked in a staff column, pre-select that staff
        setNewStaffId(staffId || '');
        setIsNewAppModalOpen(true);
    };

    const handleDayHeaderClick = (date: Date) => {
        setCurrentDate(date);
        setView('day');
    };

    const saveAppointment = () => {
        if (!selectedAppointment) return;
        setAppointments(appointments.map(a => a.id === selectedAppointment.id ? selectedAppointment : a));
        setIsEditModalOpen(false);
        setSelectedAppointment(null);
    };

    const createAppointment = () => {
        if (!newAppDate || !newClientName || !newServiceId || !newStaffId) {
            alert("Molimo ispunite sva polja");
            return;
        }

        const service = services.find(s => s.id === newServiceId);

        const newApp: ClientAppointment = {
            id: Math.random().toString(),
            clientName: newClientName,
            serviceName: service ? service.name : 'Nova Terapija',
            serviceId: Number(newServiceId),
            staffId: Number(newStaffId),
            dateString: format(newAppDate, 'yyyy-MM-dd'),
            time: newAppTime,
            duration: service ? service.duration : 30
        };
        setAppointments([...appointments, newApp]);
        setIsNewAppModalOpen(false);
    };

    // Dynamically filter staff based on selected service
    const availableStaff = newServiceId
        ? staff.filter(s => {
            const service = services.find(srv => srv.id === newServiceId);
            return service ? service.staffIds.includes(s.id) : true;
        })
        : staff;

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-full flex flex-col relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 capitalize">
                        {view === 'month' ? format(currentDate, 'MMMM yyyy') :
                            view === 'day' ? format(currentDate, 'EEEE, d. MMMM yyyy') :
                                `Tjedan ${format(startDate, 'd.M.')} - ${format(endDate, 'd.M.yyyy')}`}
                    </h2>
                    <p className="text-gray-500">Raspored klijenata i termina</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setView('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'month' ? 'bg-white shadow text-primary-purple' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Mjesec
                    </button>
                    <button
                        onClick={() => setView('week')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'week' ? 'bg-white shadow text-primary-purple' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Tjedan
                    </button>
                    <button
                        onClick={() => setView('day')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'day' ? 'bg-white shadow text-primary-purple' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Dan
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"><ChevronLeft size={20} /></button>
                    <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"><ChevronRight size={20} /></button>
                </div>
            </div>

            {view === 'week' ? (
                <div className="flex flex-1 overflow-hidden border border-gray-200 rounded-xl bg-white h-full relative">
                    <div className="overflow-y-auto w-full h-full flex relative">

                        {/* Sticky Time Column */}
                        <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200 pt-12 sticky left-0 z-30 h-max min-h-full bg-white">
                            {hours.map(hour => (
                                <div key={hour} className="h-40 border-b border-gray-200 relative flex justify-center">
                                    <span className="absolute -top-3 text-sm font-bold text-gray-500 bg-white px-1 rounded border border-gray-100 shadow-sm z-10">
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Week Grid */}
                        <div className="flex-1 min-w-[1000px]">
                            <div className="sticky top-0 z-40 grid grid-cols-7 bg-white shadow-sm border-b border-gray-200">
                                {calendarDays.map(day => (
                                    <div
                                        key={day.toString()}
                                        onClick={() => handleDayHeaderClick(day)}
                                        className="h-12 border-r border-gray-100 flex items-center justify-center font-bold text-gray-600 bg-white/95 backdrop-blur cursor-pointer hover:bg-primary-purple/10 hover:text-primary-purple transition-colors"
                                        title="Klikni za dnevni pregled"
                                    >
                                        {format(day, 'EEE d.')}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7">
                                {calendarDays.map((day, dayIdx) => (
                                    <div key={dayIdx} className="border-r border-gray-100 relative">
                                        {hours.map(hour => (
                                            <div
                                                key={hour}
                                                onDoubleClick={() => handleSlotDoubleClick(day, hour)}
                                                className="h-40 border-b border-gray-100 relative group transition-colors hover:bg-gray-50"
                                            >
                                                <div className="absolute inset-x-1 top-1 bottom-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                                    {appointments
                                                        .filter(a => a.dateString === format(day, 'yyyy-MM-dd') && parseInt(a.time.split(':')[0]) === hour)
                                                        .map(app => (
                                                            <div
                                                                key={app.id}
                                                                onDoubleClick={(e) => handleAppointmentDoubleClick(app, e)}
                                                                className="bg-purple-50 border border-purple-200 text-purple-900 text-xs p-2 rounded-md font-bold shadow-sm hover:shadow-md hover:bg-purple-100 transition-all cursor-pointer flex-shrink-0"
                                                            >
                                                                <div className="flex justify-between">
                                                                    <span>{app.time}</span>
                                                                    <span className="opacity-70 text-[10px]">{app.duration} min</span>
                                                                </div>
                                                                <div className="truncate text-sm">{app.clientName}</div>
                                                                <div className="truncate opacity-70 font-normal">{app.serviceName}</div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : view === 'day' ? (
                /* Day View Grid */
                <div className="flex flex-1 overflow-hidden border border-gray-200 rounded-xl bg-white h-full relative">
                    <div className="overflow-y-auto w-full h-full flex relative">

                        {/* Time Column */}
                        <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200 pt-16 sticky left-0 z-30 h-max min-h-full bg-white">
                            {hours.map(hour => (
                                <div key={hour} className="h-40 border-b border-gray-200 relative flex justify-center">
                                    <span className="absolute -top-3 text-sm font-bold text-gray-500 bg-white px-1 rounded border border-gray-100 shadow-sm z-10">
                                        {hour.toString().padStart(2, '0')}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Staff Columns Grid */}
                        <div className="flex-1 min-w-[1000px]">
                            {/* Staff Headers */}
                            <div className="sticky top-0 z-40 grid bg-white shadow-sm border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${staff.length || 1}, 1fr)` }}>
                                {staff.map(member => (
                                    <div key={member.id} className="h-16 border-r border-gray-100 flex flex-col items-center justify-center font-bold text-gray-700 bg-white/95 backdrop-blur gap-1">
                                        <img src={member.image} className="w-8 h-8 rounded-full object-cover border border-gray-200" alt="" />
                                        <span className="text-sm">{member.name}</span>
                                    </div>
                                ))}
                                {staff.length === 0 && <div className="p-4 text-center text-gray-500">Nema definiranih zaposlenika</div>}
                            </div>

                            {/* Body */}
                            <div className="grid" style={{ gridTemplateColumns: `repeat(${staff.length || 1}, 1fr)` }}>
                                {staff.map((member) => (
                                    <div key={member.id} className="border-r border-gray-100 relative bg-white">
                                        {hours.map(hour => (
                                            <div
                                                key={hour}
                                                onDoubleClick={() => handleSlotDoubleClick(currentDate, hour, member.id)}
                                                className="h-40 border-b border-gray-100 relative group transition-colors hover:bg-gray-50"
                                            >
                                                <div className="absolute inset-x-1 top-1 bottom-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                                    {appointments
                                                        .filter(a =>
                                                            a.dateString === format(currentDate, 'yyyy-MM-dd') &&
                                                            parseInt(a.time.split(':')[0]) === hour &&
                                                            a.staffId === member.id // Filter by staff
                                                        )
                                                        .map(app => (
                                                            <div
                                                                key={app.id}
                                                                onDoubleClick={(e) => handleAppointmentDoubleClick(app, e)}
                                                                className="bg-pink-50 border border-pink-200 text-pink-900 text-xs p-2 rounded-md font-bold shadow-sm hover:shadow-md hover:bg-pink-100 transition-all cursor-pointer flex-shrink-0"
                                                            >
                                                                <div className="flex justify-between">
                                                                    <span>{app.time}</span>
                                                                    <span className="opacity-70 text-[10px]">{app.duration} min</span>
                                                                </div>
                                                                <div className="truncate text-sm">{app.clientName}</div>
                                                                <div className="truncate opacity-70 font-normal">{app.serviceName}</div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Month View */
                <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-b-xl overflow-hidden border border-gray-100 flex-1 min-h-[600px]">
                    {['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'].map(d => <div key={d} className="bg-white p-2 text-center font-bold text-xs text-gray-400">{d}</div>)}
                    {calendarDays.map((date, idx) => {
                        const dayApps = appointments.filter(a => a.dateString === format(date, 'yyyy-MM-dd')).length;
                        return (
                            <div key={idx} className="bg-white p-2 h-[120px] border-b border-r border-gray-100 relative hover:bg-gray-50 flex flex-col justify-between">
                                <span className="font-bold text-sm">{format(date, 'd')}</span>
                                {dayApps > 0 && (
                                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold text-center">
                                        {dayApps} klijenata
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Appointment Modal */}
            <AnimatePresence>
                {isEditModalOpen && selectedAppointment && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl">Uredi Termin</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vrijeme</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold"
                                        value={selectedAppointment.time}
                                        onChange={(e) => setSelectedAppointment({ ...selectedAppointment, time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Klijent</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold"
                                        value={selectedAppointment.clientName}
                                        onChange={(e) => setSelectedAppointment({ ...selectedAppointment, clientName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Terapija</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
                                        value={selectedAppointment.serviceName}
                                        onChange={(e) => setSelectedAppointment({ ...selectedAppointment, serviceName: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsDeleteConfirmOpen(true)} className="flex-1 bg-white text-red-500 border border-gray-200 py-3 rounded-xl font-bold hover:bg-red-50 transition-all">Obriši</button>
                                    <button onClick={saveAppointment} className="flex-[2] bg-primary-purple text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all">Spremi</button>
                                </div>                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* New Appointment Modal */}
            <AnimatePresence>
                {isNewAppModalOpen && newAppDate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-xl">Novi Termin</h3>
                                    <p className="text-sm text-gray-500">{format(newAppDate, 'dd.MM.yyyy')} u {newAppTime}</p>
                                </div>
                                <button onClick={() => setIsNewAppModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                {/* Client Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Klijent</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
                                        value={newClientName}
                                        onChange={(e) => setNewClientName(e.target.value)}
                                    >
                                        <option value="">Odaberi Klijenta iz Registra...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.identification.ime_prezime}>
                                                {client.identification.ime_prezime}
                                            </option>
                                        ))}
                                    </select>
                                    {clients.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">Nema registriranih klijenata.</p>
                                    )}
                                </div>

                                {/* Time Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Početak Termina</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
                                        value={newAppTime}
                                        onChange={(e) => setNewAppTime(e.target.value)}
                                    />
                                </div>

                                {/* Service Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vrsta Terapije</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
                                        value={newServiceId}
                                        onChange={(e) => {
                                            setNewServiceId(Number(e.target.value));
                                            setNewStaffId(''); // Reset staff
                                        }}
                                    >
                                        <option value="">Odaberi Terapiju...</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Staff Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zaposlenik</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
                                        value={newStaffId}
                                        onChange={(e) => setNewStaffId(Number(e.target.value))}
                                        disabled={!newServiceId}
                                    >
                                        <option value="">{newServiceId ? 'Odaberi Zaposlenika...' : 'Prvo odaberi terapiju'}</option>
                                        {availableStaff.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button onClick={createAppointment} className="w-full bg-primary-purple text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all mt-4">Rezerviraj Termin</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteConfirmOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Brisanje Termina</h3>
                            <p className="text-gray-500 mb-6">Jeste li sigurni da želite trajno obrisati ovaj termin? Ova radnja se ne može poništiti.</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all"
                                >
                                    Odustani
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedAppointment) {
                                            setAppointments(appointments.filter(a => a.id !== selectedAppointment.id));
                                            setIsDeleteConfirmOpen(false);
                                            setIsEditModalOpen(false); // Close edit modal too
                                            setSelectedAppointment(null);
                                        }
                                    }}
                                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-md hover:shadow-lg transition-all"
                                >
                                    Obriši
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClientCalendar;
