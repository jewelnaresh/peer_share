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

	peers := make(map[uuid.UUID]*websocket.Conn)

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
		id := uuid.New()

		defer func() {
			delete(peers, id)
			c.Close()
		}()

		peers[id] = c
		payload, _ := json.Marshal(requests.InitResponse{Id: id})

		data := requests.WebsocketData{MessageType: requests.InitializeConnection, Payload: payload}
		c.WriteJSON(data)

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
				case requests.ConnectPeer:
					var connectRequest requests.ConnectRequest
					if err := json.Unmarshal(data.Payload, &connectRequest); err != nil {
						log.Println("Invalid request", err)
						break
					}

					if err = peers[connectRequest.Id].WriteJSON(requests.WebsocketData{MessageType: requests.GetOffer}); err != nil {
						log.Println("write:", err)
						break
					}

				case requests.RelayOffer:
					var relayOfferRequest requests.RelayOfferRequest
					if err := json.Unmarshal(data.Payload, &relayOfferRequest); err != nil {
						log.Println("Invalid request", err)
						break
					}

				}
			}
		}
	}))

	log.Fatal(app.Listen(":3000"))
}
