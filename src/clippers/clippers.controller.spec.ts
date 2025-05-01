import { Test, TestingModule } from '@nestjs/testing';
import { ClippersController } from "./clippers.controller";

describe('ClippersController', () => {
  let controller: ClippersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClippersController],
    }).compile();

    controller = module.get<ClippersController>(ClippersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
