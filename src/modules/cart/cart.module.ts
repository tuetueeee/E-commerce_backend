import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Product } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';
import { VouchersModule } from '../vouchers/vouchers.module';
import { FirebaseConfig } from '../../config/firebase.config';
import { FirestoreCartService } from './firestore-cart.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, User]),
    PassportModule,
    VouchersModule,
  ],
  controllers: [CartController],
  providers: [CartService, FirestoreCartService, FirebaseConfig],
  exports: [CartService],
})
export class CartModule {}
