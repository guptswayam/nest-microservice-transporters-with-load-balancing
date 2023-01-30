import { HttpException, HttpStatus, Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientProxy, Transport } from '@nestjs/microservices';
import { timeout } from 'rxjs';
import { RedisPubSubClient } from 'src/common/redisPubsub/redisPubSub.client';
import { promisify } from 'util';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

const sleep = promisify(setTimeout)

@Injectable()
export class TodosService implements OnApplicationBootstrap {
  // @Client({ transport: Transport.REDIS, options: { host: 'localhost', port: 6379, }, })
  client: ClientProxy;

  constructor(private configService: ConfigService) {
    this.client = new RedisPubSubClient(configService)
  }

  counter: number = 1

  // constructor(@Inject("TODO_SERVICE") private client: ClientProxy) {}

  async onApplicationBootstrap() {
    await this.client.connect();
  }

  create(createTodoDto: CreateTodoDto) {
    this.client.emit("todos_create", {title: "first-todo"})
    return 'This action adds a new todo';
  }

  async findAll() {
    // this.client.emit("todos_get", {x: "y"})
    try {
      const res = await new Promise((resolve, reject) => {
        this.client.send("notification-service.todos_findall", {counter: this.counter++}).pipe(
          timeout(2000)
        ).subscribe({
          next: (res) => {
            console.log(res)
            console.log("FINDALL")
            resolve(res)
          },
          error: (err) => {
            reject(err)
          }
        })
      })

      return res
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR)   
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} todo`;
  }

  update(id: number, updateTodoDto: UpdateTodoDto) {
    return `This action updates a #${id} todo`;
  }

  remove(id: number) {
    return `This action removes a #${id} todo`;
  }
}
