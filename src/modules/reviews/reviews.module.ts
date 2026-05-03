import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from '../../entities/review.entity';
import { Product } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';
import { Order } from '../../entities/order.entity';
import { FirestoreReviewsService } from '../../services/firestore-reviews.service';
import { FirebaseConfig } from '../../config/firebase.config';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Product, User, Order])],
  controllers: [ReviewsController],
  providers: [ReviewsService, FirestoreReviewsService, FirebaseConfig],
  exports: [ReviewsService],
})
export class ReviewsModule {}
