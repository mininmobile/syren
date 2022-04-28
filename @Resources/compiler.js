const fs = require("fs");

let files = {};
let runtime = { lumps: {}, sets: {}, objects: {} };

{ // read files
	console.log("- reading files...");

	let fileList = fs.readdirSync("../@Sources")
		.filter(x => x.endsWith(".syren") || x.endsWith(".css"));

	console.log("- available scripts:")
	console.log(fileList.join(", "));

	fileList.forEach((file) => {
		let data = fs.readFileSync("../@Sources/" + file, "utf-8");
		// prepare for parsing
		data = data.split(/\n+/g)
			.map(x => x.trim())
			.filter(x => !(x.length == 0 || x.startsWith("//")));
		// parse
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

		files[file] = data;
	});
}

{ // execute scripts
	console.log(files);
}

// TODO: read all of the css and apply colors, etc. to corrosponding objects
// TODO: export all applications into .ini files
