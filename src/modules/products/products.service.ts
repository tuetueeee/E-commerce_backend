import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductType } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponseDto,
} from '../../dto/product.dto';
@Injectable()
export class ProductsService {
  private logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    // Check if category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.categoryId, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if product with same name already exists
    const existingProduct = await this.productRepository.findOne({
      where: { name: createProductDto.name },
    });
    if (existingProduct) {
      throw new ConflictException('Product with this name already exists');
    }

    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);

    return this.formatProductResponse(savedProduct);
  }

  async findAll(queryDto: ProductQueryDto): Promise<{
    products: ProductResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      isNew,
      isFeatured,
      productType,
      blanksOnly,
      readyMade,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = queryDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.title ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId,
      });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (isNew !== undefined) {
      queryBuilder.andWhere('product.isNew = :isNew', { isNew });
    }

    if (isFeatured !== undefined) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', {
        isFeatured,
      });
    }

    // Resolve productType: explicit param takes precedence; legacy
    // blanksOnly/readyMade flags map onto the same column.
    const resolvedType =
      productType ??
      (blanksOnly
        ? ProductType.BLANK
        : readyMade
          ? ProductType.READY_MADE
          : undefined);

    if (resolvedType) {
      queryBuilder.andWhere('product.productType = :productType', {
        productType: resolvedType,
      });
    }

    // Apply sorting with validation
    const validSortColumns = ['createdAt', 'price', 'rating', 'name'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`product.${safeSortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      products: products.map((product) => this.formatProductResponse(product)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations: ['category', 'skuVariants', 'skuVariants.color'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProductResponse(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if category exists (if categoryId is being updated)
    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId, isActive: true },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Check if product name is unique (if name is being updated)
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const existingProduct = await this.productRepository.findOne({
        where: { name: updateProductDto.name },
      });
      if (existingProduct) {
        throw new ConflictException('Product with this name already exists');
      }
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    return this.formatProductResponse(updatedProduct);
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete
    product.isActive = false;
    await this.productRepository.save(product);

    return { message: 'Product deleted successfully' };
  }

  async updateStock(id: string, quantity: number): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    product.stock -= quantity;
    const updatedProduct = await this.productRepository.save(product);

    return this.formatProductResponse(updatedProduct);
  }

  async getFeaturedProducts(limit: number = 10): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: { isActive: true, isFeatured: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return products.map((product) => this.formatProductResponse(product));
  }

  async getNewProducts(limit: number = 10): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: { isActive: true, isNew: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return products.map((product) => this.formatProductResponse(product));
  }

  private formatProductResponse(product: Product): ProductResponseDto {
    // Extract unique colors from SKU variants
    const colors: any[] = [];
    const colorMap = new Map<string, any>();

    if (product.skuVariants && Array.isArray(product.skuVariants)) {
      product.skuVariants.forEach((sku) => {
        const colorCode = String((sku as any).ColorCode);
        if ((sku as any).color && !colorMap.has(colorCode)) {
          const colorItem = (sku as any).color;
          colorMap.set(colorCode, {
            ColorCode: colorCode,
            ColorName: colorItem?.ColorName || colorCode,
            hex: colorItem?.hex || '#000000',
            image: colorItem?.image,
          });
        }
      });
      colors.push(...colorMap.values());
    }

    // Format SKU variants
    const skuVariants = product.skuVariants
      ? product.skuVariants.map((sku) => ({
          SkuID: String((sku as any).SkuID),
          SizeCode: String((sku as any).SizeCode),
          ColorCode: String((sku as any).ColorCode),
          price: Number((sku as any).price),
          sku_name: String((sku as any).sku_name),
          avai_status: String((sku as any).avai_status),
        }))
      : undefined;

    return {
      id: product.id,
      name: product.name,
      title: product.title,
      description: product.description,
      price: Number(product.price),
      oldPrice: product.oldPrice ? Number(product.oldPrice) : undefined,
      stock: product.stock,
      quantity: product.quantity,
      image: product.image,
      images: product.images,
      categoryId: product.categoryId,
      productType: product.productType,
      isActive: product.isActive,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      averageRating: Number(product.averageRating),
      rating: Number(product.rating),
      numReviews: product.numReviews,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      printArea: (product.printArea as any) || undefined,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
          }
        : undefined,
      colors: colors.length > 0 ? colors : undefined,
      skuVariants:
        skuVariants && skuVariants.length > 0 ? skuVariants : undefined,
    } as ProductResponseDto;
  }

  async getSimilarProducts(
    productId: string,
    limit: number = 5,
  ): Promise<ProductResponseDto[]> {
    const product = await this.findOne(productId);
    if (!product.categoryId) {
      return [];
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.skuVariants', 'skuVariants')
      .where('product.categoryId = :categoryId', {
        categoryId: product.categoryId,
      })
      .andWhere('product.id <> :productId', { productId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('product.rating', 'DESC')
      .take(limit)
      .getMany();

    return products.map((p) => this.formatProductResponse(p));
  }

  async getRecommendedForUser(
    _userId: string,
    limit: number = 5,
  ): Promise<ProductResponseDto[]> {
    return this.getTrendingBlanks(limit);
  }

  private async getTrendingBlanks(limit: number): Promise<ProductResponseDto[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.skuVariants', 'skuVariants')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.productType = :productType', {
        productType: ProductType.BLANK,
      })
      .orderBy('product.rating', 'DESC')
      .addOrderBy('product.numReviews', 'DESC')
      .addOrderBy('product.createdAt', 'DESC')
      .take(limit)
      .getMany();
    return products.map((p) => this.formatProductResponse(p));
  }

  async getTrendingProducts(limit: number = 10): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: { isActive: true },
      relations: ['category', 'skuVariants'],
      order: { rating: 'DESC', numReviews: 'DESC' },
      take: limit,
    });
    return products.map((p) => this.formatProductResponse(p));
  }
}
