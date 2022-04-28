const fs = require("fs");
const { type } = require("os");

let scripts = {};

{ // read files
	console.log("- reading files...");

	let fileList = fs.readdirSync("../@Sources")
		.filter(x => x.endsWith(".syren") || x.endsWith(".css"));

	console.log("- available scripts:")
	console.log(fileList.join(", "));

	fileList.forEach((script) => {
		let data = fs.readFileSync("../@Sources/" + script, "utf-8");
		// prepare for parsing
		data = data.split(/\n+/g)
			.map(x => x.trim())
			.filter(x => !(x.length == 0 || x.startsWith("//")));
		// parse into tokens
		for (let l = 0; l < data.length; l++) {
			let line = data[l];
			// lines are parsed with this recycled piece of code
			// https://github.com/mininmobile/llamecode/blob/master/compiler/compiler.js#L46=
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
						let add = "\\" + char;

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

			if (temp != "") tokens.push(temp);
			data[l] = tokens;
		}
		// export tokens
		scripts[script] = data;
	});
}

{ // execute scripts
	Object.keys(scripts).forEach(file => {
		scripts[file].forEach((/** @type {string[]} */ line, lineIndex) => {
			let args = line;
			let cmd = args.shift();

			switch (args[0]) {
				// variable assignment placeholder
				case "=": break;

				default: {
					switch (cmd) {
						case "echo":
							console.log(args.join(" "));
							return;

						default: {
							console.log(`! [${file}: ${lineIndex + 1}] invalid command`);
						}
					}
				}
			}
		});
	});
}

// TODO: read all of the css and apply colors, etc. to corrosponding objects
// TODO: export all applications into .ini files
