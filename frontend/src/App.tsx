import { useEffect, useState } from "react";
import { useWebsocket } from "./websocket";

type AppStates = "initializing" | "connected" | "closed";

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
const localConnection = new RTCPeerConnection(RTCServerConfig);
const dataChannel = localConnection.createDataChannel("transferChannel");
let peerConnection: RTCPeerConnection;
let peerDataChannel: RTCDataChannel | null = null;

function App() {
  const [messageText, setMessageText] = useState<string | undefined>(undefined);

  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const [answer, setAnswer] = useState<RTCSessionDescriptionInit | null>(null);
  const [receivedOffer, setReceivedOffer] = useState<
    string | number | readonly string[] | undefined
  >(undefined);
  const [receivedAnswer, setReceivedAnswer] = useState<
    string | number | readonly string[] | undefined
  >(undefined);
  const [connectionState, setConnectionState] =
    useState<AppStates>("initializing");
  // const [iceCandidates, setIceCandidates] = useState<(RTCIceCandidate | null)[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [connectUrl, setConnectionUrl] = useState("");

  const [ws, wsId] = useWebsocket();

  const baseUrl = `${window.location.protocol}//${window.location.host}`

  useEffect(() => {
    // Setup WebRTC connection
    dataChannel.onmessage = (event) => {
      setCurrentMessage(event.data);
    };
    dataChannel.onopen = () => setConnectionState("connected");
    dataChannel.onclose = () => setConnectionState("closed");
    localConnection.onicecandidate = (event) => {
      console.log(event.candidate);
      // if (event.candidate) {
      //   setIceCandidates(prev => [...prev, event.candidate])
      // }
      setOffer(localConnection.localDescription);
      if (localConnection.iceGatheringState === "complete") {
        setOffer(localConnection.localDescription);
      }
    };
    return () => {
      localConnection.onicecandidate = null;
    };
  }, []);

  const handleCreateOffer = async () => {
    setOffer(null);
    const offer = await localConnection.createOffer({
      offerToReceiveAudio: true,
      iceRestart: true,
    });
    await localConnection.setLocalDescription(offer);
    setConnectionUrl(`${baseUrl}/${wsId}`);
  };

  const handleConnectToPeer = async () => {
    peerConnection = new RTCPeerConnection(RTCServerConfig);
    const parsedOffer: RTCSessionDescriptionInit = JSON.parse(
      receivedOffer as string
    );

    peerConnection.onicecandidate = (event) => {
      console.log(event.candidate);
      if (peerConnection.iceGatheringState === "complete") {
        setAnswer(peerConnection.localDescription);
      }
    };

    peerConnection.ondatachannel = (event) => {
      peerDataChannel = event.channel;
      peerDataChannel.onmessage = (event) => {
        setCurrentMessage(event.data);
      };
      peerDataChannel.onopen = () => setConnectionState("connected");
      peerDataChannel.onclose = () => {
        peerDataChannel = null;
        setConnectionState("closed");
      };
    };
    peerConnection.setRemoteDescription(new RTCSessionDescription(parsedOffer));
    const answer = await peerConnection.createAnswer({
      offerToReceiveAudio: true,
      iceRestart: true,
    });
    await peerConnection.setLocalDescription(answer);
  };

  const handleConnectWithAnswer = async () => {
    const parsedAnswer: RTCSessionDescriptionInit = JSON.parse(
      receivedAnswer as string
    );
    await localConnection.setRemoteDescription(parsedAnswer);
  };

  return (
    <div className="container">
      <h1 className="text-3xl mb-20">Connection State: {connectionState}</h1>
      <div className="">
        <div className="">
          <h1>Creat connection</h1>
          <p>Local connection Offer</p>
          <p>Url: {connectUrl}</p>
          <p>{JSON.stringify(offer)}</p>
          <button onClick={handleCreateOffer}>Create Offer</button>
          {offer && (
            <>
              <div>
                <textarea
                  cols={70}
                  rows={8}
                  placeholder="Paste the answer here!"
                  onChange={(event) => setReceivedAnswer(event.target.value)}
                />
              </div>
              <button onClick={handleConnectWithAnswer}>Connect</button>
            </>
          )}
        </div>
        <div className="">
          <h1> Connected Devices</h1>
          <div>
            <textarea
              cols={70}
              rows={8}
              onChange={(event) => setReceivedOffer(event.target.value)}
            />
          </div>

          <button onClick={handleConnectToPeer} className="">
            Connect to candidate
          </button>
          {answer && (
            <>
              <p>Generated answer</p>
              <p>{JSON.stringify(answer)}</p>
            </>
          )}
          {connectionState === "connected" && (
            <div>
              <p>Message: {currentMessage}</p>
              <input
                type="text"
                onChange={(event) => setMessageText(event.target.value)}
              />
              <button
                onClick={() =>
                  peerDataChannel
                    ? peerDataChannel.send(messageText ? messageText : "")
                    : dataChannel.send(messageText ? messageText : "")
                }
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
