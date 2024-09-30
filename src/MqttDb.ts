import MqttConfig from "./MqttConfig";
import knex, { Knex } from "knex";

export class MqttDb {
	private db: Knex;

	constructor() {
		this.db = knex({
			client: "mysql2",
			connection: {
				host: MqttConfig.db.host,
				user: MqttConfig.db.user,
				password: MqttConfig.db.password,
				database: MqttConfig.db.database
			}
		});

		setInterval(() => {
			// Clean up old events.
			this.cleanUpOldEvents();
		}, 1000 * 60 * 10); 
	}

	async cleanUpOldEvents() {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - MqttConfig.retainLogsForDays);

		await this.db("event")
			.where("timeCreated", "<", cutoff)
			.del();
	}

	async logEvent(event: MqttConsumer.Message.Payload) {
		return await this.db("event")
			.insert({
				identifier: event.identifier,
				label: event.label,
				confidence: event.confidence,
				boundingBox: event.bounding_box
			});
	}


}

