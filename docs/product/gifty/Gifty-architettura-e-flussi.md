# Gifty: architettura e flussi

_Proposta del 5 novembre 2026, da approvare prima di toccare la UX o aggiungere funzioni. Base: le decisioni D-01…D-19 di `Gifty-spec-prodotto.md`. Dove questo documento cambia la specifica, lo dice._

## 1. Regole che valgono ovunque

1. **Un ingresso per ogni cosa che si fa.** Idee regalo, Regalo di gruppo e Biglietto sono tre servizi, ognuno con la sua voce di menu. Nessuno sta dentro un altro.
2. **Le persone hanno un nome, non un ruolo.** La stessa persona organizza un regalo ed è invitata a un altro. L'interfaccia scrive «organizzato da Cri», «Marco ha aderito», mai «Organizzatore» o «Partecipante» come etichetta.
3. **Niente avvisi né spiegazioni senza un motivo reale.** Un riquadro informativo c'è solo se, senza, la persona sbaglia o perde qualcosa. Per esempio «Se scegli la votazione, nessuno paga finché non vince un regalo» si toglie.
4. **Stessa intestazione e stesso menu su tutte le pagine**, comprese quelle del biglietto e del gruppo. Fanno eccezione solo le pagine che vede il festeggiato.

## 2. Navigazione

| Dove | Voci |
|---|---|
| Intestazione, da tablet in su | logo (porta alla home) · Idee regalo · Regalo di gruppo · Biglietto · cuore dei Preferiti con il numero · tondo dell'account |
| Intestazione, da 1024px in su | in più, dopo Biglietto: «Cosa rende un regalo davvero gradito?» (`/psicologia-del-dono`); è lunga, fino a 1180px va su due righe |
| Barra in basso, telefono (massimo 5) | Home · Idee regalo · Gruppo · Biglietto · Account |

Sul telefono i Preferiti si raggiungono dal cuore nell'intestazione e dall'account; «Cosa rende un regalo davvero gradito?» dal piè di pagina, sotto Idee regalo (la barra ha già cinque voci). **Cambia la specifica §5**: il biglietto diventa una voce di menu e non sta più sotto Idee regalo.

## 3. Mappa delle pagine

```
Home  /
├─ Idee regalo  /idee
│   ├─ Trova il regalo (domande)  /regalo  → catalogo filtrato
│   ├─ Catalogo  /catalogo
│   └─ Scheda prodotto  /prodotto/[slug]   azioni: cuore · Guarda su Amazon · Regalalo in gruppo
├─ Regalo di gruppo  /regalo-di-gruppo     spiega le due partenze
│   ├─ Crea  /crea                          partenza A o B (§4.1, §4.2)
│   ├─ Il tuo gruppo  /gestisci/[slug]      persone, regalo o voto, quote, Reminder, biglietto, consegna
│   └─ Pagina del gruppo per chi è invitato  /c/[slug]
├─ Biglietto  /biglietto                    spiega il biglietto e mostra l'esempio
│   ├─ Crea  /biglietto/nuovo
│   ├─ Gestisci  /biglietto/[id]/gestisci
│   └─ Firma e apertura  /b/[slug]
├─ Preferiti  /preferiti
└─ Account  /account
    ├─ I miei regali di gruppo              quelli che organizzo e quelli a cui partecipo, insieme
    ├─ I miei biglietti
    ├─ Ricorrenze  /reminder → /account/ricorrenze
    ├─ Preferiti
    └─ Profilo, Esci
Accesso  /accedi   torna sempre alla pagina di partenza
Privacy  /privacy
```

## 4. Flussi

### 4.1 Regalo di gruppo, partenza A: «Facciamo il regalo?» (prima le adesioni)

Oggi manca del tutto: il wizard parte dalla scelta del prodotto.

1. **Per chi è:** nome del festeggiato, occasione, data.
2. **Da dove parti:** «Prima raccolgo le adesioni».
3. **Quanto chiedi a testa:** quota proposta, per esempio 10 €.
4. **Quante persone ci sono nella chat**, la data limite per aderire e «Partecipi anche tu alla divisione?», già spuntato.
5. **Come ti rimborsano:** PayPal, Satispay, IBAN, contanti.
6. **Accesso**, solo qui. La bozza resta.
7. **Condividi:** messaggio pronto per WhatsApp con il link.

