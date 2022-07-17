
Hooks.on("init",()=>{

    game.settings.register("scene-viewer", "closePrevious", {
        name: game.i18n.localize("SCENE_VIEWER.Settings.ClosePrevious"),
        hint: game.i18n.localize("SCENE_VIEWER.Settings.Hints.ClosePrevious"),
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: Boolean,
        default: false,        // The default value for the setting
    });
})