declare namespace MqttConsumer.Config {

	type Config = {
		debug: boolean;
		mqtt: {
			host: string;
		};
		db: {
			host: string;
			user: string;
			password: string;
			database: string;
		};
		globalRules: Rule[];
		detectors: Detector[];
	};

	type Detector = {
		identifier: string;
		rules: Rule[];
	};

	type Rule = {
		action: "ignore" | "log" | "report";
		labels?: string[];
		priority?: number;
		confidenceBelow?: number;
		confidenceAbove?: number;
		timeframe?: Timeframe[];
		boundingBox?: BoundingBox;
	};

	type BoundingBox = {
		topLeft: [number, number];
		bottomRight: [number, number];
	};

	type Timeframe = {
		from: TimeframeEntry;
		to: TimeframeEntry;
	};

	type TimeframeEntry = {
		dayOfWeek?: number;
		hour?: number;
		minute?: number;
	};
}