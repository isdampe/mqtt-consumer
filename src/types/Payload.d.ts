declare namespace MqttConsumer.Message {
	type Payload = {
		identifier: string;
		label: string;
		confidence: number;
		bounding_box: {
			top_left: [number, number];
			bottom_right: [number, number];
		};
	};
}