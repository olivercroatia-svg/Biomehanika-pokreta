import React, { useState, useEffect } from 'react';
import ClientCalendar from './components/ClientCalendar';
import ClientRegistry, { MOCK_CLIENTS } from './components/ClientRegistry';
import type { Client } from './components/ClientRegistry';
import {
  Menu, X, Calendar as CalendarIcon, Users, Clock,
  ChevronLeft, ChevronRight, Plus, LogIn, LogOut,
  LayoutDashboard, ClipboardList, Settings, Bell,
  ArrowLeft, Mail, Phone, Award, Briefcase, GraduationCap, Upload, Image as ImageIcon, Pencil,
  TrendingUp, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, addMonths, subMonths, startOfMonth,
  endOfMonth, startOfWeek, endOfWeek, isSameMonth,
  isSameDay, addDays, eachDayOfInterval, addWeeks, subWeeks
} from 'date-fns';

// --- Types ---
type View = 'landing' | 'dashboard' | 'team';
type AdminTab = 'calendar' | 'client-calendar' | 'client-registry' | 'staff' | 'treatments' | 'settings';

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

// --- Data ---
const INITIAL_SERVICES: Service[] = [
  {
    id: 1,
    name: "Manualna Terapija",
    description: "Precizne tehnike ruku za smanjenje boli, poboljšanje pokretljivosti zglobova i opuštanje mišićne napetosti.",
    duration: 45,
    price: 50,
    images: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=1974"
    ],
    staffIds: [1, 2]
  },
  {
    id: 2,
    name: "DNS Rehabilitacija",
    description: "Dinamička neuromuskularna stabilizacija. Vraćanje idealnih obrazaca pokreta kroz razvojnu kineziologiju.",
    duration: 60,
    price: 60,
    images: [
      "https://images.unsplash.com/photo-1579126038374-6064e9370f0f?auto=format&fit=crop&q=80&w=2031"
    ],
    staffIds: [1]
  },
  {
    id: 3,
    name: "Kinesiotaping",
    description: "Primjena elastičnih traka za potporu mišićima, smanjenje oteklina i korekciju zglobnih odnosa.",
    duration: 15,
    price: 20,
    images: [
      "https://images.unsplash.com/photo-1583454155184-870a1f63aebc?auto=format&fit=crop&q=80&w=1974"
    ],
    staffIds: [2, 3]
  }
];

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    name: "Vukica Jurišić",
    role: "Osnivačica i Glavna fizioterapeutkinja",
    education: "Magistra fizioterapije, Certificirani DNS praktičar",
    specialty: ["Manualna terapija", "DNS rehabilitacija", "Dijagnostika biomehanike"],
    bio: "S preko 10 godina iskustva u elitnoj rehabilitaciji, Vukica je osnovala centar s vizijom personaliziranog pristupa svakom pacijentu. Specijalizirana je za kompleksne slučajeve kronične boli i neuro-mišićnu stabilizaciju.",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=1974"
  },
  {
    id: 2,
    name: "Marko Horvat",
    role: "Viši fizioterapeut",
    education: "Prvostupnik fizioterapije, Specijalist sportske medicine",
    specialty: ["Sportska rehabilitacija", "Kinesiotaping", "Funkcionalni trening"],
    bio: "Marko se fokusira na oporavak sportaša i prevenciju ozljeda. Kroz godine rada s profesionalnim sportašima, razvio je metode koje omogućuju brz i siguran povratak na teren.",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=1964"
  },
  {
    id: 3,
    name: "Ivana Carić",
    role: "Fizioterapeutkinja",
    education: "Fizioterapeutski tehničar, Certificirani masažni terapeut",
    specialty: ["Medicinska masaža", "Limfna drenaža", "Elektroterapija"],
    bio: "Ivana je stručnjakinja za terapiju mekih tkiva. Njezin rad je ključan u smanjenju post-operativnog edema i obnavljanju fleksibilnosti kroz manualne tehnike drenaže.",
    image: "https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=2070"
  }
];

// --- Components ---

