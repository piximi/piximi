import { useSelector } from "react-redux";
import useSound from "use-sound";
import { useHotkeys } from "react-hotkeys-hook";

import { soundEnabledSelector } from "store/image-viewer";
import createAnnotationSoundEffect from "annotator/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "annotator/sounds/pop-up-off.mp3";

/*
  This component is responsible for playing sound effects
  following a hotkey.
  Logic cannot be moved to Stage because the useSound
  hook starts up an AudioContext, but AudioContexts
  must be resumed, or created, only after a user Gesture.
  Hence this component must only be mounted as a response to
  some (arbitrary) user gesture, like onMouseDown.
  See: https://goo.gl/7K7WLu
  Technically useSound only *creates* and AudioContext,
  and we only *play* the sounds after a user gesture,
  so it would (and did) still work if this was in the Stage component,
  but Chrome is overly aggressive and throws multiple warnings in Console,
  so this component was made just to get rid of the annoying warnings.
 */
export const SoundEvents = () => {
  const soundEnabled = useSelector(soundEnabledSelector);

  const [playCreateAnnotationSoundEffect] = useSound(
    createAnnotationSoundEffect
  );
  const [playDeleteAnnotationSoundEffect] = useSound(
    deleteAnnotationSoundEffect
  );

  useHotkeys(
    "enter",
    () => {
      console.log("enter", soundEnabled);
      if (soundEnabled) playCreateAnnotationSoundEffect();
    },
    [soundEnabled]
  );

  useHotkeys(
    "escape",
    () => {
      if (soundEnabled) playDeleteAnnotationSoundEffect();
    },
    [soundEnabled]
  );

  useHotkeys(
    "backspace, delete",
    () => {
      if (soundEnabled) playDeleteAnnotationSoundEffect();
    },
    [soundEnabled]
  );

  return <></>;
};
