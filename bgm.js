
"use strict";

// ============================================
// SUTO-TETRIS（すとてと）
// BGM 修正版
// iPhone / Safari / PC 対応
// ============================================

const GameBGM = (() => {
  let audio = null;
  let master = null;
  let timer = null;

  let enabled = true;
  let playing = false;
  let nextTime = 0;
  let step = 0;
  let generation = 0;

  const BPM = 142;
  const STEP = 60 / BPM / 2;
  const LOOKAHEAD = 0.15;

  // オリジナル8bit風メロディー
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

  // 音階 → 周波数
  function frequency(note) {
    if (!note || note === "-") {
      return 0;
    }

    const match = /^([A-G])(#?)([0-8])$/.exec(note);

    if (!match) {
      return 0;
    }

    const scale = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11
    };

    const midi =
      (Number(match[3]) + 1) * 12 +
      scale[match[1]] +
      (match[2] === "#" ? 1 : 0);

    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // 音声機能の初期化
  function init() {
    if (audio) {
      return true;
    }

    const AudioClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioClass) {
      console.warn("Web Audio API非対応");
      return false;
    }

    try {
      audio = new AudioClass();

      master = audio.createGain();
      master.gain.value = 0.22;
      master.connect(audio.destination);

      return true;
    } catch (error) {
      console.error("BGM初期化エラー", error);
      return false;
    }
  }

  // iPhone向け：ユーザー操作中に音声を起動
  function unlock() {
    if (!enabled || !init()) {
      return;
    }

    if (audio.state === "suspended") {
      audio.resume().catch(error => {
        console.warn("音声の起動に失敗", error);
      });
    }
  }

  // 音を生成
  function playNote(
    note,
    time,
    duration,
    type,
    volume
  ) {
    if (!audio || !master) {
      return;
    }

    const hz = frequency(note);

    if (!hz) {
      return;
    }

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(hz, time);

    const attack = 0.008;
    const end = time + duration;

    gain.gain.setValueAtTime(0.0001, time);

    gain.gain.linearRampToValueAtTime(
      volume,
      time + attack
    );

    gain.gain.setValueAtTime(
      volume * 0.7,
      time + duration * 0.55
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      end
    );

    oscillator.connect(gain);
    gain.connect(master);

    oscillator.start(time);
    oscillator.stop(end + 0.01);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  // 音符を予約
  function schedule(index, time) {
    const lead = melody[index % melody.length];
    const low = bass[index % bass.length];

    playNote(
      lead,
      time,
      STEP * 0.85,
      "square",
      0.18
    );

    if (index % 2 === 0) {
      playNote(
        low,
        time,
        STEP * 1.65,
        "triangle",
        0.28
      );
    }

    if (index % 8 === 6) {
      playNote(
        "C6",
        time,
        STEP * 0.35,
        "sine",
        0.06
      );
    }
  }

  // 再生スケジューラー
  function scheduler() {
    if (
      !playing ||
      !enabled ||
      !audio ||
      audio.state !== "running"
    ) {
      return;
    }

    while (
      nextTime < audio.currentTime + LOOKAHEAD
    ) {
      schedule(step, nextTime);

      nextTime += STEP;
      step = (step + 1) % melody.length;
    }
  }

  // BGM再生
  function resume() {
    if (!enabled || !init()) {
      return;
    }

    // Safariではユーザー操作に続けて呼ぶ
    unlock();

    if (playing) {
      return;
    }

    playing = true;

    const token = ++generation;

    if (timer !== null) {
      clearInterval(timer);
    }

    const begin = () => {
      if (
        token !== generation ||
        !playing ||
        !enabled ||
        !audio ||
        audio.state !== "running"
      ) {
        return;
      }

      nextTime = audio.currentTime + 0.05;

      scheduler();

      timer = setInterval(scheduler, 25);
    };

    if (audio.state === "running") {
      begin();
    } else {
      audio.resume()
        .then(begin)
        .catch(error => {
          console.warn("BGM再生エラー", error);

          if (token === generation) {
            playing = false;
          }
        });
    }
  }

  // BGM停止
  function pause() {
    playing = false;
    generation++;

    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    if (audio && audio.state === "running") {
      audio.suspend().catch(error => {
        console.warn("BGM停止エラー", error);
      });
    }
  }

  // BGM ON / OFF
  function setEnabled(value) {
    enabled = Boolean(value);

    if (!enabled) {
      pause();
    }
  }

  // プレイボタンを押した瞬間に音声を解放
  const playButton = document.getElementById("playBtn");

  if (playButton) {
    playButton.addEventListener(
      "pointerdown",
      unlock,
      { passive: true }
    );

    playButton.addEventListener("click", unlock);
  }

  // iPhoneで画面を切り替えた場合
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        pause();
      }
    }
  );

  return {
    resume,
    pause,
    setEnabled,
    unlock,

    isEnabled() {
      return enabled;
    },

    isPlaying() {
      return playing;
    }
  };
})();
