// Original hook by Zeel.  Additions by me to make sure it's a scene, and handle edge case.

Hooks.on("renderCompendium", (compendium, html, data) => {
    if (compendium.entity !="Scene") return;
    html.find("[data-entry-id]").contextmenu(async (event) => {
        if (!event.ctrlKey) return;
        const target = event.currentTarget;
        const scene = await fromUuid(`Compendium.${data.collection}.${target.dataset.entryId}`);
        const image = scene.data.img;
        let dialogType= "Loading";
        if (image.includes(".webm")){
            dialogType = "Webm"
        }
        let loading = new Dialog({
            title: game.i18n.localize(`SCENE_VIEWER.${dialogType}.Title`),
            content: game.i18n.localize(`SCENE_VIEWER.${dialogType}.Content`),
            buttons: {
             one: {
              icon: '<i class="fas fa-check"></i>',
              label: game.i18n.localize(`SCENE_VIEWER.${dialogType}.Close`)
             }
            },
            default: "one"
           });
        loading.render(true);
        if (dialogType === "Loading"){
            new ImagePopout(image).render(true);
            Hooks.once("renderImagePopout",()=>{
                loading.close()
            })
        }
    });
});

//also todo - add an option into the context menu?
//todo: Implement MultiMediaPopout from Zeel's library
//Stretch goals:  Settings to change modifier key (ctrl/shift/alt)