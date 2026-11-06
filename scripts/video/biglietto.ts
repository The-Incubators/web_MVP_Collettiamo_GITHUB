// Con pnpm dev in modalità memoria e Chrome e ffmpeg già disponibili:
// PLAYWRIGHT_MODULE=/percorso/node_modules/playwright pnpm exec tsx scripts/video/biglietto.ts
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

type Locator = {
  first(): Locator;
  nth(index: number): Locator;
  waitFor(options?: { state: "hidden" }): Promise<void>;
  scrollIntoViewIfNeeded(): Promise<void>;
  click(): Promise<void>;
  fill(value: string): Promise<void>;
  pressSequentially(value: string, options: { delay: number }): Promise<void>;
};
type Page = {
  goto(url: string): Promise<unknown>;
  addStyleTag(options: { content: string }): Promise<unknown>;
  setContent(html: string): Promise<void>;
  screenshot(options: { path: string; omitBackground: boolean }): Promise<unknown>;
  locator(selector: string): Locator;
  getByRole(role: string, options: { name: string | RegExp; exact?: boolean }): Locator;
  getByLabel(name: string, options?: { exact: boolean }): Locator;
  getByText(name: string, options?: { exact: boolean }): Locator;
  getByAltText(name: string): Locator;
  evaluate<T>(fn: () => T | Promise<T>): Promise<T>;
  waitForEvent(event: "filechooser"): Promise<{ setFiles(path: string): Promise<void> }>;
  setDefaultTimeout(ms: number): void;
  close(): Promise<void>;
};
type Context = {
  newPage(): Promise<Page>;
  addInitScript(fn: (uid: string) => void, uid: string): Promise<void>;
  route(url: string, handler: (route: { request(): { url(): string }; continue(): Promise<void>; abort(): Promise<void> }) => Promise<void>): Promise<void>;
  newCDPSession(page: Page): Promise<{
    on(event: "Page.screencastFrame", listener: (frame: { data: string; sessionId: number; metadata: { timestamp: number } }) => void): void;
    send(method: string, params?: Record<string, unknown>): Promise<unknown>;
    detach(): Promise<void>;
  }>;
  close(): Promise<void>;
};
type Viewport = { width: number; height: number };
type Browser = {
  newContext(options: { viewport: Viewport; locale: string; reducedMotion: "reduce" | "no-preference"; permissions?: string[] }): Promise<Context>;
  close(): Promise<void>;
};

const phone = { width: 412, height: 840 };
const formats = [
  { id: "16x9", width: 1600, height: 900, viewport: { width: 1120, height: 600 }, band: 90 },
  { id: "9x16", width: 1080, height: 1920, viewport: phone, band: 130 },
] as const;
type Format = (typeof formats)[number];
type Take = { list: string; duration: number; seconds: number; caption: string; subtitle: string; phone: boolean };

const friends = [
  ["Chiara", "Ti pensiamo tutti, oggi più che mai.", "Menta"],
  ["Paolo", "Un abbraccio grande da tutto l’ufficio!", "Albicocca"],
  ["Elena", "Sei una persona speciale. Grazie di esserci.", "Lavanda"],
  ["Marco", "La torta la porto io.", "Pesca"],
  ["Luca", "Cento di questi giorni, e di queste pause caffè.", "Giallo"],
  ["Sara", "Stasera si festeggia!", "Rosa"],
] as const;

const base = new URL(process.env.GIFTY_VIDEO_URL ?? "http://127.0.0.1:3000");
const output = resolve(process.env.GIFTY_VIDEO_OUTPUT ?? "public/tutorial");
const font = "docs/specs/gifty-ux-v2/prototipi/font/Urbanist.ttf";
const pause = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const url = (path: string) => new URL(path, base).href;
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const radio = (page: Page, name: string | RegExp) => page.getByRole("radio", { name });

function ffmpeg(args: string[]) {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
}

