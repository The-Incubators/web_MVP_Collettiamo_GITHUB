// Con pnpm dev in modalità memoria:
// PLAYWRIGHT_MODULE=/percorso/node_modules/playwright pnpm exec tsx scripts/video/regalo-di-gruppo.ts
// Usa Chrome, ffmpeg e la voce Alice di macOS già installati. Il materiale intermedio va in una cartella temporanea.
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
  pressSequentially(value: string, options: { delay: number }): Promise<void>;
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
  addStyleTag(options: { content: string }): Promise<unknown>;
  setDefaultTimeout(ms: number): void;
  mouse: { move(x: number, y: number): Promise<void> };
};

type ScreencastFrame = { data: string; sessionId: number; metadata: { timestamp: number } };

type Context = {
  newCDPSession(page: Page): Promise<{
    on(event: "Page.screencastFrame", listener: (frame: ScreencastFrame) => void): void;
    send(method: string, params?: Record<string, unknown>): Promise<unknown>;
    detach(): Promise<void>;
  }>;
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
const scenes = [
  { chapter: 0, seconds: 5, voice: "Dal catalogo, tocca «Fai un regalo», poi «Lo regaliamo in gruppo»." },
  { chapter: 1, seconds: 10, voice: "Scrivi il nome di Giulia, invita otto persone e fissa la scadenza. Scegli come farti rimborsare, controlla e crea il gruppo." },
  { chapter: 2, seconds: 6.4, voice: "Apri WhatsApp. Il messaggio è già pronto, con il link e l’anteprima del regalo." },
  { chapter: 3, seconds: 3.4, voice: "Gli amici aprono il link e toccano «Partecipo»." },
  { chapter: 3, seconds: 3.4, voice: "Nel gruppo vedi le adesioni salire fino a otto." },
  { chapter: 4, seconds: 3.8, voice: "Alla consegna, Gifty calcola la quota a testa." },
  { chapter: 4, seconds: 3.6, voice: "Segni i rimborsi man mano che li ricevi." },
  { chapter: 4, seconds: 2.6, voice: "Ora il regalo risulta saldato." },
];
const endSeconds = 1.6;

const formats = [
  { id: "16x9", width: 1600, height: 900, viewport: { width: 1280, height: 640 }, band: 100 },
  { id: "9x16", width: 1080, height: 1920, viewport: { width: 432, height: 692 }, band: 190 },
];

const base = new URL(process.env.GIFTY_VIDEO_URL ?? "http://127.0.0.1:3000");
if (base.hostname !== "127.0.0.1" && base.hostname !== "localhost") throw new Error("Usa l’app locale.");
if (existsSync(".env.local")) throw new Error("Avvia l’app in modalità memoria, senza .env.local.");
const output = resolve(process.env.GIFTY_VIDEO_OUTPUT ?? "public/tutorial");
const font = "docs/specs/gifty-ux-v2/prototipi/font/Urbanist.ttf";
const prefix = "regalo-di-gruppo";
const pause = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const dateIn = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const url = (path: string) => new URL(path, base).href;

function ffmpeg(args: string[]) {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
}

const cursors = new WeakMap<Page, { x: number; y: number }>();
const pointer = `
  nextjs-portal { display: none !important; }
  #tutorial-pointer { position: fixed; width: 27px; height: 31px; z-index: 2147483647;
    left: 0; top: 0; pointer-events: none; filter: drop-shadow(0 1px 2px #142b2055); }
`;

async function point(page: Page, target: Locator, animated = true) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("Controllo fuori campo");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.evaluate(() => {
    if (document.getElementById("tutorial-pointer")) return;
    const cursor = document.createElement("div");
    cursor.id = "tutorial-pointer";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<svg viewBox="0 0 64 72"><path d="M8 4L53 42L32 43L24 64Z" fill="#033922" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>';
    document.body.append(cursor);
    document.addEventListener("pointermove", (event) => {
      cursor.style.transform = `translate(${event.clientX - 3}px,${event.clientY - 2}px)`;
    }, { passive: true });
  });
  const from = cursors.get(page) ?? { x: Math.max(12, x - 55), y: Math.max(12, y - 36) };
  const steps = animated ? 10 : 1;
  for (let i = 1; i <= steps; i++) {
    const mix = (1 - Math.cos(Math.PI * i / steps)) / 2;
    await page.mouse.move(from.x + (x - from.x) * mix, from.y + (y - from.y) * mix);
    if (animated) await pause(14);
  }
  cursors.set(page, { x, y });
}

