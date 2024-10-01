type FrameCountMapEntry = {
	identifier: string;
	label: string;
	frameCount: number;
	lastSeen: Date;
};

export class MqttFrameCounter {
	private frameCountMap: Record<string, FrameCountMapEntry> = {};

	frameTick(args: {
		identifier: string;
		labels: string[];
	}) {

		for (const label of args.labels) {
			this.changeFrameCount({
				identifier: args.identifier,
				label: label,
				type: "increment",
			});
		}

		this.autoDecrementFrameCount({
			identifier: args.identifier,
			ignoreLabels: args.labels,
		});

	}

	getFrameCount(args: {
		identifier: string;
		label: string;
	}) {
		const key = `${args.identifier}:${args.label}`;
		return this.frameCountMap[key]?.frameCount ?? 0;
	}

	private changeFrameCount(args: {
		identifier: string;
		label: string;
		type: "increment" | "decrement";
	}) {
		const key = `${args.identifier}:${args.label}`;
		if (! this.frameCountMap[key]) {
			this.frameCountMap[key] = {
				identifier: args.identifier,
				label: args.label,
				frameCount: 0,
				lastSeen: new Date(),
			};
		}

		this.frameCountMap[key].frameCount += args.type === "increment" ? 1 : -1;
		if (this.frameCountMap[key].frameCount > 10)
			this.frameCountMap[key].frameCount = 10;

		if (args.type === "increment")
			this.frameCountMap[key].lastSeen = new Date();

	}

	private autoDecrementFrameCount(args: {
		identifier: string;
		ignoreLabels: string[];
	}) {
		for (const [key, entry] of Object.entries(this.frameCountMap)) {
			if (entry.identifier !== args.identifier)
				continue;

			if (args.ignoreLabels.includes(entry.label))
				continue;

			if (entry.frameCount <= 0)
				continue;

			entry.frameCount--;

			if (entry.frameCount <= 0)
				delete this.frameCountMap[key];
		}
	}
}