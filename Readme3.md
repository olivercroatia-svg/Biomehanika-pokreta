💎 Detaljno Proširenje Scenarija: "Biomehanika pokreta"
1. Korisnički tok (User Experience - UX)
A. Novi klijent (Prvi dolazak)
Otkrivanje: Klijent dolazi na web stranicu ili šalje poruku na WhatsApp.

Identifikacija: Sustav preko WhatsApp API-ja detektira da broj nije u MySQL bazi.

AI Onboarding: Chatbot šalje ljubaznu poruku: "Dobrodošli u Biomehaniku pokreta. Primijetili smo da ste novi. Kako bismo vam osigurali termin, molimo vas da ispunite kratki obrazac [Link na React registraciju]."

Registracija: Klijent na React stranici unosi ime, prezime i prihvaća GDPR te politiku otkazivanja (24h).

Prva rezervacija: Tek nakon registracije, sustav mu otvara kalendar za "Inicijalni pregled".

B. Stalni klijent (Korištenje paketa)
Upit: Klijent piše: "Trebam termin za manualnu terapiju sljedeći tjedan kod Vukice."

AI Logika: * Provjerava bazu: Klijent ima aktivni paket (preostalo 4/10 termina).

Provjerava Google Calendar: Vukica je slobodna utorak u 10:00 i srijedu u 14:00.

Odgovor: "Imate 4 preostala termina u paketu. Vukica vas može primiti u utorak u 10:00. Odgovara li vam?"

Potvrda: Klijent odgovara "Da". Sustav automatski skida 1 termin s paketa i upisuje ga u oba kalendara.

2. Detaljna AI Chatbot Logika (GPT-4 Integration)
AI ne smije samo "pričati", on mora "izvršavati". Scenarij predviđa Function Calling (OpenAI mogućnost):

Prompt za GPT: "Ti si asistent centra Biomehanika pokreta. Tvoj cilj je izvući: Uslugu, Zaposlenika i Vrijeme. Ako klijent ne navede nešto od toga, pitaj ga. Ako klijent želi otkazati, provjeri je li termin unutar 24h."

Workflow:

Klijent piše poruku.

PHP backend šalje poruku GPT-u zajedno s trenutnim popisom slobodnih termina iz Google-a.

GPT vraća strukturirani JSON: { "action": "book", "service_id": 5, "staff_id": 1, "time": "2024-05-10 10:00" }.

Backend vrši upis u MySQL.

3. "Skrivena" Admin Stranica (Dashboard za Vukicu i tim)
Ovaj dio sustava je mozak operacije. Pristup je putem /admin-portal s jakom autentifikacijom.

Zaslon "Zaposlenici": * Upload fotografija (automatsko optimiziranje veličine slike u PHP-u).

Drag & Drop povezivanje zaposlenika s uslugama.

Zaslon "Roster" (Raspored): * Definiranje tjednih smjena (npr. Jutarnja: 08-14h, Popodnevna: 14-21h).

Ove smjene se automatski sinkroniziraju s Google Calendarom kao "vrijeme dostupnosti".

Zaslon "Financije/Paketi": * Pregled klijenata koji imaju neplaćene penale zbog nepojavljivanja.

Mogućnost ručnog dodavanja gratis termina u klijentov paket.

4. Tehnička Implementacija na Hetzner Serveru
Da bi sustav bio brz i siguran, koristit ćemo Docker Compose pristup:

Container 1 (Nginx): Upravlja SSL certifikatima (HTTPS).

Container 2 (React Frontend): Optimizirana produkcijska verzija stranice.

Container 3 (PHP-FPM): Laravel ili nativni PHP koji obrađuje API zahtjeve.

Container 4 (MySQL 8.0): Baza s enkripcijom podataka.

Container 5 (Redis): Za brzo keširanje odgovora iz Google kalendara kako bi stranica bila munjevita.

5. Politika Otkazivanja i Naplate (Detaljno)
Ovo je najosjetljiviji dio poslovanja koji sprječava gubitke:

24-satni "Lock": Ako klijent pokuša otkazati preko WhatsAppa unutar 24 sata prije termina, AI odgovara: "Žao nam je, prema našim pravilima termin je moguće otkazati najkasnije 24h prije. Budući da je termin uskoro, on će se tretirati kao odrađen."

No-Show evidencija: U bazi appointments polje status postaje no-show. Klijentu se automatski šalje e-mail/poruka s informacijom o naplati pri sljedećem dolasku.

6. Web Stranica: Dizajnerski detalji (Tailwind CSS)
Header: Transparentan, s ljubičastim logotipom, postaje bijel pri scrollu.

Hero Section: Naslov u crnoj boji (text-black), gumb za naručivanje u jarkoj rozoj (bg-pink-500) s bijelim tekstom.

Sekcija "Naš tim": Fotografije su crno-bijele, a pri prelaženju mišem (hover) postaju u boji s ljubičastim okvirom.

Footer: Siva pozadina (bg-gray-100), s elegantno ispisanim podacima iz sudskog registra i linkovima na društvene mreže u crnoj boji.

Ažurirani Scenarij za Google Antigravity (Prompt)
Kada ubacite ovaj kontekst u Gemini, koristite ovo:

"Djeluj kao Full-stack Lead Developer. Na temelju proširenog scenarija za 'Biomehaniku pokreta d.o.o.', kreiraj detaljan plan API ruta u PHP-u koje će opsluživati React frontend i WhatsApp Webhook. Posebno obrati pažnju na sigurnost admin panela i logiku provjere preostalih termina u paketima usluga. Nakon toga, pripremi se za pisanje SQL koda."