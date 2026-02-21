import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, subMonths, subWeeks, addMonths, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, X, RotateCw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Client } from './ClientRegistry';

// Interfaces aligned with App.tsx
export interface Service {
    id: number;
    name: string;
    description: string;
    duration?: number;
    price?: number;
    subServices?: { id?: number; name: string; price: number; duration: number; staffIds: number[] }[];
    images: string[];
}

export interface WorkShift {
    id: string;
    staffId: number;
    staffName?: string;
    dateString: string;
    type: 'morning' | 'afternoon' | 'custom' | 'split';
    start: string;
    end: string;
    secondStart?: string;
    secondEnd?: string;
}

export interface TeamMember {
    id: number;
    name: string;
    role: string;
    education: string;
    specialty: string[];
    bio: string;
    image: string;
}

export interface ClientAppointment {
    id: string;
    clientName: string;
    clientId?: number;
    serviceId?: number;
    staffId?: number;
    serviceName: string;
    dateString: string;
    time: string; // HH:mm simplified for grid placement
    duration: number; // minutes
    notes?: string;
}

interface ClientCalendarProps {
    staff?: TeamMember[];
    services?: Service[];
    clients?: Client[];
    appointments?: ClientAppointment[];
    shifts?: WorkShift[];
    bookingMode?: boolean;
    preSelectedStaffId?: number | null;
    onSlotClick?: (date: Date, time: string, staffId: number) => void;
    onAddAppointment?: (app: ClientAppointment) => void;
    onUpdateAppointment?: (app: ClientAppointment) => void;
    onDeleteAppointment?: (appId: string) => void;
    onRefresh?: () => void;
}