const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({ images: [], staffIds: [] });

  const handleDelete = (id: number) => {
    if (confirm('Jeste li sigurni da želite obrisati ovu uslugu?')) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const handleEdit = (service: Service) => {
    setNewService({ ...service });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!newService.name || !newService.price) return;

    if (newService.id) {
      // Edit existing
      setServices(services.map(s => s.id === newService.id ? { ...newService, id: newService.id } as Service : s));
    } else {
      // Add new
      const service: Service = {
        id: Date.now(),
        name: newService.name,
        description: newService.description || '',
        duration: newService.duration || 30,
        price: newService.price,
        images: newService.images?.length ? newService.images : ['https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&q=80&w=2070'],
        staffIds: newService.staffIds || []
      };
      setServices([...services, service]);
    }

    setIsAdding(false);
    setNewService({ images: [], staffIds: [] });
  };

  const addImageToNewService = (url: string) => {
    if (!url) return;
    setNewService({ ...newService, images: [...(newService.images || []), url] });
  };

  const toggleStaff = (id: number) => {
    const current = newService.staffIds || [];
    if (current.includes(id)) {
      setNewService({ ...newService, staffIds: current.filter(s => s !== id) });
    } else {
      setNewService({ ...newService, staffIds: [...current, id] });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Create a fake URL for preview purposes (in real app, this would be uploaded to server)
      const imageUrl = URL.createObjectURL(file);
      addImageToNewService(imageUrl);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Popis Usluga</h2>
          <p className="text-gray-500">Upravljajte uslugama koje centar nudi.</p>
        </div>
        <button
          onClick={() => {
            setNewService({ images: [], staffIds: [] });
            setIsAdding(true);
          }}
          className="bg-primary-purple text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg"
        >
          <Plus size={20} /> Dodaj Novu Uslugu
        </button>
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl mb-8"
        >
          <h3 className="text-xl font-bold mb-6">{newService.id ? 'Uredi Uslugu' : 'Dodaj Uslugu'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Naziv Usluge</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none"
                placeholder="npr. Laseroterapija"
                value={newService.name || ''}
                onChange={e => setNewService({ ...newService, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Cijena (€)</label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none"
                placeholder="50"
                value={newService.price || ''}
                onChange={e => setNewService({ ...newService, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Trajanje (min)</label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none"
                placeholder="45"
                value={newService.duration || ''}
                onChange={e => setNewService({ ...newService, duration: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Fotografija</label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none"
                    placeholder="Zalijepi URL slike..."
                    id="img-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const el = e.currentTarget;
                        addImageToNewService(el.value);
                        el.value = '';
                      }
                    }}
                  />
                  <ImageIcon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>

                <div className="relative">
                  <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-2 h-full">
                    <Upload size={18} />
                    <span className="hidden sm:inline">Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById('img-input') as HTMLInputElement;
                    addImageToNewService(el.value);
                    el.value = '';
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-xl transition-colors"
                  title="Dodaj URL"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex gap-3 flex-wrap min-h-[3rem]">
                {newService.images?.length === 0 && (
                  <div className="text-gray-400 text-sm italic flex items-center pt-2">
                    Nema dodanih slika.
                  </div>
                )}
                {newService.images?.map((img, i) => (
                  <div key={i} className="relative group w-20 h-20">
                    <img src={img} className="w-full h-full rounded-xl object-cover border border-gray-200 shadow-sm" />
                    <button
                      onClick={() => setNewService({ ...newService, images: newService.images?.filter((_, idx) => idx !== i) })}
                      className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-110"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Izvođači (Tko pruža uslugu?)</label>
              <div className="flex flex-wrap gap-3">
                {TEAM_MEMBERS.map(member => (
                  <button
                    key={member.id}
                    onClick={() => toggleStaff(member.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${(newService.staffIds || []).includes(member.id)
                      ? 'bg-primary-purple text-white border-primary-purple'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-purple'
                      }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img src={member.image} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-medium text-sm">{member.name}</span>
                    {(newService.staffIds || []).includes(member.id) && <Award size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Opis</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none h-24 resize-none"
                placeholder="Kratki opis terapije..."
                value={newService.description || ''}
                onChange={e => setNewService({ ...newService, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => {
                setIsAdding(false);
                setNewService({ images: [], staffIds: [] });
              }}
              className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
            >
              Odustani
            </button>
            <button
              onClick={handleSave}
              className="bg-primary-purple text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              {newService.id ? 'Spremi Promjene' : 'Spremi Uslugu'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <motion.div
            key={service.id}
            layout
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group"
          >
            <div className="h-48 relative overflow-hidden">
              <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(service)}
                  className="bg-white/90 p-2 rounded-lg text-primary-purple hover:text-purple-700 shadow-sm backdrop-blur-sm"
                  title="Uredi"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="bg-white/90 p-2 rounded-lg text-red-500 hover:text-red-600 shadow-sm backdrop-blur-sm"
                  title="Obriši"
                >
                  <X size={18} />
                </button>
              </div>
              {service.images.length > 0 ? (
                <img src={service.images[0]} alt={service.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                  <ClipboardList size={48} />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div className="flex justify-between items-end text-white">
                  <span className="font-bold text-lg">{service.price} €</span>
                  <span className="text-sm bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
                    <Clock size={12} /> {service.duration} min
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{service.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-3 mb-4">{service.description}</p>

              <div className="flex -space-x-2 overflow-hidden border-t border-gray-50 pt-4">
                {service.staffIds?.map((staffId) => {
                  const member = TEAM_MEMBERS.find(m => m.id === staffId);
                  if (!member) return null;
                  return (
                    <img
                      key={member.id}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                      src={member.image}
                      alt={member.name}
                      title={`Izvodi: ${member.name}`}
                    />
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div >
  );
};

// Work Analysis Popup Component
const WorkAnalysisPopup = ({ members }: { members: TeamMember[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    // Hidden execution trigger implementation as requested
    const trigger = document.createElement('button');
    trigger.id = 'work-analysis-trigger';
    trigger.style.display = 'none';
    trigger.onclick = () => setIsOpen(true);
    document.body.appendChild(trigger);

    return () => {
      // Check if element exists before removing to avoid errors if fast refresh handled it
      const el = document.getElementById('work-analysis-trigger');
      if (el) document.body.removeChild(el);
    };
  }, []);

  const runAnalysis = () => {
    setIsProcessing(true);
    // Simulation of backend logic
    setTimeout(() => {
      const randomHours = Math.floor(Math.random() * 40) + 140; // ~160h
      const mockResults = {
        total: randomHours,
        morning: Math.floor(randomHours * 0.4),
        afternoon: Math.floor(randomHours * 0.4),
        night: 0,
        saturday: Math.floor(Math.random() * 10),
        sunday: Math.floor(Math.random() * 8),
        holiday: Math.floor(Math.random() * 8),
        overtime: Math.max(0, randomHours - 160)
      };
      setResults(mockResults);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-4xl border border-gray-100 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-primary-purple" /> Analitika Radnih Sati
                </h2>
                <p className="text-sm text-gray-500">Obračun sati prema zakonskim normama</p>
              </div>
              <button onClick={() => { setIsOpen(false); setResults(null); }} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {!results ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zaposlenik</label>
                    <select
                      className="w-full px-4 py-3 rounded-t-xl rounded-b-xl bg-gray-50 border border-gray-200 font-bold outline-none cursor-pointer"
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    >
                      <option value="all">Svi Zaposlenici</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Razdoblje</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none uppercase text-sm tracking-wide"
                          value={dateFrom}
                          onChange={e => setDateFrom(e.target.value)}
                        />
                      </div>
                      <span className="text-gray-400 font-bold">-</span>
                      <div className="flex-1">
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none uppercase text-sm tracking-wide"
                          value={dateTo}
                          onChange={e => setDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-700">
                  <p className="font-bold flex items-center gap-2 mb-1"><ClipboardList size={16} /> Napomena sustava</p>
                  Izračun uključuje tjedne norme, noćni rad, rad vikendom i automatski detektira državne praznike Republike Hrvatske.
                </div>

                <button
                  onClick={runAnalysis}
                  disabled={isProcessing}
                  className="w-full bg-primary-purple text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generiranje izvještaja...</>
                  ) : (
                    <>Pokreni Analizu</>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Ukupno</div>
                    <div className="text-3xl font-black text-gray-900">{results.total}<span className="text-sm text-gray-400 font-normal ml-1">h</span></div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
                    <div className="text-xs text-green-600 uppercase font-bold mb-1">Redovno</div>
                    <div className="text-3xl font-black text-green-700">{results.total - results.overtime}<span className="text-sm text-green-500 font-normal ml-1">h</span></div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                    <div className="text-xs text-red-600 uppercase font-bold mb-1">Prekovremeni</div>
                    <div className="text-3xl font-black text-red-700">{results.overtime}<span className="text-sm text-red-500 font-normal ml-1">h</span></div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-center">
                    <div className="text-xs text-yellow-700 uppercase font-bold mb-1">Praznici/Vikend</div>
                    <div className="text-3xl font-black text-yellow-800">{results.saturday + results.sunday + results.holiday}<span className="text-sm text-yellow-600 font-normal ml-1">h</span></div>
                  </div>
                </div>

                <div className="border rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Izvještaj za:</p>
                      <p className="font-bold text-gray-900 text-lg">
                        {selectedMemberId === 'all'
                          ? 'Svi Zaposlenici'
                          : members.find(m => m.id === selectedMemberId)?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Razdoblje:</p>
                      <p className="font-medium text-gray-600">
                        {dateFrom && format(new Date(dateFrom), 'dd.MM.')} - {dateTo && format(new Date(dateTo), 'dd.MM.yyyy')}
                      </p>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr className="text-left">
                        <th className="p-4 font-bold">Kategorija</th>
                        <th className="p-4 font-bold text-right">Sati</th>
                        <th className="p-4 font-bold text-right">Udio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-4 font-bold text-gray-700">Jutarnja smjena (06-14)</td>
                        <td className="p-4 text-right">{results.morning} h</td>
                        <td className="p-4 text-right text-gray-400">{Math.round(results.morning / results.total * 100)}%</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold text-gray-700">Popodnevna smjena (14-22)</td>
                        <td className="p-4 text-right">{results.afternoon} h</td>
                        <td className="p-4 text-right text-gray-400">{Math.round(results.afternoon / results.total * 100)}%</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold text-gray-700">Rad subotom</td>
                        <td className="p-4 text-right font-bold text-indigo-600">{results.saturday} h</td>
                        <td className="p-4 text-right text-gray-400">-</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold text-gray-700">Rad nedjeljom</td>
                        <td className="p-4 text-right font-bold text-red-500">{results.sunday} h</td>
                        <td className="p-4 text-right text-gray-400">-</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-bold text-gray-700">Rad blagdanom</td>
                        <td className="p-4 text-right font-bold text-red-600">{results.holiday} h</td>
                        <td className="p-4 text-right text-gray-400">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setResults(null)}
                    className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 border border-gray-200"
                  >
                    Novi Izračun
                  </button>
                  <button
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black"
                  >
                    <Download size={18} className="inline mr-2" />
                    Obrazac .PDF
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const StaffManager = () => {
  const [members, setMembers] = useState<TeamMember[]>(TEAM_MEMBERS);
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({ specialty: [] });

  const handleEdit = (member: TeamMember) => {
    setNewMember({ ...member });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (confirm('Jeste li sigurni da želite obrisati ovog zaposlenika?')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const handleSave = () => {
    if (!newMember.name || !newMember.role) return;

    if (newMember.id) {
      setMembers(members.map(m => m.id === newMember.id ? { ...newMember } as TeamMember : m));
    } else {
      const member: TeamMember = {
        id: Date.now(),
        name: newMember.name,
        role: newMember.role,
        education: newMember.education || '',
        specialty: newMember.specialty || [],
        bio: newMember.bio || '',
        image: newMember.image || 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=1974'
      };
      setMembers([...members, member]);
    }
    setIsAdding(false);
    setNewMember({ specialty: [] });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setNewMember({ ...newMember, image: imageUrl });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Zaposlenici</h2>
          <p className="text-gray-500">Upravljajte svojim timom stručnjaka.</p>
        </div>
        {!isAdding && (
          <div className="flex gap-3">
            <button
              onClick={() => document.getElementById('work-analysis-trigger')?.click()}
              className="bg-white text-primary-purple border border-primary-purple/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-purple/5 transition-all shadow-sm"
              id="btn-obracun-wrapper"
            >
              <ClipboardList size={20} /> Analiza rada
            </button>
            <button
              onClick={() => {
                setNewMember({ specialty: [] });
                setIsAdding(true);
              }}
              className="bg-primary-purple text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg"
            >
              <Plus size={20} /> Dodaj Zaposlenika
            </button>
          </div>
        )}
      </div>

      <WorkAnalysisPopup members={members} />

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl mb-8"
        >
          <h3 className="text-xl font-bold mb-6">{newMember.id ? 'Uredi Zaposlenika' : 'Dodaj Novog Zaposlenika'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Ime i Prezime</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none"
                placeholder="npr. Ana Anić"
                value={newMember.name || ''}
                onChange={e => setNewMember({ ...newMember, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Uloga / Titula</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none"
                placeholder="npr. Viši fizioterapeut"
                value={newMember.role || ''}
                onChange={e => setNewMember({ ...newMember, role: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Obrazovanje</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none"
                placeholder="npr. Mag. Physioth."
                value={newMember.education || ''}
                onChange={e => setNewMember({ ...newMember, education: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Specijalizacije (odvojite zarezom)</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none"
                placeholder="npr. Masaža, DNS, Kinesiotaping"
                value={newMember.specialty?.join(', ') || ''}
                onChange={e => setNewMember({ ...newMember, specialty: e.target.value.split(',').map(s => s.trim()) })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Fotografija</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                  {newMember.image ? (
                    <img src={newMember.image} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none"
                    placeholder="URL fotografije..."
                    value={newMember.image || ''}
                    onChange={e => setNewMember({ ...newMember, image: e.target.value })}
                  />
                  <div className="relative inline-block">
                    <label className="bg-primary-purple/10 text-primary-purple px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-primary-purple/20 transition-all text-sm flex items-center gap-2">
                      <Upload size={16} /> Upload s računala
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Biografija</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-pink/20 outline-none h-32 resize-none"
                placeholder="Kratki opis iskustva i vještina..."
                value={newMember.bio || ''}
                onChange={e => setNewMember({ ...newMember, bio: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
            >
              Odustani
            </button>
            <button
              onClick={handleSave}
              className="bg-primary-purple text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              {newMember.id ? 'Spremi Promjene' : 'Dodaj Zaposlenika'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div key={member.id} className="relative group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all">

            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDelete(member.id)}
                className="p-2 bg-white text-red-500 rounded-lg shadow-sm w-full hover:bg-red-50"
                title="Obriši"
              >
                <X size={16} />
              </button>
            </div>

            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-gray-50 relative">
              <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
            <p className="text-primary-pink font-medium text-sm mb-4">{member.role}</p>
            <p className="text-gray-500 text-sm line-clamp-3 mb-6">{member.bio}</p>
            <div className="flex gap-2 w-full mt-auto">
              <button
                onClick={() => handleEdit(member)}
                className="flex-1 border border-gray-200 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Uredi
              </button>
              <button className="flex-1 bg-primary-purple/10 text-primary-purple py-2 rounded-xl text-sm font-bold hover:bg-primary-purple/20">
                Raspored
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: () => void }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-purple to-primary-pink" />
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="text-3xl font-bold mb-2">Pristup Sustavu</div>
          <p className="text-gray-500 text-sm">Molimo unesite lozinku za pristup admin panelu.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lozinka</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && password === 'admin' && onLogin()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-purple focus:ring-2 focus:ring-primary-purple/20 transition-all outline-none"
            />
          </div>
          <button
            onClick={() => { if (password === 'admin') onLogin(); }}
            className="w-full bg-primary-purple text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all transform active:scale-[0.98]"
          >
            Prijavi se
          </button>
        </div>
      </motion.div>
    </div>
  );
};


interface WorkShift {
  id: string;
  staffId: number;
  staffName?: string; // Allow overriding name for the shift context if needed
  dateString: string;
  type: 'morning' | 'afternoon' | 'custom' | 'split';
  start: string;
  end: string;
  secondStart?: string; // For split shifts
  secondEnd?: string;   // For split shifts
}

const CustomCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<number | 'all'>('all');
  const [shifts, setShifts] = useState<WorkShift[]>([]);

  // View mode state
  const [view, setView] = useState<'month' | 'week'>('month');

  // State for shift editing
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for staff selection when creating new shift from 'All' view
  const [isStaffSelectModalOpen, setIsStaffSelectModalOpen] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);

  // Mock initial shifts
  useEffect(() => {
    // Generate some random shifts for demo
    const initialShifts: WorkShift[] = [];
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const days = eachDayOfInterval({ start, end });

    TEAM_MEMBERS.forEach(member => {
      days.forEach(day => {
        if (day.getDay() !== 0 && Math.random() > 0.3) { // Skip Sundays, random days off
          const type = Math.random() > 0.5 ? 'morning' : 'afternoon';
          initialShifts.push({
            id: `${member.id}-${format(day, 'yyyy-MM-dd')}`,
            staffId: member.id,
            dateString: format(day, 'yyyy-MM-dd'),
            type,
            start: type === 'morning' ? '08:00' : '14:00',
            end: type === 'morning' ? '14:00' : '20:00'
          });
        }
      });
    });
    setShifts(initialShifts);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(view === 'month' ? monthStart : currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(view === 'month' ? monthEnd : currentDate, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleDayClick = (date: Date) => {
    if (selectedStaffId !== 'all') {
      const dateStr = format(date, 'yyyy-MM-dd');
      // Check if shift exists for this user/date
      const existing = shifts.find(s => s.staffId === selectedStaffId && s.dateString === dateStr);

      const member = TEAM_MEMBERS.find(m => m.id === selectedStaffId);

      if (existing) {
        setEditingShift({ ...existing, staffName: existing.staffName || member?.name });
      } else {
        // Create new draft shift
        setEditingShift({
          id: `${selectedStaffId}-${dateStr}`,
          staffId: selectedStaffId as number,
          staffName: member?.name,
          dateString: dateStr,
          type: 'morning',
          start: '08:00',
          end: '14:00'
        });
      }
      setIsEditModalOpen(true);
    } else {
      // If 'all' is selected, open modal to choose which staff member to add shift for
      setTempSelectedDate(date);
      setIsStaffSelectModalOpen(true);
    }
  };

  const handleStaffSelect = (staffId: number) => {
    if (!tempSelectedDate) return;

    const member = TEAM_MEMBERS.find(m => m.id === staffId);
    const dateStr = format(tempSelectedDate, 'yyyy-MM-dd');

    setEditingShift({
      id: `${staffId}-${dateStr}`,
      staffId: staffId,
      staffName: member?.name,
      dateString: dateStr,
      type: 'morning',
      start: '08:00',
      end: '14:00'
    });

    setIsStaffSelectModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleShiftClick = (shift: WorkShift, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent ensuring day click doesn't trigger if we click item
    const member = TEAM_MEMBERS.find(m => m.id === shift.staffId);
    setEditingShift({ ...shift, staffName: shift.staffName || member?.name });
    setIsEditModalOpen(true);
  };

  const saveShift = () => {
    if (!editingShift) return;

    // Remove old version if exists
    const filtered = shifts.filter(s => s.id !== editingShift.id);

    // Add updated version
    setShifts([...filtered, editingShift]);
    setIsEditModalOpen(false);
    setEditingShift(null);
  };

  const deleteShift = () => {
    if (!editingShift) return;
    if (confirm('Jeste li sigurni da želite obrisati ovu smjenu?')) {
      setShifts(shifts.filter(s => s.id !== editingShift.id));
      setIsEditModalOpen(false);
      setEditingShift(null);
    }
  };



  const getShiftsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (selectedStaffId === 'all') {
      return shifts.filter(s => s.dateString === dateStr);
    }
    return shifts.filter(s => s.dateString === dateStr && s.staffId === selectedStaffId);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-auto min-h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 capitalize">
            {view === 'month' ? format(currentDate, 'MMMM yyyy') :
              `Tjedan ${format(startDate, 'd.M.')} - ${format(endDate, 'd.M.yyyy')}`}
          </h2>
          <p className="text-gray-500">Upravljanje terminima i smjenama</p>
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
        </div>

        <div className="flex items-center gap-4">
          {/* Employee Filter */}
          <div className="relative">
            <select
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-purple/20 cursor-pointer"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">Svi Zaposlenici</option>
              {TEAM_MEMBERS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <Users size={16} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px mb-2 bg-gray-100 rounded-t-xl overflow-hidden">
        {['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'].map(day => (
          <div key={day} className="bg-white py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-b-xl overflow-hidden border border-gray-100 min-h-[800px]">
        {calendarDays.map((date, idx) => {
          const isToday = isSameDay(date, new Date());
          const isCurrentMonth = isSameMonth(date, monthStart);
          const dayShifts = getShiftsForDay(date);

          return (
            <div
              key={idx}
              onDoubleClick={() => handleDayClick(date)}
              className={`
                bg-white p-2 cursor-pointer transition-all hover:bg-gray-50 relative border-b border-r border-gray-100
                ${view === 'month' ? 'h-[180px]' : 'min-h-[500px]'} 
                ${!isCurrentMonth && view === 'month' ? 'opacity-30' : ''}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-primary-pink text-white' : 'text-gray-900'}`}>
                  {format(date, 'd')}
                </span>
                {selectedStaffId !== 'all' && (
                  <div className="opacity-0 hover:opacity-100 transition-opacity">
                    <Plus size={16} className="text-gray-300 hover:text-primary-purple" />
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-1 overflow-visible">
                {dayShifts
                  .sort((a, b) => a.start.localeCompare(b.start))
                  .map(shift => {
                    const member = TEAM_MEMBERS.find(m => m.id === shift.staffId);
                    if (!member) return null;

                    const isFilterMode = selectedStaffId !== 'all';
                    const isSplit = shift.type === 'split';

                    return (
                      <div
                        key={shift.id}
                        onDoubleClick={(e) => handleShiftClick(shift, e)}
                        className={`text-[10px] p-1 rounded border flex items-center gap-1 mb-1
                         ${shift.type === 'morning' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                            shift.type === 'afternoon' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              isSplit ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                'bg-gray-50 text-gray-700 border-gray-100'}
                         hover:shadow-md transition-all cursor-pointer z-10
                       `}
                        title={`${member.name}: ${shift.start} - ${shift.end}`}
                      >
                        {!isFilterMode && (
                          <div className="w-3 h-3 rounded-full overflow-hidden shrink-0">
                            <img src={member.image} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <span className="truncate font-bold block">
                            {shift.staffName || member.name.split(' ')[0]}
                          </span>
                          <span className="truncate block opacity-80">
                            {shift.start}-{shift.end}
                            {isSplit && `, ${shift.secondStart}-${shift.secondEnd}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Shift Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingShift && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-xl mb-1">
                    Uredi Smjenu
                  </h3>
                  <p className="text-gray-500 text-sm">{editingShift.dateString}</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Name Edit */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zaposlenik (Prikaz)</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-800"
                    value={editingShift.staffName || ''}
                    onChange={(e) => setEditingShift({ ...editingShift, staffName: e.target.value })}
                  />
                </div>

                {/* Shift Type Selection */}
                <div className="grid grid-cols-3 gap-2">
                  {(['morning', 'afternoon', 'split'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => {
                        let s = '08:00', e = '14:00', s2, e2;
                        if (t === 'afternoon') { s = '14:00'; e = '20:00'; }
                        if (t === 'split') { s = '08:00'; e = '12:00'; s2 = '16:00'; e2 = '20:00'; }

                        setEditingShift({
                          ...editingShift,
                          type: t,
                          start: s,
                          end: e,
                          secondStart: s2,
                          secondEnd: e2
                        });
                      }}
                      className={`py-2 rounded-lg text-sm font-bold border transition-all
                            ${editingShift.type === t
                          ? 'bg-primary-purple text-white border-primary-purple'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                          `}
                    >
                      {t === 'morning' ? 'Jutro' : t === 'afternoon' ? 'Popodne' : 'Dvokratno'}
                    </button>
                  ))}
                </div>

                {/* Time Inputs */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Početak</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50"
                      value={editingShift.start}
                      onChange={(e) => setEditingShift({ ...editingShift, start: e.target.value })}
                    />
                  </div>
                  <span className="text-gray-300 mt-5">-</span>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Kraj</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50"
                      value={editingShift.end}
                      onChange={(e) => setEditingShift({ ...editingShift, end: e.target.value })}
                    />
                  </div>
                </div>

                {/* Second Slot for Split Shift */}
                {editingShift.type === 'split' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-dashed border-gray-200">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">2. Dio Početak</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50"
                        value={editingShift.secondStart || ''}
                        onChange={(e) => setEditingShift({ ...editingShift, secondStart: e.target.value })}
                      />
                    </div>
                    <span className="text-gray-300 mt-5">-</span>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">2. Dio Kraj</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50"
                        value={editingShift.secondEnd || ''}
                        onChange={(e) => setEditingShift({ ...editingShift, secondEnd: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={deleteShift}
                    className="px-4 py-3 rounded-xl border border-red-100 text-red-500 font-bold hover:bg-red-50 transition-all"
                  >
                    Obriši
                  </button>
                  <button
                    onClick={saveShift}
                    className="flex-1 bg-primary-purple text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    Spremi Promjene
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Staff Selection Modal for New Shift */}
      <AnimatePresence>
        {isStaffSelectModalOpen && tempSelectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Odaberi Zaposlenika</h3>
                <button onClick={() => setIsStaffSelectModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {TEAM_MEMBERS.map(member => {
                  // Check if already working
                  const dateStr = format(tempSelectedDate, 'yyyy-MM-dd');
                  const isWorking = shifts.some(s => s.staffId === member.id && s.dateString === dateStr);

                  return (
                    <button
                      key={member.id}
                      onClick={() => !isWorking && handleStaffSelect(member.id)}
                      disabled={isWorking}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all
                            ${isWorking ? 'opacity-50 bg-gray-50 cursor-not-allowed' : 'hover:bg-primary-purple/5 cursor-pointer border border-transparent hover:border-primary-purple/20'}
                          `}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                        <img src={member.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-gray-800">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                      {isWorking && <span className="text-xs font-bold text-gray-400">Radi</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};







const Sidebar = ({ activeTab, setActiveTab }: { activeTab: AdminTab, setActiveTab: (t: AdminTab) => void }) => {
  const items: { id: AdminTab, label: string, icon: any }[] = [
    { id: 'calendar', label: 'Kalendar smjena', icon: CalendarIcon },
    { id: 'client-calendar', label: 'Kalendar klijenata', icon: Users },
    { id: 'staff', label: 'Zaposlenici', icon: Briefcase },
    { id: 'client-registry', label: 'Registar klijenata', icon: ClipboardList },
    { id: 'treatments', label: 'Usluge', icon: Award },
    { id: 'settings', label: 'Postavke', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 h-screen flex flex-col p-6">
      <div className="text-xl font-bold mb-12 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-purple rounded-lg flex items-center justify-center text-white text-xs">BP</div>
        <span>Admin Portal</span>
      </div>

      <nav className="space-y-2 flex-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === item.id
              ? 'bg-primary-purple text-white shadow-lg'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-8 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
            <img src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=1974" alt="User" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold">Vukica J.</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};



const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('calendar');
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);

  const handleAddClient = (client: Client) => {
    setClients([...clients, client]);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white px-10 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">Pregled {activeTab === 'calendar' ? 'Kalendara' : activeTab}</h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-primary-purple transition-colors">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-pink rounded-full" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-red-500 font-medium transition-colors"
            >
              <LogOut size={20} /> Odjavi se
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-10 overflow-y-auto">
          {activeTab === 'calendar' ? (
            <CustomCalendar />
          ) : activeTab === 'client-calendar' ? (
            <ClientCalendar staff={TEAM_MEMBERS} services={INITIAL_SERVICES} clients={clients} />
          ) : activeTab === 'staff' ? (
            <StaffManager />
          ) : activeTab === 'client-registry' ? (
            <ClientRegistry clients={clients} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} />
          ) : activeTab === 'treatments' ? (
            <ServicesManager />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <LayoutDashboard size={64} className="mx-auto mb-4 opacity-20" />
                <p>Modul "{activeTab}" je u fazi razvoja.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const TeamPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Mini Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary-purple font-bold hover:scale-105 transition-all"
          >
            <ArrowLeft size={20} /> Povratak na početnu
          </button>
          <div className="text-xl font-bold">
            <span className="text-primary-purple">Naš</span>
            <span className="text-primary-pink"> Tim</span>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-purple to-indigo-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black mb-6"
          >
            Upoznajte naše stručnjake
          </motion.h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
            Vaš oporavak je u sigurnim rukama. Naš tim čine iskusni edukatori i terapeuti
            posvećeni funkcionalnom pokretu.
          </p>
        </div>
      </section>

      {/* Team List */}
      <section className="py-24 container mx-auto px-6">
        <div className="space-y-20">
          {TEAM_MEMBERS.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col md:flex-row gap-12 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
            >
              {/* Image side */}
              <div className="w-full md:w-1/2 relative">
                <div className={`absolute -inset-4 bg-gradient-to-br ${idx % 2 === 0 ? 'from-primary-pink/20 to-primary-purple/20' : 'from-indigo-200 to-purple-200'} rounded-[3rem] blur-2xl z-0`} />
                <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/5]">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                </div>
                {idx === 0 && (
                  <div className="absolute top-8 left-8 bg-primary-pink text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest z-20 shadow-lg">
                    Osnivačica
                  </div>
                )}
              </div>

              {/* Content side */}
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <h2 className="text-4xl font-extrabold text-gray-900 mb-2">{member.name}</h2>
                  <p className="text-primary-pink font-bold text-lg">{member.role}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="text-primary-purple shrink-0 mt-1" size={24} />
                    <p className="text-gray-700 font-medium">{member.education}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="text-primary-purple shrink-0 mt-1" size={24} />
                    <div className="flex flex-wrap gap-2">
                      {member.specialty.map(s => (
                        <span key={s} className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="text-primary-purple shrink-0 mt-1" size={24} />
                    <p className="text-gray-600 leading-relaxed italic">{member.bio}</p>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button className="bg-primary-purple text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2">
                    Rezerviraj kod: {member.name.split(' ')[0]}
                  </button>
                  <button className="border border-gray-200 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all">
                    <Mail size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="bg-white py-24 border-t border-gray-100">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-8">Želite se pridružiti našem timu?</h3>
          <p className="text-gray-600 mb-10 max-w-xl mx-auto">Uvijek smo u potrazi za talentiranim fizioterapeutima koji dijele našu strast prema biomehanici i individualnom pristupu.</p>
          <button className="bg-gray-900 text-white px-10 py-4 rounded-full font-bold hover:bg-primary-pink transition-all">
            Pošalji životopis
          </button>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    setIsLoginModalOpen(false);
    setView('dashboard');
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setView('landing');
  };

  if (view === 'dashboard') {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (view === 'team') {
    return <TeamPage onBack={() => setView('landing')} />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <AnimatePresence>
        {isLoginModalOpen && (
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onLogin={handleLogin}
          />
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div
            onClick={() => setView('landing')}
            className="text-2xl font-bold flex items-center gap-2 cursor-pointer"
          >
            <span className="text-primary-purple">Biomehanika</span>
            <span className="text-primary-pink">Pokreta</span>
          </div>
          <div className="hidden md:flex gap-8 items-center font-medium">
            <button
              onClick={() => { setView('landing'); window.scrollTo(0, 0); }}
              className="hover:text-primary-pink transition-colors cursor-pointer"
            >
              Početna
            </button>
            <a href="#usluge" className="hover:text-primary-pink transition-colors">Usluge</a>
            <a href="#o-nama" className="hover:text-primary-pink transition-colors">O nama</a>
            <button
              onClick={() => setView('team')}
              className="hover:text-primary-pink transition-colors cursor-pointer"
            >
              Naš Tim
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 hover:text-primary-purple transition-colors cursor-pointer"
            >
              <LogIn size={18} /> Prijavi se
            </button>
            <button className="bg-primary-purple text-white px-5 py-2 rounded-full hover:bg-opacity-90 transition-all shadow-md active:scale-95">
              Rezerviraj termin
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070"
            alt="Physical Therapy"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-6 relative z-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-6 text-gray-900">
                Vratite pokret u <br />
                <span className="text-primary-pink">ravnotežu</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Specijalizirani centar za fizikalnu terapiju i rehabilitaciju.
                Personalizirani pristup vašem oporavku uz najmodernije tehnike biomehanike.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-primary-pink text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  Rezerviraj termin odmah
                </button>
                <button
                  onClick={() => setView('team')}
                  className="border-2 border-primary-purple text-primary-purple px-8 py-4 rounded-full text-lg font-bold hover:bg-primary-purple hover:text-white transition-all shadow-md"
                >
                  Upoznaj Tim
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Summary */}
      <section id="usluge" className="py-32 bg-gray-50">
        <div className="container mx-auto px-6 text-center mb-20">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">Naše Usluge</h2>
          <div className="w-24 h-1 bg-primary-pink mx-auto"></div>
        </div>

        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { title: 'Manualna Terapija', desc: 'Precizne tehnike ruku za smanjenje boli i poboljšanje pokretljivosti.', icon: '👐' },
            { title: 'DNS Rehabilitacija', desc: 'Dinamička neuromuskularna stabilizacija za optimalnu funkciju trupa.', icon: '🧘' },
            { title: 'Kinesiotaping', desc: 'Potpora mišićima i zglobovima kroz specijalizirane trake.', icon: '🎗️' }
          ].map((service, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-primary-pink/30 transition-all group"
            >
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform inline-block">{service.icon}</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{service.title}</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">{service.desc}</p>
              <a href="#" className="text-primary-purple font-bold flex items-center gap-3 hover:gap-5 transition-all">
                Saznaj više <ChevronRight size={20} />
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Founder Section */}
      <section id="o-nama" className="py-32 bg-white overflow-hidden">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-20">
          <div className="w-full md:w-1/2 relative">
            <div className="absolute -top-10 -left-10 w-80 h-80 bg-primary-pink/10 rounded-full blur-[100px] z-0" />
            <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-primary-purple/10 rounded-full blur-[100px] z-0" />
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl skew-y-1">
              <img
                src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=1974"
                alt="Vukica Jurišić"
                className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-1000"
              />
            </div>
            <div className="absolute bottom-10 -right-4 bg-white/90 backdrop-blur p-8 rounded-[2rem] shadow-2xl z-20 border border-white/20">
              <p className="text-primary-purple font-extrabold text-xl">Vukica Jurišić</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-tighter">Glavna fizioterapeutkinja</p>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <span className="text-primary-pink font-bold uppercase tracking-[0.2em] text-sm mb-6 block">Osnivačica</span>
            <h2 className="text-5xl md:text-6xl font-black mb-8 italic text-gray-900 leading-[1.1]">"Znanost o pokretu s individualnom brigom."</h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Biomehanika pokreta d.o.o. je mjesto gdje se znanost o pokretu susreće s individualnom brigom za pacijenta.
              Pod stručnim vodstvom osnivačice Vukice Jurišić, naš tim posvećen je otkrivanju uzroka boli, a ne samo tretiranju simptoma.
            </p>
            <div className="grid grid-cols-2 gap-12 mb-10 text-center md:text-left">
              <div>
                <p className="text-5xl font-black text-primary-purple">10+</p>
                <p className="text-gray-500 font-medium">Godina iskustva</p>
              </div>
              <div>
                <p className="text-5xl font-black text-primary-purple">5000+</p>
                <p className="text-gray-500 font-medium">Sretnih klijenata</p>
              </div>
            </div>
            <button
              onClick={() => setView('team')}
              className="bg-primary-purple text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all"
            >
              Upoznaj cijeli tim
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="text-3xl font-bold mb-8">
                <span className="text-white">Biomehanika</span>
                <span className="text-primary-pink">Pokreta</span>
              </div>
              <p className="text-gray-400 max-w-sm mb-8 text-lg">
                Vodeći stručnjaci za fizioterapiju u regiji. Naša misija je vaš bezbolan i funkcionalan pokret.
              </p>
              <div className="flex gap-6">
                {['Facebook', 'Instagram', 'LinkedIn'].map(social => (
                  <a key={social} href="#" className="p-3 bg-white/5 rounded-full hover:bg-primary-pink transition-all">
                    <span className="sr-only">{social}</span>
                    <div className="w-6 h-6 border-2 border-white/20 rounded-md" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xl mb-8">Kontakt</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-center gap-3">📍 Zagreb, Hrvatska</li>
                <li className="flex items-center gap-3">📞 +385 1 2345 678</li>
                <li className="flex items-center gap-3">📧 info@biomehanika-pokreta.hr</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xl mb-8">Informacije</h4>
              <ul className="space-y-4 text-gray-400">
                <li>MBS: 12345678</li>
                <li>OIB: 87654321098</li>
                <li className="text-primary-pink font-bold mt-6">Pravila otkazivanja:</li>
                <li className="text-sm italic">Molimo otkazati minimalno 24h ranije.</li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/10 text-center text-gray-500">
            &copy; {new Date().getFullYear()} Biomehanika pokreta d.o.o. Sva prava pridržana.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
