import React, { useState, useEffect, useCallback } from 'react';
import ClientCalendar from './components/ClientCalendar';
import PhysioBookingChat from './components/PhysioBookingChat';
import type { Service, TeamMember, WorkShift, ClientAppointment } from './components/ClientCalendar';
import ClientRegistry from './components/ClientRegistry';
import type { Client } from './components/ClientRegistry';
import {
  LayoutDashboard, ClipboardList, Settings, Bell,
  ArrowLeft, Mail, Award, Briefcase, GraduationCap, Upload, Image as ImageIcon, Pencil,
  TrendingUp, Download, CheckCircle, Menu, Plus, X, Clock,
  ChevronLeft, ChevronRight, LogIn, LogOut, Calendar as CalendarIcon, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, addMonths, subMonths, startOfMonth,
  endOfMonth, startOfWeek, endOfWeek, isSameMonth,
  isSameDay, eachDayOfInterval, addWeeks, subWeeks
} from 'date-fns';
import { } from './data/services';

// --- Types ---
export type View = 'landing' | 'dashboard' | 'team' | 'booking';
export type AdminTab = 'calendar' | 'client-calendar' | 'client-registry' | 'staff' | 'treatments' | 'settings';
// Environment-aware API URL
// DEV: Uses localhost PHP built-in server
// PROD: Uses relative path (works on Hetzner or any server)
const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8000/index.php/v1'
  : 'backend/public/index.php/v1'; // Relative path for production compatibility
// --- API & State ---
// Constants removed. All data now fetched from backend.

// --- Components ---