async function openContext(browser: Browser, viewport: Viewport, motion = false) {
  const context = await browser.newContext({
    viewport, locale: "it-IT", reducedMotion: motion ? "no-preference" : "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  // Fuori dall’app sono ammessi soltanto i file pubblici del font delle icone.
  await context.route("**/*", (route) => {
    const target = new URL(route.request().url());
    const font = target.origin === "https://fonts.googleapis.com" || target.origin === "https://fonts.gstatic.com";
    return target.origin === base.origin || font ? route.continue() : route.abort();
  });
  return context;
}

async function openPage(context: Context, path: string) {
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  await page.goto(url(path));
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return page;
}

async function shoot(context: Context, page: Page, directory: string, action: () => Promise<void>) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  mkdirSync(directory);
  const cdp = await context.newCDPSession(page);
  const frames: { file: string; time: number }[] = [];
  cdp.on("Page.screencastFrame", ({ data, sessionId, metadata }) => {
    void cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    const file = resolve(directory, `${frames.length}.jpg`);
    writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, time: metadata.timestamp });
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, everyNthFrame: 1 });
  let end: number;
  try {
    await pause(150);
    await action();
    end = Date.now() / 1000;
  } finally {
    await cdp.send("Page.stopScreencast");
    await cdp.detach();
  }
  const first = frames[0];
  const last = frames.at(-1);
  if (!first || !last) throw new Error(`Nessun fotogramma in ${directory}.`);
  const tail = Math.max(end, last.time + 1 / 30);
  const list = resolve(directory, "frames.txt");
  const lines = frames.flatMap((frame, i) => [
    `file '${frame.file}'`,
    `duration ${Math.max(1 / 120, (frames[i + 1]?.time ?? tail) - frame.time).toFixed(6)}`,
  ]);
  writeFileSync(list, [...lines, `file '${last.file}'`].join("\n"));
  return { list, duration: tail - first.time };
}

