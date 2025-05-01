import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class SubmitClipDto {
    @IsString()
    @IsNotEmpty()
    clipperId: string;
    
    @IsString()
    description: string;
} 