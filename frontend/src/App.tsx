import { useRef, useState } from "react";
import {
  connectionRequest,
  WsData,
  messageTypes,
  useWebsocket,
} from "./websocket";
import "./App.css";

const RTCServerConfig: RTCConfiguration = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ],
};

function App() {
  const [transportChannelId, setTransportChannelId] = useState<string | null>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [_peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);

  const ws = useWebsocket(
    setTransportChannelId,
    setPeerConnection,
    RTCServerConfig
  );

  const handleCreateTransportChannel = () => {
    const data: WsData<null> = {
      messageType: messageTypes.initConnection,
      payload: null,
    };
    ws?.send(JSON.stringify(data));
  };

  const handleConnectWithCode = async () => {
    const input = inputRef.current?.value;
    if (!input) {
      return;
    }

    const peerConn = new RTCPeerConnection(RTCServerConfig);
    setPeerConnection(peerConn);

    const offer = await peerConn.createOffer({
      offerToReceiveAudio: true,
      iceRestart: true,
    });
    await peerConn.setLocalDescription(offer);

    const data: WsData<connectionRequest> = {
      messageType: messageTypes.connectPeer,
      payload: { transportChannelId: input, SDP: JSON.stringify(offer) },
    };

    ws?.send(JSON.stringify(data));
  };

  return (
    <div className="container">
      <div className="flex-row">
        <div>
          <p>Code: {transportChannelId}</p>
          <button onClick={handleCreateTransportChannel}>Generate code</button>
        </div>
        {!transportChannelId && (
          <div>
            <p>Paste offer</p>
            <input ref={inputRef} />
            <button onClick={handleConnectWithCode}>Connect</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