async function record(browser: Browser, format: Format, folder: string): Promise<Take[]> {
  const organiser = await openContext(browser, format.viewport);
  await organiser.addInitScript((uid) => {
    localStorage.setItem("colletta.finto.organizzatore", JSON.stringify({
      uid, nome: "Anna", email: "anna@example.test", anonimo: false, accesso: "email",
    }));
  }, `org-video-${randomUUID()}`);
  const recipient = await openContext(browser, phone, true);
  const takes: Take[] = [];
  async function take(
    context: Context, page: Page, seconds: number, caption: string, subtitle: string,
    action: () => Promise<void>,
  ) {
    const directory = resolve(folder, `${format.id}-take-${takes.length}`);
    console.log(`${format.id} · ${takes.length + 1} · ${subtitle}`);
    const footage = await shoot(context, page, directory, action);
    takes.push({ ...footage, seconds, caption, subtitle, phone: context === recipient });
  }

  try {
    const wizard = await openPage(organiser, "/biglietto/nuovo");
    const next = () => button(wizard, "Avanti").click();
    async function step(title: string, subtitle: string, seconds: number, action: () => Promise<void>) {
      await wizard.getByRole("heading", { name: title, exact: true }).waitFor();
      await take(organiser, wizard, seconds, "Crea il biglietto per Marta", subtitle, action);
    }

    await step("Che cosa si festeggia?", "Scegli Compleanno", 1.4, async () => {
      await radio(wizard, "Compleanno").click();
      await pause(500);
    });
    await next();
    await step("A chi è dedicato?", "Scrivi Marta", 1.7, async () => {
      await wizard.getByLabel("Nome di chi festeggiamo").pressSequentially("Marta", { delay: 105 });
      await pause(540);
    });
    await next();
    await step("Stile", "Scegli la carta pesca", 1.4, async () => {
      await radio(wizard, "Pesca").click();
      await pause(530);
    });
    await next();
    await step("Come lo scoprirà", "Scegli l’apertura Film", 1.5, async () => {
      await radio(wizard, /^Film/).click();
      await pause(560);
    });
    await next();
    await step("Ritocchi finali", "Controlla il titolo", 1.4, async () => {
      await wizard.getByLabel("Titolo", { exact: true }).waitFor();
      await pause(670);
    });
    await next();
    const manage = wizard.getByRole("heading", { name: "Il biglietto per Marta" });
    await step("Ci siamo", "Controlla e crea il biglietto", 1.8, async () => {
      await pause(600);
      await button(wizard, "Crea il biglietto").click();
      await manage.waitFor();
    });

    const copy = button(wizard, "Copia il link");
    await copy.scrollIntoViewIfNeeded();
    await take(organiser, wizard, 2.5, "Manda il link agli amici", "Anna copia il link", async () => {
      await pause(550);
      await copy.click();
      await wizard.getByText("Link copiato: incollalo dove vuoi.").waitFor();
      await pause(930);
    });
    const link = new URL(await wizard.evaluate(() => navigator.clipboard.readText()));
    if (link.origin !== base.origin || !link.pathname.startsWith("/b/")) throw new Error("Link di firma non locale.");

    for (const [i, [name, message, colour]] of friends.entries()) {
      const guest = await openContext(browser, format.viewport);
      try {
        const page = await openPage(guest, link.pathname);
        const start = button(page, "Lascia il tuo messaggio");
        const form = page.getByRole("form", { name: "Il tuo bigliettino" });
        const publish = button(page, "Pubblica sul biglietto");
        await start.waitFor();
        if (i === 0) {
          await take(guest, page, 3.1, "Scrivono gli auguri", "Chiara scrive e firma", async () => {
            await pause(380);
            await start.click();
            await page.getByLabel("Il tuo messaggio").fill(message);
            await page.getByLabel("Il tuo nome").pressSequentially(name, { delay: 70 });
            await radio(page, colour).click();
            await pause(520);
          });
          await take(guest, page, 2.6, "Aggiungono una foto", "Chiara carica una foto", async () => {
            const chooser = page.waitForEvent("filechooser");
            await button(page, "Foto").click();
            await (await chooser).setFiles(resolve(`public/biglietto-esempio/${name.toLowerCase()}.jpg`));
            await page.getByAltText("La foto del tuo messaggio").scrollIntoViewIfNeeded();
            await pause(550);
            await publish.click();
            await form.waitFor({ state: "hidden" });
            await pause(450);
          });
        } else {
          await start.click();
          await page.getByLabel("Il tuo messaggio").fill(message);
          await page.getByLabel("Il tuo nome").fill(name);
          await radio(page, colour).click();
          const chooser = page.waitForEvent("filechooser");
          await button(page, "Foto").click();
          await (await chooser).setFiles(resolve(`public/biglietto-esempio/${name.toLowerCase()}.jpg`));
          await page.getByAltText("La foto del tuo messaggio").waitFor();
          await publish.click();
          await form.waitFor({ state: "hidden" });
        }
      } finally {
        await guest.close();
      }
    }

    await wizard.evaluate(() => location.reload());
    await manage.waitFor();
    await wizard.locator(".firme-b li").nth(5).waitFor();
    const deliver = button(wizard, "Manda il biglietto a Marta");
    await deliver.scrollIntoViewIfNeeded();
    await take(organiser, wizard, 2.6, "Manda il biglietto a Marta", "Il biglietto ha sei firme", async () => {
      await pause(480);
      await deliver.click();
      await button(wizard, "Consegna").click();
      await button(wizard, "Riapri per altri messaggi").waitFor();
      await pause(360);
    });

    const film = await openPage(recipient, link.pathname);
    const openFilm = button(film, "Apri il biglietto");
    await openFilm.waitFor();
    await take(recipient, film, 7.4, "Marta apre il biglietto", "La busta si apre", async () => {
      await pause(650);
      await openFilm.click();
      await film.locator(".coriandolo").first().waitFor();
      await film.getByRole("article", { name: "Messaggio di Chiara" }).waitFor();
      await pause(1900);
    });
    await film.close();

    async function changeMode(name: RegExp) {
      await button(wizard, "Modifica come lo scopre").click();
      await radio(wizard, name).click();
      await wizard.getByRole("dialog", { name: "Come lo scoprirà" }).waitFor({ state: "hidden" });
    }

    await changeMode(/^Storia/);
    const story = await openPage(recipient, link.pathname);
    await button(story, "Apri il biglietto").click();
    await story.getByRole("article", { name: "Messaggio di Chiara" }).waitFor();
    await take(recipient, story, 3.5, "Storia, una firma alla volta", "Marta tocca per andare avanti", async () => {
      await pause(1000);
      await button(story, "Avanti").click();
      await story.getByText("2 di 6", { exact: true }).waitFor();
      await pause(2050);
    });
    await story.close();

    await changeMode(/^Griglia/);
    const grid = await openPage(recipient, link.pathname);
    await button(grid, "Apri il biglietto").click();
    await grid.locator(".muro .foglietto-firma").nth(5).waitFor();
    await pause(3700);
    await take(recipient, grid, 4.2, "Griglia, tutti i messaggi insieme", "Sei messaggi, sei foto", async () => {
      await pause(700);
      await grid.evaluate(() => {
        const notes = document.querySelector(".muro .foglietti");
        const bottom = notes?.getBoundingClientRect().bottom ?? window.innerHeight;
        window.scrollBy({ top: bottom - window.innerHeight + 30, behavior: "smooth" });
      });
      await pause(3150);
    });
    return takes;
  } finally {
    await recipient.close();
    await organiser.close();
  }
}

