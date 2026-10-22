export interface Utente {
  uid: string;
  nome: string;
  email: string | null;
  /** true per chi partecipa senza account: l'uid serve solo alle regole e a ritrovare la propria riga */
  anonimo: boolean;
}

export type Annulla = () => void;

export interface Autenticazione {
  /** Chiama cb a ogni cambio; la prima chiamata arriva appena lo stato è noto. */
  osserva(cb: (u: Utente | null) => void): Annulla;
  /** Per chi partecipa: l'identità esistente (anche di chi organizza) oppure una anonima, in silenzio. */
  assicuraIdentita(): Promise<Utente>;
  /** Invia il collegamento via email. `accessoImmediato` è true solo nella modalità senza Firebase. */
  inviaLinkEmail(email: string, nome: string): Promise<{ accessoImmediato: boolean }>;
  /** Se l'indirizzo corrente è un collegamento di accesso, lo completa. */
  completaLinkEmail(url: string): Promise<Utente | null>;
  /** `nome`: come vuole essere chiamato chi accede (facoltativo); se manca vale il nome del profilo Google. */
  accediConGoogle(nome?: string): Promise<void>;
  esci(): Promise<void>;
  /** Il token di accesso da mandare al server (solo con Firebase); null nella modalità senza Firebase. */
  token(): Promise<string | null>;
}

export const CHIAVE_UID = "colletta.uid";
export const CHIAVE_EMAIL_ACCESSO = "colletta.emailAccesso";
export const CHIAVE_NOME_ACCESSO = "colletta.nomeAccesso";

/** localStorage può mancare o lanciare (navigazione privata, dati bloccati): mai un errore visibile. */
export function leggiLocale(chiave: string): string | null {
  try {
    return window.localStorage.getItem(chiave);
  } catch {
    return null;
  }
}

export function scriviLocale(chiave: string, valore: string | null): void {
  try {
    if (valore === null) window.localStorage.removeItem(chiave);
    else window.localStorage.setItem(chiave, valore);
  } catch {
    /* ignorato */
  }
}

export function nomeDaEmail(email: string): string {
  const locale = email.split("@")[0] ?? "";
  const parola = locale.split(/[._+-]/)[0] ?? "";
  return parola ? parola.charAt(0).toUpperCase() + parola.slice(1) : "Organizzatore";
}
