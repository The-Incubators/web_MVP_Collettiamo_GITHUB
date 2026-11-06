import Link from "next/link";
import type { ReactNode } from "react";
import { IconaTratto } from "@/components/ui/IconaTratto";

/**
 * «La psicologia del dono» (testo di Stefano, 6 nov): per ogni capitolo un testo breve sempre visibile e, dietro
 * «Approfondisci», gli studi che lo reggono. <details> nativo: si apre anche senza JavaScript e la ricerca del browser
 * trova il testo chiuso. Le fonti in fondo restano: sono la prova di ciò che la pagina afferma.
 */
export function PaginaPsicologiaDelDono() {
  return (
    <>
      <section className="apertura">
        <div className="pagina apertura-in">
          <div className="testo">
            <h1 className="t-pagina">La psicologia del dono</h1>
            <p className="t-titolo sottotitolo">
              Perché certi regali ci toccano davvero e altri finiscono in un cassetto? Cosa dicono gli studi su chi regala e chi
              riceve, in breve per chi ha fretta e più nel dettaglio per chi è curioso.
            </p>
          </div>
          <div className="dono-motto">
            <p className="carta mano">L’oggetto porta il regalo, il motivo porta il messaggio.</p>
          </div>
        </div>
      </section>

      <section className="sezione" aria-labelledby="t-in-breve">
        <div className="pagina dono-colonna">
          <h2 id="t-in-breve" className="t-sezione">
            In breve
          </h2>
          <p>
            Quasi un italiano su due ha ricevuto almeno un regalo di Natale che non gli è piaciuto. Il problema di solito non è
            la spesa: è che chi riceve non ritrova sé stesso nel regalo. Quando apriamo un pacchetto ci chiediamo, quasi senza
            accorgercene: <em>perché proprio questo, per me?</em> Decenni di ricerche di psicologia ed economia danno una
            risposta abbastanza chiara.
          </p>
          <ul className="dono-punti">
            <li>
              <strong>Spendere di più non rende un regalo più gradito.</strong> Chi regala ne è convinto, chi riceve in media
              non lo percepisce.
            </li>
            <li>
              <strong>Si ringrazia un’intenzione, non un oggetto.</strong> La gratitudine cresce quando il regalo ci fa
              sentire visti e capiti.
            </li>
            <li>
              <strong>Il pensiero conta, ma solo se si vede.</strong> Chi riceve non immagina da solo quanto ci hai pensato:
              bisogna mostrarglielo.
            </li>
            <li>
              <strong>Quando il regalo non convince, è il motivo a salvarlo.</strong> Un regalo imperfetto scelto con cura
              piace molto più dello stesso regalo scelto a caso.
            </li>
            <li>
              <strong>Ascoltare, ricordare, metterci qualcosa di sé</strong> sono i modi più semplici per dare un motivo a un
              regalo.
            </li>
            <li>
              <strong>Il motivo non sostituisce l’oggetto, lo accompagna.</strong> Il regalo deve servire anche dopo
              l’apertura.
            </li>
          </ul>
          <p>
            In una frase: <strong>l’oggetto porta il regalo, il motivo porta il messaggio.</strong>
          </p>
        </div>
      </section>

      <Capitolo n={1} titolo="Chi riceve non guarda lo scontrino" approfondimento={<Approfondimento1 />}>
        Chi regala tende a pensare che un regalo più caro farà più piacere. Chi riceve, nella maggior parte dei casi, non fa
        questo collegamento: si chiede se il regalo è giusto per lui, non quanto è costato. C’è un’eccezione. Nelle ricorrenze
        in cui il regalo è atteso, come Natale o un compleanno importante, il regalo deve essere all’altezza dell’occasione.
        Superata quella soglia, spendere di più aggiunge poco.
      </Capitolo>

      <Capitolo n={2} titolo="Si ringrazia un’intenzione" approfondimento={<Approfondimento2 />}>
        La gratitudine non è una ricevuta. Nasce quando capiamo che qualcuno ha pensato a noi, ai nostri bisogni, a chi siamo.
        Per questo lo stesso regalo può commuoverci o lasciarci indifferenti: dipende da cosa ci leggiamo dentro.
      </Capitolo>

      <Capitolo n={3} titolo="Il pensiero conta, ma solo se si vede" approfondimento={<Approfondimento3 />}>
        È il risultato più sorprendente. Chi riceve un regalo che gli piace di solito non si chiede quanto ci hai pensato: è
        contento e basta. Il pensiero diventa importante quando qualcosa lo porta in superficie. Un biglietto che spiega perché
        l’hai scelto fa esattamente questo.
      </Capitolo>

      <Capitolo n={4} titolo="Quando il regalo non convince, è il motivo a salvarlo" approfondimento={<Approfondimento4 />}>
        Non sempre si indovina. Ed è proprio allora che il motivo fa la differenza: un regalo poco riuscito, scelto con cura da
        una persona che conosciamo, piace molto di più dello stesso regalo scelto a caso. Il motivo funziona come una rete di
        sicurezza. Finché va tutto bene non la vedi, ma quando qualcosa va storto ti salva.
      </Capitolo>

      <Capitolo n={5} titolo="Ascoltare è già un motivo" approfondimento={<Approfondimento5 />}>
        Chiedere che cosa desidera o seguire una lista sembra poco romantico. Eppure chi riceve giudica spesso{" "}
        <em>più pensato</em> un regalo che aveva desiderato ad alta voce. Per chi riceve, «ci hai pensato» vuol dire
        soprattutto «mi hai ascoltato».
      </Capitolo>

      <Capitolo n={6} titolo="Un ricordo vale più di un oggetto alla moda" approfondimento={<Approfondimento6 />}>
        Una foto di un momento passato insieme, un oggetto legato a una storia comune, un’esperienza da vivere: chi riceve li
        apprezza più spesso di quanto chi regala immagini. Chi regala li evita per paura di sbagliare e ripiega sull’oggetto
        «sicuro».
      </Capitolo>

      <Capitolo n={7} titolo="Mettici un pezzo di te" approfondimento={<Approfondimento7 />}>
        Di solito cerchiamo il regalo che rispecchia chi lo riceve. Ma un regalo che racconta qualcosa anche di chi lo fa, come
        una passione o un luogo del cuore, fa sentire entrambi più vicini. È una piccola confidenza.
      </Capitolo>

      <Capitolo n={8} titolo="La cura che si vede" approfondimento={<Approfondimento8 />}>
        A parità di valore, un gesto curato vale di più: una banconota piegata con pazienza, un fiore disegnato a mano sul
        biglietto, un oggetto fatto con le proprie mani. In questi dettagli chi riceve legge il tempo e l’attenzione che gli
        hai dedicato.
      </Capitolo>

      <Capitolo n={9} titolo="E dopo l’apertura?" approfondimento={<Approfondimento9 />}>
        Chi regala pensa al momento in cui il pacchetto viene aperto: la sorpresa, il sorriso. Chi riceve pensa anche a dopo:
        lo userò? mi servirà? Il regalo più riuscito tiene insieme le due cose: un buon motivo e una buona vita dopo il nastro.
      </Capitolo>

      <section className="sezione" aria-labelledby="t-cinque-modi">
        <div className="pagina dono-colonna">
          <h2 id="t-cinque-modi" className="t-sezione">
            Cinque modi per dare un motivo al regalo
          </h2>
          <ol className="dono-modi">
            <li>
              <strong>Scrivi perché l’hai scelto.</strong> Bastano due righe.
            </li>
            <li>
              <strong>Parti da un ricordo comune.</strong> Un luogo, una battuta, un giorno che conoscete solo voi.
            </li>
            <li>
              <strong>Riprendi qualcosa che ti ha detto.</strong> Ascoltare è già un motivo.
            </li>
            <li>
              <strong>Mettici un pezzo di te.</strong> Una tua passione dentro qualcosa che serve a lui o a lei.
            </li>
            <li>
              <strong>Aggiungi un tocco fatto a mano.</strong> Una confezione curata, un disegno, una dedica scritta da te.
            </li>
          </ol>
          <Approfondisci>
            <p>
              <strong>1. Scrivi perché l’hai scelto.</strong> È il modo più diretto per rendere visibile il pensiero (Zhang ed
              Epley 2012). Non serve essere scrittori. «L’ho visto e ho pensato alle nostre domeniche al lago» dice più di una
              pagina di auguri. Se ti fai aiutare a trovare le parole, l’ultima versione deve essere tua: un messaggio di
              affetto scritto da altri, presentato come proprio, mette a disagio anche chi lo firma.
            </p>
            <p>
              <strong>2. Parti da un ricordo comune.</strong> I regali di valore sentimentale sono quelli che chi riceve
              vorrebbe più spesso (Givi e Galak 2017). Anche un oggetto qualunque cambia significato se richiama una storia
              vostra.
            </p>
            <p>
              <strong>3. Riprendi qualcosa che ti ha detto.</strong> Chi riceve giudica più pensato ciò che aveva desiderato
              (Gino e Flynn 2011). Prova a segnarti, durante l’anno, i «mi piacerebbe…» delle persone a cui tieni.
            </p>
            <p>
              <strong>4. Mettici un pezzo di te.</strong> I regali che rivelano qualcosa di chi li fa avvicinano entrambi
              (Aknin e Human 2015; Paolacci e colleghi 2015). Il libro che ti ha cambiato l’estate, il caffè della tua città.
            </p>
            <p>
              <strong>5. Aggiungi un tocco fatto a mano.</strong> A parità di valore, la cura visibile cambia la risposta
              (Kube e colleghi 2012; Bradler e Neckermann 2019). Non serve saper fare tutto: basta che si veda la tua mano.
            </p>
            <p>
              E se il budget è stretto, ricordalo: un regalo fuori dalle ricorrenze, fatto solo perché pensavi a qualcuno, rende
              felici quasi a prescindere da cosa sia (Givi e Galak 2022).
            </p>
          </Approfondisci>
        </div>
      </section>

      <section className="apertura dono-chiusura" aria-labelledby="t-chiusura">
        <div className="pagina dono-colonna">
          <h2 id="t-chiusura" className="t-sezione">
            Non serve spendere di più. Serve dire qualcosa di vero.
          </h2>
          <p>
            Il regalo giusto è un oggetto che funziona, accompagnato da un motivo che si vede. Noi ti aiutiamo a trovare il
            primo. Il secondo è tuo, e possiamo aiutarti a scriverlo.
          </p>
          <div className="azioni">
            <Link className="btn btn-primario" href="/regalo">
              Trova il regalo
            </Link>
            <Link className="btn btn-contorno" href="/biglietto/nuovo">
              Scrivi il biglietto
            </Link>
          </div>
        </div>
      </section>

      <section className="sezione" aria-labelledby="t-fonti">
        <div className="pagina dono-colonna dono-fonti">
          <h2 id="t-fonti" className="t-sezione">
            Fonti
          </h2>
          {FONTI.map((g) => (
            <div key={g.titolo}>
              <h3>{g.titolo}</h3>
              <ul>
                {g.voci.map((v) => (
                  <li key={v.url}>
                    {v.testo}{" "}
                    <a href={v.url} target="_blank" rel="noopener noreferrer">
                      {v.link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Capitolo({ n, titolo, approfondimento, children }: { n: number; titolo: string; approfondimento: ReactNode; children: ReactNode }) {
  return (
    <section className="sezione" aria-labelledby={`t-capitolo-${n}`}>
      <div className="pagina dono-capitolo">
        <span className="dono-numero t-cifra" aria-hidden="true">
          {n}
        </span>
        <div className="dono-colonna">
          <h2 id={`t-capitolo-${n}`} className="t-sezione">
            <span className="sr-only">{n}. </span>
            {titolo}
          </h2>
          <p>{children}</p>
          <Approfondisci>{approfondimento}</Approfondisci>
        </div>
      </div>
    </section>
  );
}

/** Il testo nascosto dietro «Approfondisci»: la pillola del sistema (come «Leggi tutto»), mai un link di testo. */
function Approfondisci({ children }: { children: ReactNode }) {
  return (
    <details className="dono-approfondisci">
      <summary className="btn btn-quieto">
        <span className="se-chiuso">Approfondisci</span>
        <span className="se-aperto">Riduci</span>
        <IconaTratto nome="dx" />
      </summary>
      <div className="dono-studi">{children}</div>
    </details>
  );
}

function Approfondimento1() {
  return (
    <>
      <p>
        Nel 2009 Francis Flynn e Gabrielle Adams, a Stanford, hanno messo a confronto chi regala e chi riceve in tre studi. Il
        primo riguardava gli anelli di fidanzamento, il secondo i regali di compleanno, il terzo un regalo di laurea: un lettore
        iPod o un CD. Il risultato è stato sempre lo stesso. Chi regalava era convinto che più spendeva, più l’altro avrebbe
        apprezzato. In chi riceveva quel legame non c’era.
      </p>
      <p>
        Gli autori spiegano lo scarto così: chi regala usa il prezzo per dimostrare di averci pensato. Chi riceve, però, cerca il
        pensiero altrove.
      </p>
      <p>
        Più di recente, nel 2022, Julian Givi e Jeff Galak hanno aggiunto un dettaglio importante. Un regalo fatto «senza
        motivo», fuori da qualsiasi ricorrenza, rende felici quasi a prescindere da cosa sia: il gesto stesso dice «ci tengo a
        te». Nelle ricorrenze invece il regalo è atteso, e deve raggiungere una qualità minima perché il messaggio arrivi. Lì
        l’oggetto conta di più.
      </p>
      <p>
        Anche gli economisti ci hanno ragionato. Nel 1993 Joel Waldfogel stimò che i regali di Natale valgono per chi li riceve
        dal 10% a un terzo in meno del loro prezzo. Tre anni dopo Sara Solnick e David Hemenway chiesero invece quanto denaro
        avrebbe reso le persone «ugualmente felici». Così più della metà dei regali risultava valere <em>più</em> del prezzo
        pagato. Tra le due stime c’è il valore sentimentale, quello che lo scontrino non registra.
      </p>
    </>
  );
}

function Approfondimento2() {
  return (
    <>
      <p>
        Nel 2008 Sara Algoe, Jonathan Haidt e Shelly Gable hanno seguito tre confraternite femminili di un’università americana
        durante una settimana dedicata ai regali alle nuove iscritte. Le ragazze annotavano ogni regalo ricevuto e quanto si
        sentivano grate. La gratitudine dipendeva soprattutto da quanto il regalo sembrava pensato e attento a loro. Il costo
        contava, ma come indizio di quell’attenzione. Un mese dopo, chi aveva provato più gratitudine si sentiva più legata a chi
        l’aveva festeggiata.
      </p>
      <p>
        Qualche anno prima Daniel Ames, Francis Flynn ed Elke Weber avevano osservato lo stesso fenomeno a proposito degli aiuti
        in generale. Chi riceve si chiede <em>come</em> l’altro ha deciso di aiutarlo: per affetto, per dovere o per calcolo. Se
        percepisce affetto, vuole frequentare di più quella persona e ricambiare. Il calcolo pesa soprattutto sui gesti piccoli,
        perché lì nessuno si aspetta una contabilità.
      </p>
      <p>
        Un esperimento di Jo-Ann Tsang del 2006, ripetuto nel 2025 con un protocollo dichiarato in anticipo, va nella stessa
        direzione. A parità di favore ricevuto, ci si sente più grati se l’intenzione era generosa. Il senso di essere in debito,
        invece, non cambia.
      </p>
      <p>
        Secondo Algoe la gratitudine ha una funzione precisa: ci aiuta a riconoscere chi è attento a noi e ci spinge ad
        avvicinarci a quella persona. Un regalo è uno dei modi più chiari per farsi riconoscere.
      </p>
    </>
  );
}

function Approfondimento3() {
  return (
    <>
      <p>
        Nel 2012 Yan Zhang e Nicholas Epley hanno messo alla prova il detto «è il pensiero che conta». In quattro esperimenti
        hanno coinvolto oltre 700 visitatori di un museo di Chicago.
      </p>
      <p>
        Prima hanno chiesto alle persone di ricordare un regalo ricevuto. Per i regali graditi, quanto il donatore ci avesse
        pensato non cambiava l’apprezzamento. Per i regali non graditi, invece, contava moltissimo.
      </p>
      <p>
        Poi hanno cambiato l’ordine delle domande. Se chiedevano prima di riflettere sull’impegno di chi aveva regalato, il
        pensiero contava anche per i regali graditi. La spiegazione degli autori è semplice: i pensieri sono invisibili. Chi
        riceve non li cerca da solo, a meno che qualcosa non lo inviti a farlo.
      </p>
      <p>
        C’è anche una buona notizia per chi regala. In un altro esperimento, chi sceglieva il regalo con cura si sentiva poi più
        vicino alla persona a cui l’aveva dato, anche quando questa non se ne accorgeva. Il pensiero fa bene prima di tutto a chi
        lo fa.
      </p>
      <p>
        Il consiglio pratico viene da sé: se ci hai pensato, dillo. Due righe sul perché di quel regalo trasformano un pensiero
        invisibile in qualcosa che si può leggere.
      </p>
    </>
  );
}

function Approfondimento4() {
  return (
    <>
      <p>
        Nello stesso studio di Zhang ed Epley, alcune coppie di conoscenti si scambiavano davvero un piccolo regalo. Chi regalava
        poteva sceglierlo con attenzione o a caso. Quando il regalo era poco attraente, la scelta accurata ne alzava nettamente
        l’apprezzamento (7,38 contro 5,74). Quando il regalo era già bello, non cambiava nulla. Tra sconosciuti l’effetto
        spariva: dove non c’è una relazione, il motivo non ha niente a cui appoggiarsi.
      </p>
      <p>
        Il meccanismo è intuitivo. Un regalo che non ci convince ci fa chiedere «perché me l’ha regalato?», e in quel momento la
        risposta pesa più dell’oggetto.
      </p>
      <p>
        Il rovescio della medaglia l’ha studiato Elizabeth Dunn con alcuni colleghi nel 2008. Dopo un regalo sbagliato dalla
        partner, gli uomini si sentivano meno simili a lei e immaginavano una relazione più breve. Un regalo sbagliato senza un
        motivo visibile può dire «non mi conosci».
      </p>
      <p>
        Per chi ha paura di sbagliare il messaggio è rassicurante: non serve il regalo perfetto. Serve un regalo scelto per una
        ragione, e quella ragione detta ad alta voce.
      </p>
    </>
  );
}

function Approfondimento5() {
  return (
    <>
      <p>
        Nel 2011 Francesca Gino e Francis Flynn hanno studiato liste nozze, liste dei desideri online e regali scelti in
        laboratorio, in cinque esperimenti. Chi riceveva apprezzava di più i regali che aveva chiesto e li considerava anche più
        premurosi. Chi regalava era convinto del contrario: pensava che una sorpresa fuori lista avrebbe fatto più colpo.
      </p>
      <p>
        La lezione non è «niente sorprese». È che il motivo più forte è spesso il più semplice: ho ricordato quello che mi avevi
        detto. Una frase lasciata cadere a settembre e ripresa a dicembre vale più di qualsiasi trovata.
      </p>
      <p>
        Un’avvertenza vale anche per i suggerimenti, compresi i nostri. In uno studio giapponese del 2026 su 567 persone, chi
        riceveva un regalo provava meno gratitudine se sapeva che l’aveva suggerito un’intelligenza artificiale e non una
        persona. Un suggerimento aiuta a trovare l’idea. Il motivo deve restare tuo.
      </p>
    </>
  );
}

function Approfondimento6() {
  return (
    <>
      <p>
        Nel 2017 Julian Givi e Jeff Galak, alla Carnegie Mellon University, hanno messo le persone davanti a una scelta. Da una
        parte un regalo di valore sentimentale, come la foto di un ricordo condiviso. Dall’altra un regalo in linea con i gusti,
        come la maglia della squadra del cuore. Chi riceve avrebbe voluto il regalo sentimentale più spesso di quanto chi regala
        lo scegliesse. Il motivo dell’esitazione: un regalo sentimentale sembra più rischioso, e chi regala teme di sbagliare.
      </p>
      <p>
        Lo stesso anno Cindy Chan e Cassie Mogilner hanno studiato scambi di regali reali tra amici e partner. I regali da
        vivere, come un concerto o una lezione, rafforzavano la relazione più degli oggetti. Non contava quanto piacessero
        all’apertura, ma l’emozione provata mentre si vivevano. Funzionavano bene anche gli oggetti capaci di emozionare: una foto
        incorniciata, un gioiello con una frase incisa. E non era necessario vivere l’esperienza insieme.
      </p>
      <p>
        Il punto comune: i regali che portano con sé un pezzo di storia condivisa dicono «ci siamo», non solo «ti conosco».
      </p>
    </>
  );
}

function Approfondimento7() {
  return (
    <>
      <p>
        Nel 2015 Lara Aknin e Lauren Human hanno confrontato, in sei studi, due modi di scegliere un regalo: pensando ai gusti di
        chi lo riceve o a ciò che rappresenta chi lo fa. Quasi tutti dichiaravano di preferire il primo modo, sia nel fare sia nel
        ricevere. Eppure, misurando la vicinanza dopo lo scambio, erano i regali che rivelavano qualcosa di chi li faceva a far
        sentire entrambi più vicini. Le autrici lo leggono come un atto di apertura: regalare un pezzo di sé è un modo di farsi
        conoscere.
      </p>
      <p>
        Lo stesso anno Gabriele Paolacci, Laura Straeter e Ilona de Hooge hanno osservato che un regalo legato a un tratto
        importante di chi lo fa piace di più. Una tazza con un’immagine del Louvre otteneva 5,83 su 7 se chi la regalava era un
        appassionato di Francia, 5,27 se amava l’Inghilterra.
      </p>
      <p>
        Conta però che sia un tratto vero e centrale. Una passione di una vita va bene, un interesse di un pomeriggio no. E il
        regalo deve restare un regalo per l’altro: un pezzo di te dentro qualcosa che serve a lui o a lei.
      </p>
    </>
  );
}

function Approfondimento8() {
  return (
    <>
      <p>
        Nel 2012 tre economisti, Sebastian Kube, Michel Maréchal e Clemens Puppe, hanno condotto un esperimento in una
        biblioteca. Ad alcuni lavoratori hanno dato un bonus di 7 euro in contanti, ad altri una borraccia dello stesso valore. Il
        regalo in natura ha aumentato la produttività in media del 25%, il contante molto meno. L’effetto più forte l’ha avuto lo
        stesso denaro, ma piegato a origami. Curiosamente, potendo scegliere, quasi tutti avrebbero preferito i soldi.
      </p>
      <p>
        Christiane Bradler e Susanne Neckermann hanno ottenuto un risultato simile con due esperimenti sul campo. Denaro e
        biglietto di ringraziamento funzionavano bene insieme solo quando c’era un tocco personale fatto a mano, come un fiore
        disegnato sul biglietto.
      </p>
      <p>
        Già nel 1994 Henry Robben e Theo Verhallen avevano notato che chi riceve preferisce i regali costati a chi li fa tempo e
        impegno, non solo denaro. Chi regala, invece, tende a non tenerne conto.
      </p>
      <p>
        Nel 2015 Christoph Fuchs e i suoi colleghi hanno mostrato che percepiamo gli oggetti fatti a mano come se «contenessero
        amore». L’effetto è forte quando il regalo è per una persona cara e sparisce per i semplici conoscenti.
      </p>
    </>
  );
}

function Approfondimento9() {
  return (
    <>
      <p>
        Nel 2016 Jeff Galak, Julian Givi ed Elanor Williams hanno riletto molti studi sugli errori nei regali e hanno trovato uno
        schema ricorrente. Chi regala ottimizza il momento dell’apertura: l’effetto sorpresa, la reazione immediata. Chi riceve
        valuta il regalo nel tempo: quanto lo usa, quanto gli è utile, quanto continua a piacergli.
      </p>
      <p>
        Da qui viene un limite onesto a tutto ciò che abbiamo detto finora. Il motivo rende un regalo più caro, ma non rende
        utile un regalo inutile. L’oggetto resta il veicolo del messaggio: se si rompe dopo una settimana o resta in un cassetto,
        porta con sé anche il motivo.
      </p>
      <p>
        Una buona domanda da farsi prima di comprare: tra tre mesi lo userà ancora? Se la risposta è sì e sai dire perché l’hai
        scelto, hai trovato un buon regalo.
      </p>
    </>
  );
}

const FONTI: { titolo: string; voci: { testo: ReactNode; link: string; url: string }[] }[] = [
  {
    titolo: "Dati italiani",
    voci: [
      {
        testo: "Indagine Ipsos Doxa per eBay sui regali di Natale non graditi (2025):",
        link: "TechPrincess",
        url: "https://techprincess.it/regali-indesiderati-natale-indagine-ebay/",
      },
    ],
  },
  {
    titolo: "Prezzo e valore",
    voci: [
      {
        testo: (
          <>
            Flynn, F. J., e Adams, G. S. (2009). <em>Money can’t buy love: Asymmetric beliefs about gift price and feelings of appreciation</em>.
            Journal of Experimental Social Psychology.
          </>
        ),
        link: "Link",
        url: "https://doi.org/10.1016/j.jesp.2008.11.003",
      },
      {
        testo: (
          <>
            Givi, J., e Galak, J. (2022). <em>Gift recipients’ beliefs about occasion-based and nonoccasion-based gifts</em>. Journal of
            Consumer Psychology.
          </>
        ),
        link: "Link",
        url: "https://doi.org/10.1002/jcpy.1239",
      },
      {
        testo: (
          <>
            Waldfogel, J. (1993) e Solnick, S. J., e Hemenway, D. (1996). <em>The deadweight loss of Christmas</em>. American Economic
            Review.
          </>
        ),
        link: "Sintesi Bruegel",
        url: "https://www.bruegel.org/blog-post/microeconomics-christmas",
      },
    ],
  },
  {
    titolo: "Gratitudine e intenzione",
    voci: [
      {
        testo: (
          <>
            Algoe, S. B., Haidt, J., e Gable, S. L. (2008). <em>Beyond reciprocity: Gratitude and relationships in everyday life</em>. Emotion.
          </>
        ),
        link: "Link",
        url: "https://doi.org/10.1037/1528-3542.8.3.425",
      },
      {
        testo: (
          <>
            Ames, D. R., Flynn, F. J., e Weber, E. U. (2004). <em>It’s the thought that counts: On perceiving how helpers decide to lend a hand</em>.
            Personality and Social Psychology Bulletin.
          </>
        ),
        link: "Link",
        url: "https://collaborate.princeton.edu/en/publications/its-the-thought-that-counts-on-perceiving-how-helpers-decide-to-l/",
      },
      {
        testo: (
          <>
            Tsang, J.-A. (2006). <em>The effects of helper intention on gratitude and indebtedness</em>. Motivation and Emotion. Replica
            preregistrata:
          </>
        ),
        link: "Link",
        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12042844/",
      },
      {
        testo: (
          <>
            Algoe, S. B. (2012). <em>Find, remind, and bind: The functions of gratitude in everyday relationships</em>. Social and Personality
            Psychology Compass.
          </>
        ),
        link: "Link",
        url: "https://doi.org/10.1111/j.1751-9004.2012.00439.x",
      },
    ],
  },
  {
    titolo: "Il pensiero e quando si vede",
    voci: [
      {
        testo: (
          <>
            Zhang, Y., e Epley, N. (2012). <em>Exaggerated, mispredicted, and misplaced: When “it’s the thought that counts” in gift exchanges</em>.
            Journal of Experimental Psychology: General.
          </>
        ),
        link: "Link",
        url: "https://pubmed.ncbi.nlm.nih.gov/22774790/",
      },
      {
        testo: (
          <>
            Dunn, E. W., Huntsinger, J., Lun, J., e Sinclair, S. (2008). <em>The gift of similarity: How good and bad gifts influence relationships</em>.
            Social Cognition.
          </>
        ),
        link: "Link",
        url: "https://collaborate.princeton.edu/en/publications/the-gift-of-similarity-how-good-and-bad-gifts-influence-relations/",
      },
      {
        testo: (
          <>
            Gino, F., e Flynn, F. J. (2011). <em>Give them what they want: The benefits of explicitness in gift exchange</em>. Journal of
            Experimental Social Psychology.
          </>
        ),
        link: "Sintesi Stanford",
        url: "https://www.gsb.stanford.edu/insights/give-them-gift-theyre-expecting",
      },
      {
        testo: (
          <>
            Ioku, T., e Watamura, E. (2026). <em>Gift giving with AI assistant</em>. Japanese Association of Industrial/Organizational
            Psychology Journal.
          </>
        ),
        link: "Link",
        url: "https://www.jstage.jst.go.jp/article/jaiop/39/2/39_211/_article/-char/en",
      },
    ],
  },
  {
    titolo: "Significato, ricordi, esperienze",
    voci: [
      {
        testo: (
          <>
            Givi, J., e Galak, J. (2017). <em>Sentimental value and gift giving: Givers’ fears of getting it wrong prevents them from getting it right</em>.
            Journal of Consumer Psychology.
          </>
        ),
        link: "Sintesi",
        url: "https://sciencedaily.com/releases/2017/07/170725100701.htm",
      },
      {
        testo: (
          <>
            Chan, C., e Mogilner, C. (2017). <em>Experiential gifts foster stronger social relationships than material gifts</em>. Journal of
            Consumer Research.
          </>
        ),
        link: "Link",
        url: "https://doi.org/10.1093/jcr/ucw067",
      },
      {
        testo: (
          <>
            Aknin, L. B., e Human, L. J. (2015). <em>Give a piece of you: Gifts that reflect givers promote closeness</em>. Journal of
            Experimental Social Psychology.
          </>
        ),
        link: "Link",
        url: "https://doi.org/10.1016/j.jesp.2015.04.006",
      },
      {
        testo: (
          <>
            Paolacci, G., Straeter, L., e de Hooge, I. (2015). <em>Give me your self: Gifts are liked more when they match the giver’s characteristics</em>.
            Journal of Consumer Psychology.
          </>
        ),
        link: "Link",
        url: "https://doi.org/10.1016/j.jcps.2015.01.006",
      },
    ],
  },
  {
    titolo: "La cura e il fatto a mano",
    voci: [
      {
        testo: (
          <>
            Kube, S., Maréchal, M. A., e Puppe, C. (2012). <em>The currency of reciprocity: Gift exchange in the workplace</em>. American
            Economic Review.
          </>
        ),
        link: "Sintesi AEA",
        url: "https://www.aeaweb.org/research/workplace-gift-exchange",
      },
      {
        testo: (
          <>
            Bradler, C., e Neckermann, S. (2019). <em>The magic of the personal touch: Field experimental evidence on money and appreciation as gifts</em>.
            Scandinavian Journal of Economics.
          </>
        ),
        link: "Link",
        url: "https://papers.tinbergen.nl/16045.pdf",
      },
      {
        testo: (
          <>
            Robben, H. S. J., e Verhallen, T. M. M. (1994). <em>Behavioral costs as determinants of cost perception and preference formation for gifts to receive and gifts to give</em>.
            Journal of Economic Psychology.
          </>
        ),
        link: "Link",
        url: "https://repository.tilburguniversity.edu/items/10666738-7a06-4869-ad0f-099eabdb610d",
      },
      {
        testo: (
          <>
            Fuchs, C., Schreier, M., e van Osselaer, S. M. J. (2015). <em>The handmade effect: What’s love got to do with it?</em> Journal of
            Marketing.
          </>
        ),
        link: "Link",
        url: "https://doi.org/10.1509/jm.14.0018",
      },
    ],
  },
  {
    titolo: "Dopo l’apertura",
    voci: [
      {
        testo: (
          <>
            Galak, J., Givi, J., e Williams, E. F. (2016). <em>Why certain gifts are great to give but not to get</em>. Current Directions in
            Psychological Science.
          </>
        ),
        link: "Link",
        url: "https://journals.sagepub.com/doi/10.1177/0963721416656937",
      },
      {
        testo: "Hass, D., Kirk, C. P., e Givi, J. Sui messaggi d’affetto scritti con l’intelligenza artificiale. The Conversation.",
        link: "Link",
        url: "https://theanswerdetroit.com/news/technology/whether-its-valentines-day-notes-or-emails-to-loved-ones-using-ai-to-write-leave/78d5279614e12113e8178a5d53af5387",
      },
    ],
  },
];
