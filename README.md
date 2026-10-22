# Regaloop (Colletta)

Web app per organizzare un regalo di gruppo in Italia: si sceglie il regalo, il gruppo vota, ognuno paga la sua quota e si firma un biglietto digitale. Nome di progetto: «Cosa gli regaliamo?». Nel codice e nell'infrastruttura il nome resta `colletta`.

**Principio fondante:** i soldi non passano mai dal servizio. Chi partecipa paga direttamente chi organizza (PayPal, Satispay, IBAN, contanti).

## Due porte d'ingresso

- **«Cerco un'idea»**: catalogo di prodotti selezionati (Amazon.it, link affiliati) e percorso «Trova il regalo» (`/regalo`).
- **«Organizzo un regalo di gruppo»**: si crea la colletta, si condivide un link nel gruppo WhatsApp, chi partecipa entra senza registrarsi.

## Cosa fa oggi

| Funzione | Rotte |
|---|---|
| Catalogo, scheda prodotto, preferiti | `/catalogo`, `/prodotto/[slug]`, `/preferiti` |
| Creazione della colletta (wizard) | `/crea` |
| Votazione del regalo | dentro la colletta |
| Pagina di chi partecipa | `/c/[slug]` |
| Dashboard e chiusura di chi organizza | `/gestisci/[slug]`, `/le-mie-collette` |
| Biglietto digitale | `/biglietto`, `/b/[slug]` |
| Ordine del catalogo (area riservata) | `/backoffice/catalogo` |
| Varianti di UX (V1, V2, V3) | `/scegli-ux`, `/v2`, `/v3` |

Online: https://colletta--users-database-e7ac6.europe-west4.hosted.app

## Stack

Next.js 15.5, React 19.1, Tailwind 3.4, Firebase (Firestore, database `colletta`; Auth), pnpm 10. Pubblicato su Firebase App Hosting, backend `colletta`, regione europe-west4.

## Avvio in locale

```bash
pnpm install
pnpm dev
```

Senza le variabili Firebase l'app gira in **modalità memoria**: i dati vivono nel processo del server e si perdono al riavvio. Per usare Firestore copia `.env.local.example` in `.env.local` e compila tutte le variabili, client e Admin.

Controlli: `pnpm typecheck`, `pnpm lint`, `pnpm test`; regole Firestore con `pnpm test:rules` (servono gli emulatori Firebase e Java).

## Documenti

- `PROMPT_PROTOTIPO_COLLETTA.md`: specifica completa (modello dati, regole, schermate).
- `DECISIONI.md`: scelte prese, limiti noti, cosa è verificato e cosa no. Da leggere prima di cambiare qualcosa.
- `AMAZON_AFFILIATES_API.md`: integrazione con il programma di affiliazione Amazon.

## Limiti noti

Dettagli in `DECISIONI.md`, sezioni 1 e 10.

- Chi ha lo slug di una colletta può leggere i dati di pagamento di chi organizza.
- Il progetto Firebase è condiviso con altre app.
- Mai provato su un telefono vero né in un'anteprima WhatsApp.
