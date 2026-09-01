"use client";

let audioContext: AudioContext | null = null;

export function playPing(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!Ctor) return;

    if (!audioContext) {
      audioContext = new Ctor();
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioContext.currentTime);
    gain.gain.setValueAtTime(0.06, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.18,
    );

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
  } catch {
    // Autoplay policies may block audio until first interaction; stay silent.
  }
}
