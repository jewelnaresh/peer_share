import { useEffect, useState, useSyncExternalStore } from "react";

export const messageTypes = {
  initConnection: "INIT_CONNECTION",
  connectPeer: "CONNECT_PEER",
  receiveOffer: "RECEIVE_OFFER",
  receiveAnswer: "RECEIVE_ANSWER",
};

export interface InitPayload {
  transportChannelId: string;
}

export interface connectionRequest {
  transportChannelId: string;
  SDP: string;
}

export interface WsData<T> {
  messageType: string;
  payload: T;
}

export type onMessageEventListeners = (
  this: WebSocket,
  ev: MessageEvent<string>
) => void;

export const useWebsocket = (
  setTransportChannelId: React.Dispatch<
    React.SetStateAction<string | null | undefined>
  >,
  setPeerConnection: React.Dispatch<
    React.SetStateAction<RTCPeerConnection | null>
  >,
  RTCServerConfig: RTCConfiguration
) => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Setup Websocket connection
  useEffect(() => {

    const connection = new WebSocket("ws:127.0.0.1:3000/ws");
    setWs(connection);

    const handleOnMessage = async (e: MessageEvent<string>) => {
      const data: WsData<unknown> = JSON.parse(e.data);
      switch (data.messageType) {
        case messageTypes.initConnection: {
          const payload = data.payload as InitPayload;
          setTransportChannelId(payload.transportChannelId);
          break;
        }
        case messageTypes.receiveOffer: {
          const payload = data.payload as connectionRequest;
          const peerConn = new RTCPeerConnection(RTCServerConfig);
          setPeerConnection(peerConn);

          const parsedOffer = JSON.parse(payload.SDP);
          peerConn.setRemoteDescription(new RTCSessionDescription(parsedOffer));

          const answer = await peerConn.createAnswer({
            offerToReceiveAudio: true,
            iceRestart: true,
          });
          await peerConn.setLocalDescription(answer);

          const answerData: WsData<connectionRequest> = {
            messageType: messageTypes.receiveAnswer,
            payload: {
              transportChannelId: payload.transportChannelId,
              SDP: JSON.stringify(answer),
            },
          };
          connection.send(JSON.stringify(answerData));
          break;
        }

        default:
          break;
      }
    };

    connection.addEventListener("message", handleOnMessage);


    return () => {
      connection.removeEventListener("message", handleOnMessage);
      connection.close();
      setWs(null);
    };
  }, [RTCServerConfig, setPeerConnection, setTransportChannelId]);

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
