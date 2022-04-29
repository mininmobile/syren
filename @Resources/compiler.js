const fs = require("fs");

let styles = {}
let scripts = {}
let runtime = {}

{ // read files
	console.log("- reading files...");

	let fileList = fs.readdirSync("../@Sources")
		.filter(x => x.endsWith(".syren") || x.endsWith(".css"));

	console.log("- available scripts:")
	console.log(fileList.join(", "), "\n");

	fileList.forEach((file) => {
		let data = fs.readFileSync("../@Sources/" + file, "utf-8");
		let namespace = file.charAt(0).toUpperCase() + file.substring(1, file.length - 6);
		// prepare for parsing
		data = data.split(/\n+/g)
			.map(x => x.trim())
			.filter(x => !(x.length == 0 || x.startsWith("//")));
		// export tokens
		scripts[namespace] = data;
	});
}

{ // execute scripts
	console.log("- parsing .syren files\n");

	Object.keys(scripts).forEach(namespace => {
		console.log(`> ${namespace} (${namespace}.syren)`);

		runtime[namespace] = {
			sets: {},
			lumps: {},
			objects: {},
			variables: {},
		}

		scripts[namespace].forEach((/** @type {string[]} */ line, lineIndex) =>
			parseLine(namespace, line, lineIndex));

			console.log("");
	});

	function parseLine(namespace, _line, lineIndex) {
		// parse the variables
		let line = parseVariables(namespace, _line, lineIndex);
		// parse the line
		// modified from https://github.com/mininmobile/llamecode/blob/master/compiler/compiler.js#L46=
		let tokens = [];
		let temp = "";
		let mode = {
			string: false,
			escape: false,
		}

		for (let i = 0; i < line.length; i++) {
			let char = line[i];

			if (mode.string) {
				if (mode.escape) {
					let add = char;

					switch (char) {
						case "n": add = "\n"; break;
						case "t": add = "\t"; break;
						case "\\": add = "\\"; break;
						case "\"": add = "\""; break;
					}

					temp += add;
					mode.escape = false;
				} else {
					if (char == "\"") {
						tokens.push(temp);
						temp = "";
						mode.string = false;
					} else if (char == "\\") {
						mode.escape = true;
					} else {
						temp += char;
					}
				}
			} else if (temp.length == 0 && char == "\"") {
				mode.string = true;
			} else if (temp.length != 0 && char == " ") {
				tokens.push(temp);
				temp = "";
			} else if (char != " ") {
				temp += char;
			}
		}

		if (temp != "")
			tokens.push(temp);
		let args = tokens;
		let cmd = args.shift();

		switch (args[0]) {
			// variable assignment placeholder
			case "=": {
				parseReference(namespace, cmd, lineIndex, genField("string", args.slice(1).join("")));
			} break;

			default: switch (cmd) {
				case "echo":
					console.log(" ", args.join(""));
					return;

				default: {
					console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid command "${cmd}"`);
				}
			}
		}
	}

	// modified from https://github.com/mininmobile/flexscript/blob/master/lib/flexscript.js#L219=
	function parseVariables(namespace, line, lineIndex) {
		// first stage
		// insert special markers for correctly defined variables locations
		let indent = 0;
		let tokens = [];

		for (let i = 0; i < line.length; i++) {
			if (line[i] == "{" && line[i - 1] == "$" && line[i - 2] !== "\\") {
				tokens[indent] ?
					tokens[indent] += "\xff" : tokens[indent] = "\xff";

				indent++;
			} else if (indent > 0 && line[i] == "}" && line[i - 1] !== "\\") {
				tokens[indent] += "\xfe";

				indent--;
			} else if ((line[i] == "$" && line[i - 1] !== "\\") || line[i] == "\\" && line[i + 1] == "$") { /* nothing */ } else {
				tokens[indent] ?
					tokens[indent] += line[i] : tokens[indent] = line[i];
			}
		}

		// second stage
		// check if variables to evaluate are present
		if (tokens[1]) {
			let temp = tokens[tokens.length - 1].split("\xfe");
			temp.pop();

			// loop through every variable name
			for (let i = tokens.length - 2; i >= 0; i--) {
				let l = tokens[i];

				// evaluate the variable names into their values
				temp.forEach((x) => {
					let value = parseReference(namespace, x, lineIndex);
					l = l.replace("\xff", value ? strField(value) : `\${${x}}`);
				});

				if (i == 0)
					return l;
				else {
					temp = l.split("\xfe");
					temp.pop();
				}
			}
		} else // no varaibles to evaluate
			return tokens[0];
	}

	function parseReference(namespace, reference, lineIndex, overwrite) {
		let ref = reference.split(".");
		let path = "";
		let value;
		let j = 1;

		// if ref[0] is a different namespace
		if (runtime[ref[0]] && ref[1]) {
			if (value = runtime[ref[0]].variables[ref[1]])
				path += ref[0] + ".variables." + ref[1];
			else if (value = runtime[ref[0]].objects[ref[1]])
				path += ref[0] + ".objects." + ref[1];
			j = 2;
		} else {
			if (value = runtime[namespace].variables[ref[0]])
				path += namespace + ".variables." + ref[0];
			else if (value = runtime[namespace].objects[ref[0]])
				path += namespace + ".objects." + ref[0];
		}

		if (!value) {
			if (overwrite) {
				if (runtime[ref[0]] && ref[1])
					path += ref[0] + ".variables." + ref[1];
				else
					path += namespace + ".variables." + ref[0];

				j = ref.length;
			} else {
				console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid reference (${reference})`);
				return;
			}
		}

		for (; j < ref.length; j++) {
			let r = ref[j];
			path += ".";
			if (value._type == "object" && value._content[r]) {
				path += "_content." + r;
				value = value._content[r];
			} else {
				console.log(`! [${namespace}.syren: ${lineIndex + 1}] "${r}" is not a child of "${ref.slice(0, -1).join(".")}"`);
				return;
			}
		}

		if (overwrite !== undefined) {
			let stack = path.split(".");
			let object = runtime;

			while (stack.length > 1) {
				object = object[stack.shift()];
			}

			object[stack.shift()] = overwrite;

			return path;
		} else {
			return value;
		}
	}

	function genField(type, content, options = {}) {
		switch (type) {
			case "object":
				return { _type: type, _class: options.class, _content: content, }

			default:
				return { _type: type, _content: content}
		}
	}

	function strField(field) {
		if (!field) return;

		switch (field._type) {
			case "object":
				return `[object: ${field._class || "Object"}]`;

			default:
				return field._content;
		}
	}
}

// TODO: read all of the css and apply colors, etc. to corrosponding objects
// TODO: export all applications into .ini files
