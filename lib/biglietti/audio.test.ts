import { describe, expect, it } from "vitest";
import { eMp3, intervalloRichiesto, nomeAudioDaUrl, nomeFileMusica, urlAudio } from "./audio";

describe("musica del biglietto", () => {
  it("riconosce l'MP3 dal contenuto", () => {
    expect(eMp3(new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00]))).toBe(true); // ID3
    expect(eMp3(new Uint8Array([0xff, 0xfb, 0x90, 0x64]))).toBe(true); // MPEG-1 Layer III
    expect(eMp3(new Uint8Array([0xff, 0xf3, 0x90, 0x64]))).toBe(true); // MPEG-2 Layer III
    expect(eMp3(new Uint8Array([0xff, 0xf1, 0x50, 0x80]))).toBe(false); // AAC (ADTS)
    expect(eMp3(new Uint8Array([0x4f, 0x67, 0x67, 0x53]))).toBe(false); // Ogg
    expect(eMp3(new Uint8Array([0x52, 0x49, 0x46, 0x46]))).toBe(false); // WAV
    expect(eMp3(new Uint8Array([0x49, 0x44]))).toBe(false);
  });
  it("url e nome dell'audio", () => {
    const url = urlAudio("abc123def45", "m-xyz12345");
    expect(url).toBe("/api/audio/b/abc123def45/m-xyz12345");
    expect(nomeAudioDaUrl("abc123def45", url)).toBe("m-xyz12345");
    expect(nomeAudioDaUrl("altro", url)).toBeNull();
    expect(nomeAudioDaUrl("abc123def45", null)).toBeNull();
  });
  it("il nome del file da mostrare: senza cartelle, corto, mai vuoto", () => {
    expect(nomeFileMusica("C:\\Musica\\Tanti auguri.mp3")).toBe("Tanti auguri.mp3");
    expect(nomeFileMusica("  ")).toBe("musica.mp3");
    expect(nomeFileMusica(null)).toBe("musica.mp3");
    expect(nomeFileMusica("x".repeat(200))).toHaveLength(80);
  });
  it("le richieste a pezzi (Range) come le fanno Safari e iPhone", () => {
    expect(intervalloRichiesto(null, 1000)).toBeNull();
    expect(intervalloRichiesto("bytes=0-1", 1000)).toEqual({ inizio: 0, fine: 1 });
    expect(intervalloRichiesto("bytes=500-", 1000)).toEqual({ inizio: 500, fine: 999 });
    expect(intervalloRichiesto("bytes=900-5000", 1000)).toEqual({ inizio: 900, fine: 999 });
    expect(intervalloRichiesto("bytes=-100", 1000)).toEqual({ inizio: 900, fine: 999 });
    expect(intervalloRichiesto("bytes=1000-", 1000)).toBe("fuori");
    expect(intervalloRichiesto("bytes=5-2", 1000)).toBe("fuori");
    // più intervalli o formati strani: si manda tutto il file
    expect(intervalloRichiesto("bytes=0-1,5-6", 1000)).toBeNull();
    expect(intervalloRichiesto("righe=0-1", 1000)).toBeNull();
  });
});