async function click(page: Page, target: Locator, animated = true) {
  if (animated) await point(page, target);
  await target.click();
}

type Take = { list: string; duration: number };

async function shoot(context: Context, page: Page, directory: string, action: () => Promise<void>): Promise<Take> {
  await page.addStyleTag({ content: pointer });
  mkdirSync(directory);
  const cdp = await context.newCDPSession(page);
  const frames: { file: string; time: number }[] = [];
  cdp.on("Page.screencastFrame", ({ data, sessionId, metadata }) => {
    void cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    const file = resolve(directory, `${frames.length}.jpg`);
    writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, time: metadata.timestamp });
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 });
  let end = 0;
  try {
    await pause(170);
    await action();
    end = Date.now() / 1000;
  } finally {
    await cdp.send("Page.stopScreencast");
    await cdp.detach();
  }
  if (frames.length < 2) throw new Error(`Ripresa incompleta: ${directory}`);
  const list = resolve(directory, "frames.txt");
  const tail = Math.max(end, frames.at(-1)!.time + 1 / 30);
  const lines = frames.flatMap((frame, i) => [
    `file '${frame.file}'`,
    `duration ${Math.max(1 / 120, (frames[i + 1]?.time ?? tail) - frame.time).toFixed(6)}`,
  ]);
  lines.push(`file '${frames.at(-1)!.file}'`);
  writeFileSync(list, lines.join("\n"));
  return { list, duration: tail - frames[0].time };
}

