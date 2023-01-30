import { ConfigService } from '@nestjs/config';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { v4 } from 'uuid';
import { RedisService } from './redis.service';

export class RedisPubSubServer
  extends Server
  implements CustomTransportStrategy
{

  instanceId: string

  constructor(private configService: ConfigService) {
    super();
  }

  /**
   * This method is triggered when you run "app.listen()".
   */
  async listen(callback: () => void) {
    const redisClient = RedisService.getClient();

    const serviceName = this.configService.get<string>('app.serviceName');
    this.instanceId = v4();
    await redisClient.hset(
      serviceName,
      this.instanceId,
      this.configService.get<string>("app.url"),
    );

    const redisSubClient = RedisService.getClient('sub');
    const redisPubClient = RedisService.getClient('pub');

    // console.log(this.messageHandlers.get("todos_findall").isEventHandler)

    for (const key of this.messageHandlers.keys()) {
      redisSubClient.subscribe(`${key}.${this.instanceId}`, (err, count) => {
        if (err) console.error(err.message);
        console.log(`Subscribed to a channel ${key}.${this.instanceId}`);
      });

      // if(!this.messageHandlers.get(key).isEventHandler) {
      //     redisSubClient.subscribe(`${key}.reply`, () => {
      //         console.log(`Subscribed to a channel ${key}.reply`);
      //     })
      // }
    }

    redisSubClient.on('message', async (channel, message) => {
      const patternArr = channel.split(".")
      patternArr.pop()
      const pattern = patternArr.join(".")
      if (this.messageHandlers.has(pattern)) {
        const handler = this.messageHandlers.get(pattern);
        const resData = await (handler(JSON.parse(message)) as Promise<any>);
        if (!handler.isEventHandler) {
          redisPubClient.publish(`${pattern}.${this.instanceId}.reply`, JSON.stringify(resData));
        }
      }
    });

    callback();
  }

  /**
   * This method is triggered on application shutdown.
   */
  async close() {
    const client = RedisService.getClient()
    await client.hdel(this.configService.get<string>('app.serviceName'), this.instanceId)
  }
}