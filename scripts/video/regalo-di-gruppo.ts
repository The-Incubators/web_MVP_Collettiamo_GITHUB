// Con pnpm dev in modalità memoria:
// PLAYWRIGHT_MODULE=/percorso/node_modules/playwright pnpm exec tsx scripts/video/regalo-di-gruppo.ts
// Usa Chrome già installato e ffmpeg sul PATH. Il materiale intermedio va in una cartella temporanea.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

type Locator = {
  first(): Locator;
  filter(options: { hasText: RegExp }): Locator;
  getByRole(role: string, options: { name: string | RegExp; exact?: boolean }): Locator;
  waitFor(options?: { state: "hidden" }): Promise<void>;
  scrollIntoViewIfNeeded(): Promise<void>;
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>;
  fill(value: string): Promise<void>;
  click(): Promise<void>;
  check(): Promise<void>;
  getAttribute(name: string): Promise<string | null>;
};

type Page = {
  locator(selector: string): Locator;
  getByRole: Locator["getByRole"];
  getByLabel(name: string, options?: { exact: boolean }): Locator;
  getByText(name: string | RegExp, options?: { exact: boolean }): Locator;
  goto(url: string): Promise<unknown>;
  evaluate<T>(fn: () => T | Promise<T>): Promise<T>;
  setContent(html: string): Promise<void>;
  setDefaultTimeout(ms: number): void;
  screenshot(options: {
    path: string;
    animations?: "disabled";
    style?: string;
    omitBackground?: boolean;
  }): Promise<unknown>;
  mouse: { move(x: number, y: number, options?: { steps: number }): Promise<void> };
};

type Context = {
  addInitScript(fn: (uid: string) => void, uid: string): Promise<void>;
  newPage(): Promise<Page>;
  close(): Promise<void>;
};

type Chromium = {
  launch(options: { channel: "chrome" }): Promise<{
    newContext(options: { viewport: { width: number; height: number }; locale: string; reducedMotion: "reduce" }): Promise<Context>;
    close(): Promise<void>;
  }>;
};

const captions = [
  "Scegli il regalo",
  "Imposti il regalo di gruppo",
  "Mandi il link nella chat",
  "Gli amici aderiscono",
  "Dividi la spesa tra amici",
];
const subtitle = [
  "Dal catalogo scegli «Fai un regalo», poi «Lo regaliamo in gruppo».",
  "Indica per chi è il regalo, quante persone inviti e fino a quando. Scegli come ricevere i rimborsi, controlla e crea.",
  "Il messaggio per WhatsApp è pronto, con l’anteprima del link.",
  "Gli amici aprono il link e aderiscono. Nella pagina del gruppo vedi chi si è iscritto.",
  "Dopo la consegna Gifty divide la spesa tra chi partecipa. Segna i rimborsi ricevuti fino a «Saldato».",
];

const formats = [
  { id: "16x9", width: 1600, height: 900, viewport: { width: 1280, height: 680 }, band: 100 },
  { id: "9x16", width: 1080, height: 1920, viewport: { width: 420, height: 695 }, band: 190 },
];

const base = new URL(process.env.GIFTY_VIDEO_URL ?? "http://127.0.0.1:3000");
if (base.hostname !== "127.0.0.1" && base.hostname !== "localhost") throw new Error("Usa l’app locale.");
if (existsSync(".env.local")) throw new Error("Avvia l’app in modalità memoria, senza .env.local.");
const output = resolve("public/tutorial");
const font = "docs/specs/gifty-ux-v2/prototipi/font/Urbanist.ttf";
const prefix = "regalo-di-gruppo";
const pause = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const dateIn = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const url = (path: string) => new URL(path, base).href;

function ffmpeg(args: string[]) {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
}

async function point(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("Controllo fuori campo");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps: 16 });
  return { x, y };
}

async function click(page: Page, target: Locator) {
  await point(page, target);
  await target.click();
}

