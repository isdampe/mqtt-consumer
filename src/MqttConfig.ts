import fs from "fs";

let MqttConfig: MqttConsumer.Config.Config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

function validateConfig(input: any): string[] {
	const errors: string[] = [];
	
	if (typeof input !== "object" || input === null) {
		errors.push("Input must be an object.");
		return errors;
	}

	if (typeof input.retainLogsForDays !== "number") {
		errors.push("retainLogsForDays must be a number.");
	}

	if (typeof input.debug !== "boolean") {
		errors.push("debug must be a boolean.");
	}

	if (!input.mqtt || typeof input.mqtt.host !== "string") {
		errors.push("mqtt.host is required and must be a string.");
	}

	if (! input.db || typeof input.db.host !== "string") {
		errors.push("db.host is required and must be a string.");
	}

	if (! input.db || typeof input.db.user !== "string") {
		errors.push("db.user is required and must be a string.");
	}

	if (! input.db || typeof input.db.password !== "string") {
		errors.push("db.password is required and must be a string.");
	}

	if (! input.db || typeof input.db.database !== "string") {
		errors.push("db.database is required and must be a string.");
	}
	

	if (!Array.isArray(input.globalRules)) {
		errors.push("globalRules must be an array.");
	} else {
		for (const rule of input.globalRules) {
			const ruleErrors = validateRule(rule);
			errors.push(...ruleErrors);
		}
	}

	if (!Array.isArray(input.detectors)) {
		errors.push("detectors must be an array.");
	} else {
		for (const detector of input.detectors) {
			const detectorErrors = validateDetector(detector);
			errors.push(...detectorErrors);
		}
	}

	return errors;
}

function validateDetector(detector: any): string[] {
	const errors: string[] = [];
	
	if (typeof detector !== "object" || detector === null) {
		errors.push("Detector must be an object.");
		return errors;
	}
	
	if (typeof detector.identifier !== "string") {
		errors.push("Detector.identifier is required and must be a string.");
	}

	if (!Array.isArray(detector.rules)) {
		errors.push("Detector.rules must be an array.");
	} else {
		for (const rule of detector.rules) {
			const ruleErrors = validateRule(rule);
			errors.push(...ruleErrors);
		}
	}

	return errors;
}

function validateRule(rule: any): string[] {
	const errors: string[] = [];
	
	if (typeof rule !== "object" || rule === null) {
		errors.push("Rule must be an object.");
		return errors;
	}

	const validActions = ["ignore", "log", "report"];
	if (!validActions.includes(rule.action)) {
		errors.push("Rule.action is required and must be one of: ignore, log, report.");
	}

	if (rule.labels && !Array.isArray(rule.labels)) {
		errors.push("Rule.labels must be an array if provided.");
	}

	if (rule.confidenceBelow !== undefined && typeof rule.confidenceBelow !== "number") {
		errors.push("Rule.confidenceBelow must be a number if provided.");
	}

	if (rule.confidenceAbove !== undefined && typeof rule.confidenceAbove !== "number") {
		errors.push("Rule.confidenceAbove must be a number if provided.");
	}

	if (rule.timeframe) {
		if (!Array.isArray(rule.timeframe)) {
			errors.push("Rule.timeframe must be an array if provided.");
		} else {
			for (const timeframe of rule.timeframe) {
				const timeframeErrors = validateTimeframe(timeframe);
				errors.push(...timeframeErrors);
			}
		}
	}

	if (rule.boundingBox) {
		const boundingBoxErrors = validateBoundingBox(rule.boundingBox);
		errors.push(...boundingBoxErrors);
	}

	return errors;
}

function validateBoundingBox(boundingBox: any): string[] {
	const errors: string[] = [];
	
	if (typeof boundingBox !== "object" || boundingBox === null) {
		errors.push("BoundingBox must be an object.");
		return errors;
	}

	if (!Array.isArray(boundingBox.topLeft) || boundingBox.topLeft.length !== 2) {
		errors.push("BoundingBox.topLeft must be an array of two numbers.");
	} else {
		if (typeof boundingBox.topLeft[0] !== "number" || typeof boundingBox.topLeft[1] !== "number") {
			errors.push("BoundingBox.topLeft coordinates must be numbers.");
		}
	}

	if (!Array.isArray(boundingBox.bottomRight) || boundingBox.bottomRight.length !== 2) {
		errors.push("BoundingBox.bottomRight must be an array of two numbers.");
	} else {
		if (typeof boundingBox.bottomRight[0] !== "number" || typeof boundingBox.bottomRight[1] !== "number") {
			errors.push("BoundingBox.bottomRight coordinates must be numbers.");
		}
	}

	return errors;
}

function validateTimeframe(timeframe: any): string[] {
	const errors: string[] = [];
	
	if (typeof timeframe !== "object" || timeframe === null) {
		errors.push("Timeframe must be an object.");
		return errors;
	}

	const fromErrors = validateTimeframeEntry(timeframe.from);
	errors.push(...fromErrors);

	const toErrors = validateTimeframeEntry(timeframe.to);
	errors.push(...toErrors);

	return errors;
}

function validateTimeframeEntry(entry: any): string[] {
	const errors: string[] = [];
	
	if (typeof entry !== "object" || entry === null) {
		errors.push("TimeframeEntry must be an object.");
		return errors;
	}

	if (entry.dayOfWeek !== undefined && typeof entry.dayOfWeek !== "number") {
		errors.push("TimeframeEntry.dayOfWeek must be a number if provided.");
	}

	if (entry.hour !== undefined && typeof entry.hour !== "number") {
		errors.push("TimeframeEntry.hour must be a number if provided.");
	}

	if (entry.minute !== undefined && typeof entry.minute !== "number") {
		errors.push("TimeframeEntry.minute must be a number if provided.");
	}

	return errors;
}


const errors = validateConfig(MqttConfig);
if (errors.length > 0)
	throw new Error(`Invalid config: ${errors.join("\n")}`);

export default MqttConfig;