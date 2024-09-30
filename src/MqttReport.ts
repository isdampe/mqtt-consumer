import MqttConfig from "./MqttConfig";
import axios from "axios";

export async function MqttReportEvent(event: MqttConsumer.Message.Payload) {
	const response = await axios.post(
		`${MqttConfig.reportServer.host}/message`,
		{
			title: `${event.identifier}: ${event.label} (${event.confidence.toFixed(2)})`,
			message: `${event.identifier}: ${event.label} (${event.confidence.toFixed(2)}) at ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}`,
			priorities: 5
		},
		{
			headers: {
				"X-Gotify-Key": MqttConfig.reportServer.apiKey,
				"Content-Type": "application/json"
			}
		}
	);

	console.log(response);
}