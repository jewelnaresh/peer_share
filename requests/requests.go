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
	TransportChannelId uuid.UUID `json:"transportChannelId"`
}

const (
	InitializeConnection = "INIT_CONNECTION"
	ConnectPeer          = "CONNECT_PEER"
	ReceiveOffer         = "RECEIVE_OFFER"
	ReceiveAnswer        = "RECEIVE_ANSWER"

	AddICECandidate     = "ADD_ICE_CANDIDATE"
	ReceiveICECandidate = "RECEIVE_ICE_CANDIDATE"
)

type ConnectRequest struct {
	TransportChannelId uuid.UUID `json:"transportChannelId"`
	SDP                string    `json:"SDP"`
}
