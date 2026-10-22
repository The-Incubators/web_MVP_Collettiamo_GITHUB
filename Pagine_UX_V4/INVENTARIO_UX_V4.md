# UX_V4 — Inventario dell'export Stitch

Confronto fra l'export (`stitch_regaloop_group_gift_platform/`, 20 schermate + `DESIGN.md`) e il brief `PROMPT_STITCH_UX_V4.md`.
Serve da lista di controllo durante l'implementazione.

## 0. Decisioni prese (22 ottobre 2026)

- **Schermate mancanti, approccio misto:** in Stitch si generano solo **B3 Chiusura**, **C1.b Votazione** e **C1.j Rendiconto**; tutte le altre si ricavano dai componenti V4.
- **Wizard di creazione a 5 passi:** Regalo · Per chi e quando · Quota e pagamenti · Chi partecipa · Invita.
- **Nuove funzioni da aggiungere con UX_V4:** foto nel messaggio della colletta (C1.g) e «Ruolo o parentela» per chi firma il biglietto (E3, D5). Richiedono nuovi campi, regole e test.
- **Copia di lavoro e pubblicazione:** `web_MVP_Collettiamo_GITHUB`, branch `ux-v4`; V1 recuperabile dal tag `ux-v1`.
- Le altre proposte «da accettare» della sezione 4 sono accettate.

## 1. Design system

- `expressive_warmth/DESIGN.md` è una **versione nuova** di Expressive Warmth (non quella di V2/V3): primario **#033922** (verde del logo), CTA principale **arancio #FD5D17 a pillola**, oro #FDB022 per i traguardi, fondo `#f6fbf4`, card `#FFFDF8`, bordi `#E6DFD5`.
- Caratteri: **Bricolage Grotesque** (titoli) + **Plus Jakarta Sans** (testo); icone **Material Symbols Outlined**. Uguali in tutte le 20 schermate.
- Coerenza visiva fra le schermate: buona. Eccezione: **E1 usa un logo diverso** (scritta «regaloop» con simbolo ∞) → si usa il logo vero ovunque.

## 2. Copertura: cosa c'è e cosa manca

| Brief | Schermata Stitch | Stato |
|---|---|---|
| A1 Home | `a1_home_regaloop` | ✅ |
| A2 Catalogo | `a2_catalogo_regali` | ✅ (manca il bottom sheet dei filtri) |
| A3 Scheda prodotto | `a3_scheda_prodotto_calcolo_quota` | ✅ |
| A4 Trova il regalo | `a4_trova_il_regalo_guidato` | ⚠️ solo la domanda «Interessi»: mancano avvio, destinatario, occasione, caricamento, risultati |
| A5 Preferiti | — | ❌ |
| A6 Accedi | — | ❌ |
| B1.1 Il regalo | `b1.1_crea_colletta_il_regalo` | ⚠️ manca la variante «Lo sceglie il gruppo» (lista idee, durata) |
| B1.2 Per chi e quando | — | ❌ |
| B1.3 + B1.4 Quota e pagamenti | `b1.3_crea_quota_metodi_pagamento` | ✅ **unite in un passo solo** |
| B1.5 Chi partecipa | — | ❌ |
| B1.6 Invita | `b1.6_crea_invita_il_gruppo_e_lancio` | ✅ (ha spostato qui la modalità sorpresa) |
| B2 Dashboard | `b2_dashboard_raccolta_organizzatore` | ⚠️ mancano: contanti da ricevere, blocco link, votazione, «Chiudi le adesioni» |
| B3 Chiusura | — | ❌ **importante** |
| B4 Dati | — | ❌ |
| B5 Le mie collette | — | ❌ |
| C1.a Prima schermata | `c1.a_pagina_colletta_partecipante` | ✅ |
| C1.b Votazione · C1.c Il gruppo ha scelto | — | ❌ |
| C1.d Nome | — | ❌ |
| C1.e + C1.f Metodo e «Hai pagato?» | `c1.e_f_paga_e_dichiara_la_quota` | ✅ **uniti in una schermata** (manca il campo importo per la quota libera) |
| C1.g Biglietto | `c1.g_firma_il_biglietto_di_gruppo` | ✅ |
| C1.h Il tuo stato | `c1.h_stato_del_partecipante` | ✅ |
| C1.i Scaduta · C1.j Chiusa/rendiconto | — | ❌ |
| C2 Biglietto stampabile | — | ❌ |
| D1 Nuovo biglietto | `d1_nuovo_biglietto_di_gruppo` | ✅ |
| D2 Dettagli | `d2_dettagli_del_biglietto` | ✅ (molti testi da correggere) |
| D3 Copertina | `d3_scegli_copertina_biglietto` | ✅ |
| D4 Anteprima e pubblica | — | ❌ |
| D5 Gestione biglietto | `d5_gestione_biglietto_organizzatore` | ✅ |
| E1–E4 Firmatario | `e1`…`e4` | ✅ tutte e quattro |
| F1–F4 Servizio | — | ❌ (pagine semplici) |

**Totale:** 20 schermate presenti su circa 50 stati del brief. I gruppi **E (chi firma)** e **D (biglietto)** sono quasi completi, mentre **B (organizzatore)** e **C (chi partecipa)** hanno buchi importanti.

## 3. Contenuti inventati o sbagliati da correggere

### Gravi: contraddicono il principio «i soldi non passano da qui» o promettono funzioni che non esistono

