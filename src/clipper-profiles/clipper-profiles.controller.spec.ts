import { Test, TestingModule } from '@nestjs/testing';
import { ClipperProfilesController } from './clipper-profiles.controller';

describe('ClipperProfilesController', () => {
  let controller: ClipperProfilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClipperProfilesController],
    }).compile();

    controller = module.get<ClipperProfilesController>(ClipperProfilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
