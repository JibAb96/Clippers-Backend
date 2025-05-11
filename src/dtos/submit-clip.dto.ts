import { IsNotEmpty, IsString } from "class-validator";

export class SubmitClipDto {
    @IsString()
    @IsNotEmpty()
    clipperId: string;

    @IsString()
    @IsNotEmpty()
    title: string;
    
    @IsString()
    description: string;
} 