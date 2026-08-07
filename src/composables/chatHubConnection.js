import * as signalR from '@microsoft/signalr'

const HUB_PATH = '/chat-ms/hubs/chat'

/**
 * Создаёт (но не запускает) соединение с ChatHub.
 * Токен передаётся через accessTokenFactory — SignalR сам положит его
 * в query-параметр access_token при WS upgrade (см. обсуждение YARP-конфига:
 * заголовки недоступны браузерному WebSocket API, поэтому JWE/JWT летит в query).
 *
 * @param {Object} options
 * @param {string} options.baseUrl - адрес gateway, например http://localhost:5126
 * @param {() => string | Promise<string>} options.getAccessToken - текущий access token
 */
export function createChatHubConnection({ baseUrl, getAccessToken }) {
    var connection = new signalR.HubConnectionBuilder()
    .withUrl(`${baseUrl}${HUB_PATH}`, {
      accessTokenFactory: getAccessToken
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()
    
    connection.on('Notify', (data) => console.log('Notification from chats', data))

  return connection
}