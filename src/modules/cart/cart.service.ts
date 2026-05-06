import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartResponseDto,
  CartSummaryDto,
} from '../../dto/cart.dto';
import { VouchersService } from '../vouchers/vouchers.service';
import {
  FirestoreCartData,
  FirestoreCartItemData,
  FirestoreCartService,
} from './firestore-cart.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private vouchersService: VouchersService,
    private firestoreCartService: FirestoreCartService,
  ) {}

  private async validateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { UserID: userId, is_active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async getActiveProduct(productId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private toDate(value: any): Date {
    if (!value) {
      return new Date();
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value.toDate === 'function') {
      return value.toDate();
    }

    return new Date(value);
  }

  async getOrCreateCart(userId: string): Promise<FirestoreCartData> {
    await this.validateUser(userId);
    return this.firestoreCartService.getFullCart(userId);
  }

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCart(userId);
    return this.formatCartResponse(cart);
  }

  async addToCart(
    userId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    const {
      productId,
      quantity,
      colorCode,
      sizeCode,
      customDesignData,
      designId,
    } = addToCartDto;

    await this.validateUser(userId);
    const product = await this.getActiveProduct(productId);

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}`,
      );
    }

    await this.firestoreCartService.addOrMergeItem(userId, {
      productId,
      quantity,
      price: Number(product.price || 0),
      colorCode: colorCode || null,
      sizeCode: sizeCode || null,
      designId: designId || null,
      customDesignData: customDesignData || null,
      product: {
        id: product.id,
        name: product.name,
        title: product.title,
        price: Number(product.price || 0),
        image: product.image,
        stock: product.stock,
      },
    });

    const updatedCart = await this.firestoreCartService.getFullCart(userId);
    return this.formatCartResponse(updatedCart);
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const { quantity } = updateCartItemDto;

    await this.validateUser(userId);
    const cartItem = await this.firestoreCartService.getItem(userId, itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    const product = await this.getActiveProduct(cartItem.productId);

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}`,
      );
    }

    await this.firestoreCartService.updateItemQuantity(userId, itemId, quantity);

    const updatedCart = await this.firestoreCartService.getFullCart(userId);
    return this.formatCartResponse(updatedCart);
  }

  async removeFromCart(
    userId: string,
    itemId: string,
  ): Promise<CartResponseDto> {
    await this.validateUser(userId);
    const cartItem = await this.firestoreCartService.getItem(userId, itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.firestoreCartService.removeItem(userId, itemId);

    const updatedCart = await this.firestoreCartService.getFullCart(userId);
    return this.formatCartResponse(updatedCart);
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    await this.validateUser(userId);
    await this.firestoreCartService.clearAllItems(userId);
    return { message: 'Cart cleared successfully' };
  }

  async getCartSummary(userId: string): Promise<CartSummaryDto> {
    await this.validateUser(userId);
    const cart = await this.firestoreCartService.getFullCart(userId);

    const items = cart.items.map((item) => ({
      productId: item.productId,
      productName: item.product?.name || 'Unknown product',
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      subtotal: Number(item.subtotal || 0),
    }));

    return {
      totalItems: cart.itemCount,
      totalAmount: cart.totalAmount,
      items,
    };
  }

  async applyVoucher(
    userId: string,
    voucherCode: string,
  ): Promise<{ message: string; discount?: number; discountAmount?: number }> {
    await this.validateUser(userId);
    const cart = await this.firestoreCartService.getFullCart(userId);
    const orderAmount = cart.totalAmount || 0;

    const validationResult = await this.vouchersService.validateVoucher(
      voucherCode,
      userId,
      orderAmount,
    );

    if (!validationResult.valid) {
      throw new BadRequestException(
        validationResult.message || 'Invalid voucher code',
      );
    }

    const discountAmount = validationResult.discount;
    const voucher = validationResult.voucher;

    if (!voucher) {
      throw new BadRequestException('Voucher not found');
    }

    let message = 'Voucher applied successfully!';
    if (voucher.type === 'percentage') {
      message = `Voucher applied successfully! ${voucher.value}% discount`;
    } else if (voucher.type === 'fixed_amount') {
      message = `Voucher applied successfully! Discount: ${discountAmount.toLocaleString('vi-VN')}â‚«`;
    } else if (voucher.type === 'free_shipping') {
      message = 'Free shipping voucher applied successfully!';
    }

    await this.firestoreCartService.updateAppliedVoucher(userId, {
      code: voucher.code,
      type: voucher.type,
      value: Number(voucher.value),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      appliedAt: new Date(),
    });

    return {
      message,
      discount:
        voucher.type === 'percentage'
          ? Number(voucher.value) / 100
          : orderAmount > 0
            ? discountAmount / orderAmount
            : 0,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
    };
  }

  private formatCartResponse(cart: FirestoreCartData): CartResponseDto {
    return {
      id: cart.id || cart.userId,
      userId: cart.userId,
      totalAmount: Number(cart.totalAmount || 0),
      itemCount: Number(cart.itemCount || 0),
      isActive: cart.isActive,
      createdAt: this.toDate(cart.createdAt),
      updatedAt: this.toDate(cart.updatedAt),
      items: cart.items
        ? cart.items.map((item: FirestoreCartItemData) => {
            const itemPrice = Number(item.price || item.product?.price || 0);

            return {
              id: item.id || '',
              productId: item.productId,
              quantity: Number(item.quantity || 0),
              price: itemPrice,
              subtotal: Number(
                item.subtotal || itemPrice * Number(item.quantity || 0),
              ),
              sizeCode: item.sizeCode || undefined,
              colorCode: item.colorCode || undefined,
              designId: item.designId || undefined,
              customDesignData: item.customDesignData || undefined,
              product: {
                id: item.product?.id || item.productId,
                name: item.product?.name || 'Unknown product',
                title: item.product?.title || '',
                price: Number(item.product?.price || itemPrice),
                image: item.product?.image,
                stock: Number(item.product?.stock || 0),
              },
            };
          })
        : [],
    };
  }
}