async function prepareWhatsApp(page: Page) {
  // La ripresa resta locale. La chat ricostruisce il passaggio usando il messaggio e l'anteprima di Gifty.
  await page.evaluate(() => {
    const share = document.querySelector<HTMLAnchorElement>('a[href*="wa.me"]');
    const preview = document.querySelector(".wa-anteprima");
    const link = document.querySelector<HTMLSpanElement>(".wa-link");
    const text = link?.parentElement?.textContent;
    if (!share || !preview || !link || !text) throw new Error("Manca l’anteprima WhatsApp.");
    const chat = document.createElement("section");
    chat.id = "tutorial-wa";
    chat.innerHTML = `<style>
      #tutorial-wa { position:fixed; inset:0; z-index:9000; display:grid; grid-template-rows:auto 1fr auto; font:18px system-ui,sans-serif;
        background:#ebe4d9; color:#142b20; opacity:0; transform:translateY(12px); transition:opacity 220ms ease,transform 220ms ease; pointer-events:none; }
      #tutorial-wa.is-open { opacity:1; transform:none; pointer-events:auto; }
      #tutorial-wa header { position:static; background:#075e54; color:white; padding:22px 24px; display:grid; gap:3px; }
      #tutorial-wa header small { color:#e2f4ed; font-size:14px; }
      #tutorial-wa main { width:min(100% - 28px, 660px); margin:0 auto; padding:26px 0; display:flex; flex-direction:column; align-items:flex-end; }
      #tutorial-wa .draft { width:min(100% - 28px,660px); margin:0 auto 24px; display:flex; align-items:flex-end; gap:10px; }
      #tutorial-wa .message { background:#dcf8c6; border-radius:12px 12px 2px 12px; padding:12px; max-width:540px; overflow-wrap:anywhere; }
      #tutorial-wa .draft .message { background:white; flex:1; min-width:0; }
      #tutorial-wa .wa-anteprima { background:#c9e8b7; margin-bottom:8px; }
      #tutorial-wa .message p { margin:0; line-height:1.35; }
      #tutorial-wa .message a { color:#075e54; text-decoration:underline; }
      #tutorial-wa button { flex:none; width:48px; height:48px; background:#075e54; color:white; border-radius:100%; border:none; }
      #tutorial-wa .time { display:block; text-align:right; font-size:12px; color:#46685e; margin-top:4px; }
    </style><header><b>Compleanno di Giulia</b><small>WhatsApp · Chat di esempio</small></header><main></main>
    <div class="draft"><div class="message"></div><button type="button" aria-label="Invia nella chat di esempio">➤</button></div>`;
    const draft = chat.querySelector(".message")!;
    draft.append(preview.cloneNode(true));
    const p = document.createElement("p");
    const linkText = link.textContent ?? "";
    p.append(text.slice(0, text.length - linkText.length));
    const anchor = document.createElement("a");
    anchor.href = linkText;
    anchor.textContent = "Apri l’invito su Gifty";
    p.append(anchor);
    draft.append(p);
    share.addEventListener("click", (event) => {
      event.preventDefault();
      chat.classList.add("is-open");
    });
    chat.querySelector("button")!.addEventListener("click", () => {
      chat.querySelector("main")!.append(draft);
      const status = document.createElement("span");
      status.className = "time";
      status.textContent = "10:24  ✓✓";
      draft.append(status);
      chat.querySelector(".draft")!.remove();
      draft.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 220 });
    });
    document.body.append(chat);
  });
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
  const takes: Take[] = [];
  const take = async (owner: Context, view: Page, action: () => Promise<void>) => {
    takes.push(await shoot(owner, view, resolve(folder, `${format.id}-take-${takes.length}`), action));
  };
  const button = (name: string | RegExp) => page.getByRole("button", { name });
  const link = (name: string | RegExp) => page.getByRole("link", { name });
  const next = () => click(page, button("Continua"));
  const top = () => page.evaluate(() => window.scrollTo(0, 0));

  const guests: Context[] = [];
  const participants: Page[] = [];
  try {
    await page.goto(url("/catalogo?tema=tecnologia&mostra=72"));
    const gift = page.locator('a[href="/fai-un-regalo?prodotto=speaker-bluetooth-retro-verde"]');
    const group = page.locator('a[href="/crea?prodotto=speaker-bluetooth-retro-verde"]');
    await gift.scrollIntoViewIfNeeded();
    await take(context, page, async () => {
      await point(page, gift);
      await pause(800);
      await gift.click();
      await group.waitFor();
      await page.addStyleTag({ content: pointer });
      await pause(550);
      await point(page, group);
      await pause(650);
      await group.click();
      await page.getByLabel("Nome", { exact: true }).waitFor();
    });

    const name = page.getByLabel("Nome", { exact: true });
    const create = button("Crea il regalo di gruppo");
    const manage = page.getByRole("link", { name: "Vai al regalo di gruppo", exact: true });
    await take(context, page, async () => {
      await point(page, name);
      await name.pressSequentially("Giulia", { delay: 95 });
      await click(page, page.getByRole("radio", { name: "Compleanno" }));
      await page.getByLabel("Quando festeggiate").fill(dateIn(14));
      await pause(520);
      await next();
      const count = page.getByLabel("Persone invitate a partecipare");
      await point(page, count);
      await count.fill("8");
      const deadline = page.getByLabel("Data in cui si chiudono le adesioni");
      await point(page, deadline);
      await deadline.fill(dateIn(7));
      await pause(760);
      await next();
      const paypalChoice = page.getByRole("checkbox", { name: "PayPal", exact: true });
      await point(page, paypalChoice);
      await paypalChoice.check();
      const paypal = page.getByLabel("Nome utente PayPal o link paypal.me");
      await paypal.pressSequentially("marco.esempio", { delay: 38 });
      await pause(540);
      await next();
      await pause(1120);
      await click(page, create);
      await manage.waitFor();
      await pause(450);
    });

    const managementPath = await manage.getAttribute("href");
    if (!managementPath?.startsWith("/gestisci/")) throw new Error("Manca il link al gruppo creato.");
    const invitation = url(managementPath.replace("/gestisci/", "/c/"));
    const share = link(/Condividi su WhatsApp/);
    await prepareWhatsApp(page);
    await take(context, page, async () => {
      await point(page, share);
      await pause(1050);
      await share.click();
      const send = button("Invia nella chat di esempio");
      await pause(930);
      await point(page, send);
      await send.click();
      await pause(1050);
      await point(page, link("Apri l’invito su Gifty"));
      await pause(600);
    });

    const names = ["Anna", "Luca", "Sara", "Paolo", "Elena", "Davide", "Chiara"];
    for (let i = 0; i < names.length; i++) {
      const guest = await open();
      guests.push(guest);
      const invite = await guest.newPage();
      participants.push(invite);
      invite.setDefaultTimeout(9_000);
      await invite.goto(invitation);
    }
    async function join(invite: Page, name: string, visible: boolean) {
      await click(invite, invite.getByRole("button", { name: "Partecipo", exact: true }), visible);
      await invite.getByLabel("Oppure con la tua email").fill(`${name.toLowerCase()}@example.test`);
      await click(invite, invite.getByRole("button", { name: "Mandami il link per accedere" }), visible);
      await invite.getByText(/Partecipi al regalo per Giulia/).waitFor();
    }
    await take(guests[0], participants[0], async () => {
      await pause(470);
      await join(participants[0], names[0], true);
      await pause(830);
    });

    await page.goto(url(managementPath));
    const stats = page.locator(".g-cifre > div").first();
    const countAt = (count: number) =>
      page.locator(".g-cifre > div").filter({ hasText: new RegExp(`Iscritti\\s*${count}\\s*su 8`) });
    await countAt(2).waitFor();
    await take(context, page, async () => {
      await point(page, stats);
      await pause(500);
      for (const [i, participant] of participants.slice(1).entries()) await join(participant, names[i + 1], false);
      await countAt(8).waitFor();
      await pause(800);
    });

    const delivered = button(/^Regalo consegnato$/);
    await delivered.scrollIntoViewIfNeeded();
    await take(context, page, async () => {
      await point(page, delivered);
      await pause(520);
      await delivered.click();
      await page.getByText(/^Regalo consegnato il/).waitFor();
      await top();
      await point(page, page.locator(".g-cifre > div").filter({ hasText: /Quota a testa/ }));
      await pause(1040);
    });

    participants.push(await context.newPage());
    for (const participant of participants) {
      await participant.goto(invitation);
      await click(participant, participant.getByRole("button", { name: "Ho pagato", exact: true }), false);
      await participant.getByText("In attesa della conferma di Marco", { exact: true }).waitFor();
    }
    await page.goto(url(managementPath));
    const paymentFor = (name: string) =>
      page.locator(format.id === "16x9" ? ".g-registro tbody tr" : ".g-persona")
        .filter({ hasText: new RegExp(name) })
        .getByRole("button", { name: /^Segna ricevuto / });
    for (const name of names.slice(0, 6)) {
      const payment = paymentFor(name);
      await payment.click();
      await payment.waitFor({ state: "hidden" });
    }
    await paymentFor("Marco").scrollIntoViewIfNeeded();
    await take(context, page, async () => {
      for (const name of ["Marco", "Chiara"]) {
        const payment = paymentFor(name);
        await point(page, payment);
        await pause(460);
        await payment.click();
        await payment.waitFor({ state: "hidden" });
      }
      await pause(650);
    });

    await page.goto(url("/account/regali"));
    const paid = page.locator(`a[href="${managementPath}"] .stato`).filter({ hasText: /^Saldato$/ });
    await paid.waitFor();
    await take(context, page, async () => {
      await point(page, paid);
      await pause(1250);
    });
    return takes;
  } catch (error) {
    console.error(`Ripresa interrotta dopo ${takes.length} scene (${format.id}).`);
    throw error;
  } finally {
    await Promise.all(guests.map((guest) => guest.close()));
    await context.close();
  }
}

