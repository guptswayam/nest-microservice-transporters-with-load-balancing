import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';

const sleep = promisify(setTimeout)

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(createTodoDto);
  }

  @Get()
  findAll() {
    return this.todosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todosService.update(+id, updateTodoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todosService.remove(+id);
  }

  @EventPattern('todos_get')
  async handleGetTODO(data: Record<string, unknown>) {
    console.log(data)
  }

  @EventPattern('todos_create')
  async handleCreateTODO(data: Record<string, unknown>) {
    console.log(data)
  }

  // @MessagePattern(`todo-service.todos_findall`)
  // async handleTodoFindAll(data: Record<string, unknown>) {
  //   console.log(data)
  //   await sleep(1000)
  //   return data
  // }
}
