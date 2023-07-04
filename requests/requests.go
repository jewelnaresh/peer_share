package requests

import (
	"encoding/json"

	"github.com/google/uuid"
)

type WebsocketData struct {
	MessageType string          `json:"messageType"`
	Payload     json.RawMessage `json:"payload"`
}

type InitResponse struct {
	Id uuid.UUID `json:"id"`
}

const (
	InitializeConnection = "INIT_CONNECTION"
	ReceiveOffer         = "RECEIVE_OFFER"
	ReceiveAnswer        = "RECEIVE_ANSWER"

	ConnectPeer = "CONNECT_PEER"
	GetOffer    = "GET_OFFER"
	RelayOffer  = "RELAY_OFFER"
	RelayAnswer = "RELAY_ANSWER"

	AddICECandidate     = "ADD_ICE_CANDIDATE"
	ReceiveICECandidate = "RECEIVE_ICE_CANDIDATE"
)

type ConnectRequest struct {
	Id uuid.UUID `json:"id"`
}

type RelayOfferRequest struct {
	SDP string `sdp:"id"`
}

type RelayAnswerRequest struct {
	SDP string `sdp:"id"`
}
