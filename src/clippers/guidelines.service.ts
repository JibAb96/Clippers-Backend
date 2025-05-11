import { Injectable } from '@nestjs/common';
import { GuidelinesRepository } from './guidlelines.repository';
import { GuidelinesInterface, GuidelinesResponse } from './interfaces/guidlines.interface';
import camelcaseKeys from 'camelcase-keys';

@Injectable()
export class GuidelinesService {
  constructor(private readonly guidlinesRepository: GuidelinesRepository) {}

  async findAllByClipperId(
    clipperId: string,
  ): Promise<string[] | null> {
    let guidelines: string[] = []
    let rawResponse =
      await this.guidlinesRepository.findAllByClipperId(clipperId);
    if (!rawResponse) {
      return null;
    }
    rawResponse = camelcaseKeys(rawResponse)
    // Assuming rawResponse is an array of objects
    rawResponse.map((item: GuidelinesResponse) => guidelines.push(item.guideline))
    return guidelines
  }

  async create(guideline: GuidelinesInterface) {
    const response = await this.guidlinesRepository.create(guideline);
    return camelcaseKeys(response);
  }

  async findOneById(id: string) {
    const response = await this.guidlinesRepository.findOneById(id);
    return camelcaseKeys(response);
  }

  async update(id: string, guideline: GuidelinesInterface) {
    const response = await this.guidlinesRepository.update(id, guideline);
    return camelcaseKeys(response);
  }

  async delete(id: string): Promise<void> {
    return this.guidlinesRepository.delete(id);
  }
}
