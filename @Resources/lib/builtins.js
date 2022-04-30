const util = require("./util");

function Application() {
	return util.genField("object", {
		// metadata
		title: util.makeField(""),
		author: util.makeField(""),
		version: util.makeField(0),
		license: util.makeField(""),
		description: util.makeField(""),
		// properties
		width: util.makeField(800),
		height: util.makeField(600),
		// commands
		// TODO: meta
		// TODO: size
	}, { class: "Application" });
}

module.exports = {
	Application,
}
