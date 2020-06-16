require('./lib/requireRoot'); //allow require relative to project root

const logger = requireRoot("/lib/logger");
const config = requireRoot('/lib/config');

const databaseLoader = requireRoot('/loaders/databaseLoader');
const mqttLoader = requireRoot('/loaders/mqttLoader');
const webSocketLoader = requireRoot('/loaders/webSocketLoader');
const httpSrvLoader = requireRoot('/loaders/httpSrvLoader');
const contextHandler = requireRoot('/lib/contextHandler');
const jobs = requireRoot('/jobs');

logger.info("Application starting...");
// Init storage: global.db and global.db.promise
const database = databaseLoader(() => {

  // Init WebSocket: global.wss
  const ws = webSocketLoader();

  // Init Express app and start: global.app
  const app = httpSrvLoader();

  // Create central manager: global.context
  const context = global.context = new contextHandler();

  // Init central manager devices
  context.InitDevices(function () {

    // Init MQTT client: global.mqtt
    const mqttCli = mqttLoader();

    // Subscribe to MQTT
    context.InitMqtt(mqttCli);

    // Init scheduled jobs
    jobs();

    logger.info("Application started, waiting for subsystems start");
  });
});