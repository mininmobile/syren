const fs = require("fs");

// read all the files
console.log("- reading files...");

let files = fs.readdirSync("../@Sources")
	.filter(x => x.endsWith(".syren") || x.endsWith(".css"));

console.log("- available scripts:")
console.log(files.join(", "));

// parse all of the scripts and create some objects
// read all of the css and apply colors, etc. to corrosponding objects
// export all applications into .ini files
