import { Injectable } from '@nestjs/common';
import { GuidelinesRepository } from './guidlelines.repository';
import { GuidleinesInterface } from './interfaces/guidlines.interface';
import camelcaseKeys from 'camelcase-keys';

@Injectable()
export class GuidelinesService {
  constructor(private readonly guidlinesRepository: GuidelinesRepository) {}

  async create(guideline: GuidleinesInterface) {
    const response = await this.guidlinesRepository.create(guideline);
    return camelcaseKeys(response);
  }

  async findOneById(id: string) {
    const response = await this.guidlinesRepository.findOneById(id);
    return camelcaseKeys(response);
  }

  async update(id: string, guideline: GuidleinesInterface) {
    const response = await this.guidlinesRepository.update(id, guideline);
    return camelcaseKeys(response);
  }

  async delete(id: string): Promise<void> {
    return this.guidlinesRepository.delete(id);
  }
}
