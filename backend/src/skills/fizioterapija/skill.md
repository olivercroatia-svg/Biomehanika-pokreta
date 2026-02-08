# Vještina: Protokol_Prijema_Fizioterapija

## Opis
Ova vještina definira standardizirani proces unosa novog klijenta u sustav fizioterapeutske ordinacije. Obuhvaća administrativne podatke, medicinsku povijest (anamnezu), inicijalni fizikalni status klijenta te modul za upravljanje terminima.

## Struktura Podataka (Schema)

### 1. Identifikacija i Kontakt
Osnovni entitet klijenta za bazu podataka.
- `id_klijenta`: **UUID** (Automatski generirano)
- `ime_prezime`: **String** (Obavezno)
- `datum_rodjenja`: **Date** (Format: YYYY-MM-DD)
- `zanimanje`: **String** (Analiza ergonomskog rizika)
- `kontakt_broj`: **String**
- `privola_gdpr`: **Boolean** (Mora biti `True` za nastavak)

### 2. Medicinska Povijest (Anamneza)
Podaci ključni za sigurnost tretmana i identifikaciju kontraindikacija.
- `glavna_tegoba`: **Text** (Opis razloga dolaska)
- `kontraindikacije`: **List[Enum]**
    - Opcije: `[PACEMAKER, TRUDNOCA, METALNI_IMPLANTATI, MALIGNA_OBOLJENJA, SVJEZA_FRAKTURA]`
- `lijekovi`: **Text** (Posebno antikoagulansi i analgetici)
- `prethodne_operacije`: **Text**

### 3. Fizikalni Status (Inicijalna Procjena)
Mjerni podaci za praćenje napretka (Baseline).
- `bol_vas_skala`: **Integer** (Raspon: 0-10)
- `opseg_pokreta`: **Map<String, String>** (npr. "Lakat_Flex": "120°")
- `misicna_snaga`: **Integer** (MMT skala 0-5)
- `neurološki_ispad`: **Boolean**
- `napomene_terapeuta`: **Text** (Palpacija, postura, hod)

### 4. Raspored i Praćenje Termina (Scheduling)
Struktura za upravljanje kalendarom i frekvencijom tretmana.
- `id_termina`: **UUID** (Primarni ključ termina)
- `datum_vrijeme`: **DateTime** (Format: ISO-8601)
- `vrsta_usluge`: **Enum** `[PRVI_PREGLED, TERAPIJA, KONZULTACIJE, KONTROLA]`
- `trajanje_minuta`: **Integer** (Standardno 30, 45 ili 60 min)
- `status_dolaska`: **Enum** `[ZAKAZANO, DOŠAO, OTKAZANO_NA_VRIJEME, NEDOLAZAK]`
- `terapeut_id`: **String** (Identifikator dodijeljenog fizioterapeuta)
- `ponavljanje_ciklusa`: **Integer** (Broj planiranih dolazaka, npr. 10)

---

## Logička Pravila i Validacija

| Pravilo | Uvjet | Akcija sustava |
| :--- | :--- | :--- |
| **Provjera Sigurnosti** | Ako je `pacemaker` == `True` | Blokiraj "Elektroterapija" u planu liječenja. |
| **Kritična Bol** | Ako je `bol_vas_skala` >= 8 | Označi klijenta kao "Hitni termin/Akutno". |
| **Validacija Privole** | Ako je `privola_gdpr` == `False` | Onemogući spremanje u bazu podataka. |
| **Podsjetnik** | 24h prije termina | Pošalji automatski SMS/Email klijentu. |
| **Sukob Termina** | Ako je `terapeut_id` zauzet | Onemogući dvostruko bukiranje (Double-booking). |
| **Kraj Ciklusa** | Nakon zadnjeg termina | Generiraj obavijest za "Završnu procjenu". |

---

## Tijek Rada (Workflow)

1.  **Inicijalizacija**: Otvaranje novog unosa putem `skill.md`.
2.  **Prikupljanje**: Unos podataka klijenta i odabir termina.
3.  **Evaluacija**: Sustav automatski provjerava kontraindikacije i dostupnost kalendara.
4.  **Arhiviranje**: Enkripcija medicinskih podataka i pohrana u `Pacijenti_DB`.
5.  **Izlaz**: Generiranje potvrde termina i inicijalnog nalaza.

---

## Metapodaci (Metadata)
- **Verzija**: 1.1.0
- **Kategorija**: Zdravstvo / Fizioterapija / Scheduling
- **Jezik**: HR
- **Sigurnosna Razina**: Visoka (Medicinska tajna)