const endSeconds = 1.6;

function phonePosition(format: Format) {
  const area = format.height - format.band;
  const h = area - (format.id === "16x9" ? 56 : 104);
  const w = Math.round(h * phone.width / phone.height / 2) * 2;
  return { w, h, x: (format.width - w) / 2, y: (area - h) / 2 };
}

async function phoneFrame(browser: Browser, format: Format, folder: string) {
  const { width, height, band } = format;
  const area = height - band;
  const { x, y, w, h } = phonePosition(format);
  const frame = await openContext(browser, { width, height: area });
  const file = resolve(folder, `${format.id}-telefono.png`);
  try {
    const page = await frame.newPage();
    // L'apertura trasparente ritaglia solo gli angoli della ripresa originale.
    const r = format.id === "16x9" ? 28 : 49;
    const bezel = format.id === "16x9" ? 10 : 17;
    const hole = `M${x + r} ${y}H${x + w - r}q${r} 0 ${r} ${r}V${y + h - r}q0 ${r} -${r} ${r}H${x + r}q-${r} 0 -${r} -${r}V${y + r}q0 -${r} ${r} -${r}Z`;
    await page.setContent(`<body style="margin:0">
      <svg width="${width}" height="${area}" style="display:block">
        <defs><mask id="screen">
          <rect width="100%" height="100%" fill="white"/>
          <path d="${hole}" fill="black"/>
        </mask></defs>
        <g mask="url(#screen)">
          <rect width="100%" height="100%" fill="#e9f2ec"/>
          <path d="M-20 ${area * 0.68}C${width * 0.24} ${area * 0.5} ${width * 0.26} ${area * 0.9} ${width * 0.52} ${area * 0.67}S${width * 0.84} ${area * 0.27} ${width + 20} ${area * 0.47}"
            fill="none" stroke="#fd5d17" stroke-width="9"/>
          <rect x="${x - bezel + 2}" y="${y - bezel + 7}" width="${w + bezel * 2}" height="${h + bezel * 2}" rx="${r + bezel}" fill="#033922" opacity=".18"/>
          <rect x="${x - bezel}" y="${y - bezel}" width="${w + bezel * 2}" height="${h + bezel * 2}" rx="${r + bezel}" fill="#142b20"/>
        </g>
        <rect x="${(width - w * 0.2) / 2}" y="${y + bezel}" width="${w * 0.2}" height="${bezel}" rx="${bezel / 2}" fill="#142b20"/>
      </svg>
    </body>`);
    await page.screenshot({ path: file, omitBackground: true });
  } finally {
    await frame.close();
  }
  return file;
}

