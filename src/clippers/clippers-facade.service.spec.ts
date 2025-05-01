import { Test, TestingModule } from '@nestjs/testing';
import { ClippersFacadeService } from './clippers-facade.service';

describe('ClippersFacadeService', () => {
  let service: ClippersFacadeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClippersFacadeService],
    }).compile();

    service = module.get<ClippersFacadeService>(ClippersFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
