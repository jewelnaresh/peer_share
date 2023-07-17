import { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  InitPayload,
  WsData,
  addICECandidateRequest,
  connectionRequest,
  messageTypes,
  useWebsocket,
} from "./websocket";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [transportChannelId, setTranportChannelId] = useState<string>();
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
  const [isConnected, setIsConnected] = useState(false);

  const ws = useWebsocket();

  useEffect(() => {
    const handleOnMessage = async (ev: MessageEvent<string>) => {
      const data: WsData<unknown> = JSON.parse(ev.data);
      switch (data.messageType) {
        case messageTypes.initConnection: {
          const payload = data.payload as InitPayload;
          setTranportChannelId(payload.transportChannelId);
          break;
        }
        case messageTypes.receiveOffer: {
          const payload = data.payload as connectionRequest;
          const peerConn = new RTCPeerConnection(RTCServerConfig);
          setPeerConnection(peerConn);

          peerConn.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
            if (ev.candidate) {
              const candidate = ev.candidate;
              if (candidate.candidate === "" || !transportChannelId) return;
              const iceData: WsData<addICECandidateRequest> = {
                messageType: messageTypes.addReceiverICECandidate,
                payload: {
                  transportChannelId: transportChannelId,
                  ICECandidate: JSON.stringify(candidate),
                },
              };
              ws?.send(JSON.stringify(iceData));
            }
          };

          peerConn.onconnectionstatechange = () => {
            if (peerConn.connectionState === "connected") {
              setIsConnected(true);
            } else {
              setIsConnected(false);
            }
          };

          const parsedOffer = JSON.parse(payload.SDP);
          peerConn.setRemoteDescription(new RTCSessionDescription(parsedOffer));

          const answer = await peerConn.createAnswer({
            iceRestart: true,
            offerToReceiveAudio: true,
          });
          await peerConn.setLocalDescription(answer);

          const answerData: WsData<connectionRequest> = {
            messageType: messageTypes.receiveAnswer,
            payload: {
              transportChannelId: payload.transportChannelId,
              SDP: JSON.stringify(answer),
            },
          };
          ws?.send(JSON.stringify(answerData));
          break;
        }
        case messageTypes.receiveAnswer: {
          const payload = data.payload as connectionRequest;
          const parsedAnswer = JSON.parse(payload.SDP);
          peerConnection?.setRemoteDescription(
            new RTCSessionDescription(parsedAnswer)
          );
          setTranportChannelId(payload.transportChannelId);
          break;
        }
        case messageTypes.receiveICECandidate: {
          const payload = data.payload as addICECandidateRequest;
          const parsedICECandidate = JSON.parse(payload.ICECandidate);
          peerConnection?.addIceCandidate(
            new RTCIceCandidate(parsedICECandidate)
          );
          break;
        }
        default:
          break;
      }
    };

    ws?.addEventListener("message", handleOnMessage);

    return () => {
      ws?.removeEventListener("message", handleOnMessage);
    };
  }, [peerConnection, transportChannelId, ws]);

  const handleCreateTransportChannel = () => {
    const data: WsData<null> = {
      messageType: messageTypes.initConnection,
      payload: null,
    };
    ws?.send(JSON.stringify(data));
  };

  const handleConnectWithCode = async () => {
    const enteredCode = inputRef.current?.value;
    if (!enteredCode) return;

    const peerConnection = new RTCPeerConnection(RTCServerConfig);
    setPeerConnection(peerConnection);

    peerConnection.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
      if (ev.candidate) {
        const candidate = ev.candidate;
        if (candidate.candidate === "" || !transportChannelId) return;
        const iceData: WsData<addICECandidateRequest> = {
          messageType: messageTypes.addConnectorICECandidate,
          payload: {
            transportChannelId: transportChannelId,
            ICECandidate: JSON.stringify(candidate),
          },
        };
        ws?.send(JSON.stringify(iceData));
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "connected") {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    };

    const offer = await peerConnection.createOffer({
      iceRestart: true,
      offerToReceiveAudio: true,
    });
    await peerConnection.setLocalDescription(offer);
    const data: WsData<connectionRequest> = {
      messageType: messageTypes.connectPeer,
      payload: { transportChannelId: enteredCode, SDP: JSON.stringify(offer) },
    };

    ws?.send(JSON.stringify(data));
  };

  return (
    <div className="container">
      <div className="flex-row">
        <div>
          <p>Connection status: {isConnected ? "Connected" : "Disconnected"}</p>
          <p>Code: {transportChannelId}</p>
          {!transportChannelId && (
            <button onClick={handleCreateTransportChannel}>
              Generate code
            </button>
          )}
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