function narration(folder: string) {
  const tracks: string[] = [];
  const voice = process.env.GIFTY_VOICE ?? "Alice";
  for (const [i, scene] of scenes.entries()) {
    const aiff = resolve(folder, `voice-${i}.aiff`);
    execFileSync("/usr/bin/say", ["-v", voice, "-r", "181", "-o", aiff, scene.voice], { stdio: "inherit" });
    const info = execFileSync("/usr/bin/afinfo", [aiff], { encoding: "utf8" });
    const duration = Number(info.match(/estimated duration: ([0-9.]+)/)?.[1]);
    if (!Number.isFinite(duration) || duration + 0.1 > scene.seconds) {
      throw new Error(`La battuta ${i + 1} non rientra nella scena.`);
    }
    const file = resolve(folder, `voice-${i}.wav`);
    ffmpeg([
      "-i", aiff, "-af",
      `highpass=f=75,loudnorm=I=-17:TP=-2:LRA=6,adelay=100,apad=whole_dur=${scene.seconds}`,
      "-t", String(scene.seconds), "-ar", "48000", "-ac", "1", file,
    ]);
    tracks.push(file);
  }
  const end = resolve(folder, "silenzio.wav");
  ffmpeg(["-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", String(endSeconds), end]);
  const list = resolve(folder, "voice.txt");
  writeFileSync(list, [...tracks, end].map((file) => `file '${file}'`).join("\n"));
  const path = resolve(folder, "voice.m4a");
  ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-c:a", "aac", "-b:a", "96k", path]);
  return path;
}

