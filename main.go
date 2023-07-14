package main

import (
	"encoding/json"
	"log"
	"peershare/requests"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func main() {

	transportChannels := make(map[uuid.UUID]*TransportChannel)
	app := fiber.New()

	app.Static("/", "./frontend/dist")

	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {

		defer func() {
			c.Close()
		}()

		var (
			messageType int
			msg         []byte
			err         error
		)

		for {
			if messageType, msg, err = c.ReadMessage(); err != nil {
				log.Println("read:", err)
				break
			}
			if messageType == websocket.TextMessage {
				var data requests.WebsocketData
				if err := json.Unmarshal(msg, &data); err != nil {
					log.Println("Invalid request", err)
					break
				}

				switch data.MessageType {
				case requests.InitializeConnection:
					id := uuid.New()
					tc := NewTransportChannel(c)
					transportChannels[id] = tc

					payload, _ := json.Marshal(requests.InitResponse{TransportChannelId: id})
					c.WriteJSON(requests.WebsocketData{MessageType: requests.InitializeConnection, Payload: payload})
				case requests.ConnectPeer:
					var connectRequest requests.ConnectRequest
					if err := json.Unmarshal(data.Payload, &connectRequest); err != nil {
						log.Println("Invalid request", err)
						break
					}

					tc := transportChannels[connectRequest.TransportChannelId]
					if tc.isConnected() {
						log.Println("Invalid request", err)
						break
					}
					tc.connectConnector(c)

					tc.Receiver.WriteJSON(requests.WebsocketData{
						MessageType: requests.ReceiveOffer,
						Payload:     data.Payload,
					})
				case requests.ReceiveAnswer:
					var connectRequest requests.ConnectRequest
					if err := json.Unmarshal(data.Payload, &connectRequest); err != nil {
						log.Println("Invalid request", err)
						break
					}
					tc := transportChannels[connectRequest.TransportChannelId]
					tc.Connector.WriteJSON(requests.WebsocketData{
						MessageType: requests.ReceiveAnswer,
						Payload:     data.Payload,
					})
				}
			}
		}
	}))

	log.Fatal(app.Listen(":3000"))
}
