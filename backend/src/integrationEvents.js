function emitIntegrationEvent(type, payload) {
  console.log(`[integration-event] ${type}`, JSON.stringify(payload));
}

module.exports = { emitIntegrationEvent };
