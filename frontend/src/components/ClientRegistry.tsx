import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Settings, Save, AlertCircle } from 'lucide-react';

// --- Types based on Skill Schema ---

// 1. Identifikacija
export interface ClientIdentification {
    id: string; // UUID
    ime_prezime: string;
    datum_rodjenja: string; // YYYY-MM-DD
    zanimanje: string;
    kontakt_broj: string;
    email: string;
    privola_gdpr: boolean;
}

export type ContraindicationType = 'PACEMAKER' | 'TRUDNOCA' | 'METALNI_IMPLANTATI' | 'MALIGNA_OBOLJENJA' | 'SVJEZA_FRAKTURA';

const CONTRAINDICATIONS: ContraindicationType[] = [
    'PACEMAKER', 'TRUDNOCA', 'METALNI_IMPLANTATI', 'MALIGNA_OBOLJENJA', 'SVJEZA_FRAKTURA'
];

// 2. Anamneza
export interface ClientAnamnesis {
    glavna_tegoba: string;
    kontraindikacije: ContraindicationType[];
    lijekovi: string;
    prethodne_operacije: string;
}

// 3. Fizikalni Status
export interface ClientPhysicalStatus {
    bol_vas_skala: number; // 0-10
    opseg_pokreta: string;
    misicna_snaga: number; // 0-5
    neuroloski_ispad: boolean;
    napomene_terapeuta: string;
}

// Combined Client Interface
export interface Client {
    id: string;
    identification: ClientIdentification;
    anamnesis: ClientAnamnesis;
    physicalStatus: ClientPhysicalStatus;
    status: 'active' | 'archived';
    registrationDate: string;
}

// Mock Data
export const MOCK_CLIENTS: Client[] = [
    {
        id: '1',
        identification: {
            id: '1',
            ime_prezime: 'Ivan Horvat',
            datum_rodjenja: '1985-05-12',
            zanimanje: 'Programer',
            kontakt_broj: '0912345678',
            email: 'ivan@example.com',
            privola_gdpr: true
        },
        anamnesis: {
            glavna_tegoba: 'Bol u donjem dijelu leđa',
            kontraindikacije: [],
            lijekovi: '',
            prethodne_operacije: 'Apendektomija 2005'
        },
        physicalStatus: {
            bol_vas_skala: 6,
            opseg_pokreta: 'Limitirana fleksija kuka',
            misicna_snaga: 4,
            neuroloski_ispad: false,
            napomene_terapeuta: 'Sjedilački način života, loša postura.'
        },
        status: 'active',
        registrationDate: '2025-01-15'
    },
    {
        id: '2',
        identification: {
            id: '2',
            ime_prezime: 'Ana Marić',
            datum_rodjenja: '1990-03-22',
            zanimanje: 'Učiteljica',
            kontakt_broj: '0987654321',
            email: 'ana.maric@example.com',
            privola_gdpr: true
        },
        anamnesis: {
            glavna_tegoba: 'Česte glavobolje i bol u vratu',
            kontraindikacije: [],
            lijekovi: '',
            prethodne_operacije: ''
        },
        physicalStatus: {
            bol_vas_skala: 4,
            opseg_pokreta: 'Vratna kralježnica ograničena rotacija',
            misicna_snaga: 5,
            neuroloski_ispad: false,
            napomene_terapeuta: 'Tenzijske glavobolje'
        },
        status: 'active',
        registrationDate: '2025-01-20'
    }
];

interface ClientRegistryProps {
    clients: Client[];
    onAddClient: (client: Client) => void;
    onUpdateClient: (client: Client) => void;
}

