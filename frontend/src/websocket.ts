import { useEffect, useState, useSyncExternalStore } from "react";

export const messageTypes = {
  initConnection: "INIT_CONNECTION",
  connectPeer: "CONNECT_PEER",
  receiveOffer: "RECEIVE_OFFER",
  receiveAnswer: "RECEIVE_ANSWER",
  addConnectorICECandidate: "ADD_CONNECTOR_ICE_CANDIDATE",
  addReceiverICECandidate: "ADD_RECEIVER_ICE_CANDIDATE",
  receiveICECandidate: "RECEIVE_ICE_CANDIDATE",
};

export interface InitPayload {
  transportChannelId: string;
}

export interface connectionRequest {
  transportChannelId: string;
  SDP: string;
}

export interface addICECandidateRequest {
  transportChannelId: string;
  ICECandidate: string;
}

export interface WsData<T> {
  messageType: string;
  payload: T;
}

export type onMessageEventListeners = (
  this: WebSocket,
  ev: MessageEvent<string>
) => void;

export const useWebsocket = () => {
  const [ws, setWs] = useState<WebSocket>();

  // Setup Websocket connection
  useEffect(() => {
    const connection = new WebSocket("ws:127.0.0.1:3000/ws");
    setWs(connection);

    return () => {
      connection.close();
      setWs(undefined);
    };
  }, []);

  return ws;
};

function subscribeToNetworkEvents(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export const useOnlineStatus = () => {
  return useSyncExternalStore(subscribeToNetworkEvents, () => navigator.onLine);
};
