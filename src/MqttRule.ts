export function MqttGetMatchedRules(payload: MqttConsumer.Message.Payload, config: MqttConsumer.Config.Config): MqttConsumer.Config.Rule[] {
	const matchingRules: MqttConsumer.Config.Rule[] = [];

	const checkTimeframe = (timeframe: MqttConsumer.Config.Timeframe): boolean => {
		const now = new Date();
		const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
		const hour = now.getHours();
		const minute = now.getMinutes();

		if (timeframe.from.dayOfWeek !== undefined && timeframe.to.dayOfWeek !== undefined) {
			if (dayOfWeek < timeframe.from.dayOfWeek || dayOfWeek > timeframe.to.dayOfWeek) return false;
		}
		if (timeframe.from.hour !== undefined && timeframe.to.hour !== undefined) {
			if (hour < timeframe.from.hour || hour > timeframe.to.hour) return false;
		}
		if (timeframe.from.minute !== undefined && timeframe.to.minute !== undefined) {
			if (minute < timeframe.from.minute || minute > timeframe.to.minute) return false;
		}
		return true;
	};

	const checkBoundingBox = (ruleBox: MqttConsumer.Config.BoundingBox): boolean => {
		const payloadBox = payload.bounding_box;
		return (
			payloadBox.top_left[0] >= ruleBox.topLeft[0] &&
			payloadBox.top_left[1] >= ruleBox.topLeft[1] &&
			payloadBox.bottom_right[0] <= ruleBox.bottomRight[0] &&
			payloadBox.bottom_right[1] <= ruleBox.bottomRight[1]
		);
	};

	const checkRule = (rule: MqttConsumer.Config.Rule): boolean => {
		if (rule.labels && !rule.labels.includes(payload.label)) return false;
		if (rule.confidenceBelow !== undefined && payload.confidence >= rule.confidenceBelow) return false;
		if (rule.confidenceAbove !== undefined && payload.confidence <= rule.confidenceAbove) return false;
		if (rule.boundingBox && !checkBoundingBox(rule.boundingBox)) return false;
		if (rule.timeframe && !rule.timeframe.some(checkTimeframe)) return false;
		return true;
	};

	// Check global rules
	for (const rule of config.globalRules) {
		if (checkRule(rule)) matchingRules.push(rule);
	}

	// Check detector rules
	for (const detector of config.detectors) {
		for (const rule of detector.rules) {
			if (checkRule(rule)) matchingRules.push(rule);
		}
	}

	return matchingRules.sort((a, b) => {
		return (b.priority ?? 1) - (a.priority ?? 1);
	});

}
