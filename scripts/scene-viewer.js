//initialisation
Hooks.on("ready", () => {if (game.settings.get("scene-viewer","rightClick")) overrideRightClick()})
//Setting up right click menu on compendium.  libWrapper override
export function overrideRightClick(){
    if(!game.modules.get('lib-wrapper')?.active && game.user.isGM){ //warn if libWrapper is not active
        ui.notifications.error("Adding Compendium Scene Viewer to the right click context menu requires the 'libWrapper' module. Please install and activate it.");
    }
    libWrapper.register('scene-viewer', 'Compendium.prototype._contextMenu', function (html) {
        let menuItems=[
            {
              name: "COMPENDIUM.ImportEntry",
              icon: '<i class="fas fa-download"></i>',
              callback: li => {
                const entryId = li.attr('data-entry-id');
                const entities = this.cls.collection;
                return entities.importFromCollection(this.collection, entryId, {}, {renderSheet: true});
              }
            },
            {
              name: "COMPENDIUM.DeleteEntry",
              icon: '<i class="fas fa-trash"></i>',
              callback: li => {
                let entryId = li.attr('data-entry-id');
                this.getEntity(entryId).then(entry => {
                  return Dialog.confirm({
                    title: `${game.i18n.localize("COMPENDIUM.DeleteEntry")} ${entry.name}`,
                    content: game.i18n.localize("COMPENDIUM.DeleteConfirm"),
                    yes: () => this.deleteEntity(entryId),
                  });
                });
              }
            }]
        if(html[0]?.children[1]?.children[0]?.className?.includes("scene")) menuItems.push({
            name: "SCENE.View",
            icon: '<i class="fas fa-images"></i>',
            callback: async (li) => {
                const entryId = li.attr('data-entry-id');
                const scene = await fromUuid(`Compendium.${this.collection}.${entryId}`);
                const image = scene.data.img;
                loadImage(image)
            }
          })
        new ContextMenu(html, ".directory-item", menuItems);
    }, 'OVERRIDE');
}

// Original hook by Zeel.  Additions by me to make sure it's a scene, and handle edge case.

Hooks.on("renderCompendium", (compendium, html, data) => {
    if (compendium.entity !="Scene") return;
    html.find("[data-entry-id]").contextmenu(async (event) => {
        if (!event.ctrlKey) return;
        const target = event.currentTarget;
        const uuid = `Compendium.${data.collection}.${target.dataset.entryId}`;
        const scene = await fromUuid(uuid);
        const image = scene.data.img;
        const options = {title: scene.name, uuid};
        loadImage(image, options)
    });
});

function loadImage(image, options){
    let loading = new Dialog({
        title: game.i18n.localize(`SCENE_VIEWER.Loading.Title`),
        content: game.i18n.localize(`SCENE_VIEWER.Loading.Content`),
        buttons: {
            one: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize("Close")
            }
        },
        default: "one"
    });
    loading.render(true);
    if (game.settings.get("scene-viewer", "closePrevious")) Object.entries(ui.windows).forEach( async a => {if (a[1] instanceof MultiMediaPopout) await a[1].close() } );
    new MultiMediaPopout(image, options).render(true);
    Hooks.once("renderImagePopout",()=>{
        loading.close()
    })
}

//Stretch goals:  Settings to change modifier key (ctrl/shift/alt)

/**
 * Capable of handling images, as well as .mp4 and .webm video
 * not very sophisticated (according to Zeel). Original code by Zeel, used under MIT license
 *
 * @class MultiMediaPopout
 * @extends {ImagePopout}
 */
class MultiMediaPopout extends ImagePopout {
	/**
	 * Creates an instance of MultiMediaPopout.
	 *
	 * @param {string} src
	 * @param {object} [options={}]
	 * @memberof MultiMediaPopout
	 */
	constructor(src, options = {}) {
		super(src, options);

		this.video = VIDEO_FILE_EXTENSIONS.includes(
			src.split('.').pop().toLowerCase()
		);

		this.options.template = "modules/scene-viewer/templates/media-popout.html"; //TODO: make the "muted" part of the template optional
	}

	/** @override */
	async getData(options) {
		let data = await super.getData();
		data.isVideo = this.video;
		return data;
	}
	/**
	* Share the displayed image with other connected Users
	*/
	shareImage() {
		game.socket.emit("module.token-hud-art-button", {
			image: this.object,
			title: this.options.title,
			uuid: this.options.uuid
		});
	}

	/**
	 * Handle a received request to display media.
	 *
	 * @override
	 * @param {string} image - The path to the image/media resource.
	 * @param {string} title - The title for the popout title bar.
	 * @param {string} uuid
	 * @return {MultiMediaPopout}
	 * @private
	 */
	static _handleShareMedia({ image, title, uuid } = {}) {
		return new MultiMediaPopout(image, {
			title: title,
			uuid: uuid,
			shareable: false,
			editable: false
		}).render(true);
	}
}