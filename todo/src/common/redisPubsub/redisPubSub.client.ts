import { ConfigService } from "@nestjs/config";
import { ClientProxy, ReadPacket, WritePacket } from "@nestjs/microservices";
import {v4 as v4uuid} from "uuid"
import { RedisService } from "./redis.service";

export class RedisPubSubClient extends ClientProxy {

    responseCallbackHandlers: Map<string, (packet: WritePacket<any>) => void> = new Map()
    responseChannels: Map<string, boolean> = new Map()
    roundRobinId: number = 0

    constructor(private configService: ConfigService) {
      super()

      const redisSubClient = RedisService.getClient("sub")
      redisSubClient.on("message", (channel, message) => {
        if (/.reply$/.test(channel)) {
          
          const parsedMessage = JSON.parse(message)
          console.log(parsedMessage)
          const handler = this.responseCallbackHandlers.get(parsedMessage.id)
          this.responseCallbackHandlers.delete(parsedMessage.id)
          handler({response: parsedMessage.data})
        }
      })

    }

    async connect(): Promise<any> {}
  
    async close() {
      console.log('close');
    }
  
    async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
      console.log('event to dispatch: ', packet);
      const redisPubClient = RedisService.getClient("pub")
      redisPubClient.publish(packet.pattern, JSON.stringify(packet.data));
    }

    publish(
      packet: ReadPacket<any>,
      callback: (packet: WritePacket<any>) => void,
    ): () => void {

      (async () => {
        const requestId = v4uuid()

        const redisPubClient = RedisService.getClient("pub")
        const redisClient = RedisService.getClient()

        const serviceName = packet.pattern.split(".")[0]
        const instances = Object.keys(await redisClient.hgetall(serviceName))

        if(!instances.length) {
          return
        }

        this.roundRobinId = ++this.roundRobinId % instances.length
        const selectedInstance = instances[this.roundRobinId]
        console.log(selectedInstance)

        const channel = `${packet.pattern}.${selectedInstance}`

        if (!this.responseChannels.has(channel)) {
          const redisSubClient = RedisService.getClient("sub")
          redisSubClient.subscribe(`${packet.pattern}.${selectedInstance}.reply`, (err, _) => {
            console.log(`Subscribed to a channel ${packet.pattern}.${selectedInstance}.reply`);
            this.responseChannels.set(channel, true)
          })
        }

        this.responseCallbackHandlers.set(requestId, callback)
        
        redisPubClient.publish(channel, JSON.stringify({
          pattern: channel,
          data: packet.data,
          id: requestId
        }));
      })()

      
      return () => {}
    }
}