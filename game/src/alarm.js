// alarm.js — the alarm meter, the caught moment and the getaway.
// The meter fills while any guard or camera sees the thief and drains while
// hidden. At 100 the run is over: caught, fairly, with a retry. Above 55 the
// guards go alert and hunt the last place they saw the thief.

export function createAlarm() {
  return {
    value: 0, // 0..100
    caught: false,
    // Who is spotting the thief right now (for the HUD warning).
    spottedBy: null,
  };
}

export function resetAlarm(alarm) {
  alarm.value = 0;
  alarm.caught = false;
  alarm.spottedBy = null;
}

// sight: { guardSeen, guardDist, camSeen, sneaking } for this frame.
export function updateAlarm(alarm, dt, sight, now, guards) {
  alarm.spottedBy = null;
  let fill = 0;
  if (sight.guardSeen) {
    // Close and standing is worse than far and sneaking.
    const close = sight.guardDist < 110 ? 1.25 : 0.8;
    const sneak = sight.sneaking ? 0.55 : 1;
    fill += 46 * close * sneak;
    alarm.spottedBy = 'guard';
  }
  if (sight.camSeen) {
    fill += 27;
    alarm.spottedBy = alarm.spottedBy ?? 'camera';
  }

  if (fill > 0) {
    alarm.value = Math.min(100, alarm.value + fill * dt);
    // Guards remember where they saw the thief and hunt that spot.
    if (alarm.value > 55 && sight.thiefPos) {
      for (const g of guards) {
        if (g.mode === 'patrol') {
          g.mode = 'alert';
          g.lastSeen = { x: sight.thiefPos.x, y: sight.thiefPos.y, at: now };
        }
      }
    }
  } else {
    alarm.value = Math.max(0, alarm.value - 14 * dt);
  }

  if (alarm.value >= 100) alarm.caught = true;
  return alarm.caught;
}
