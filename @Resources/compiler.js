const fs = require("fs");
const util = require("./lib/util");
const builtins = require("./lib/builtins");

let styles = {}
let scripts = {}
let runtime = {}

{ // read files
	console.log("- reading files...");

	let fileList = fs.readdirSync("../@Sources");
	let scriptList = fileList.filter(x => x.endsWith(".syren"));
	let styleList = fileList.filter(x => x.endsWith(".css"));

	console.log("- available scripts:")
	console.log(scriptList.join(", "));

	scriptList.forEach((file) => {
		let data = fs.readFileSync("../@Sources/" + file, "utf-8");
		let namespace = file.charAt(0).toUpperCase() + file.substring(1, file.length - 6);
		// prepare for parsing
		data = data.split(/\n+/g)
			.map(x => x.trim())
			.filter(x => !(x.length == 0 || x.startsWith("//")));
		// export tokens
		scripts[namespace] = data;
	});

	console.log("- available styles:")
	console.log(styleList.join(", "), "\n");

	styleList.forEach((file) => {
		let data = fs.readFileSync("../@Sources/" + file, "utf-8");
		let namespace = file.charAt(0).toUpperCase() + file.substring(1, file.length - 4);

		// export tokens
		styles[namespace] = data;
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
				let ref = parseReference(namespace, cmd, lineIndex, true);
				if (!ref) break;
				let value = util.makeField(args.slice(1).join(""));
				util.setObject(runtime, ref.path, value);
			} break;

			case "=[]": {
				let ref = parseReference(namespace, cmd, lineIndex, true);
				let value = util.makeField(args.slice(1).map(util.makeField));
				util.setObject(runtime, ref.path, value);
			} break;

			default: switch (cmd) {
				case "echo":
					console.log(" ", args.join(""));
					return;

				case "new":
					if (builtins[args[0]] == undefined)
						return console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid object "${args[0]}"`);
					if (!args[1] || args[1].length == 0)
						return console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid object name`);
					if (runtime[namespace].objects[args[1]] !== undefined)
						return console.log(`! [${namespace}.syren: ${lineIndex + 1}] object by name "${args[1]}" already exists`);

					let n = runtime[namespace].objects[args[1]] = builtins[args[0]]();

					if (args[2] == "->") {
						let ref = parseReference(namespace, args[3], lineIndex);
						if (!args[3] || !ref || !ref._content.components)
							return console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid object after "->"`);

						ref._content.components._content.push(n);
					}
					return;

				default:
					let ref = parseReference(namespace, cmd, lineIndex, true);
					if ((ref || {}).isCommand) {
						ref.value._content(args, runtime, namespace, lineIndex);
					} else
						console.log(`! [${namespace}.syren: ${lineIndex + 1}] invalid command "${cmd}"`);
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
					l = l.replace("\xff", value ? util.strField(value) : `\${${x}}`);
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

	function parseReference(namespace, reference, lineIndex, returnMeta = false) {
		let ref = reference.split(".");
		let value;
		let j = 1;
		// meta
		let path = "";
		let setsNamespace = false;
		let isVariable = true;
		let isObject = false;
		let isCommand = false;

		// if ref[0] is a different namespace
		if (runtime[ref[0]] && ref[1]) {
			if (value = runtime[ref[0]].variables[ref[1]])
				path += ref[0] + ".variables." + ref[1];
			else if (value = runtime[ref[0]].objects[ref[1]]) {
				path += ref[0] + ".objects." + ref[1];
				isVariable = false;
				isObject = true;
			}
			j = 2;
			setsNamespace = true;
		} else {
			if (value = runtime[namespace].variables[ref[0]])
				path += namespace + ".variables." + ref[0];
			else if (value = runtime[namespace].objects[ref[0]]) {
				path += namespace + ".objects." + ref[0];
				isVariable = false;
				isObject = true;
			}
		}

		if (!value) {
			if (returnMeta) {
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
			if (value._type == "object" && value._content[r] !== undefined)
			{ // if a field of an object
				path += "_content." + r;
				value = value._content[r];
				isObject = false;
				if (value._type == "command")
					isCommand = true;
			} else if (value._type == "array")
			{ // if a field of an array
				isObject = false;
				if ((value._content[Number(r)] !== undefined && !returnMeta) || (!isNaN(Number(r)) && returnMeta))
				{ // if an element in the array
					path += "_content." + r;
					value = value._content[Number(r)];
				} else if (r == "length" && !returnMeta)
				{ // if the length of the array
					value = util.makeField(value._content.length);
				} else
				{
					console.log(`! [${namespace}.syren: ${lineIndex + 1}] "${r}" is not a property of array "${ref.slice(0, -1).join(".")}"`);
					return;
				}
			} else
			{ // if it is not a field of the previous reference
				console.log(`! [${namespace}.syren: ${lineIndex + 1}] "${r}" is not a child of "${ref.slice(0, -1).join(".")}"`);
				return;
			}
		}

		if (returnMeta) {
			return { setsNamespace, isVariable, isObject, isCommand, path, value }
		} else {
			return value;
		}
	}
}

{ // interpret css stylings
	// TODO: find a css parser
}

// TODO: apply colors, etc. to corrosponding objects
// TODO: export all applications into .ini files