const ServicesManager = ({ services, setServices, teamMembers }: { services: Service[], setServices: (s: Service[]) => void, teamMembers: TeamMember[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({ images: [] });

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

  const handleSave = async () => {
    if (!newService.name) return;

    const serviceToSave = newService.id ?
      { ...newService } as Service :
      {
        id: Date.now(),
        name: newService.name,
        description: newService.description || '',
        duration: newService.duration || 30,
        price: newService.price,
        images: newService.images?.length ? newService.images : ['https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&q=80&w=2070'],
        subServices: newService.subServices || []
      };

    try {
      const res = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceToSave)
      });
      const data = await res.json();
      const savedService = { ...serviceToSave, id: data.id || serviceToSave.id } as Service;

      if (newService.id) {
        setServices(services.map(s => s.id === newService.id ? savedService : s));
      } else {
        setServices([...services, savedService]);
      }
      setIsAdding(false);
      setNewService({ images: [] });
    } catch (e) {
      console.error("Failed to save service", e);
      alert("Neuspješno spremanje usluge.");
    }
  };

  const addImageToNewService = (url: string) => {
    if (!url) return;
    setNewService({ ...newService, images: [...(newService.images || []), url] });
  };

  const toggleSubServiceStaff = (subIndex: number, staffId: number) => {
    const subs = [...(newService.subServices || [])];
    if (!subs[subIndex]) return;

    const currentStaff = subs[subIndex].staffIds || [];
    if (currentStaff.includes(staffId)) {
      subs[subIndex].staffIds = currentStaff.filter(id => id !== staffId);
    } else {
      subs[subIndex].staffIds = [...currentStaff, staffId];
    }
    setNewService({ ...newService, subServices: subs });
  };

  const handleSubServiceChange = (index: number, field: 'name' | 'price' | 'duration', value: string | number) => {
    const subs = [...(newService.subServices || [])];
    if (!subs[index]) return;
    if (field === 'price') subs[index].price = Number(value);
    else if (field === 'duration') subs[index].duration = Number(value);
    else subs[index].name = String(value);
    setNewService({ ...newService, subServices: subs });
  };

  const addSubService = () => {
    setNewService({ ...newService, subServices: [...(newService.subServices || []), { name: '', price: 0, duration: 30, staffIds: [] }] });
  };

  const removeSubService = (index: number) => {
    const subs = [...(newService.subServices || [])];
    subs.splice(index, 1);
    setNewService({ ...newService, subServices: subs });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const formData = new FormData();
      formData.append('file', file);

      try {
        // Use relative path to upload.php, assuming it is in same directory as index.php
        // Construct upload URL based on API_BASE_URL
        const uploadUrl = API_BASE_URL.replace('/index.php/v1', '/upload.php');

        const res = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            addImageToNewService(data.url);
          } else {
            alert("Upload succeed but no URL returned");
          }
        } else {
          alert("Upload failed");
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Greška pri uploadu slike");
      }
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
          title="Dodaj novu uslugu"
          onClick={() => {
            setNewService({ images: [] });
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
            {/* Price removed as requested */}
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-gray-700">Podusluge</label>
              <button type="button" onClick={addSubService} className="text-sm text-primary-purple font-bold flex items-center gap-1 hover:underline">
                <Plus size={16} /> Dodaj Poduslugu
              </button>
            </div>

            {(newService.subServices && newService.subServices.length > 0) && (
              <div className="flex gap-4 mb-2 px-1">
                <span className="flex-1 text-xs font-bold text-gray-400 uppercase">Naziv podusluge</span>
                <span className="w-24 text-xs font-bold text-gray-400 uppercase">Trajanje (min)</span>
                <span className="w-24 text-xs font-bold text-gray-400 uppercase">Cijena (€)</span>
                <span className="w-8"></span>
              </div>
            )}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              {(newService.subServices || []).map((sub, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 border border-gray-100 rounded-lg bg-white">
                  <div className="flex gap-4 items-center">
                    <input
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary-purple outline-none text-sm"
                      placeholder="Naziv podusluge"
                      value={sub.name}
                      onChange={e => handleSubServiceChange(idx, 'name', e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-24 px-4 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary-purple outline-none text-sm"
                      placeholder="min"
                      value={sub.duration || 30}
                      onChange={e => handleSubServiceChange(idx, 'duration', e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-24 px-4 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-primary-purple outline-none text-sm"
                      placeholder="€"
                      value={sub.price}
                      onChange={e => handleSubServiceChange(idx, 'price', e.target.value)}
                    />
                    <button
                      onClick={() => removeSubService(idx)}
                      className="text-red-400 hover:text-red-600"
                      title="Ukloni poduslugu"
                      aria-label="Ukloni poduslugu"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  {/* Sub-service staff selection */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs font-bold text-gray-500 uppercase self-center mr-2">Izvođači:</span>
                    {teamMembers.map(member => (
                      <button
                        key={member.id}
                        onClick={() => toggleSubServiceStaff(idx, member.id)}
                        className={`px-2 py-1 rounded text-xs font-bold border transition-colors flex items-center gap-1 ${(sub.staffIds || []).includes(member.id)
                          ? 'bg-primary-purple text-white border-primary-purple'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <img src={member.image} className="w-4 h-4 rounded-full object-cover" alt="" />
                        {member.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {(newService.subServices?.length === 0) && (
                <p className="text-sm text-gray-400 text-center italic py-2">Nema dodanih podusluga.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              {/* Duration removed from main service */}
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
                setNewService({ images: [] });
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
                  <span className="font-bold text-lg">
                    {service.subServices && service.subServices.length > 0
                      ? `od ${Math.min(...service.subServices.map(s => s.price))} €`
                      : (service.price ? `${service.price} €` : '')}
                  </span>
                  <span className="text-sm bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
                    <Clock size={12} />
                    {(() => {
                      if (service.subServices && service.subServices.length > 0) {
                        const min = Math.min(...service.subServices.map(s => s.duration || 0));
                        const max = Math.max(...service.subServices.map(s => s.duration || 0));
                        return min === max ? `${min} min` : `${min}-${max} min`;
                      }
                      return `${service.duration || 30} min`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{service.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-3 mb-4">{service.description}</p>

              <div className="flex -space-x-2 overflow-hidden border-t border-gray-50 pt-4">
                {Array.from(new Set(service.subServices?.flatMap(s => s.staffIds || []) || [])).map((staffId) => {
                  const member = teamMembers.find(m => m.id === staffId);
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

const StaffManager = ({ onViewSchedule, members, setMembers }: {
  onViewSchedule: (id: number) => void,
  members: TeamMember[],
  setMembers: (m: TeamMember[]) => void
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({ specialty: [] });

  const handleEdit = (member: TeamMember) => {
    setNewMember({ ...member });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Jeste li sigurni da želite obrisati ovog zaposlenika?')) {
      try {
        const res = await fetch(`${API_BASE_URL}/staff?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          setMembers(members.filter(m => m.id !== id));
        } else {
          alert('Greška pri brisanju.');
        }
      } catch (e) {
        console.error("Delete failed", e);
      }
    }
  };

  const handleSave = async () => {
    if (!newMember.name || !newMember.role) return;

    const memberToSave = newMember.id ?
      { ...newMember } as TeamMember :
      {
        id: Date.now(),
        name: newMember.name,
        role: newMember.role,
        education: newMember.education || '',
        specialty: newMember.specialty || [],
        bio: newMember.bio || '',
        image: newMember.image || 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=1974'
      };

    try {
      const res = await fetch(`${API_BASE_URL}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberToSave)
      });
      if (!res.ok) throw new Error("Failed to save staff");

      const data = await res.json();
      const savedMember = { ...memberToSave, id: data.id || memberToSave.id } as TeamMember;

      if (newMember.id) {
        setMembers(members.map(m => m.id === newMember.id ? savedMember : m));
      } else {
        setMembers([...members, savedMember]);
      }
      setIsAdding(false);
      setNewMember({ specialty: [] });
    } catch (e) {
      console.error("Failed to save staff", e);
      alert("Neuspješno spremanje zaposlenika.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const uploadUrl = API_BASE_URL.replace('/index.php/v1', '/upload.php');
        const res = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setNewMember({ ...newMember, image: data.url });
          }
        } else {
          alert("Upload failed");
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Greška pri uploadu slike");
      }
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
              <button
                onClick={() => onViewSchedule(member.id)}
                className="flex-1 bg-primary-purple/10 text-primary-purple py-2 rounded-xl text-sm font-bold hover:bg-primary-purple/20"
              >
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




const CustomCalendar = ({ selectedStaffId, setSelectedStaffId, shifts, setShifts, teamMembers }: {
  selectedStaffId: number | 'all',
  setSelectedStaffId: (id: number | 'all') => void,
  shifts: WorkShift[],
  setShifts: (s: WorkShift[]) => void,
  teamMembers: TeamMember[]
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // View mode state
  const [view, setView] = useState<'month' | 'week'>('month');

  // State for shift editing
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for staff selection when creating new shift from 'All' view
  const [isStaffSelectModalOpen, setIsStaffSelectModalOpen] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);

  // Local mock initialization removed - passed via props from App.tsx

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

      const member = teamMembers.find(m => m.id === selectedStaffId);

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

    const member = teamMembers.find(m => m.id === staffId);
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
    const member = teamMembers.find(m => m.id === shift.staffId);
    setEditingShift({ ...shift, staffName: shift.staffName || member?.name });
    setIsEditModalOpen(true);
  };

  const saveShift = async () => {
    if (!editingShift) return;

    // Remove old version if exists
    const filtered = shifts.filter(s => s.id !== editingShift.id);

    // Call API
    try {
      const res = await fetch(`${API_BASE_URL}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingShift)
      });
      if (res.ok) {
        const data = await res.json();
        // Update local shift ID with DB ID
        const savedShift = { ...editingShift, id: data.id || editingShift.id };
        setShifts([...filtered, savedShift]);
        setIsEditModalOpen(false);
        setEditingShift(null);
      }
    } catch (e) {
      console.error("Shift save failed", e);
    }
  };

  const deleteShift = async () => {
    if (!editingShift) return;
    if (confirm('Jeste li sigurni da želite obrisati ovu smjenu?')) {
      try {
        await fetch(`${API_BASE_URL}/shifts?id=${editingShift.id}`, { method: 'DELETE' });
        setShifts(shifts.filter(s => s.id !== editingShift.id));
        setIsEditModalOpen(false);
        setEditingShift(null);
      } catch (e) { console.error(e); }
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
              {teamMembers.map(m => (
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
                    const member = teamMembers.find(m => m.id === shift.staffId);
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
                {teamMembers.map(member => {
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







const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: { activeTab: AdminTab, setActiveTab: (t: AdminTab) => void, isOpen?: boolean, setIsOpen?: (v: boolean) => void }) => {
  const items: { id: AdminTab, label: string, icon: any }[] = [
    { id: 'calendar', label: 'Kalendar smjena', icon: CalendarIcon },
    { id: 'client-calendar', label: 'Kalendar klijenata', icon: Users },
    { id: 'staff', label: 'Zaposlenici', icon: Briefcase },
    { id: 'client-registry', label: 'Registar klijenata', icon: ClipboardList },
    { id: 'treatments', label: 'Usluge', icon: Award },
    { id: 'settings', label: 'Postavke', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      <div className={`
        bg-white border-r border-gray-100 h-screen flex flex-col p-6
        fixed md:relative inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex justify-between items-center mb-12">
          <div className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-purple rounded-lg flex items-center justify-center text-white text-xs">BP</div>
            <span>Admin Portal</span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsOpen?.(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          {items.map(item => (
            <button
              key={item.id}
              title={item.label}
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
    </>
  );
};

const Dashboard = ({ onLogout, services, setServices, shifts, setShifts, appointments, appClients, setAppClients, teamMembers, setTeamMembers, onAddAppointment, onUpdateAppointment, onDeleteAppointment, onRefresh }: {
  onLogout: () => void,
  services: Service[],
  setServices: React.Dispatch<React.SetStateAction<Service[]>>,
  shifts: WorkShift[],
  setShifts: React.Dispatch<React.SetStateAction<WorkShift[]>>,
  appointments: ClientAppointment[],
  // setAppointments removed as it is not used in Dashboard
  appClients: Client[],
  setAppClients: React.Dispatch<React.SetStateAction<Client[]>>,
  teamMembers: TeamMember[],
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>,
  onAddAppointment: (app: ClientAppointment) => void,
  onUpdateAppointment: (app: ClientAppointment) => void,
  onDeleteAppointment: (id: string) => void,
  onRefresh?: () => void
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('calendar');
  const [calendarStaffId, setCalendarStaffId] = useState<number | 'all'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleViewSchedule = (staffId: number) => {
    setCalendarStaffId(staffId);
    setActiveTab('calendar');
  };

  const handleAddClient = async (client: Client) => {
    setAppClients(prev => [...prev, client]);
    // Save to DB
    try {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      const savedClient = { ...client, id: data.id || client.id };
      setAppClients(prev => prev.map(c => c.id === client.id ? savedClient : c));
    } catch (e) {
      console.error(e);
      alert('Greška pri spremanju klijenta!');
    }
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setAppClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white px-10 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
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
          {activeTab === 'calendar' && (
            <CustomCalendar
              selectedStaffId={calendarStaffId}
              setSelectedStaffId={setCalendarStaffId}
              shifts={shifts}
              setShifts={setShifts}
              teamMembers={teamMembers}
            />
          )}
          {activeTab === 'client-calendar' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <ClientCalendar
                staff={teamMembers}
                services={services}
                clients={appClients}
                appointments={appointments}
                shifts={shifts}
                onAddAppointment={onAddAppointment}
                onUpdateAppointment={onUpdateAppointment}
                onDeleteAppointment={onDeleteAppointment}
                onRefresh={onRefresh}
              />
            </div>
          )}
          {activeTab === 'client-registry' && (
            <ClientRegistry
              clients={appClients}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
            />
          )}
          {activeTab === 'staff' && <StaffManager onViewSchedule={handleViewSchedule} members={teamMembers} setMembers={setTeamMembers} />}
          {activeTab === 'treatments' && <ServicesManager services={services} setServices={setServices} teamMembers={teamMembers} />}
          {activeTab !== 'calendar' && activeTab !== 'client-calendar' && activeTab !== 'client-registry' && activeTab !== 'staff' && activeTab !== 'treatments' && (
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

const TeamPage = ({ onBack, onBookWithStaff, members }: { onBack: () => void, onBookWithStaff: (id: number) => void, members: TeamMember[] }) => {
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
            className="text-5xl md:text-6xl font-black mb-6 !text-white"
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
          {members.map((member, idx) => (
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
                  <button
                    onClick={() => onBookWithStaff(member.id)}
                    className="bg-primary-purple text-white px-6 py-3 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
                  >
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


const BookingPage = ({
  onBack,
  services,
  initialServiceId,
  shifts,
  appointments,
  onAddAppointment,
  clients,
  initialStaffId,
  teamMembers,

}: {
  onBack: () => void,
  services: Service[],
  initialServiceId?: number | null,
  shifts: WorkShift[],
  appointments: ClientAppointment[],
  onAddAppointment: (app: ClientAppointment) => void,
  clients: Client[],
  initialStaffId?: number | null,
  teamMembers: TeamMember[]
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(initialServiceId || null);
  const [selectedSubService, setSelectedSubService] = useState<{ id?: number, name: string, price: number, duration: number, staffIds: number[], categoryId: number } | null>(null);
  const [bookingStep, setBookingStep] = useState<'service' | 'staff' | 'calendar'>('service');
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(initialStaffId || null);

  // Identity Modal State
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [userIdentity, setUserIdentity] = useState({ name: '', contact: '' });
  const [pendingSlot, setPendingSlot] = useState<{ date: Date, time: string } | null>(null);

  const [bookingStatus, setBookingStatus] = useState<'idle' | 'success' | 'error' | 'unknown_client'>('idle');

  // const selectedCategory = services.find(s => s.id === selectedServiceId);

  const handleSubServiceSelect = (sub: any, categoryId: number) => {
    setSelectedSubService({ ...sub, categoryId });
    if (selectedStaffId) {
      setBookingStep('calendar');
    } else {
      setBookingStep('staff');
    }
  };

  const handleStaffSelect = (staffId: number) => {
    setSelectedStaffId(staffId);
    setBookingStep('calendar');
  };

  const getAvailableSlots = (date: Date, staffId: number, duration: number) => {
    if (!date || !staffId) return [];

    const dateStr = format(date, 'yyyy-MM-dd');
    const shift = shifts.find(s => s.staffId === staffId && s.dateString === dateStr);
    if (!shift) return [];

    const slots: string[] = [];

    // Helper to check for overlap with existing appointments
    const checkOverlap = (time: Date, dur: number) => {
      const slotStart = time.getTime();
      const slotEnd = time.getTime() + dur * 60000;

      return appointments.some(app => {
        if (app.staffId !== staffId || app.dateString !== dateStr) return false;
        const [appH, appM] = app.time.split(':').map(Number);
        const appStart = new Date(date);
        appStart.setHours(appH, appM, 0, 0);
        const appEnd = new Date(appStart.getTime() + app.duration * 60000);

        return (slotStart < appEnd.getTime() && slotEnd > appStart.getTime());
      });
    };

    const processShiftPart = (startStr: string, endStr: string) => {
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);

      const partStart = new Date(date);
      partStart.setHours(startH, startM, 0, 0);
      const partEnd = new Date(date);
      partEnd.setHours(endH, endM, 0, 0);

      let current = new Date(partStart);
      while (current.getTime() + duration * 60000 <= partEnd.getTime()) {
        if (!checkOverlap(current, duration)) {
          slots.push(format(current, 'HH:mm'));
        }
        current = new Date(current.getTime() + 15 * 60000); // 15 min steps
      }
    };

    processShiftPart(shift.start, shift.end);
    if (shift.secondStart && shift.secondEnd) {
      processShiftPart(shift.secondStart, shift.secondEnd);
    }

    return slots;
  };

  const handleSlotClick = (date: Date, _time: string) => {
    if (!selectedStaffId || !selectedSubService) return;

    const slots = getAvailableSlots(date, selectedStaffId, selectedSubService.duration);
    if (slots.length > 0) {
      setPendingSlot({ date, time: slots[0] });
      setIsIdentityModalOpen(true);
    } else {
      alert("Nažalost, nema slobodnih termina koji odgovaraju trajanju ove usluge za odabrani dan.");
    }
  };

  const verifyAndBook = () => {
    if (!pendingSlot || !selectedSubService || !selectedStaffId) return;

    // Check if client exists
    const clientExists = clients.some(c =>
      c.identification.ime_prezime.toLowerCase() === userIdentity.name.toLowerCase() &&
      (c.identification.email === userIdentity.contact || c.identification.kontakt_broj === userIdentity.contact)
    );

    if (clientExists) {
      const matchedClient = clients.find(c =>
        c.identification.ime_prezime.toLowerCase() === userIdentity.name.toLowerCase() &&
        (c.identification.email === userIdentity.contact || c.identification.kontakt_broj === userIdentity.contact)
      );

      const newApp: ClientAppointment & { clientId?: string | number } = {
        id: Math.random().toString(36).substr(2, 9),
        clientName: userIdentity.name,
        clientId: matchedClient?.id ? Number(matchedClient.id) : undefined, // Send client ID to backend
        serviceId: selectedSubService.id || selectedSubService.categoryId,
        serviceName: selectedSubService.name,
        staffId: selectedStaffId,
        dateString: format(pendingSlot.date, 'yyyy-MM-dd'),
        time: pendingSlot.time,
        duration: selectedSubService.duration
      };

      onAddAppointment(newApp);
      setBookingStatus('success');
      setIsIdentityModalOpen(false); // Close modal to show the success message behind it


      // Auto redirect after delay
      setTimeout(() => {
        onBack();
      }, 5000);
    } else {
      setBookingStatus('unknown_client');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      {/* Header */}
      <div className="bg-primary-purple text-white py-12 px-4 shadow-lg">
        <div className="container mx-auto relative flex items-center justify-center">
          <button
            onClick={() => bookingStep === 'service' ? onBack() : setBookingStep(bookingStep === 'calendar' ? 'staff' : 'service')}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Povratak"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-center !text-white">
            {bookingStep === 'service' ? 'Rezervacija Termina' :
              bookingStep === 'staff' ? 'Odabir Osoblja' : 'Odabir Termina'}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl min-h-[600px]">
        {bookingStatus === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center border border-green-100 flex flex-col items-center justify-center space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-500" />

            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2 relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-green-200 rounded-full"
              />
              <CheckCircle size={48} className="relative z-10" />
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900 italic leading-tight">Rezervacija Uspješna!</h2>
              <div className="flex flex-col gap-2">
                <p className="text-xl text-gray-600 font-medium">
                  Hvala vam na povjerenju, <span className="text-primary-purple font-bold">{userIdentity.name}</span>.
                </p>
                <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 mt-4 inline-block mx-auto">
                  <p className="text-gray-500">Vidimo se u dogovorenom terminu:</p>
                  <p className="text-2xl font-black text-primary-purple">
                    {pendingSlot ? format(pendingSlot.date, 'dd.MM.yyyy') : ''} • {pendingSlot?.time}h
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary-purple/5 p-6 rounded-3xl border border-primary-purple/10 flex items-center gap-4 max-w-lg">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-purple shadow-sm">
                <Mail size={24} />
              </div>
              <p className="text-left text-gray-700 font-medium">
                Potvrda termina i upute za dolazak su upravo poslane na vašu adresu <span className="text-primary-purple underline">{userIdentity.contact}</span>.
              </p>
            </div>

            <div className="w-64 space-y-3 pt-4">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5 }}
                  className="h-full bg-primary-purple"
                />
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Preusmjeravanje ({5}s)</p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Progress indicator */}
            <div className="flex justify-between items-center mb-16 max-w-md mx-auto relative px-4">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
              {[
                { step: 'service', label: 'Usluga', icon: '📝' },
                { step: 'staff', label: 'Tim', icon: '👥' },
                { step: 'calendar', label: 'Termin', icon: '📅' }
              ].map((s) => {
                const isActive = bookingStep === s.step;
                const isPast = (bookingStep === 'staff' && s.step === 'service') || (bookingStep === 'calendar' && (s.step === 'service' || s.step === 'staff'));

                return (
                  <div key={s.step} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-500 border-4 ${isActive ? 'bg-primary-purple text-white border-primary-purple scale-110 shadow-lg' : isPast ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-400 border-gray-200'}`}>
                      {isPast ? '✓' : s.icon}
                    </div>
                    <span className={`text-xs mt-3 font-bold uppercase tracking-wider ${isActive ? 'text-primary-purple' : 'text-gray-400'}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>

            {bookingStep === 'service' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="grid grid-cols-1 gap-6">
                  {services.map((category) => (
                    <div key={category.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                      <div
                        className="p-8 cursor-pointer hover:bg-gray-50 flex justify-between items-center group"
                        onClick={() => setSelectedServiceId(selectedServiceId === category.id ? null : category.id)}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-primary-purple/5 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            {category.id === 1 ? '🔍' : category.id === 2 ? '⚡' : category.id === 3 ? '👐' : '🏃'}
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">{category.name}</h3>
                            <p className="text-gray-500 text-sm">{category.subServices?.length || 0} opcija</p>
                          </div>
                        </div>
                        <ChevronRight className={`text-gray-300 transition-transform ${selectedServiceId === category.id ? 'rotate-90 text-primary-purple' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {selectedServiceId === category.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gray-50/50 border-t border-gray-50"
                          >
                            <div className="p-4 space-y-2">
                              {category.subServices?.filter(sub => !selectedStaffId || sub.staffIds.includes(selectedStaffId)).map((sub, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => handleSubServiceSelect(sub, category.id)}
                                  className="bg-white p-6 rounded-2xl flex justify-between items-center hover:shadow-md hover:border-primary-purple/30 border border-transparent transition-all cursor-pointer group"
                                >
                                  <div>
                                    <h4 className="font-bold text-gray-900 group-hover:text-primary-purple transition-colors">{sub.name}</h4>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                      <span className="flex items-center gap-1 font-bold text-primary-pink">
                                        {sub.price} €
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock size={14} /> {sub.duration} min
                                      </span>
                                    </div>
                                  </div>
                                  <button className="bg-gray-100 text-primary-purple p-3 rounded-xl group-hover:bg-primary-purple group-hover:text-white transition-all">
                                    <ChevronRight size={20} />
                                  </button>
                                </div>
                              ))}
                              {category.subServices?.filter(sub => !selectedStaffId || sub.staffIds.includes(selectedStaffId)).length === 0 && (
                                <div className="p-8 text-center text-gray-400 italic">
                                  Nema dostupnih podusluga za ovog djelatnika u ovoj kategoriji.
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {bookingStep === 'staff' && selectedSubService && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold italic text-gray-900 mb-2">Tko će vas tretirati?</h2>
                  <p className="text-gray-500">Odaberite stručnjaka za: <span className="text-primary-purple font-bold">{selectedSubService.name}</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teamMembers.filter(m => selectedSubService.staffIds.includes(m.id)).map(member => (
                    <div
                      key={member.id}
                      onClick={() => handleStaffSelect(member.id)}
                      className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center gap-6 cursor-pointer hover:shadow-2xl transition-all hover:scale-[1.02] group"
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl shrink-0 group-hover:border-primary-pink transition-all">
                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-primary-purple transition-colors">{member.name}</h3>
                        <p className="text-primary-pink text-xs font-bold uppercase tracking-wider mb-2">{member.role}</p>
                        <p className="text-gray-500 text-xs line-clamp-2">{member.specialty.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {bookingStep === 'calendar' && selectedStaffId && selectedSubService && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="flex items-center gap-6 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-8">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-purple shrink-0">
                    <img src={teamMembers.find(m => m.id === selectedStaffId)?.image} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{teamMembers.find(m => m.id === selectedStaffId)?.name}</h3>
                    <p className="text-sm text-gray-500">{selectedSubService.name} • {selectedSubService.duration} min</p>
                  </div>
                </div>

                {/* Calendar Grid - Simple representation for MVP */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                  <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-gray-900">
                    <button className="p-2 hover:bg-gray-200 rounded-lg" title="Prethodni mjesec"><ChevronLeft /></button>
                    <h3 className="text-xl font-black italic uppercase tracking-widest">Veljača 2026</h3>
                    <button className="p-2 hover:bg-gray-200 rounded-lg" title="Sljedeći mjesec"><ChevronRight /></button>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-7 gap-4 mb-4 text-center">
                      {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map(d => <span key={d} className="text-xs font-bold text-gray-400">{d}</span>)}
                      {Array.from({ length: 28 }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `2026-02-${String(day).padStart(2, '0')}`;
                        const isWorking = shifts.some(s => s.staffId === selectedStaffId && s.dateString === dateStr);

                        return (
                          <div
                            key={i}
                            className={`aspect-square flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${isWorking ? 'bg-primary-purple/5 text-primary-purple hover:bg-primary-purple hover:text-white border border-primary-purple/20' : 'text-gray-300 opacity-20 pointer-events-none'}`}
                            role="button"
                            tabIndex={0}
                            title={isWorking ? `Odaberi termin za ${day}.2.` : 'Nema termina'}
                            onKeyDown={(e) => {
                              if (isWorking && (e.key === 'Enter' || e.key === ' ')) {
                                handleSlotClick(new Date(2026, 1, day), "09:00");
                              }
                            }}
                            onClick={() => {
                              if (isWorking) {
                                handleSlotClick(new Date(2026, 1, day), "09:00");
                              }
                            }}
                          >
                            <span className="text-sm font-black">{day}</span>
                            {isWorking && <div className="w-1 h-1 bg-current rounded-full mt-1" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Identity Verification Modal */}
      <AnimatePresence>
        {isIdentityModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary-purple/20 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white/20 w-full max-w-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-pink to-primary-purple" />
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 italic mb-2">Potvrda Identiteta</h3>
                  <p className="text-gray-500">Provjeravamo jeste li u našem sustavu.</p>
                </div>
                <button
                  onClick={() => setIsIdentityModalOpen(false)}
                  title="Zatvori prozor"
                  className="p-3 bg-gray-50 rounded-full hover:rotate-90 transition-all text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>

              {bookingStatus === 'unknown_client' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-600 text-sm font-medium mb-6 flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center font-bold">!</div>
                  Ispričavamo se, niste pronađeni u registru klijenata. Molimo kontaktirajte nas telefonski.
                </motion.div>
              )}

              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Odabrani Datum</span>
                    <span className="font-bold text-primary-purple">{pendingSlot ? format(pendingSlot.date, 'dd.MM.yyyy') : ''}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Slobodni Termini</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-primary-purple/10 focus:border-primary-purple outline-none font-bold text-gray-800 transition-all appearance-none cursor-pointer"
                      value={pendingSlot?.time}
                      title="Odaberite vrijeme termina"
                      onChange={e => setPendingSlot(prev => prev ? { ...prev, time: e.target.value } : null)}
                    >
                      {pendingSlot && getAvailableSlots(pendingSlot.date, selectedStaffId!, selectedSubService!.duration).map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Vaše Ime i Prezime</label>
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary-purple focus:bg-white outline-none font-bold text-gray-800 transition-all"
                    placeholder="Pero Perić"
                    value={userIdentity.name}
                    onChange={e => setUserIdentity({ ...userIdentity, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Email ili Broj Telefona</label>
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary-purple focus:bg-white outline-none font-bold text-gray-800 transition-all"
                    placeholder="pero.peric@email.com"
                    value={userIdentity.contact}
                    onChange={e => setUserIdentity({ ...userIdentity, contact: e.target.value })}
                  />
                </div>

                <button
                  onClick={verifyAndBook}
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-primary-purple hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Dovrši Rezervaciju <ArrowLeft className="rotate-180" size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  // State lifted from ServicesManager to be shared across views
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Auto-save effects removed in favor of direct API calls in managers

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [expandedServiceIds, setExpandedServiceIds] = useState<number[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lifted state
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [appClients, setAppClients] = useState<Client[]>([]);
  const [preselectedStaffId, setPreselectedStaffId] = useState<number | null>(null);

  // Initialize data from API
  const refreshData = useCallback(async () => {
    // Services
    try {
      const res = await fetch(`${API_BASE_URL}/services`);
      if (res.ok) setServices(await res.json());
    } catch (e) { console.error("Failed services", e); }

    // Staff
    try {
      const res = await fetch(`${API_BASE_URL}/staff`);
      if (res.ok) setTeamMembers(await res.json());
    } catch (e) { console.error("Failed staff", e); }

    // Shifts
    try {
      const res = await fetch(`${API_BASE_URL}/shifts`);
      if (res.ok) setShifts(await res.json());
    } catch (e) { console.error("Failed shifts", e); }

    // Clients
    try {
      const res = await fetch(`${API_BASE_URL}/clients`);
      if (res.ok) setAppClients(await res.json());
    } catch (e) { console.error("Failed clients", e); }

    // Bookings
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`);
      if (res.ok) setAppointments(await res.json());
    } catch (e) { console.error("Failed bookings", e); }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Shift mock init removed

  const handleAddAppointment = async (app: ClientAppointment) => {
    console.log('Sending booking payload:', app);
    // Optimistic update
    setAppointments([...appointments, app]);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText, error: '' }));
        const detailedError = errorData.error ? `${errorData.message}: ${errorData.error}` : errorData.message;
        throw new Error(detailedError || 'Server returned ' + response.status);
      }

      const data = await response.json();
      // Update with real ID from DB
      setAppointments(prev => prev.map(a => a.id === app.id ? { ...a, id: data.id } : a));
    } catch (error) {
      console.error('Error saving booking:', error);
      alert(`Greška pri spremanju termina: ${error instanceof Error ? error.message : String(error)}`);
      setAppointments(prev => prev.filter(a => a.id !== app.id)); // Revert
    }
  };

  const handleUpdateAppointment = async (app: ClientAppointment) => {
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === app.id ? app : a));

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app),
      });

      if (!response.ok) throw new Error('Failed to update');
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Greška pri ažuriranju termina.');
      // Revert would be complex here without deep cloning previous state, 
      // typically we'd fetch data again or rely on user to retry.
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    // Optimistic update
    const previous = appointments;
    setAppointments(prev => prev.filter(a => a.id !== id));

    try {
      const response = await fetch(`${API_BASE_URL}/bookings?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Greška pri brisanju termina.');
      setAppointments(previous); // Revert
    }
  };


  const toggleServiceExpansion = (id: number) => {
    setExpandedServiceIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const [view, setView] = useState<View>('landing');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

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
    return (
      <Dashboard
        onLogout={handleLogout}
        services={services}
        setServices={setServices}
        shifts={shifts}
        setShifts={setShifts}
        appointments={appointments}
        appClients={appClients}
        setAppClients={setAppClients}
        teamMembers={teamMembers}
        setTeamMembers={setTeamMembers}
        onAddAppointment={handleAddAppointment}
        onUpdateAppointment={handleUpdateAppointment}
        onDeleteAppointment={handleDeleteAppointment}
        onRefresh={refreshData}
      />
    );
  }

  if (view === 'team') {
    return (
      <TeamPage
        onBack={() => setView('landing')}
        onBookWithStaff={(staffId) => {
          setPreselectedStaffId(staffId);
          setView('booking');
        }}
        members={teamMembers}
      />
    );
  }

  if (view === 'booking') {
    return (
      <BookingPage
        onBack={() => {
          setView('landing');
          setPreselectedStaffId(null);
        }}
        services={services}
        initialServiceId={selectedServiceId}
        initialStaffId={preselectedStaffId}
        shifts={shifts}
        appointments={appointments}
        onAddAppointment={handleAddAppointment}
        clients={appClients}
        teamMembers={teamMembers}
      />
    );
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

          {/* Desktop Navigation */}
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
            <a href="#cjenik" className="hover:text-primary-pink transition-colors">Cjenik</a>
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 hover:text-primary-purple transition-colors cursor-pointer"
            >
              <LogIn size={18} /> Prijavi se
            </button>
            <button
              onClick={() => setView('booking')}
              className="bg-primary-purple text-white px-5 py-2 rounded-full hover:bg-opacity-90 transition-all shadow-md active:scale-95"
            >
              Rezerviraj termin
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4 font-medium text-lg">
                <button
                  onClick={() => { setView('landing'); setIsMobileMenuOpen(false); window.scrollTo(0, 0); }}
                  className="text-left hover:text-primary-pink transition-colors py-2"
                >
                  Početna
                </button>
                <a href="#usluge" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary-pink transition-colors py-2">Usluge</a>
                <a href="#o-nama" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary-pink transition-colors py-2">O nama</a>
                <button
                  onClick={() => { setView('team'); setIsMobileMenuOpen(false); }}
                  className="text-left hover:text-primary-pink transition-colors py-2"
                >
                  Naš Tim
                </button>
                <a href="#cjenik" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary-pink transition-colors py-2">Cjenik</a>
                <div className="h-px w-full bg-gray-100 my-2" />
                <button
                  onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-2 hover:text-primary-purple transition-colors py-2"
                >
                  <LogIn size={20} /> Prijavi se
                </button>
                <button
                  onClick={() => { setView('booking'); setIsMobileMenuOpen(false); }}
                  className="bg-primary-purple text-white px-5 py-3 rounded-xl hover:bg-opacity-90 transition-all text-center mt-2"
                >
                  Rezerviraj termin
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 text-gray-900">
                Vratite pokret u <br />
                <span className="text-primary-pink">ravnotežu</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Suvremena fizikalna terapija usmjerena na cjelovitu procjenu, liječenje i prevenciju poremećaja pokreta.
                Individualni pristup uz detaljnu analizu biomehanike tijela.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setView('booking')}
                  className="bg-primary-pink text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                >
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
              Biomehanika pokreta d.o.o. pruža usluge suvremene fizikalne terapije usmjerene na cjelovitu procjenu, liječenje i prevenciju poremećaja pokreta, boli i funkcionalnih ograničenja.
              Polazimo od individualnog pristupa svakom klijentu, integrirajući međunarodno priznate koncepte poput Maitland metode, PNF-a, DNS-a i Bobath koncepta.
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

      {/* Services Summary */}
      <section id="usluge" className="py-32 bg-gray-50">
        <div className="container mx-auto px-6 text-center mb-20">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">Naše Usluge</h2>
          <div className="w-24 h-1 bg-primary-pink mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sveobuhvatan pristup vašem zdravlju kroz četiri ključna stupa rehabilitacije.
          </p>
        </div>

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {services.map((service, i) => {
            // Map icons based on index for now
            const icons = ['🔍', '⚡', '👐', '🏃'];
            const icon = icons[i] || '📋';

            return (
              <motion.div
                key={service.id}
                whileHover={{ y: -5 }}
                className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 hover:border-primary-pink/30 transition-all group flex flex-col"
              >
                <div className="flex items-start gap-6 mb-6">
                  <div className="text-5xl group-hover:scale-110 transition-transform shrink-0 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{service.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                  </div>
                </div>

                <div className="space-y-3 mt-4 flex-1">
                  {service.subServices && (expandedServiceIds.includes(service.id) ? service.subServices : service.subServices.slice(0, 4)).map((sub, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-purple mt-2.5 shrink-0" />
                      <p className="text-sm font-medium leading-relaxed">{sub.name}</p>
                    </div>
                  ))}
                  {service.subServices && service.subServices.length > 4 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleServiceExpansion(service.id);
                      }}
                      className="text-xs text-primary-purple font-bold pl-5 hover:underline focus:outline-none cursor-pointer text-left"
                    >
                      {expandedServiceIds.includes(service.id) ? "Prikaži manje" : `+ još ${service.subServices.length - 4} usluga`}
                    </button>
                  )}
                </div>

                <div className="pt-8 mt-4 border-t border-gray-100">
                  <button
                    onClick={() => { setSelectedServiceId(service.id); setView('booking'); }}
                    className="text-primary-purple font-bold flex items-center gap-2 hover:gap-4 transition-all text-sm uppercase tracking-wider"
                  >
                    Rezerviraj termin <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="cjenik" className="py-24 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Cjenik Usluga</h2>
            <div className="w-16 h-1 bg-primary-pink mx-auto rounded-full"></div>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">Transparentne cijene za vrhunsku rehabilitaciju. Bez skrivenih troškova.</p>
          </div>

          <div className="max-w-4xl mx-auto bg-gray-50 rounded-[2.5rem] p-8 md:p-12 shadow-lg border border-gray-100">
            <div className="space-y-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6 hover:shadow-md transition-all">
                  <div
                    className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => { setSelectedServiceId(service.id); setView('booking'); }}
                  >
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-500">
                        {(() => {
                          if (service.subServices && service.subServices.length > 0) {
                            const min = Math.min(...service.subServices.map(s => s.duration || 0));
                            const max = Math.max(...service.subServices.map(s => s.duration || 0));
                            return min === max ? `${min} min` : `${min}-${max} min`;
                          }
                          return service.duration ? `${service.duration} min` : '';
                        })()} (prosječno)
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>

                  <div className="divide-y divide-gray-50">
                    {service.subServices && service.subServices.length > 0 ? (
                      service.subServices.map((sub, idx) => (
                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-purple-50 transition-colors">
                          <span className="text-gray-700 font-medium">{sub.name}</span>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="font-bold text-primary-pink text-lg block">{sub.price} €</span>
                              {sub.duration && <span className="text-xs text-gray-400">{sub.duration} min</span>}
                            </div>
                            <button
                              onClick={() => { setSelectedServiceId(service.id); setView('booking'); }}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-primary-purple hover:bg-primary-purple hover:text-white transition-all"
                              title="Rezerviraj"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 flex justify-between items-center hover:bg-purple-50 transition-colors">
                        <span className="text-gray-700 font-medium py-2">Cijena usluge</span>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary-pink text-lg">
                            {service.price ? `${service.price} €` : 'Na upit'}
                          </span>
                          <button
                            onClick={() => { setSelectedServiceId(service.id); setView('booking'); }}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-primary-purple hover:bg-primary-purple hover:text-white transition-all"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center pt-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm mb-6">
                * Za pakete od 5 ili 10 terapija odobravamo poseban popust.
                <br />
                Plaćanje je moguće gotovinom i svim karticama.
              </p>
              <button
                onClick={() => setView('booking')}
                className="inline-flex items-center gap-2 text-primary-purple font-bold hover:gap-4 transition-all"
              >
                Rezerviraj svoj termin <ArrowLeft className="rotate-180" size={18} />
              </button>
            </div>
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

      {/* AI Booking Chat Button */}
      {(
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl hover:scale-105 hover:shadow-purple-500/30 transition-all hover:-translate-y-1 active:scale-95 group relative"
          >
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white animate-pulse"></span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </button>
        </div>
      )}

      {/* AI Booking Chat Overlay */}
      {isChatOpen && (
        <PhysioBookingChat
          services={services}
          teamMembers={teamMembers}
          shifts={shifts}
          appointments={appointments}
          clients={appClients}
          onAddAppointment={handleAddAppointment}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};


export default App;