async function record(
  browser: Awaited<ReturnType<Chromium["launch"]>>,
  format: (typeof formats)[number],
  folder: string,
) {
  const open = () => browser.newContext({ viewport: format.viewport, locale: "it-IT", reducedMotion: "reduce" });
  const context = await open();
  // Identità finta già autenticata, con lo stesso formato prodotto dall’accesso in memoria.
  await context.addInitScript((uid) => {
    localStorage.setItem("colletta.finto.organizzatore", JSON.stringify({
      uid, nome: "Marco", email: "marco@example.test", anonimo: false, accesso: "email",
    }));
  }, `org-video-${randomUUID()}`);
  const page = await context.newPage();
  page.setDefaultTimeout(9_000);
  const frames: { file: string; chapter: number; seconds: number; x: number; y: number }[] = [];

  async function frame(view: Page, chapter: number, seconds: number, target: Locator) {
    await view.evaluate(() => document.fonts.ready.then(() => undefined));
    const cursor = await point(view, target);
    const file = resolve(folder, `${format.id}-${frames.length}.png`);
    await pause(260);
    await view.screenshot({ path: file, animations: "disabled", style: "nextjs-portal { display: none }" });
    frames.push({ file, chapter, seconds, ...cursor });
  }

  const button = (name: string | RegExp) => page.getByRole("button", { name });
  const link = (name: string | RegExp) => page.getByRole("link", { name });
  const next = () => click(page, button("Continua"));
  const top = () => page.evaluate(() => window.scrollTo(0, 0));

  const guests: Context[] = [];
  const participants: Page[] = [];
  try {
    await page.goto(url("/catalogo?tema=tecnologia&mostra=72"));
    const gift = page.locator('a[href="/fai-un-regalo?prodotto=speaker-bluetooth-retro-verde"]');
    await frame(page, 0, 2.6, gift);
    await click(page, gift);
    const group = page.locator('a[href="/crea?prodotto=speaker-bluetooth-retro-verde"]');
    await frame(page, 0, 2.4, group);
    await click(page, group);

    await page.getByLabel("Nome", { exact: true }).fill("Giulia");
    await click(page, page.getByRole("radio", { name: "Compleanno" }));
    await page.getByLabel("Quando festeggiate").fill(dateIn(14));
    await frame(page, 1, 2.1, page.getByLabel("Nome", { exact: true }));
    await next();
    await page.getByLabel("Persone invitate a partecipare").fill("8");
    await page.getByLabel("Data in cui si chiudono le adesioni").fill(dateIn(7));
    await frame(page, 1, 2.7, page.getByLabel("Data in cui si chiudono le adesioni"));
    await next();
    await page.getByRole("checkbox", { name: "PayPal", exact: true }).check();
    const paypal = page.getByLabel("Nome utente PayPal o link paypal.me");
    await paypal.fill("marco.esempio");
    await frame(page, 1, 1.8, paypal);
    await next();
    const create = button("Crea il regalo di gruppo");
    await frame(page, 1, 2.4, create);
    await click(page, create);

    const manage = page.getByRole("link", { name: "Vai al regalo di gruppo", exact: true });
    await manage.waitFor();
    const managementPath = await manage.getAttribute("href");
    if (!managementPath?.startsWith("/gestisci/")) throw new Error("Manca il link al gruppo creato.");
    const invitation = url(managementPath.replace("/gestisci/", "/c/"));
    await frame(page, 2, 5.0, link(/Condividi su WhatsApp/));
    await click(page, manage);

    const stats = page.locator(".g-cifre > div").first();
    await frame(page, 3, 1.6, stats);
    const names = ["Anna", "Luca", "Sara", "Paolo", "Elena", "Davide", "Chiara"];
    for (const [i, name] of names.entries()) {
      const guest = await open();
      guests.push(guest);
      const invite = await guest.newPage();
      participants.push(invite);
      invite.setDefaultTimeout(9_000);
      await invite.goto(invitation);
      const join = invite.getByRole("button", { name: "Partecipo", exact: true });
      if (i === 0) await frame(invite, 3, 2.1, join);
      await click(invite, join);
      await invite.getByLabel("Oppure con la tua email").fill(`${name.toLowerCase()}@example.test`);
      await click(invite, invite.getByRole("button", { name: "Mandami il link per accedere" }));
      await invite.getByText(/Partecipi al regalo per Giulia/).waitFor();
      if (i === 2 || i === 6) {
        await page.goto(url(managementPath));
        await page.locator(".g-cifre > div").filter({ hasText: new RegExp(`Iscritti\\s*${i + 2}\\s*su 8`) }).waitFor();
        await frame(page, 3, i === 2 ? 1.2 : 2.0, stats);
      }
    }

    const delivered = button(/^Regalo consegnato$/);
    await frame(page, 4, 2.0, delivered);
    await click(page, delivered);
    await page.getByText(/^Regalo consegnato il/).waitFor();
    await top();
    await frame(page, 4, 2.1, page.locator(".g-cifre > div").filter({ hasText: /Quota a testa/ }));
    // Ogni persona dichiara il rimborso con il proprio account locale.
    participants.push(await context.newPage());
    for (const participant of participants) {
      await participant.goto(invitation);
      await click(participant, participant.getByRole("button", { name: "Ho pagato", exact: true }));
      await participant.getByText("In attesa della conferma di Marco", { exact: true }).waitFor();
    }
    await page.goto(url(managementPath));
    for (const [i, name] of [...names, "Marco"].entries()) {
      const row = page.locator(format.id === "16x9" ? ".g-registro tbody tr" : ".g-persona").filter({ hasText: new RegExp(name) });
      const payment = row.getByRole("button", { name: /^Segna ricevuto / });
      if (i === 0) await frame(page, 4, 2.3, payment);
      if (i === 7) await frame(page, 4, 1.5, payment);
      await click(page, payment);
      await payment.waitFor({ state: "hidden" });
    }
    await page.goto(url("/account/regali"));
    const paid = page.locator(`a[href="${managementPath}"] .stato`).filter({ hasText: /^Saldato$/ });
    await frame(page, 4, 2.3, paid);
    return frames;
  } catch (error) {
    console.error(`Ripresa interrotta dopo ${frames.length} inquadrature (${format.id}).`);
    throw error;
  } finally {
    await Promise.all(guests.map((guest) => guest.close()));
    await context.close();
  }
}

