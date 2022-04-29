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
		// prepare for parsing
		data = data.split(/\n+/g)
			.map(x => x.trim())
			.filter(x => !(x.length == 0 || x.startsWith("//")));
		// export tokens
		scripts[file.substring(0, file.length - 6)] = data;
	});
}

{ // execute scripts
	console.log("- parsing .syren files\n");

	Object.keys(scripts).forEach(namespace => {
		console.log(`> ${namespace} (${namespace}.syren)`);

		runtime[namespace] = {
			sets: {},
			lumps: {},
			objects: {
				"ballsack": genField("object", {
					"ballCount": genField("number", 2),
				}),
			},
			variables: {
				"var": genField("string", "yep"),
			},
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
			case "=": break;

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
					let ref = x.split(".");
					let value = runtime[namespace].variables[ref[0]];

					l = l.replace("\xff", strField(value) || `\${${x}}`)
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

	function genField(type, content, options = {}) {
		switch (type) {
			case "object":
				return { _type: type, _content: content, }

			default:
				return { _type: type, _content: content}
		}
	}

	function strField(field) {
		if (!field) return;

		switch (field._type) {
			default:
				return field._content;
		}
	}
}

// TODO: read all of the css and apply colors, etc. to corrosponding objects
// TODO: export all applications into .ini files
