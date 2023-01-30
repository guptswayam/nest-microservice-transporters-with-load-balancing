import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import Redis from "ioredis";


export class RedisService implements OnApplicationShutdown {

    private static redisPubClient: Redis
    private static redisSubClient: Redis
    private static redisClient: Redis

    static getClient(type?: string) {
        if(type === "pub") {
            if(this.redisPubClient)
                return this.redisPubClient
            else {
                this.redisPubClient = new Redis()
                return this.redisPubClient
            }
        } else if (type === "sub"){
            if(this.redisSubClient)
                return this.redisSubClient
            else {
                this.redisSubClient = new Redis()
                return this.redisSubClient
            }
        } else {
            if(this.redisClient)
                return this.redisClient
            else {
                this.redisClient = new Redis()
                return this.redisClient
            }
        }
    }

    onApplicationShutdown() {
        RedisService.redisPubClient.disconnect()
        RedisService.redisSubClient.disconnect()
        RedisService.redisClient.disconnect()
    }
}
