import { Threshold } from '@synchro-charts/core';
import { AudioAlert } from './audioAlert';
import { AudioAlertPlayer } from './audioAlertPlayer';

export const initializeAudioAlerts = (
  audioAlerts: Map<Threshold | string, AudioAlert> | undefined,
  audioAlertPlayer: AudioAlertPlayer | undefined,
  thresholds: Threshold[]
): Map<Threshold | string, AudioAlert> => {
  const tempAudioAlerts = audioAlerts ?? new Map<Threshold | string, AudioAlert>();
  if (!audioAlertPlayer) {
    return tempAudioAlerts;
  }
  thresholds.forEach((threshold) => {
    if (!tempAudioAlerts.has(threshold.id ?? threshold) && audioAlertPlayer) {
      tempAudioAlerts.set(
        threshold.id ?? threshold,
        new AudioAlert({
          audioAlertPlayer: audioAlertPlayer,
          isMuted: false,
          volume: 1.0,
          severity: threshold.severity,
        })
      );
    }
  });
  return tempAudioAlerts;
};