function mount(format: Format, takes: Take[], folder: string, frame: string) {
  const { width, height, band } = format;
  const area = height - band;
  const { w, h, x, y } = phonePosition(format);
  const caption = resolve(folder, "caption.txt");
  if (takes.some(({ caption, subtitle }) => [caption, subtitle].some((line) => line.trim().split(/\s+/).length > 6))) {
    throw new Error("Le didascalie possono avere al massimo sei parole.");
  }
  const clips = takes.map((take, i) => {
    const file = resolve(folder, `${format.id}-clip-${i}.mp4`);
    writeFileSync(caption, take.caption);
    const filters = [
      // Seleziona un estratto a velocità reale per Marta. Solo i passaggi operativi si adattano al montaggio.
      take.phone ? "setpts=PTS-STARTPTS" : `setpts=${(take.seconds / take.duration).toFixed(6)}*(PTS-STARTPTS)`,
      "fps=30",
      take.phone
        ? `scale=${w}:${h}:flags=lanczos,pad=${width}:${area}:${x}:${y}:0xE9F2EC[schermo];[schermo][1:v]overlay`
        : `scale=${width}:${area}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,pad=${width}:${area}:(ow-iw)/2:(oh-ih)/2:0xE9F2EC`,
      `pad=${width}:${height}:0:0:0xF5FAF6`,
      `drawbox=x=${width / 2 - 20}:y=${area + 14}:w=40:h=4:color=0xFD5D17:t=fill`,
      `drawtext=fontfile=${font}:textfile=${caption}:fontsize=${format.id === "16x9" ? 39 : 50}:fontcolor=0x033922:x=(w-tw)/2:y=${area}+(${band}-th)/2+6`,
      `tpad=stop_mode=clone:stop_duration=${take.seconds}`,
    ];
    ffmpeg([
      "-f", "concat", "-safe", "0", "-i", take.list,
      ...(take.phone ? ["-i", frame, "-filter_complex"] : ["-vf"]), filters.join(","),
      "-t", String(take.seconds), "-an", "-c:v", "libx264", "-threads", "4", "-preset", "fast",
      "-crf", "25", "-pix_fmt", "yuv420p", file,
    ]);
    return file;
  });

  const end = resolve(folder, `${format.id}-logo.mp4`);
  ffmpeg([
    "-f", "lavfi", "-i", `color=c=0xF5FAF6:s=${width}x${height}:r=30`, "-i", "public/logo/gifty.png",
    "-filter_complex", `[1:v]scale=${Math.round(width * 0.32)}:-1[logo];[0:v][logo]overlay=(W-w)/2:(H-h)/2`,
    "-t", String(endSeconds), "-an", "-c:v", "libx264", "-threads", "4", "-crf", "25", "-pix_fmt", "yuv420p", end,
  ]);
  const list = resolve(folder, `${format.id}.txt`);
  writeFileSync(list, [...clips, end].map((file) => `file '${file}'`).join("\n"));
  const path = resolve(output, `biglietto-${format.id}.mp4`);
  ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", path]);
  if (statSync(path).size >= 6_000_000) throw new Error(`Il video ${format.id} supera 6 MB.`);
  const poster = clips[takes.findIndex((take) => take.phone)];
  ffmpeg(["-ss", "0.35", "-i", poster, "-frames:v", "1", "-vf", "scale='min(1200,iw)':-1",
    "-quality", "87", resolve(output, `biglietto-${format.id}.webp`)]);
}

function subtitles(takes: Take[]) {
  let time = 0;
  const stamp = (seconds: number) => new Date(Math.round(seconds * 1000)).toISOString().slice(11, 23);
  const cues = takes.map((take) => {
    const start = time;
    time += take.seconds;
    return `${stamp(start)} --> ${stamp(time)}\n${take.subtitle}`;
  });
  cues.push(`${stamp(time)} --> ${stamp(time + endSeconds)}\nGifty`);
  writeFileSync(resolve(output, "biglietto-it.vtt"), `WEBVTT\n\n${cues.join("\n\n")}\n`);
}

async function main() {
  if (!["localhost", "127.0.0.1"].includes(base.hostname) || existsSync(".env.local")) {
    throw new Error("Usa l’app locale in modalità memoria, senza .env.local.");
  }
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  const probe = await fetch(url("/api/memoria"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metodo: "slugLibero", args: ["demo"], uid: "org-video-prova" }),
  });
  if (!probe.ok || !(await probe.json()).ok) throw new Error("Avvia l’app in modalità memoria.");

  const load = createRequire(import.meta.url);
  const { chromium } = load(process.env.PLAYWRIGHT_MODULE ?? "playwright") as {
    chromium: { launch(options: { channel: "chrome" }): Promise<Browser> };
  };
  const browser = await chromium.launch({ channel: "chrome" });
  const folder = mkdtempSync(resolve(tmpdir(), "gifty-biglietto-"));
  mkdirSync(output, { recursive: true });
  try {
    for (const format of formats) {
      const takes = await record(browser, format, folder);
      const frame = await phoneFrame(browser, format, folder);
      mount(format, takes, folder, frame);
      subtitles(takes);
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
