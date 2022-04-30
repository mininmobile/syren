function makeField(value, options = {}) {
	if (typeof value == "string") {
		// if string is passed, check if can be number
		let x = Number(value);
		if (value.length == 0 || isNaN(x))
			return genField("string", value, options);
		else
			return genField("number", x, options);
	} else if (typeof value == "number") {
		return genField("number", value, options);
	} else if (value instanceof Array) {
		return genField("array", value, options);
	} else {
		return genField(typeof value, value, options);
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
			return `<object: ${field._class || "Object"}>`;

		case "array":
			return `<array: ${field._content.map(strField).join(", ")}>`;

		case "command":
			return `<command: ${field._command || "Internal"}>`;

		default:
			return field._content;
	}
}

function setObject(object, path, value) {
	let stack = path.split(".");

	while (stack.length > 1) {
		object = object[stack.shift()];
	}

	object[stack.shift()] = value;
}

module.exports = {
	makeField,
	genField,
	strField,
	setObject,
}
