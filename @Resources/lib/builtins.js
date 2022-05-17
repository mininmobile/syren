const util = require("./util");

function Application() {
	let object = {
		components: util.makeField([]),
		// metadata
		title: util.makeField(""),
		author: util.makeField(""),
		version: util.makeField(""),
		license: util.makeField(""),
		description: util.makeField(""),
		// properties
		w: util.makeField(800),
		h: util.makeField(600),
		// commands
		setMeta: util.makeField((args, runtime, namespace, lineIndex) => {
			if (args[0] && args[0].length > 0)
				object.description._content = args[0];
			if (args[1] && args[1].length > 0)
				object.author._content = args[1];
			if (args[2] && args[2].length > 0)
				object.license._content = args[2];
			if (args[3] && args[3].length > 0)
				object.version._content = args[3];
		}, { command: "setMeta" }),

		setSize: util.makeField((args, runtime, namespace, lineIndex) => {
			if (args[0] == undefined || args[0].length == 0 || isNaN(args[0]))
				return console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid argument "${args[0]}" expected number`);
			if (args[1] == undefined || args[1].length == 0 || isNaN(args[1]))
				return console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid argument "${args[1]}" expected number`);

			object.width._content = Number(args[0]);
			object.height._content = Number(args[1]);
		}, { command: "setSize" }),
	}
	return util.genField("object", object, { class: "Application" });
}

function StringMeter() {
	let object = {
		// properties
		content: util.makeField(""),
		x: util.makeField(0),
		y: util.makeField(0),
		// commands
		setPos: util.makeField((args, runtime, namespace, lineIndex) => {
			if (args[0] == undefined || args[0].length == 0 || isNaN(args[0]))
				return console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid argument "${args[0]}" expected number`);
			if (args[1] == undefined || args[1].length == 0 || isNaN(args[1]))
				return console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid argument "${args[1]}" expected number`);

			object.x._content = Number(args[0]);
			object.y._content = Number(args[1]);
		}, { command: "setPos" }),
	}
	return util.genField("object", object, { class: "StringMeter" });
}

module.exports = {
	Application,
	StringMeter,
}