| Schermata | Problema | Correzione |
|---|---|---|
| D1 | «Amazon Pay & Carte» | Togliere: non si paga mai dentro l'app |
| D2 | Riquadro «Vuoi abbinare una colletta? … Apple Pay … Zero commissioni sui primi 300 € … Bonifico istantaneo sul conto dell'organizzatore a fine evento» | Sostituire con il riquadro vero: «Vuoi anche fare un regalo di gruppo?» → crea colletta |
| D2 | «Riceverai il link magico via email e WhatsApp…», «firme bloccate 15 minuti prima… flip-book» | Togliere: le email non sono ancora attive, il flip-book non esiste |
| D3, D5 | «PDF in alta risoluzione per tutti», «Scarica PDF pronto stampa» | Il PDF non esiste ancora (fase 5): nascondere |
| E1 | «Ritrova la tua firma» da un altro dispositivo | Non esiste ancora (serve l'email): togliere |
| C1.h | «Regaloop crittografa i dati» | Affermazione non verificata: togliere |
| C1.e | «Scrivi a Marco» | Non abbiamo i contatti dell'organizzatore: togliere |

### Dati e numeri finti (vanno sostituiti con quelli veri)

- **Prezzo barrato e «Risparmi 16%»** (A3, C1.a): non abbiamo il prezzo di listino → togliere.
- **Marche e prodotti di fantasia** (Muji Style, Ferm Living, Fotocamera istantanea…), «184 idee»: si usano catalogo e conteggio veri.
- **Badge «Top Regalo», «Artigianale», «100% Metallo riciclabile», «con Prime»** → togliere.
- **Dominio `regaloop.it`** (B1.6, D2, E4): non esiste, si usa l'indirizzo vero del sito.
- **Messaggio WhatsApp** (B1.6) e **promemoria** (B2, D5): si usano i testi generati dal codice (`lib/dominio/messaggi.ts`, promemoria).
- **«Sara, Luca, Giulia stanno scrivendo»** (E1): presenza in tempo reale finta → «hanno già firmato».
- **«9 / 15 firme stimate»** (D5): non esiste un numero di firme atteso → solo il conteggio.
- **«Consegna card il 18 maggio»** (C1.h): il biglietto della colletta non ha una consegna → togliere.
- **«Oltre 40 layout»** (D2) e nomi delle copertine (D3): le copertine vere sono 12 + 2 speciali (Palloncini, Torta e candeline, Coriandoli…).
- **Contanti «alla festa sabato sera al locale»** (C1.e) → «di persona».
- **Causale «Regalo Giulia – [Tuo Nome]»** (C1.e): la causale è generata per ogni partecipante.
- **Satispay «Cerca Marco Rossi»** (C1.e): abbiamo solo il numero.

### Filtri e opzioni che non esistono

- **A2:** filtro «Fino a 100 €» (le fasce vere sono fino a 30 · 30–80 · 80–150 · 150–200 · oltre 200 €) e «Compleanno» (i prodotti non hanno occasioni).
- **A4:** interessi e categorie inventati (Caffè specialty, Vino naturale, «Arredo & Design»…). Si usano i 36 interessi veri nelle 6 categorie Cultura, Sport, Food&Drink, Adventure, Società, Altre passioni. Il riquadro «Consiglio del Loop Master» va tolto.
- **B1.1:** «Votazione anonima o palese» → non è un'opzione.
- **C1.g:** «Formato A3 aperto» → il biglietto stampabile è A5.
- **D5:** «A4 pieghevole / Continua» → le opzioni vere sono 1, 2 o 3 colonne.
- **E2:** limite «400 caratteri» → quello vero è 1000; lo stile «Festoso» si chiama «Decorativo»; mancano i controlli **Colore** e **Dimensione**.
- **E3:** manca **Cognome (facoltativo)**.

### Intestazioni

- **C1.a ed E1** hanno freccia indietro e icona profilo: per chi partecipa e chi firma vanno tolte (solo il logo piccolo).
- **A1:** il titolo è «…senza rincorrere tutti»; quello approvato è «…senza dover rincorrere tutti».

## 4. Proposte nuove di Stitch (non nel brief)

| Proposta | Dove | Costo | Proposta di decisione |
|---|---|---|---|
| Quota e pagamenti in un solo passo (wizard da 6 a 5 passi) | B1.3 | basso | da decidere |
| Metodo e «Hai pagato?» nella stessa schermata | C1.e_f | basso | accettare |
| Modalità sorpresa spostata al passo «Invita», accanto all'anteprima | B1.6 | basso | accettare |
| «Simula per N invitati» globale nel catalogo | A2 | basso (esiste già in V3) | accettare |
| Linguette Tutti / Confermati / In attesa / Da sollecitare | B2 | basso | accettare |
| Frasi rapide («Auguri Giuli!»…) per il messaggio | C1.g | basso | accettare |
| Iniziali di chi ha partecipato sulla pagina pubblica | C1.a | basso | accettare (solo i confermati) |
| Foto nel messaggio della colletta | C1.g | medio: nuovo dato e caricamento | rimandare |
| Campo «Ruolo o parentela» per chi firma | E3, D5 | medio: nuovo dato | rimandare |
| Sollecito al singolo invitato (icona invio) | B2 | medio: non abbiamo i recapiti | sostituire con «copia messaggio personale» |
