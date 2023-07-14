package main

import "github.com/gofiber/contrib/websocket"

type TransportChannelState int

const (
	Connecting TransportChannelState = iota
	Connected
)

type TransportChannel struct {
	Connector *websocket.Conn
	Receiver  *websocket.Conn
	state     TransportChannelState
}

func NewTransportChannel(receiver *websocket.Conn) *TransportChannel {
	tc := TransportChannel{Receiver: receiver, state: Connecting}
	return &tc
}

func (tc *TransportChannel) connectConnector(connector *websocket.Conn) {
	tc.Connector = connector
	tc.state = Connected
}

func (tc *TransportChannel) isConnected() bool {
	return tc.state == Connected
}
