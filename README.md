# PROJEKTNA DOKUMENTACIJA I INSTRUKCIJA: Sustav "Biomehanika pokreta"

## 1. Kontekst i Identitet Brenda
- **Naziv tvrtke:** Biomehanika pokreta d.o.o. za fizikalnu terapiju.
- **Djelatnost:** Centar za fizikalnu terapiju i rehabilitaciju.
- **Vizualni identitet:** Paleta boja: Roza, Ljubičasta, Siva, Crna, Bijela.
- **Cilj:** Izrada web stranice i unutar nje automatizacija zakazivanja termina uz AI asistenciju (ChatGPT) i WhatsApp Business API.

## 2. Tehnički Stack
- **Frontend:** React.js (Moderni UI, Responsive dizajn).
- **Backend:** PHP (Preporuka: Laravel framework zbog sigurnosti i API mogućnosti).
- **Baza podataka:** MySQL (Hetzner Cloud).
- **Integracije:** - Google Calendar API (Dva kalendara: Osoblje vs. Klijenti).
    - WhatsApp Business API (Meta Cloud API).
    - OpenAI API (GPT-4o za chatbot logiku).
    - Gmail SMTP/API za automatizirane mailove.

## 3. Funkcionalni Zahtjevi (Moduli)

### A. Sustav Rezervacija & Kalendar
- **Dvostruki Kalendar:** 1. *Interni:* Raspored smjena i dostupnost fizioterapeuta.
    2. *Eksterni:* Vidljivi termini za klijente generirani na temelju smjena fizioterapeuta.
- **Validacija:** Klijent mora biti u sustavu (provjera broja telefona) prije potvrde termina.
- **Otkazivanje:** Automatska kontrola "24h policy". Ako je otkazivanje unutar 24h, sustav bilježi penalizaciju/naplatu.

### B. Automatizirana Komunikacija (AI Chatbot)
- **Logika:** Chatbot (GPT) analizira upit klijenta, provjerava bazu i Google Calendar, te predlaže 3 alternativna slobodna termina ako je traženi zauzet.
- **Kanali:** WhatsApp (primarno) i Email.
- **Podsjetnici:** Automatsko slanje poruka 24h prije termina.

### C. Web Stranica & CMS
- **Javni dio:** O nama, usluge sa opisom i fotografijama, opis centra za fizioterapiju, opis vlasnice i osnivačice centra (Vukica Jurišić)imena i fotografije zaposlenih, podaci iz sudskog registra.
- **Admin/Hidden Panel:** Zaštićen šifrom. Omogućuje:
    - Unos/uređivanje zaposlenika i njihovih fotografija.
    - Definiranje usluga (terapija) i mapiranje: koja usluga pripada kojem fizioterapeutu.
    - Upravljanje smjenama (roster).

## 4. Podaci za Web Stranicu (Content)
- **O nama:** Biomehanika pokreta d.o.o. je specijalizirani centar fokusiran na vrhunsku rehabilitaciju, funkcionalni oporavak i personalizirani pristup pacijentu. Koristimo najmodernije tehnike fizikalne terapije kako bismo vratili tijelo u optimalni balans.
- **Registracijski podaci:** [Unijeti MBS, OIB i sjedište iz sudskog registra].

---

## INSTRUKCIJA ZA GEMINI (Antigravity Prompt):
"Djeluj kao Senior Full-stack Developer i Arhitekt sustava. Na temelju gore navedenih točaka, generiraj sljedeće:

1.  **Shemu baze podataka (MySQL):** Tablice za `users` (zaposlenici i klijenti), `services`, `appointments`, `staff_schedule`.
2.  **API Endpoints (PHP):** Definiciju ruta za rezervaciju, provjeru dostupnosti i webhook za WhatsApp.
3.  **Frontend Arhitekturu (React):** Strukturu komponenti (CalendarView, BookingForm, AdminDashboard).
4.  **AI Logic Flow:** Kako GPT API treba procesuirati poruku 'Želim termin sutra popodne' u JSON format koji PHP backend može razumjeti.
5.  **Dizajn sustava:** Predloži Tailwind CSS klase za implementaciju palete (roza/ljubičasta/siva) na web stranici."