type Frame = Awaited<ReturnType<typeof record>>[number];

function mount(format: (typeof formats)[number], frames: Frame[], folder: string) {
  const { width, height, viewport, band } = format;
  const contentHeight = height - band;
  const size = format.id === "16x9" ? 38 : 47;
  const clips: string[] = [];

  for (const [i, frame] of frames.entries()) {
    const file = resolve(folder, `${format.id}-clip-${i}.mp4`);
    const caption = resolve(folder, "caption.txt");
    writeFileSync(caption, captions[frame.chapter]);
    const n = Math.round(frame.seconds * 30);
    const ease = `(1-cos(PI*on/${n}))/2`;
    const focusX = frame.x / viewport.width;
    const focusY = frame.y / viewport.height;
    const cursorX = Math.round(frame.x * width / viewport.width);
    const cursorY = Math.round(frame.y * contentHeight / viewport.height);
    const move = "(1+cos(PI*min(t/0.58,1)))/2";
    const filters = [
      `[0:v]scale=${width * 2}:${contentHeight * 2}:flags=lanczos`,
      `zoompan=z='1+0.042*${ease}':x='(iw-iw/zoom)*${focusX}':y='(ih-ih/zoom)*${focusY}':d=${n}:s=${width}x${contentHeight}:fps=30`,
      `pad=${width}:${height}:0:0:0xF5FAF6`,
      `drawbox=x=0:y=${contentHeight}:w=iw:h=3:color=0xD9E4DC:t=fill`,
      `drawbox=x=${Math.round(width / 2 - 18)}:y=${contentHeight + 16}:w=36:h=4:color=0xFD5D17:t=fill`,
      `drawtext=fontfile=${font}:textfile=${caption}:fontsize=${size}:fontcolor=0x033922:x=(w-tw)/2:y=${contentHeight}+(${band}-th)/2+8[scene]`,
    ].join(",");
    ffmpeg([
      "-i", frame.file, "-i", resolve(folder, "cursor.png"),
      "-filter_complex_threads", "2", "-filter_complex",
      `${filters};[1:v]scale=${format.id === "16x9" ? 30 : 46}:-1[cursor];[scene][cursor]overlay=x='${cursorX}-4-64*${move}':y='${cursorY}-4-34*${move}'`,
      "-an", "-c:v", "libx264", "-threads", "4", "-preset", "fast", "-crf", "24", "-pix_fmt", "yuv420p", file,
    ]);
    clips.push(file);
  }

  const end = resolve(folder, `${format.id}-logo.mp4`);
  ffmpeg([
    "-f", "lavfi", "-i", `color=c=0xF5FAF6:s=${width}x${height}:r=30`, "-i", "public/logo/gifty.png",
    "-filter_complex", `[1:v]scale=${Math.round(width * 0.35)}:-1[logo];[0:v][logo]overlay=(W-w)/2:(H-h)/2,fade=t=in:d=0.25`,
    "-t", "2.4", "-an", "-c:v", "libx264", "-threads", "4", "-crf", "24", "-pix_fmt", "yuv420p", end,
  ]);
  clips.push(end);
  const list = resolve(folder, `${format.id}.txt`);
  writeFileSync(list, clips.map((file) => `file '${file}'`).join("\n"));
  ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", resolve(output, `${prefix}-${format.id}.mp4`)]);

  const preview = clips[frames.findIndex((frame) => frame.chapter === 2)];
  const poster = format.id === "16x9" ? prefix : `${prefix}-9x16`;
  ffmpeg(["-ss", "1.2", "-i", preview, "-frames:v", "1", "-vf", "scale='min(1200,iw)':-1", "-quality", "87", resolve(output, `${poster}.webp`)]);

  if (format.id === "16x9") {
    let time = 0;
    const stamp = (seconds: number) => new Date(Math.round(seconds * 1000)).toISOString().slice(11, 23);
    const cues = subtitle.map((text, chapter) => {
      const start = time;
      time += frames.filter((frame) => frame.chapter === chapter).reduce((sum, frame) => sum + frame.seconds, 0);
      return `${stamp(start)} --> ${stamp(time)}\n${text}`;
    });
    writeFileSync(resolve(output, `${prefix}.vtt`), `WEBVTT\n\n${cues.join("\n\n")}\n`);
  }
}

