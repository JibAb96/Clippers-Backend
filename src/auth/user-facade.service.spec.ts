import { Test, TestingModule } from '@nestjs/testing';
import { UserFacadeService } from './user-facade.service';

describe('UserFacadeService', () => {
  let service: UserFacadeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserFacadeService],
    }).compile();

    service = module.get<UserFacadeService>(UserFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