Poi, nel gruppo: le persone aderiscono (4 su 10) → si sceglie il regalo nel budget, uno solo o con una votazione (D-05) → la quota si ricalcola → acquisto → consegna → Reminder a chi non ha pagato.

### 4.2 Regalo di gruppo, partenza B: «Ho scelto il regalo»

Come la A, ma al passo 3 si sceglie il regalo dal catalogo o da un link. «Aggiungi un altro regalo da votare» aggiunge opzioni, da 2 a 5. La quota è il prezzo diviso fra le persone attese. Da una scheda prodotto, «Regalalo in gruppo» apre questo flusso con il regalo già scelto.

### 4.3 Chi riceve il link

1. Apre `/c/[slug]` da WhatsApp e vede il festeggiato, chi organizza (per nome) e il regalo o lo scopo (D-14).
2. Tocca **Partecipo** → accesso con Google o con il link via email → torna sulla stessa pagina, adesione salvata.
3. Vota o suggerisce, se c'è una votazione.
4. Paga la quota fuori da Gifty e tocca «Ho pagato».
5. Firma il biglietto del gruppo.
6. Ritrova tutto in Account → I miei regali di gruppo, con «organizzato da Marco».

Oggi chi partecipa scrive solo il nome e resta anonimo; l'adesione legata all'account arriva con la fase 3.

### 4.4 Biglietto

- **Da solo:** Biglietto → Crea → design, dedica, consegna → link da mandare a chi firma → link per il festeggiato. Si ritrova in Account → I miei biglietti.
- **Del gruppo:** dalla pagina del gruppo, «Prepara il biglietto» crea lo stesso biglietto già collegato al regalo (D-19). Firmano le persone che hanno aderito.

### 4.5 Idee regalo

Domande o catalogo → scheda prodotto → cuore (va nei Preferiti), «Guarda su Amazon» per comprarlo da soli, oppure «Regalalo in gruppo» (§4.2).

### 4.6 Account

Una sola lista «I miei regali di gruppo», ordinata per data, con il nome di chi organizza su ogni regalo: «organizzato da Cri» o «organizzato da Marco». Da un regalo mio si va a `/gestisci/[slug]`, da uno a cui partecipo a `/c/[slug]`.

## 5. Che cosa c'è oggi e che cosa manca

| Flusso | Oggi | Manca |
|---|---|---|
| 4.1 Prima le adesioni | Non esiste | Tutto: partenza, quota senza prodotto, scelta del regalo dopo (C-01) |
| 4.2 Regalo scelto | Wizard in 6 passi che parte dal prodotto; il voto blocca le adesioni (C-02) | Persone attese e data limite, adesione durante il voto |
| 4.3 Chi riceve il link | Nome senza account, recupero per nome (C-03) | Partecipo con accesso, una riga per account |
| 4.4 Biglietto | Area separata senza menu del sito; nell'account solo il link per crearne uno | Voce di menu, intestazione comune, elenco nell'account |
| 4.5 Idee regalo | C'è; il biglietto sta sotto Idee regalo | Spostare il biglietto |
| 4.6 Account | Solo i regali che organizzo | Anche quelli a cui partecipo, con i nomi |

## 6. Ordine di lavoro proposto

1. **Approvazione** di questo documento.
2. **Struttura:** Biglietto nel menu e intestazione comune, account con i nomi, avvisi inutili tolti. Solo pagine che esistono già.
3. **Audit UX delle funzioni esistenti**, flusso per flusso: catalogo e scheda, Trova il regalo, wizard di oggi, pagina del gruppo, pagina di chi partecipa, biglietto. Ogni problema con schermata e soluzione, approvato prima di correggerlo.
4. **Correzioni UX** di quell'audit.
5. Poi le funzioni nuove: partenza A, adesione con account (fase 3 della specifica).
