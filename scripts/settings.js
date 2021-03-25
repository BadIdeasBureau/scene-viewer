import { overrideRightClick } from "./scene-viewer.js";

Hooks.on("init",()=>{
    game.settings.register("scene-viewer", "rightClick", {
        name: game.i18n.localize("SCENE_VIEWER.Settings.RightClick"),
        hint: game.i18n.localize("SCENE_VIEWER.Settings.Hints.RightClick"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: value => { // A callback function which triggers when the setting is changed
          if (value) overrideRightClick()
        }
      });

    game.settings.register("scene-viewer", "closePrevious", {
        name: game.i18n.localize("SCENE_VIEWER.Settings.ClosePrevious"),
        hint: game.i18n.localize("SCENE_VIEWER.Settings.Hints.ClosePrevious"),
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: Boolean,
        default: false,        // The default value for the setting
    });
})