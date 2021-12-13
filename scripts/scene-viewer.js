//initialisation
Hooks.once("init", () => game.socket.on("module.scene-viewer", (data) => MultiMediaPopout._handleShareMedia(data)))
Hooks.once("ready", () => {if (game.settings.get("scene-viewer","rightClick")) overrideRightClick()})
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
                condition: () => this.collection.documentClass.canUserCreate(game.user),
                callback: li => {
                    const collection = game.collections.get(this.collection.documentName);
                    const id = li.data("document-id");
                    return collection.importFromCompendium(this.collection, id, {}, {renderSheet: true});
                }
            },
            {
                name: "COMPENDIUM.DeleteEntry",
                icon: '<i class="fas fa-trash"></i>',
                condition: () => game.user.isGM,
                callback: async li => {
                    const id = li.data("document-id");
                    const document = await this.collection.getDocument(id);
                    return Dialog.confirm({
                        title: `${game.i18n.localize("COMPENDIUM.DeleteEntry")} ${document.name}`,
                        content: `<h4>${game.i18n.localize("AreYouSure")}</h4><p>${game.i18n.localize("COMPENDIUM.DeleteEntryWarning")}</p>`,
                        yes: () => document.delete()
                    });
                }
            }
        ]
        if(this.collection.documentName === "Scene") menuItems.push({
            name: game.i18n.localize("SCENES.View"),
            icon: '<i class="fas fa-images"></i>',
            callback: async (li) => {
                const id = li.data("document-id");
                const document = await this.collection.getDocument(id);
                loadImage(document)
            }
          })
        new ContextMenu(html, ".directory-item", menuItems);
    }, 'OVERRIDE');
}

//Debugger support
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag('scene-viewer');
});

function log(...args) {
    try {
        const isDebugging = window.DEV?.getPackageDebugValue("scene-viewer");

        if (isDebugging) {
            console.log("scene-viewer", '|', ...args);
        }
    } catch (e) {}
}
//no logging actually implemented yet, but hey, it's a thing that might happen!

// Original hook by Zeel.  Additions by me to make sure it's a scene, and handle edge case, and update to 0.8.

Hooks.on("renderCompendium", (compendium, html, data) => {
    let {collection} = data;
    log("Collection rendered:", collection)
    if (collection.documentName !="Scene") return;
    html.find("[data-document-id]").contextmenu(async (event) => {
        if (!event.ctrlKey) return;
        const target = event.currentTarget;
        const scene = await collection.getDocument(target.dataset.documentId);
        loadImage(scene)
    });
});

function loadImage(scene){
    log("Loading Scene:", scene)
    if(!scene.img){
        ui.notifications.warn(game.i18n.localize("SCENE_VIEWER.NoImage"))
        return
    }
    const image = scene.img;
    const options = {title: scene.name, uuid: scene.uuid}
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
    if (game.settings.get("scene-viewer", "closePrevious")) Object.entries(ui.windows).forEach( async a => {if (a[1] instanceof MultiMediaPopout && a[1]?.options?.popOut) await a[1].close() } );
    new MultiMediaPopout(image, options).render(true);
    Hooks.once("renderImagePopout",()=>{
        loading.close()
    })
}

//Stretch goals:  Settings to change modifier key (ctrl/shift/alt)

// noinspection JSClosureCompilerSyntax
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

		this.video = !!CONST.VIDEO_FILE_EXTENSIONS[
			src.split('.').pop().toLowerCase()
		];

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
		game.socket.emit("module.scene-viewer", {
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