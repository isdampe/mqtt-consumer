import { connect, MqttClient } from "mqtt";
import MqttConfig from "./MqttConfig";
import { MqttGetMatchedRules } from "./MqttRule";
import { MqttDb } from "./MqttDb";

class MqttConsumer {
	private config: MqttConsumer.Config.Config;
	private client: MqttClient;
	private db: MqttDb;

	constructor(config: MqttConsumer.Config.Config) {
		this.config = config;
		this.db = new MqttDb();
		this.client = connect(this.config.mqtt.host);
		this.client.on("connect", this.onConnect.bind(this));
		this.client.on("message", this.onMessage.bind(this));
	}

	private log(message: string) {
		console.log(`[MqttConsumer log] ${message}`);
	}

	private debug(message: string) {
		if (! this.config.debug) 
			return;

		console.log(`[MqttConsumer debug] ${message}`);
	}

	private onConnect() {
		for (const detector of this.config.detectors) {
			this.debug(`Subscribing to ${detector.identifier}`);
			this.client.subscribe(detector.identifier);
		}
	}

	private onMessage(topic: string, message: Buffer) {
		try {
			const json = JSON.parse(message.toString());
			this.validatePayload(json);
			this.handleMessage({
				...json,
				identifier: topic,
			});
		} catch (e) {
			this.log(`Error parsing message: ${e}`);
			return;
		}
	}

	private validatePayload(json: any) {
		if (typeof json !== "object" || json === null)
			throw new Error("Invalid message: not an object");

		if (typeof json.label !== "string")
			throw new Error("Invalid message: label is not a string");

		if (typeof json.confidence !== "number")
			throw new Error("Invalid message: confidence is not a number");

		if (typeof json.bounding_box !== "object" || json.bounding_box === null)
			throw new Error("Invalid message: bounding_box is not an object");

		if (! Array.isArray(json.bounding_box.top_left))
			throw new Error("Invalid message: bounding_box.top_left is not an array");

		if (! Array.isArray(json.bounding_box.bottom_right))
			throw new Error("Invalid message: bounding_box.bottom_right is not an array");

		if (json.bounding_box.top_left.length !== 2)
			throw new Error("Invalid message: bounding_box.top_left is not an array of length 2");

		if (json.bounding_box.bottom_right.length !== 2)
			throw new Error("Invalid message: bounding_box.bottom_right is not an array of length 2");

	}

	private handleMessage(payload: MqttConsumer.Message.Payload) {
		this.debug(`Received message for ${payload.identifier}: ${JSON.stringify(payload, null, 2)}`);
		const matchedRules = MqttGetMatchedRules(payload, this.config);
		if (matchedRules.length === 0) {
			this.debug(`No rules matched for ${payload.identifier}`);
			return;
		}

		for (const rule of matchedRules) {
			switch (rule.action) {
				case "ignore":
					this.debug(`Ignoring message for ${payload.identifier}`);
					break;
				case "log":
					this.debug(`Logging message for ${payload.identifier}`);
					this.debug(JSON.stringify(payload, null, 2));
					this.db.logEvent(payload);
					break;
				case "report":
					this.debug(`Reporting message for ${payload.identifier}`);
					break;
			}

			// Don't continue processing if the action is ignore.
			if (rule.action === "ignore")
				break;
		}
	}

}

const consumer = new MqttConsumer(MqttConfig);