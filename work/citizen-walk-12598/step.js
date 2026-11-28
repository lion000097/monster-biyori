// Coordinate snapshots live only for the current session. Existing actors keep their paths and timing.
const stepBeforeTownMotion = stepActors;
stepActors = function(dt) {
  for (const group of [state.monsters, state.staff, state.guests]) {
    for (const actor of group) {
      const pose = townMotionPose(actor);
      pose.x = actor.x;
      pose.y = actor.y;
    }
  }
  stepBeforeTownMotion(dt);
  for (const group of [state.monsters, state.staff, state.guests]) {
    for (const actor of group) finishTownMotionStep(actor, dt);
  }
};
