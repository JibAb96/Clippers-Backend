import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { camelToSnake } from '../utility/camelToSnake';
import { GuidleinesInterface } from "./interfaces/guidlines.interface";
@Injectable()
export class GuidelinesRepository {
  constructor(private supabaseService: SupabaseService) {}
  private readonly logger = new Logger(GuidelinesRepository.name);

  async findOneById(id: string) {

    const { data, error } = await this.supabaseService.client
      .from('clipper_guidelines')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      this.logger.error(
        `Unable to find clipper guideline by id ${id}: ${error.message}`,
        error.stack,
      );
    if (error.code === 'PGRST116') {
        throw new NotFoundException(`Clipper guideline with id ${id} not found`);
      } else {
        throw new InternalServerErrorException(
          `There was an error finding clipper guideline: ${error.message}`,
        );
      }
    }
    return data;
  }
  

  async create(userData: GuidleinesInterface) {
    const snakeCaseData = camelToSnake(userData);
    console.log(snakeCaseData);
    const { data, error } = await this.supabaseService.client
      .from('clipper_guidelines')
      .insert(snakeCaseData)
      .select()
      .single();
    
    if (error) {
      this.logger.error(`Unable to create guideline: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error creating guideline',
      );
    }
    return data;
  }

  async update(id: string, userData: GuidleinesInterface) {
    const snakeCaseData = camelToSnake(userData);
    const { data, error } = await this.supabaseService.client
      .from('clipper_guidelines')
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Unable to  update guideline: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'There was an internal server error updating guideline',
      );
    }
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('clipper_guidelines')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Unable to delete user: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'There was an internal server error creating user',
      );
    }
  }

}