const ClientCalendar: React.FC<ClientCalendarProps> = ({
    staff = [],
    services = [],
    clients = [],
    appointments = [],
    shifts = [],
    bookingMode = false,
    preSelectedStaffId = null,
    onSlotClick,
    onAddAppointment,
    onUpdateAppointment,
    onDeleteAppointment,
    onRefresh
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>(() => {
        if (preSelectedStaffId) return 'day';
        return window.innerWidth < 768 ? 'day' : 'week';
    });

    // Filter staff if pre-selected
    const visibleStaff = preSelectedStaffId
        ? staff.filter(m => m.id === preSelectedStaffId)
        : staff;


    const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointment | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // New Appointment State
    const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
    const [newAppDate, setNewAppDate] = useState<Date | null>(null);
    const [newAppTime, setNewAppTime] = useState<string>('');
    const [newClientId, setNewClientId] = useState<string>(''); // Changed from name to ID
    const [selectedServiceValue, setSelectedServiceValue] = useState<string>(''); // Format: "serviceId|subServiceName"
    const [newStaffId, setNewStaffId] = useState<number | ''>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Appointment State
    const [editFormData, setEditFormData] = useState({
        clientName: '',
        clientId: '' as string | number, // Added clientId
        serviceValue: '',
        staffId: 0,
        time: '',
        date: ''
    });

    // Filtered appointments based on search
    const filteredAppointments = searchTerm
        ? appointments.filter(a => a.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
        : appointments;

    // Mock data generation removed. Data should be passed via props.
    // useEffect(() => { ... }, []);

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

        // Initialize edit form data
        const sVal = app.serviceId ? `${app.serviceId}|${app.serviceName}` : '';
        setEditFormData({
            clientName: app.clientName,
            clientId: app.clientId || '',
            serviceValue: sVal,
            staffId: app.staffId || 0,
            time: app.time,
            date: app.dateString
        });

        setIsEditModalOpen(true);
    };

    const handleSlotDoubleClick = (date: Date, hour: number, staffId?: number) => {
        if (bookingMode) {
            // In booking mode, single click logic via prop
            if (onSlotClick && staffId) {
                onSlotClick(date, `${hour.toString().padStart(2, '0')}:00`, staffId);
            }
            return;
        }

        setNewAppDate(date);
        setNewAppDate(date);
        setNewAppTime(`${hour.toString().padStart(2, '0')}:00`);
        setNewClientId('');
        setSelectedServiceValue('');
        // If double clicked in a staff column, pre-select that staff
        setNewStaffId(staffId || '');
        setIsNewAppModalOpen(true);
    };

    // Helper to check availability
    const isSlotAvailable = (date: Date, hour: number, staffId: number) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // Check if there is a shift
        const shift = shifts.find(s => s.staffId === staffId && s.dateString === dateStr);
        if (!shift) return false;

        const shiftStart = parseInt(shift.start.split(':')[0]);
        const shiftEnd = parseInt(shift.end.split(':')[0]);

        if (hour < shiftStart || hour >= shiftEnd) return false;

        // Check if there is an appointment
        const hasAppointment = appointments.some(a =>
            a.staffId === staffId &&
            a.dateString === dateStr &&
            parseInt(a.time.split(':')[0]) === hour
        );

        return !hasAppointment;
    };

    const handleDayHeaderClick = (date: Date) => {
        setCurrentDate(date);
        setView('day');
    };

    const saveAppointment = () => {
        if (!selectedAppointment) return;

        const [sId, subName] = editFormData.serviceValue.split('|');
        const serviceId = Number(sId);
        const service = services.find(s => s.id === serviceId);
        const subService = service?.subServices?.find(sub => sub.name === subName);

        // Find client ID based on ID
        const client = clients.find(c => c.id == editFormData.clientId);

        const updatedApp: ClientAppointment = {
            ...selectedAppointment,
            clientName: client ? client.identification.ime_prezime : editFormData.clientName,
            clientId: client ? Number(client.id) : Number(editFormData.clientId),
            serviceName: subService ? subService.name : (service ? service.name : 'Terapija'),
            serviceId: subService ? subService.id : serviceId, // FIX: Use subService ID (backend ID)
            staffId: Number(editFormData.staffId),
            dateString: editFormData.date,
            time: editFormData.time,
            duration: subService?.duration || service?.duration || 30
        };

        if (onUpdateAppointment) {
            onUpdateAppointment(updatedApp);
        }
        setIsEditModalOpen(false);
        setSelectedAppointment(null);
    };

    const createAppointment = () => {
        if (!newAppDate || !newClientId || !selectedServiceValue || !newStaffId) {
            alert("Molimo ispunite sva polja");
            return;
        }

        const [sId, subName] = selectedServiceValue.split('|');
        const serviceId = Number(sId);
        const service = services.find(s => s.id === serviceId);
        const subService = service?.subServices?.find(sub => sub.name === subName);

        // Find Client ID
        const client = clients.find(c => c.id == newClientId);

        const newApp: ClientAppointment = {
            id: Math.random().toString(),
            clientName: client ? client.identification.ime_prezime : 'Nepoznat',
            clientId: Number(newClientId), // Important for backend
            serviceName: subService ? subService.name : (service ? service.name : 'Terapija'),
            serviceId: subService ? subService.id : serviceId, // Use subService ID if available
            staffId: Number(newStaffId),
            dateString: format(newAppDate, 'yyyy-MM-dd'),
            time: newAppTime,
            duration: subService?.duration || service?.duration || 30
        };
        if (onAddAppointment) {
            onAddAppointment(newApp);
        }
        setIsNewAppModalOpen(false);
    };

    // Dynamically filter staff based on selected service
    const availableStaff = selectedServiceValue
        ? staff.filter(s => {
            const [sId, subName] = selectedServiceValue.split('|');
            const service = services.find(srv => srv.id === Number(sId));
            const subService = service?.subServices?.find(sub => sub.name === subName);
            return subService ? (subService.staffIds || []).includes(s.id) : true;
        })
        : staff;

    const availableEditStaff = editFormData.serviceValue
        ? staff.filter(s => {
            const [sId, subName] = editFormData.serviceValue.split('|');
            const service = services.find(srv => srv.id === Number(sId));
            const subService = service?.subServices?.find(sub => sub.name === subName);
            return subService ? (subService.staffIds || []).includes(s.id) : true;
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

                <div className="flex flex-1 max-w-sm relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pretraži klijenta..."
                        className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-purple/20 font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="Očisti pretragu"
                            aria-label="Očisti pretragu"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-all border border-gray-200 text-primary-purple flex items-center gap-2 font-bold px-4"
                            title="Osvježi podatke"
                        >
                            <RotateCw size={18} />
                            Osvježi
                        </button>
                    )}
                    <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200" title="Prethodno"><ChevronLeft size={20} /></button>
                    <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200" title="Sljedeće"><ChevronRight size={20} /></button>
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
                                                // Change behavior based on bookingMode
                                                onClick={() => {
                                                    if (bookingMode) handleSlotDoubleClick(day, hour, undefined); // 'undefined' for general view, but Booking needs staff specific. 
                                                    // In Week view (general), we might not support Booking click well unless we assume "Any staff". 
                                                    // But requirement says "Calendar shows... selected staff".
                                                    // So we likely won't use 'week' view for Booking with 'multiple staff' mixed.
                                                    // If 'preSelectedStaffId' is set, we can pass it.
                                                    if (bookingMode && preSelectedStaffId) handleSlotDoubleClick(day, hour, preSelectedStaffId);
                                                }}
                                                onDoubleClick={() => !bookingMode && handleSlotDoubleClick(day, hour)}
                                                className={`h-40 border-b border-gray-100 relative group transition-colors 
                                                    ${bookingMode && preSelectedStaffId && isSlotAvailable(day, hour, preSelectedStaffId) ? 'bg-green-50 hover:bg-green-100 cursor-pointer' : 'hover:bg-gray-50'}
                                                    ${bookingMode && preSelectedStaffId && !isSlotAvailable(day, hour, preSelectedStaffId) ? 'bg-gray-100/50' : ''}
                                                `}
                                            >
                                                <div className="absolute inset-x-1 top-1 bottom-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                                    {filteredAppointments
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
                            <div className="sticky top-0 z-40 grid bg-white shadow-sm border-b border-gray-100" style={{ gridTemplateColumns: `repeat(${visibleStaff.length || 1}, 1fr)` }}>
                                {visibleStaff.map(member => (
                                    <div key={member.id} className="h-16 border-r border-gray-100 flex flex-col items-center justify-center font-bold text-gray-700 bg-white/95 backdrop-blur gap-1">
                                        <img src={member.image} className="w-8 h-8 rounded-full object-cover border border-gray-200" alt={member.name} />
                                        <span className="text-sm">{member.name}</span>
                                    </div>
                                ))}
                                {visibleStaff.length === 0 && <div className="p-4 text-center text-gray-500">Nema definiranih zaposlenika</div>}
                            </div>

                            {/* Body */}
                            <div className="grid" style={{ gridTemplateColumns: `repeat(${visibleStaff.length || 1}, 1fr)` }}>
                                {visibleStaff.map((member) => (
                                    <div key={member.id} className="border-r border-gray-100 relative bg-white">
                                        {hours.map(hour => (
                                            <div
                                                key={hour}
                                                // For Day View (Split by Staff):
                                                onClick={() => bookingMode && isSlotAvailable(currentDate, hour, member.id) && handleSlotDoubleClick(currentDate, hour, member.id)}
                                                onDoubleClick={() => !bookingMode && handleSlotDoubleClick(currentDate, hour, member.id)}
                                                className={`h-40 border-b border-gray-100 relative group transition-colors 
                                                    ${bookingMode
                                                        ? (isSlotAvailable(currentDate, hour, member.id) ? 'bg-green-50 hover:bg-green-100 cursor-pointer' : 'bg-gray-100/50 cursor-not-allowed')
                                                        : 'hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <div className="absolute inset-x-1 top-1 bottom-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                                    {filteredAppointments
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
                        const dayApps = filteredAppointments.filter(a => a.dateString === format(date, 'yyyy-MM-dd')).length;
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
            )
            }

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
                                {/* Date Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Datum</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
                                        value={editFormData.date}
                                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                                    />
                                </div>

                                {/* Time Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vrijeme</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
                                        value={editFormData.time}
                                        onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                                    />
                                </div>

                                {/* Client Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Klijent</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
                                        value={editFormData.clientId}
                                        onChange={(e) => {
                                            const cId = e.target.value;
                                            const client = clients.find(c => c.id == cId);
                                            setEditFormData({
                                                ...editFormData,
                                                clientId: cId,
                                                clientName: client ? client.identification.ime_prezime : ''
                                            });
                                        }}
                                    >
                                        <option value="">Odaberi Klijenta...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.identification.ime_prezime}
                                            </option>
                                        ))}
                                        {/* If current client is not in list (legacy), add option */}
                                        {!clients.find(c => c.id == editFormData.clientId) && editFormData.clientId && (
                                            <option value={editFormData.clientId}>{editFormData.clientName || 'Nepoznat Klijent'}</option>
                                        )}
                                    </select>
                                </div>

                                {/* Service Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Terapija</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
                                        value={editFormData.serviceValue}
                                        onChange={(e) => {
                                            setEditFormData({ ...editFormData, serviceValue: e.target.value, staffId: 0 });
                                        }}
                                    >
                                        <option value="">Odaberi Terapiju...</option>
                                        {services.map(s => (
                                            <optgroup key={s.id} label={s.name}>
                                                {(s.subServices || []).map(sub => (
                                                    <option key={`${s.id}-${sub.name}`} value={`${s.id}|${sub.name}`}>
                                                        {sub.name} ({sub.duration} min)
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                {/* Staff Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zaposlenik</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
                                        value={editFormData.staffId}
                                        onChange={(e) => setEditFormData({ ...editFormData, staffId: Number(e.target.value) })}
                                        disabled={!editFormData.serviceValue}
                                    >
                                        <option value={0}>Odaberi Zaposlenika...</option>
                                        {availableEditStaff.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => setIsDeleteConfirmOpen(true)} className="flex-1 bg-white text-red-500 border border-gray-200 py-3 rounded-xl font-bold hover:bg-red-50 transition-all">Obriši</button>
                                    <button onClick={saveAppointment} className="flex-[2] bg-primary-purple text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all">Spremi Izmjene</button>
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
                                        value={newClientId}
                                        onChange={(e) => setNewClientId(e.target.value)}
                                    >
                                        <option value="">Odaberi Klijenta iz Registra...</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
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
                                        value={selectedServiceValue}
                                        onChange={(e) => {
                                            setSelectedServiceValue(e.target.value);
                                            setNewStaffId(''); // Reset staff
                                        }}
                                    >
                                        <option value="">Odaberi Terapiju...</option>
                                        {services.map(s => (
                                            <optgroup key={s.id} label={s.name}>
                                                {(s.subServices || []).map(sub => (
                                                    <option key={`${s.id}-${sub.name}`} value={`${s.id}|${sub.name}`}>
                                                        {sub.name} ({sub.duration} min)
                                                    </option>
                                                ))}
                                            </optgroup>
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
                                        disabled={!selectedServiceValue}
                                    >
                                        <option value="">{selectedServiceValue ? 'Odaberi Zaposlenika...' : 'Prvo odaberi terapiju'}</option>
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
                                        if (selectedAppointment && onDeleteAppointment) {
                                            onDeleteAppointment(selectedAppointment.id);
                                            setIsDeleteConfirmOpen(false);
                                            setIsEditModalOpen(false);
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
        </div >
    );
};

export default ClientCalendar;
