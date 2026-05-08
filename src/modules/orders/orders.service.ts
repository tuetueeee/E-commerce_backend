import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Product, ProductType } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';
import { SkuVariant } from '../../entities/sku-variant.entity';
import { Stock } from '../../entities/stock.entity';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  OrderQueryDto,
  OrderResponseDto,
  OrderStatsDto,
} from '../../dto/order.dto';
import { EmailService } from '../../services/email.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SkuVariant)
    private skuVariantRepository: Repository<SkuVariant>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private dataSource: DataSource,
    private emailService: EmailService,
    private inventoryService: InventoryService,
  ) {}

  async create(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const { items, shippingAddress, paymentMethod, notes } = createOrderDto;

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { UserID: userId, is_active: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const validatedItems: Array<{
      productId: string;
      quantity: number;
      price: number;
      subtotal: number;
      product: Product;
      skuVariant: SkuVariant | null;
      skuId: string;
      colorCode?: string;
      sizeCode?: string;
      designId?: string;
      customDesignData?: any;
    }> = [];

    for (const item of items) {
      // Validate product exists
      const product = await this.productRepository.findOne({
        where: { id: item.productId, isActive: true },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      // Validate design payload against product type:
      // - BLANK products require either a chosen designId or customDesignData
      // - READY_MADE products must NOT receive any design payload (the product
      //   has its design printed in by the shop)
      const hasDesign = Boolean(item.designId || item.customDesignData);
      if (product.productType === ProductType.BLANK && !hasDesign) {
        throw new BadRequestException(
          `Sản phẩm phôi "${product.name}" yêu cầu chọn thiết kế trước khi đặt hàng.`,
        );
      }
      if (product.productType === ProductType.READY_MADE && hasDesign) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" đã có thiết kế in sẵn, không thể chỉnh sửa thêm.`,
        );
      }

      // Resolve SKU variant by (productId + colorCode + sizeCode). Both BLANK
      // and READY_MADE products must have pre-configured SKUs covering the
      // requested size/color combination.
      if (!item.colorCode || !item.sizeCode) {
        throw new BadRequestException(
          `Vui lòng chọn size và màu cho sản phẩm "${product.name}".`,
        );
      }

      const skuVariant = await this.skuVariantRepository.findOne({
        where: {
          productId: item.productId,
          ColorCode: item.colorCode,
          SizeCode: item.sizeCode,
        },
      });

      if (!skuVariant) {
        throw new NotFoundException(
          `Không tìm thấy phiên bản size ${item.sizeCode} màu ${item.colorCode} của sản phẩm "${product.name}".`,
        );
      }

      const skuId = skuVariant.SkuID;

      // Check stock for the SKU. If the inventory record is missing, fall back
      // to the product-level stock. We no longer special-case "custom design"
      // orders because BLANK products go through the same SKU pipeline as
      // READY_MADE products now.
      try {
        const stock = await this.inventoryService.getBySku(skuId);
        const availableStock = stock.qty_on_hand - stock.qty_reserved;

        if (availableStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`,
          );
        }
      } catch (error: any) {
        if (error instanceof NotFoundException) {
          const productStock = product.stock ?? 0;
          if (productStock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}. Available: ${productStock}`,
            );
          }
        } else {
          throw error;
        }
      }

      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal,
        product,
        skuVariant,
        skuId,
        colorCode: item.colorCode,
        sizeCode: item.sizeCode,
        designId: item.designId,
        customDesignData: item.customDesignData,
      });
    }

    // Create order with transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create order
      const order = this.orderRepository.create({
        userId,
        Status: OrderStatus.PENDING,
        Subtotal: totalAmount,
        Total: totalAmount,
        Order_date: new Date(),
        shippingAddress,
        paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        notes,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create order items and reserve stock
      const orderItems: OrderItem[] = [];
      for (const item of validatedItems) {
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          productId: item.productId,
          qty: item.quantity,
          unit_price: item.price,
          colorCode: item.colorCode || null,
          sizeCode: item.sizeCode || null,
          designId: item.designId || null,
          customDesignData: item.customDesignData || null,
          skuId: item.skuId,
        } as Partial<OrderItem>);

        const savedOrderItem = await queryRunner.manager.save(
          OrderItem,
          orderItem,
        );
        orderItems.push(savedOrderItem);

        // Reserve stock at the SKU level. If the inventory record is missing,
        // fall back to decrementing the product-level stock so the order still
        // succeeds for products that haven't been migrated to per-SKU stock.
        try {
          await this.inventoryService.reserve(
            item.skuId,
            item.quantity,
            `Order ${savedOrder.id}`,
            'order',
            savedOrder.id,
          );
          this.logger.log(
            `Reserved ${item.quantity} units of SKU ${item.skuId} for order ${savedOrder.id}`,
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to reserve stock for SKU ${item.skuId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          item.product.stock -= item.quantity;
          await queryRunner.manager.save(Product, item.product);
        }
      }

      await queryRunner.commitTransaction();

      // Get user email for order confirmation
      const userEmail = user.email;
      const orderResponse = this.formatOrderResponse(savedOrder);

      // Prepare order items with product info for email
      const orderItemsForEmail = await Promise.all(
        orderItems.map(async (oi) => {
          const product = await this.productRepository.findOne({
            where: { id: oi.productId },
          });
          return {
            product: {
              name: product?.name || 'Sản phẩm',
              id: product?.id,
            },
            quantity: oi.qty,
            price: oi.unit_price,
            colorCode: oi.colorCode,
            sizeCode: oi.sizeCode,
          };
        }),
      );

      // Send order confirmation email (non-blocking)
      this.emailService
        .sendOrderConfirmation(userEmail, {
          id: savedOrder.id,
          orderId: savedOrder.id,
          totalAmount: savedOrder.totalAmount,
          total: savedOrder.totalAmount,
          items: orderItemsForEmail,
          shippingAddress: savedOrder.shippingAddress,
          paymentMethod: savedOrder.paymentMethod,
        })
        .catch((error) => {
          this.logger.error(
            `Failed to send order confirmation email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          // Don't throw - email is not critical
        });

      return orderResponse;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(queryDto: OrderQueryDto): Promise<{
    orders: OrderResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      paymentStatus,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = queryDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders: orders.map((order) => this.formatOrderResponse(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUser(
    userId: string,
    queryDto: OrderQueryDto,
  ): Promise<{
    orders: OrderResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      paymentStatus,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = queryDto;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.userId = :userId', { userId });

    // Apply filters
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders: orders.map((order) => this.formatOrderResponse(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrderResponse(order);
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if status transition is valid
    this.validateStatusTransition(order.status, updateOrderStatusDto.status);

    Object.assign(order, updateOrderStatusDto);
    const updatedOrder = await this.orderRepository.save(order);

    return this.formatOrderResponse(updatedOrder);
  }

  async updatePaymentStatus(
    id: string,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.paymentStatus = updatePaymentStatusDto.paymentStatus;
    const updatedOrder = await this.orderRepository.save(order);

    return this.formatOrderResponse(updatedOrder);
  }

  async cancelOrder(id: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user can cancel this order
    if (order.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    // Check if order can be cancelled
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    // Restore product stock and cancel order
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Restore product stock
      for (const item of order.items) {
        const product = await this.productRepository.findOne({
          where: { id: item.productId },
        });
        if (product) {
          product.stock += item.quantity;
          await queryRunner.manager.save(Product, product);
        }
      }

      // Update order status
      order.status = OrderStatus.CANCELLED;
      const updatedOrder = await queryRunner.manager.save(Order, order);

      await queryRunner.commitTransaction();

      return this.formatOrderResponse(updatedOrder);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getOrderStats(): Promise<OrderStatsDto> {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { Status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { Status: OrderStatus.PROCESSING } }),
      this.orderRepository.count({ where: { Status: OrderStatus.SHIPPED } }),
      this.orderRepository.count({ where: { Status: OrderStatus.DELIVERED } }),
      this.orderRepository.count({ where: { Status: OrderStatus.CANCELLED } }),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.Total)', 'total')
        .where('order.paymentStatus = :status', {
          status: PaymentStatus.COMPLETED,
        })
        .getRawOne(),
    ]);

    const revenueValue = totalRevenue?.total 
      ? (typeof totalRevenue.total === 'string' ? parseFloat(totalRevenue.total) : Number(totalRevenue.total) || 0)
      : 0;
    
    const averageOrderValue =
      totalOrders > 0 ? revenueValue / totalOrders : 0;

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: revenueValue,
      averageOrderValue,
    };
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private formatOrderResponse(order: Order): OrderResponseDto {
    // Parse Total from decimal string to number
    const totalAmount = typeof order.totalAmount === 'string' 
      ? parseFloat(order.totalAmount) 
      : (order.totalAmount || 0);
    
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalAmount: totalAmount,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
          }
        : {
            id: '',
            name: '',
            email: '',
          },
      items: order.items
        ? order.items
            .filter((item) => item.product) // Filter out items without products
            .map((item) => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              product: {
                id: item.product.id,
                name: item.product.name,
                title: item.product.title,
                image: item.product.image,
              },
            }))
        : [],
    };
  }
}
