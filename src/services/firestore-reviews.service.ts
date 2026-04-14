import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseConfig } from '../config/firebase.config';
import {
  ReviewResponseDto,
  ProductReviewStatsDto,
} from '../dto/review.dto';

@Injectable()
export class FirestoreReviewsService {
  private db: admin.firestore.Firestore;
  private reviewsCollection = 'reviews';

  constructor(private firebaseConfig: FirebaseConfig) {
    this.db = firebaseConfig.getFirestore();
    this.initializeCollection();
  }

  /**
   * Initialize collection if it doesn't exist
   */
  private async initializeCollection() {
    try {
      // Try to create a dummy document to ensure collection exists
      const snapshot = await this.db
        .collection(this.reviewsCollection)
        .limit(1)
        .get();
      console.log('✅ Firestore reviews collection initialized');
    } catch (error) {
      console.error('⚠️ Firestore collection check failed:', error.message);
    }
  }

  /**
   * Create a new review in Firestore
   */
  async createReview(
    userId: string,
    productId: string,
    rating: number,
    comment?: string,
    orderId?: string,
    designId?: string,
  ): Promise<ReviewResponseDto> {
    try {
      // Check if user has already reviewed this product
      const existingReviewQuery = await this.db
        .collection(this.reviewsCollection)
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!existingReviewQuery.empty) {
        throw new BadRequestException(
          'You have already reviewed this product',
        );
      }

      const reviewData = {
        userId,
        productId,
        rating,
        comment: comment || '',
        orderId: orderId || null,
        designId: designId || null,
        media_url: null,
        isVerified: false,
        isActive: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      const docRef = await this.db
        .collection(this.reviewsCollection)
        .add(reviewData);

      console.log('✅ Review created in Firestore:', docRef.id);

      return {
        id: docRef.id,
        ...reviewData,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: '', name: '', email: '' },
        product: { id: '', name: '', title: '' },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Firestore Error Details:', {
        code: error.code,
        message: error.message,
        status: error.status,
        fullError: error,
      });
      throw new Error(`Failed to create review: ${error.code ? `[${error.code}]` : ''} ${error.message}`);
    }
  }

  /**
   * Get all reviews with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    productId?: string,
    userId?: string,
    rating?: number,
    isVerified?: boolean,
  ): Promise<{
    reviews: ReviewResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      let query: admin.firestore.Query =
        this.db.collection(this.reviewsCollection);

      // Apply filters
      query = query.where('isActive', '==', true);

      if (productId) {
        query = query.where('productId', '==', productId);
      }
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      if (rating !== undefined) {
        query = query.where('rating', '==', rating);
      }
      if (isVerified !== undefined) {
        query = query.where('isVerified', '==', isVerified);
      }

      // Get all matching documents
      const snapshot = await query.get();

      // Format and sort in memory
      const allReviews = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...this.formatReviewData(doc.data()),
        }))
        .sort((a, b) => {
          const aTime = a.createdAt.getTime ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const bTime = b.createdAt.getTime ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return bTime - aTime;
        }) as ReviewResponseDto[];

      // Calculate pagination
      const total = allReviews.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReviews = allReviews.slice(startIndex, endIndex);

      return {
        reviews: paginatedReviews,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Firestore findAll Error:', error);
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
  }

  /**
   * Get a single review by ID
   */
  async findOne(id: string): Promise<ReviewResponseDto> {
    try {
      const doc = await this.db
        .collection(this.reviewsCollection)
        .doc(id)
        .get();

      if (!doc.exists) {
        throw new NotFoundException('Review not found');
      }

      const data = doc.data() as any;
      if (!data?.isActive) {
        throw new NotFoundException('Review not found');
      }

      return {
        id: doc.id,
        ...this.formatReviewData(data),
      } as ReviewResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch review: ${error.message}`);
    }
  }

  /**
   * Update a review
   */
  async updateReview(
    id: string,
    rating?: number,
    comment?: string,
  ): Promise<ReviewResponseDto> {
    try {
      const doc = await this.db
        .collection(this.reviewsCollection)
        .doc(id)
        .get();

      if (!doc.exists || !doc.data()?.isActive) {
        throw new NotFoundException('Review not found');
      }

      const updateData: any = {
        updatedAt: admin.firestore.Timestamp.now(),
      };

      if (rating !== undefined) {
        updateData.rating = rating;
      }
      if (comment !== undefined) {
        updateData.comment = comment;
      }

      await this.db
        .collection(this.reviewsCollection)
        .doc(id)
        .update(updateData);

      const updatedDoc = await this.db
        .collection(this.reviewsCollection)
        .doc(id)
        .get();

      return {
        id: updatedDoc.id,
        ...this.formatReviewData(updatedDoc.data()),
      } as ReviewResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update review: ${error.message}`);
    }
  }

  /**
   * Delete a review (soft delete)
   */
  async deleteReview(id: string): Promise<{ message: string }> {
    try {
      const doc = await this.db
        .collection(this.reviewsCollection)
        .doc(id)
        .get();

      if (!doc.exists || !doc.data()?.isActive) {
        throw new NotFoundException('Review not found');
      }

      await this.db
        .collection(this.reviewsCollection)
        .doc(id)
        .update({
          isActive: false,
          updatedAt: admin.firestore.Timestamp.now(),
        });

      return { message: 'Review deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  /**
   * Verify a review (admin only)
   */
  async verifyReview(id: string): Promise<ReviewResponseDto> {
    try {
      const doc = await this.db
        .collection(this.reviewsCollection)
        .doc(id)
        .get();

      if (!doc.exists || !doc.data()?.isActive) {
        throw new NotFoundException('Review not found');
      }

      await this.db
        .collection(this.reviewsCollection)
        .doc(id)
        .update({
          isVerified: true,
          updatedAt: admin.firestore.Timestamp.now(),
        });

      const updatedDoc = await this.db
        .collection(this.reviewsCollection)
        .doc(id)
        .get();

      return {
        id: updatedDoc.id,
        ...this.formatReviewData(updatedDoc.data()),
      } as ReviewResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to verify review: ${error.message}`);
    }
  }

  /**
   * Get product review statistics
   */
  async getProductReviewStats(
    productId: string,
  ): Promise<ProductReviewStatsDto> {
    try {
      const snapshot = await this.db
        .collection(this.reviewsCollection)
        .where('productId', '==', productId)
        .where('isActive', '==', true)
        .get();

      if (snapshot.empty) {
        return {
          productId,
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verifiedReviews: 0,
          recentReviews: [],
        };
      }

      const reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const totalReviews = reviews.length;
      const verifiedReviews = reviews.filter((r: any) => r.isVerified).length;

      // Calculate average rating
      const totalRating = reviews.reduce((sum, r: any) => sum + r.rating, 0);
      const averageRating = totalRating / totalReviews;

      // Calculate rating distribution
      const ratingDistribution = {
        1: reviews.filter((r: any) => r.rating === 1).length,
        2: reviews.filter((r: any) => r.rating === 2).length,
        3: reviews.filter((r: any) => r.rating === 3).length,
        4: reviews.filter((r: any) => r.rating === 4).length,
        5: reviews.filter((r: any) => r.rating === 5).length,
      };

      // Get recent reviews
      const recentReviews = reviews
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        })
        .slice(0, 3)
        .map((r: any) => ({
          id: r.id,
          userId: r.userId,
          productId: r.productId,
          rating: r.rating,
          comment: r.comment,
          isVerified: r.isVerified,
          isActive: r.isActive,
          createdAt: r.createdAt?.toDate?.() || new Date(),
          updatedAt: r.updatedAt?.toDate?.() || new Date(),
          user: { id: '', name: '', email: '' },
          product: { id: '', name: '', title: '' },
        } as ReviewResponseDto));

      return {
        productId,
        averageRating: Math.round(averageRating * 100) / 100,
        totalReviews,
        ratingDistribution,
        verifiedReviews,
        recentReviews,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch product review stats: ${error.message}`,
      );
    }
  }

  /**
   * Get overall review statistics
   */
  async getReviewStats(): Promise<{
    totalReviews: number;
    averageRating: number;
    verifiedReviews: number;
    reviewsByRating: {
      [key: number]: number;
    };
  }> {
    try {
      const snapshot = await this.db
        .collection(this.reviewsCollection)
        .where('isActive', '==', true)
        .get();

      if (snapshot.empty) {
        return {
          totalReviews: 0,
          averageRating: 0,
          verifiedReviews: 0,
          reviewsByRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const reviews = snapshot.docs.map((doc) => doc.data());
      const totalReviews = reviews.length;
      const verifiedReviews = reviews.filter((r) => r.isVerified).length;

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / totalReviews;

      const reviewsByRating = {
        1: reviews.filter((r) => r.rating === 1).length,
        2: reviews.filter((r) => r.rating === 2).length,
        3: reviews.filter((r) => r.rating === 3).length,
        4: reviews.filter((r) => r.rating === 4).length,
        5: reviews.filter((r) => r.rating === 5).length,
      };

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        verifiedReviews,
        reviewsByRating,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch overall review stats: ${error.message}`,
      );
    }
  }

  /**
   * Helper method to format review data
   */
  private formatReviewData(data: any) {
    return {
      userId: data.userId || '',
      productId: data.productId || '',
      rating: data.rating || 0,
      comment: data.comment || '',
      isVerified: data.isVerified || false,
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      user: {
        id: data.userId || '',
        name: '',
        email: '',
      },
      product: {
        id: data.productId || '',
        name: '',
        title: '',
      },
    };
  }
}