async function main() {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  const response = await fetch(url("/api/memoria"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metodo: "slugLibero", args: ["demo"], uid: "org-video-marco" }),
  });
  if (!response.ok) throw new Error("Il server locale non risponde in modalità memoria.");
  const load = createRequire(import.meta.url);
  const { chromium } = load(process.env.PLAYWRIGHT_MODULE ?? "playwright") as { chromium: Chromium };
  const browser = await chromium.launch({ channel: "chrome" });
  const folder = mkdtempSync(resolve(tmpdir(), "gifty-video-"));
  mkdirSync(output, { recursive: true });
  try {
    const recordings = [];
    for (const format of formats) {
      console.log(`Riprese ${format.id}`);
      recordings.push(await record(browser, format, folder));
    }
    const graphics = await browser.newContext({ viewport: { width: 64, height: 72 }, locale: "it-IT", reducedMotion: "reduce" });
    const art = await graphics.newPage();
    await art.setContent('<body style="margin:0"><svg width="64" height="72" viewBox="0 0 64 72"><path d="M8 4 L53 42 L32 43 L24 64 Z" fill="#033922" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg></body>');
    await art.screenshot({ path: resolve(folder, "cursor.png"), omitBackground: true });
    await graphics.close();
    for (const [i, format] of formats.entries()) {
      console.log(`Montaggio ${format.id}`);
      mount(format, recordings[i], folder);
    }
  } finally {
    await browser.close();
    rmSync(folder, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
