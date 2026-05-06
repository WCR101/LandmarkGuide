import * as Speech from 'expo-speech';

let speaking = false;
const queue = [];

export function announce(text) {
  queue.push(text);
  processQueue();
}

function processQueue() {
  if (speaking || queue.length === 0) return;
  speaking = true;
  const text = queue.shift();
  Speech.speak(text, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.85,
    onDone: () => { speaking = false; processQueue(); },
    onError: () => { speaking = false; processQueue(); },
  });
}

export function stopSpeaking() {
  Speech.stop();
  queue.length = 0;
  speaking = false;
}
