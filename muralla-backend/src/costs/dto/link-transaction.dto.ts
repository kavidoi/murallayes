import { IsNotEmpty, IsString } from 'class-validator';

export class LinkTransactionDto {
  @IsString()
  @IsNotEmpty()
  transactionId!: string;
}
