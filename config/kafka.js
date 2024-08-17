'use strict'

const kafka = require('kafka-node');

const kafkaClient = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_HOST });
const producer = new kafka.Producer(kafkaClient);
const consumer = new kafka.Consumer(
  kafkaClient,
  [{ topic: 'kafka-donny-betest', partition: 0 }],
  { autoCommit: true }
);

producer.on('ready', () => console.log('Kafka Producer is ready'));
producer.on('error', (err) => console.error('Kafka Producer error:', err));

module.exports = { producer, consumer };
