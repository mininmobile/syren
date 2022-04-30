const util = require("./util");

function Application() {
	let object = {
		// metadata
		title: util.makeField(""),
		author: util.makeField(""),
		version: util.makeField(""),
		license: util.makeField(""),
		description: util.makeField(""),
		// properties
		width: util.makeField(800),
		height: util.makeField(600),
		// commands
		meta: util.makeField((cmd, args, runtime, namespace, lineIndex) => {
			if (args[0] && args[0].length > 0)
				object.description._content = args[0];
			if (args[1] && args[1].length > 0)
				object.author._content = args[1];
			if (args[2] && args[2].length > 0)
				object.license._content = args[2];
			if (args[3] && args[3].length > 0)
				object.version._content = args[3];
		}, { command: "meta" }),

		size: util.makeField((cmd, args, runtime, namespace, lineIndex) => {
			if (args[0] == undefined || args[0].length == 0 || isNaN(args[0]))
				return console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid argument "${args[0]}" expected number`);
			if (args[1] == undefined || args[1].length == 0 || isNaN(args[1]))
				return console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid argument "${args[1]}" expected number`);

			object.width._content = Number(args[0]);
			object.height._content = Number(args[1]);
		}, { command: "size" }),
	}
	return util.genField("object", object, { class: "Application" });
}

module.exports = {
	Application,
}
