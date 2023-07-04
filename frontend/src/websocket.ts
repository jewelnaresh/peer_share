import { useEffect, useState } from "react";

const messageTypes = { initConnection: "INIT_CONNECTION" };

interface InitPayload {
  id: string;
}

interface WsData {
  messageType: string;
  payload: InitPayload;
}

export const useWebsocket = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsId, setWsId] = useState<string | null>(null);
  // Setup Websocket connection

  useEffect(() => {
    const connection = new WebSocket("ws:127.0.0.1:3000/ws");

    connection.onmessage = (e) => {
      const data: WsData = JSON.parse(e.data);
      switch (data.messageType) {
        case messageTypes.initConnection:
          setWsId(data.payload.id);
          break;

        default:
          break;
      }
    };

    setWs(connection);

    return () => {
      connection.close();
      setWs(null);
    };
  }, []);

  return [ws, wsId];
};
