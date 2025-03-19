import { Test, TestingModule } from '@nestjs/testing';
import { ClipperProfilesService } from './clipper-profiles.service';

describe('ClipperProfilesService', () => {
  let service: ClipperProfilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClipperProfilesService],
    }).compile();

    service = module.get<ClipperProfilesService>(ClipperProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
