// Original hook by Zeel.  Additions by me to make sure it's a scene, and handle edge case.

Hooks.on("renderCompendium", (compendium, html, data) => {
    if (compendium.entity !="Scene") return;
    html.find("[data-entry-id]").contextmenu(async (event) => {
        if (!event.ctrlKey) return;
        const target = event.currentTarget;
        const scene = await fromUuid(`Compendium.${data.collection}.${target.dataset.entryId}`);
        const image = scene.data.img;
        let dialogType= "Loading";
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
            new MultiMediaPopout(image).render(true);
            Hooks.once("renderImagePopout",()=>{
                loading.close()
            })
        }
    });
});

//also todo - add an option into the context menu?
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

		this.video = ["mp4", "webm"].includes(
			src.filename.split('.').pop().toLowerCase()
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