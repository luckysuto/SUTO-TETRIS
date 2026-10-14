
"use strict";

// ============================================
// SUTO-TETRIS（すとてと）
// オリジナル8bit風BGM
// Web Audio API
// ============================================

const GameBGM = (() => {

  let audio = null;
  let master = null;

  let enabled = true;
  let playing = false;

  let timer = null;
  let nextTime = 0;
  let step = 0;

  const BPM = 142;
  const STEP_TIME = 60 / BPM / 2;
  const LOOK_AHEAD = 0.12;

  // ==========================================
  // 音階を周波数に変換
  // ==========================================

  function noteFreq(note) {
    if (!note || note === "-") {
      return 0;
    }

    const match = note.match(
      /^([A-G])(#?)([0-8])$/
    );

    if (!match) {
      return 0;
    }

    const names = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11
    };

    const semitone =
      names[match[1]] +
      (match[2] === "#" ? 1 : 0);

    const octave = Number(match[3]);

    const midi =
      (octave + 1) * 12 + semitone;

    return 440 * Math.pow(
      2,
      (midi - 69) / 12
    );
  }

  // ==========================================
  // オリジナルメロディー
  // ==========================================

  const melody = [
    "E5", "-", "G5", "A5",
    "B5", "A5", "G5", "E5",

    "D5", "-", "E5", "G5",
    "A5", "G5", "E5", "D5",

    "C5", "E5", "G5", "E5",
    "A5", "G5", "E5", "C5",

    "D5", "F5", "A5", "G5",
    "F5", "E5", "D5", "-",

    "E5", "G5", "B5", "G5",
    "C6", "B5", "G5", "E5",

    "F5", "A5", "C6", "A5",
    "B5", "A5", "F5", "D5",

    "E5", "G5", "A5", "B5",
    "C6", "B5", "A5", "G5",

    "F5", "E5", "D5", "C5",
    "D5", "E5", "G5", "-"
  ];

  // 伴奏
  const bass = [
    "C3", "-", "C3", "-",
    "G3", "-", "C3", "-",

    "G2", "-", "G2", "-",
    "D3", "-", "G2", "-",

    "A2", "-", "A2", "-",
    "E3", "-", "A2", "-",

    "F2", "-", "F2", "-",
    "C3", "-", "F2", "-"
  ];

  // ==========================================
  // AudioContext初期化
  // ==========================================

  function init() {
    if (audio) {
      return true;
    }

    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      console.warn(
        "このブラウザはWeb Audio APIに対応していません。"
      );
      return false;
    }

    audio = new AudioContextClass();

    master = audio.createGain();
    master.gain.value = 0.13;

    master.connect(audio.destination);

    return true;
  }

  // ==========================================
  // 8bit音を生成
  // ==========================================

  function playNote(
    note,
    time,
    duration,
    type = "square",
    volume = 0.3
  ) {
    if (!audio || !master) {
      return;
    }

    const frequency = noteFreq(note);

    if (!frequency) {
      return;
    }

    const oscillator =
      audio.createOscillator();

    const gain =
      audio.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(
      frequency,
      time
    );

    gain.gain.setValueAtTime(
      0.0001,
      time
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, volume),
      time + 0.012
    );

    gain.gain.setValueAtTime(
      Math.max(0.0002, volume),
      time + Math.max(
        0.013,
        duration * 0.55
      )
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + duration
    );

    oscillator.connect(gain);
    gain.connect(master);

    oscillator.start(time);
    oscillator.stop(
      time + duration + 0.01
    );

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  // ==========================================
  // 1ステップ分の音を予約
  // ==========================================

  function scheduleStep(index, time) {
    const melodyNote =
      melody[index % melody.length];

    const bassNote =
      bass[index % bass.length];

    // メインメロディー
    playNote(
      melodyNote,
      time,
      STEP_TIME * 0.85,
      "square",
      0.24
    );

    // ベース
    if (index % 2 === 0) {
      playNote(
        bassNote,
        time,
        STEP_TIME * 1.6,
        "triangle",
        0.3
      );
    }

    // 高音の装飾
    if (index % 8 === 6) {
      playNote(
        "C6",
        time,
        STEP_TIME * 0.35,
        "square",
        0.055
      );
    }
  }

  // ==========================================
  // 再生スケジューラー
  // ==========================================

  function scheduler() {
    if (
      !playing ||
      !audio ||
      audio.state !== "running"
    ) {
      return;
    }

    while (
      nextTime <
      audio.currentTime + LOOK_AHEAD
    ) {
      scheduleStep(step, nextTime);

      nextTime += STEP_TIME;

      step = (step + 1) % melody.length;
    }
  }

  // ==========================================
  // 再生
  // ==========================================

  async function resume() {
    if (!enabled) {
      return;
    }

    if (!init()) {
      return;
    }

    try {
      if (audio.state !== "running") {
        await audio.resume();
      }
    } catch (error) {
      console.warn(
        "BGMを再生できませんでした。",
        error
      );
      return;
    }

    if (!enabled) {
      return;
    }

    if (playing) {
      return;
    }

    playing = true;

    nextTime = audio.currentTime + 0.04;

    scheduler();

    timer = setInterval(
      scheduler,
      25
    );
  }

  // ==========================================
  // 停止
  // ==========================================

  function pause() {
    playing = false;

    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    if (audio && audio.state === "running") {
      audio.suspend().catch(() => {});
    }
  }

  // ==========================================
  // ON / OFF
  // ==========================================

  function setEnabled(value) {
    enabled = Boolean(value);

    if (!enabled) {
      pause();
    }
  }

  // ==========================================
  // 外部公開
  // ==========================================

  return {
    resume,
    pause,
    setEnabled,

    isEnabled() {
      return enabled;
    },

    isPlaying() {
      return playing;
    }
  };

})();
