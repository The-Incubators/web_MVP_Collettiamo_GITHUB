# Gifty: cookie e analisi, il piano

Stato: proposta per Cri, 6 novembre 2026. Nulla di questo è ancora costruito. Non è un parere legale: decide come costruire e segnala che cosa va fatto vedere a un avvocato.

## 1. Obiettivo

Sapere quante persone arrivano, da dove, che cosa aprono e dove si fermano (idee regalo, regalo di gruppo, biglietto), senza banner dei cookie, se possibile. Il banner costa conversioni e, con gli strumenti giusti, in Italia non serve.

## 2. Che cosa fa oggi il sito sul dispositivo e verso terzi

Controllato nel codice il 6 novembre (ramo `fix/gifty-ritocchi-6nov`).

| Cosa | Dove | Serve il consenso? |
|---|---|---|
| Sessione di accesso (Firebase Auth, Google) | IndexedDB e localStorage del browser | No: tecnico, serve al servizio chiesto |
| Bozze del biglietto e del regalo di gruppo, chiave di chi firma | localStorage (`lib/wizard/stato.ts`, `components/biglietto/firma/bozza.ts`) | No: tecnico |
| «Visti di recente» | localStorage, solo nel browser (`lib/vistiDiRecente.ts`) | Probabilmente no (funzione chiesta, mai inviata a noi); da confermare con l'avvocato |
| Eventi dell'imbuto del regalo di gruppo (aperture, adesioni, metodo, dichiarazioni, messaggi) | Firestore, lato nostro (`lib/dominio/imbuto.ts`) | No cookie; serve l'informativa |
| **Font del biglietto da fonts.googleapis.com** | ogni apertura di un biglietto chiama Google (`lib/dominio/biglietti.ts:200`) | **Problema**: l'IP del visitatore va a Google. Il Tribunale di Monaco (LG München I, 3 O 17493/20, 20 gennaio 2022) lo ha giudicato illecito senza consenso, perché i font si possono ospitare in casa |
| Immagini da Unsplash e GIF da Giphy nel biglietto | `lib/biglietti/librerie.ts` | Da verificare se le immagini arrivano al browser dai loro server: in quel caso va nell'informativa |
| Link Amazon con il tag affiliato | il cookie lo mette Amazon sul suo sito, dopo il clic | No da parte nostra; va nell'informativa |

Oggi non c'è nessuno strumento di analisi delle visite (né Google Analytics né altro).

## 3. La regola italiana che conta

Linee guida cookie del Garante, provvedimento n. 231 del 10 giugno 2021 (Gazzetta Ufficiale n. 163 del 9 luglio 2021):

- i cookie tecnici non richiedono consenso, solo informativa;
- gli analytics sono trattati come tecnici se servono solo a statistiche aggregate del sito; se sono di terze parti servono misure che riducano il potere identificativo (per esempio l'IP mascherato) e il fornitore non deve incrociare i dati con altri;
- se serve un banner: rifiuto facile come l'accettazione (la X chiude e rifiuta), niente scroll come consenso, niente cookie wall, e non si richiede prima di sei mesi.

Google Analytics 4 (anche via Firebase Analytics) mette identificativi sul dispositivo e i dati vanno a Google: con lui serve il banner.

## 4. Le opzioni per le analisi

| Opzione | Cookie | Banner | Costo | Limiti |
|---|---|---|---|---|
| A. Plausible Cloud | nessuno | no | da circa 9 $/mese (prezzo da confermare su plausible.io) | solo statistiche aggregate; ospitato nell'UE (Germania) |
| B. Plausible o Matomo ospitati da noi | nessuno (Matomo va configurato senza cookie) | no | il server e la manutenzione | qualcuno deve tenerlo acceso e aggiornato |
| C. Solo eventi nostri in Firestore | nessuno | no | quasi zero | niente provenienza delle visite né pagine viste, a meno di costruirle |
| D. Google Analytics 4 / Firebase Analytics | sì | sì, con rifiuto alla pari | gratis | banner su ogni prima visita; trasferimento negli USA da documentare |

Raccomandazione: **A + C**. Plausible per visite, provenienza e pagine; i nostri eventi per l'imbuto (che esiste già per il regalo di gruppo e si estende a idee regalo e biglietto). Niente banner. La scelta del fornitore è di Cri: A e B si equivalgono sul piano legale, cambia chi lo gestisce.

## 5. Che cosa misurare

Pochi eventi, tutti senza dati personali, gli stessi nomi nei due sistemi.

| Servizio | Eventi |
|---|---|
| Idee regalo | inizio domande, domande finite, apertura scheda, clic su «Guarda su Amazon», clic su «Fai un regalo» |
| Regalo di gruppo | creato, link condiviso, aperture, adesioni, dichiarazioni (già nell'imbuto) |
| Biglietto | creato, link condiviso, messaggi lasciati, biglietto aperto da chi festeggia |
| Tutorial | video avviato, «Guarda come si fa» toccato |

Il clic su Amazon è il numero che lega Gifty ai ricavi: va per primo.

## 6. I passi, in ordine

1. **Cri decide**: il titolare del trattamento (quale società firma la privacy), il fornitore (A o B) e l'elenco degli eventi.
2. **Togliere la chiamata a Google Fonts**: i font del biglietto ospitati da noi in `public/`, come già fanno i font del sito con `next/font`. Va fatto comunque, anche senza analisi.
3. Verificare Unsplash e Giphy: se le immagini arrivano dai loro server, scriverlo nell'informativa (oppure copiarle da noi quando si sceglie l'immagine).
4. Installare lo strumento scelto (è un'installazione: serve il sì di Cri) con lo script senza cookie e gli eventi del punto 5.
5. Estendere l'imbuto Firestore a idee regalo e biglietto.
6. Riscrivere la pagina privacy: titolare e contatto, ogni finalità, ogni destinatario (Google per l'accesso, Firebase, Plausible, Amazon, Unsplash, Giphy), tempi di conservazione, diritti; una sezione «Cookie» con l'elenco di ciò che il sito salva sul dispositivo.
7. Prova prima del rilascio: in una finestra pulita, aprire gli strumenti del browser e controllare che prima di qualunque azione ci siano solo voci tecniche e nessuna richiesta a Google Fonts.
8. Far rileggere informativa e scelte a un avvocato prima del lancio pubblico.

## 7. Domande aperte per Cri

- Quale società è il titolare (Something Labs Pte Ltd, Tempura Consulting LLC o altra)? Se è fuori dall'UE e serve utenti italiani, va deciso anche il rappresentante nell'UE (art. 27 GDPR).
- Plausible Cloud o uno strumento ospitato da noi?
- Vanno bene gli eventi del punto 5, o ne serve qualcuno in più?

## Fonti

- Garante privacy, Linee guida cookie e altri strumenti di tracciamento, 10 giugno 2021: [sintesi iubenda](https://www.iubenda.com/it/help/31246-italy-new-cookie-rules), [Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/italian-garante-publishes-updated-guidelines-on-cookies-and-other-tracking-technologies), [Gazzetta Ufficiale via lavoripubblici.it](https://www.lavoripubblici.it/news/gpdp-cookie-linee-guida-gazzetta-ufficiale-26302). Il testo integrale va riletto sul sito del Garante prima del lancio.
- LG München I, 3 O 17493/20, 20 gennaio 2022: [gesetze-bayern.de](https://www.gesetze-bayern.de/Content/Document/Y-300-Z-GRURRS-B-2022-N-612?view=Print).
- Plausible, ospitato nell'UE e senza cookie: [eualternative.eu](https://eualternative.eu/service/plausible); il prezzo va confermato su plausible.io.