function mount(format: (typeof formats)[number], takes: Take[], folder: string, voice: string) {
  const { width, height, band } = format;
  const contentHeight = height - band;
  const size = format.id === "16x9" ? 38 : 47;
  const clips: string[] = [];
  for (const [i, scene] of scenes.entries()) {
    const take = takes[i];
    const file = resolve(folder, `${format.id}-clip-${i}.mp4`);
    const caption = resolve(folder, "caption.txt");
    writeFileSync(caption, captions[scene.chapter]);
    const filters = [
      `setpts=${(scene.seconds / take.duration).toFixed(6)}*PTS`,
      "fps=30",
      `scale=${width}:${contentHeight}:flags=lanczos`,
      `zoompan=z='1+0.018*(1-cos(PI*min(1,on/${Math.round(scene.seconds * 30)})))/2':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=${width}x${contentHeight}:fps=30`,
      `pad=${width}:${height}:0:0:0xF5FAF6`,
      `drawbox=x=${Math.round(width / 2 - 18)}:y=${contentHeight + 16}:w=36:h=4:color=0xFD5D17:t=fill`,
      `drawtext=fontfile=${font}:textfile=${caption}:fontsize=${size}:fontcolor=0x033922:x=(w-tw)/2:y=${contentHeight}+(${band}-th)/2+8`,
      "tpad=stop_mode=clone:stop_duration=0.2",
    ].join(",");
    ffmpeg([
      "-f", "concat", "-safe", "0", "-i", take.list, "-vf", filters, "-t", String(scene.seconds),
      "-an", "-c:v", "libx264", "-threads", "4", "-preset", "fast", "-crf", "25", "-pix_fmt", "yuv420p", file,
    ]);
    clips.push(file);
  }
  const end = resolve(folder, `${format.id}-logo.mp4`);
  ffmpeg([
    "-f", "lavfi", "-i", `color=c=0xF5FAF6:s=${width}x${height}:r=30`, "-i", "public/logo/gifty.png",
    "-filter_complex", `[1:v]scale=${Math.round(width * 0.35)}:-1[logo];[0:v][logo]overlay=(W-w)/2:(H-h)/2`,
    "-t", String(endSeconds), "-an", "-c:v", "libx264", "-threads", "4", "-crf", "25", "-pix_fmt", "yuv420p", end,
  ]);
  const list = resolve(folder, `${format.id}.txt`);
  writeFileSync(list, [...clips, end].map((file) => `file '${file}'`).join("\n"));
  ffmpeg([
    "-f", "concat", "-safe", "0", "-i", list, "-i", voice, "-map", "0:v:0", "-map", "1:a:0", "-c", "copy",
    "-movflags", "+faststart", resolve(output, `${prefix}-${format.id}.mp4`),
  ]);
  const poster = format.id === "16x9" ? prefix : `${prefix}-9x16`;
  ffmpeg(["-ss", "1.2", "-i", clips[2], "-frames:v", "1", "-vf", "scale='min(1200,iw)':-1", "-quality", "87", resolve(output, `${poster}.webp`)]);
}

function subtitles() {
  let time = 0;
  const stamp = (seconds: number) => new Date(Math.round(seconds * 1000)).toISOString().slice(11, 23);
  const cues = scenes.map((scene) => {
    const start = time;
    time += scene.seconds;
    return `${stamp(start)} --> ${stamp(time)}\n${scene.voice}`;
  });
  writeFileSync(resolve(output, `${prefix}.vtt`), `WEBVTT\n\n${cues.join("\n\n")}\n`);
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
    const voice = narration(folder);
    for (const format of formats) {
      console.log(`Riprese ${format.id}`);
      const takes = await record(browser, format, folder);
      console.log(`Montaggio ${format.id}`);
      mount(format, takes, folder, voice);
    }
    subtitles();
  } finally {
    await browser.close();
    rmSync(folder, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