const ClientRegistry: React.FC<ClientRegistryProps> = ({ clients = [], onAddClient, onUpdateClient }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingClientId, setEditingClientId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Client>>({
        identification: {
            id: '',
            ime_prezime: '',
            datum_rodjenja: '',
            zanimanje: '',
            kontakt_broj: '',
            email: '',
            privola_gdpr: false
        },
        anamnesis: {
            glavna_tegoba: '',
            kontraindikacije: [],
            lijekovi: '',
            prethodne_operacije: ''
        },
        physicalStatus: {
            bol_vas_skala: 0,
            opseg_pokreta: '',
            misicna_snaga: 5,
            neuroloski_ispad: false,
            napomene_terapeuta: ''
        }
    });

    const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

    const handleInputChange = (section: keyof Client, field: string, value: any) => {
        setFormData(prev => {
            const sectionData = prev[section] as any || {};
            return {
                ...prev,
                [section]: {
                    ...sectionData,
                    [field]: value
                }
            };
        });
    };

    const toggleContraindication = (cin: ContraindicationType) => {
        const current = formData.anamnesis?.kontraindikacije || [];
        const updated = current.includes(cin)
            ? current.filter(c => c !== cin)
            : [...current, cin];

        handleInputChange('anamnesis', 'kontraindikacije', updated);
    };

    const handleEditClient = (client: Client) => {
        setFormData({
            identification: { ...client.identification },
            anamnesis: { ...client.anamnesis },
            physicalStatus: { ...client.physicalStatus }
        });
        setEditingClientId(client.id);
        setIsAddModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.identification?.privola_gdpr) {
            alert("GDPR privola je obavezna!");
            return;
        }

        if (!formData.identification || !formData.anamnesis || !formData.physicalStatus) return;

        if (editingClientId) {
            // Update existing
            const updatedClient: Client = {
                id: editingClientId,
                identification: { ...formData.identification!, id: editingClientId },
                anamnesis: { ...formData.anamnesis! },
                physicalStatus: { ...formData.physicalStatus! },
                status: 'active',
                registrationDate: clients.find(c => c.id === editingClientId)?.registrationDate || new Date().toISOString()
            };
            onUpdateClient(updatedClient);
        } else {
            // Create new
            const newClient: Client = {
                id: Date.now().toString(),
                identification: { ...formData.identification!, id: Date.now().toString() },
                anamnesis: { ...formData.anamnesis! },
                physicalStatus: { ...formData.physicalStatus! },
                status: 'active',
                registrationDate: new Date().toISOString()
            };
            onAddClient(newClient);
        }

        setIsAddModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            identification: { id: '', ime_prezime: '', datum_rodjenja: '', zanimanje: '', kontakt_broj: '', email: '', privola_gdpr: false },
            anamnesis: { glavna_tegoba: '', kontraindikacije: [], lijekovi: '', prethodne_operacije: '' },
            physicalStatus: { bol_vas_skala: 0, opseg_pokreta: '', misicna_snaga: 5, neuroloski_ispad: false, napomene_terapeuta: '' }
        });
        setEditingClientId(null);
        setActiveStep(1);
    };

    const filteredClients = clients.filter(c =>
        c.identification.ime_prezime.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.identification.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Registar Klijenata</h2>
                    <p className="text-gray-500">Baza svih klijenata i njihovi podaci</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary-purple text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <Plus size={20} /> Novi Klijent
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Pretraži po imenu, prezimenu ili emailu..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-purple/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {filteredClients.map(client => (
                    <div
                        key={client.id}
                        onDoubleClick={() => handleEditClient(client)}
                        className="p-4 rounded-xl border border-gray-100 hover:border-primary-purple/30 hover:shadow-md transition-all cursor-pointer group bg-white select-none"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-pink/10 text-primary-pink flex items-center justify-center font-bold text-lg">
                                    {client.identification.ime_prezime.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-primary-purple transition-colors">{client.identification.ime_prezime}</h3>
                                    <p className="text-sm text-gray-500">{client.identification.email} • {client.identification.kontakt_broj}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg text-gray-400 group-hover:text-primary-purple group-hover:bg-primary-purple/10 transition-colors">
                                <Settings size={18} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Client Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{editingClientId ? 'Uredi Klijenta' : 'Novi Klijent'}</h3>
                                    <p className="text-gray-500 text-sm">Protokol prijema fizioterapije</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={24} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex border-b border-gray-100">
                                <button
                                    onClick={() => setActiveStep(1)}
                                    className={`flex-1 py-4 text-center font-bold text-sm transition-colors relative ${activeStep === 1 ? 'text-primary-purple' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    1. Identifikacija
                                    {activeStep === 1 && <motion.div layoutId="step" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-purple" />}
                                </button>
                                <button
                                    onClick={() => setActiveStep(2)}
                                    className={`flex-1 py-4 text-center font-bold text-sm transition-colors relative ${activeStep === 2 ? 'text-primary-purple' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    2. Anamneza
                                    {activeStep === 2 && <motion.div layoutId="step" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-purple" />}
                                </button>
                                <button
                                    onClick={() => setActiveStep(3)}
                                    className={`flex-1 py-4 text-center font-bold text-sm transition-colors relative ${activeStep === 3 ? 'text-primary-purple' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    3. Fizikalni Status
                                    {activeStep === 3 && <motion.div layoutId="step" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-purple" />}
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">

                                {activeStep === 1 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                label="Ime i Prezime"
                                                value={formData.identification?.ime_prezime}
                                                onChange={(v: string) => handleInputChange('identification', 'ime_prezime', v)}
                                                required
                                            />
                                            <Input
                                                label="Datum Rođenja"
                                                type="date"
                                                value={formData.identification?.datum_rodjenja}
                                                onChange={(v: string) => handleInputChange('identification', 'datum_rodjenja', v)}
                                            />
                                            <Input
                                                label="Zanimanje (Ergonomija)"
                                                value={formData.identification?.zanimanje}
                                                onChange={(v: string) => handleInputChange('identification', 'zanimanje', v)}
                                            />
                                            <Input
                                                label="Kontakt Broj"
                                                value={formData.identification?.kontakt_broj}
                                                onChange={(v: string) => handleInputChange('identification', 'kontakt_broj', v)}
                                            />
                                            <Input
                                                label="Email"
                                                type="email"
                                                value={formData.identification?.email}
                                                onChange={(v: string) => handleInputChange('identification', 'email', v)}
                                            />
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
                                            <input
                                                type="checkbox"
                                                id="gdpr"
                                                className="mt-1 w-5 h-5 rounded text-primary-purple focus:ring-primary-purple"
                                                checked={formData.identification?.privola_gdpr}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('identification', 'privola_gdpr', e.target.checked)}
                                            />
                                            <label htmlFor="gdpr" className="text-sm text-blue-800">
                                                <strong>GDPR Privola:</strong> Ovime potvrđujem da sam upoznat/a s načinom obrade mojih osobnih podataka i dajem privolu za njihovo korištenje u svrhu vođenja medicinske dokumentacije i planiranja terapije.
                                            </label>
                                        </div>
                                    </motion.div>
                                )}

                                {activeStep === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Glavna Tegoba</label>
                                            <textarea
                                                className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-purple/20 min-h-[100px]"
                                                placeholder="Opišite razlog dolaska, trajanje simptoma, faktore koji pogoršavaju stanje..."
                                                value={formData.anamnesis?.glavna_tegoba}
                                                onChange={(e) => handleInputChange('anamnesis', 'glavna_tegoba', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Kontraindikacije</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {CONTRAINDICATIONS.map(key => (
                                                    <div
                                                        key={key}
                                                        onClick={() => toggleContraindication(key)}
                                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${formData.anamnesis?.kontraindikacije.includes(key)
                                                            ? 'bg-red-50 border-red-200 text-red-700'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span className="font-medium text-sm">{key.replace(/_/g, ' ')}</span>
                                                        {formData.anamnesis?.kontraindikacije.includes(key) && <AlertCircle size={16} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Input
                                            label="Redovna Terapija (Lijekovi)"
                                            placeholder="Antikoagulansi, analgetici..."
                                            value={formData.anamnesis?.lijekovi}
                                            onChange={(v: string) => handleInputChange('anamnesis', 'lijekovi', v)}
                                        />

                                        <Input
                                            label="Prethodne Operacije & Zahvati"
                                            value={formData.anamnesis?.prethodne_operacije}
                                            onChange={(v: string) => handleInputChange('anamnesis', 'prethodne_operacije', v)}
                                        />
                                    </motion.div>
                                )}

                                {activeStep === 3 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div>
                                            <label className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                                                <span>VAS Skala Boli (0-10)</span>
                                                <span className="text-primary-pink text-lg">{formData.physicalStatus?.bol_vas_skala}</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-pink"
                                                value={formData.physicalStatus?.bol_vas_skala}
                                                onChange={(e) => handleInputChange('physicalStatus', 'bol_vas_skala', parseInt(e.target.value))}
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                <span>Bez boli</span>
                                                <span>Neizdrživa bol</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <Input
                                                label="Opseg Pokreta (ROM)"
                                                placeholder="npr. Lakat Flex: 120°"
                                                value={formData.physicalStatus?.opseg_pokreta}
                                                onChange={(v: string) => handleInputChange('physicalStatus', 'opseg_pokreta', v)}
                                            />
                                            <Input
                                                label="Mišićna Snaga (MMT 0-5)"
                                                type="number"
                                                min="0" max="5"
                                                value={formData.physicalStatus?.misicna_snaga}
                                                onChange={(v: string) => handleInputChange('physicalStatus', 'misicna_snaga', parseInt(v))}
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <input
                                                type="checkbox"
                                                id="neuro"
                                                className="w-5 h-5 text-primary-purple"
                                                checked={formData.physicalStatus?.neuroloski_ispad}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('physicalStatus', 'neuroloski_ispad', e.target.checked)}
                                            />
                                            <label htmlFor="neuro" className="text-gray-700 font-bold">Prisutan neurološki ispad / deficit</label>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Napomene Terapeuta</label>
                                            <textarea
                                                className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-purple/20 min-h-[100px]"
                                                placeholder="Palpacija, postura, obrazac hoda, specifični testovi..."
                                                value={formData.physicalStatus?.napomene_terapeuta}
                                                onChange={(e) => handleInputChange('physicalStatus', 'napomene_terapeuta', e.target.value)}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between">
                                <button
                                    onClick={() => activeStep > 1 && setActiveStep(prev => prev - 1 as any)}
                                    className={`px-6 py-3 rounded-xl font-bold transition-all ${activeStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Natrag
                                </button>

                                {activeStep < 3 ? (
                                    <button
                                        onClick={() => setActiveStep(prev => prev + 1 as any)}
                                        className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all"
                                    >
                                        Dalje
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        className="bg-primary-purple text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                        <Save size={18} /> Spremi Karton
                                    </button>
                                )}
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// UI Helper Components
const Input = ({ label, value, onChange, type = 'text', placeholder, required, min, max }: any) => (
    <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-primary-purple/20"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={max}
        />
    </div>
);

export default ClientRegistry;
