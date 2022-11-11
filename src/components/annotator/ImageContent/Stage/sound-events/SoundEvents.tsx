import { useSelector } from "react-redux";
import { memo } from "react";
import useSound from "use-sound";
import { useHotkeys } from "hooks";

import { soundEnabledSelector } from "store/annotator";

import { HotkeyView } from "types";

import createAnnotationSoundEffect from "data/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "data/sounds/pop-up-off.mp3";

/*
  This component is responsible for playing sound effects
  following a hotkey.
  Logic cannot be moved to Stage because the useSound
  hook starts up an AudioContext, but AudioContexts
  must be resumed, or created, only after a user Gesture.
  Hence this component must only be mounted as a response to
  some (arbitrary) user gesture, like onMouseDown.
  See: https://goo.gl/7K7WLu
  Technically useSound only *creates* an AudioContext,
  and we only *play* the sounds after a user gesture,
  so it would (and did) still work if this was in the Stage component,
  but Chrome is overly aggressive and throws multiple warnings in Console,
  so this component was made just to get rid of the annoying warnings.
 */
export const SoundEvents = memo(() => {
  const soundEnabled = useSelector(soundEnabledSelector);

  const [playCreateAnnotationSoundEffect, { sound: creeateAnnotationSound }] =
    useSound(createAnnotationSoundEffect, { soundEnabled });
  const [playDeleteAnnotationSoundEffect, { sound: deleteAnnotationSound }] =
    useSound(deleteAnnotationSoundEffect, { soundEnabled });

  useHotkeys(
    "enter",
    () => {
      playCreateAnnotationSoundEffect();
    },
    HotkeyView.Annotator,
    [soundEnabled, creeateAnnotationSound]
  );

  useHotkeys(
    "escape, backspace, delete",
    () => {
      playDeleteAnnotationSoundEffect();
    },
    HotkeyView.Annotator,
    [soundEnabled, deleteAnnotationSound]
  );

  return <></>;
});
