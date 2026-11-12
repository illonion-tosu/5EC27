/**
 * Create socket event loggers
 * @param {ReconnectingWebSocket} socket 
 */
function registerSocketEventLoggers(socket) {
    socket.onopen = () => { console.log("Successfully Connected"); };
    socket.onclose = event => { console.log("Socket Closed Connection: ", event); socket.send("Client Closed!"); };
    socket.onerror = error => { console.log("Socket Error: ", error); };
}

/**
 * Create websocket
 * @param {string} path 
 * @returns {ReconnectingWebSocket} returns the socket for onmessage
 */
export function createTosuWsSocket(path = "/websocket/v2") {
    const socket = new ReconnectingWebSocket("ws://" + location.host + path);
    registerSocketEventLoggers(socket);
    return socket;
}