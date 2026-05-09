import { DataSource } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Product, ProductType } from '../entities/product.entity';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Packaging } from '../entities/packaging.entity';
import { ReturnReason } from '../entities/return-reason.entity';
import { Employee, EmployeeRole } from '../entities/employee.entity';
import { Size } from '../entities/size.entity';
import { Material } from '../entities/material.entity';
import { PrintMethod } from '../entities/print-method.entity';
import { Asset } from '../entities/asset.entity';
import { AssetDisposal } from '../entities/asset-disposal.entity';
import { ColorOption } from '../entities/color-option.entity';
import { SkuVariant } from '../entities/sku-variant.entity';
import { Stock } from '../entities/stock.entity';
import {
  StockMovement,
  StockMovementType,
} from '../entities/stock-movement.entity';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';
import { ShipmentItem } from '../entities/shipment-item.entity';
import { Address } from '../entities/address.entity';
import { Design, DesignStatus, LicenseType } from '../entities/design.entity';
import {
  Voucher,
  VoucherType,
  VoucherStatus,
} from '../entities/voucher.entity'; // Mới
import { UserVoucher } from '../entities/user-voucher.entity'; // Mới
import { SavedDesign } from '../entities/saved-design.entity'; // Mới
import { Favorite } from '../entities/favorite.entity'; // Mới
import {
  PaymentMethod,
  PaymentMethodType,
  PaymentMethodStatus,
} from '../entities/payment-method.entity'; // Mới
import {
  RewardPoint,
  PointType,
  PointSource,
} from '../entities/reward-point.entity';
import { RewardCatalog, RewardType } from '../entities/reward-catalog.entity';
import { TrackEvent } from '../entities/track-event.entity';
import * as bcrypt from 'bcryptjs';

// --- CONSTANTS (Gộp từ cả 2 file) ---
const USER_ADMIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const USER_ALICE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const USER_BOB_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
const USER_CHARLIE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';

const CAT_SHIRTS_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const CAT_JEANS_ID = '2c9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bee';
const CAT_DRESSES_ID = '3d9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bef';
const CAT_JACKETS_ID = '4e9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bf0';
const CAT_ACCESSORIES_ID = '5f9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bf1';
const CAT_SPORTSWEAR_ID = '6a9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bf2';

// Danh sách sản phẩm đầy đủ từ file cũ để phục vụ Orders
const PROD_SHIRT_1_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000001';
const PROD_FASHION_SHIRT_2_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000002';
const PROD_TSHIRT_1_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000003';
const PROD_FASHION_JEAN_1_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000004';
const PROD_FASHION_JEAN_2_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000005';
const PROD_KAKI_SHORTS_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000006';
const PROD_FASHION_DRESS_1_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000007';
const PROD_FASHION_DRESS_2_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000008';
const PROD_FASHION_JACKET_1_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000009';
const PROD_FASHION_JACKET_2_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000010';
const PROD_FASHION_HAT_1_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000011';
const PROD_FASHION_BAG_1_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000012';
const PROD_SPORT_SHIRT_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000013';
const PROD_SPORT_SHORTS_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000014';
const PROD_LINEN_SHIRT_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000015';
const PROD_GRAPHIC_TSHIRT_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000016';
const PROD_JEAN_RELAXED_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000017';
// Additional blank products (no SKU variants)
const PROD_TSHIRT_WHITE_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000018';
const PROD_TSHIRT_GRAY_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000019';
const PROD_TSHIRT_NAVY_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000020';
const PROD_POLO_SHIRT_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000021';
const PROD_HOODIE_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000022';
const PROD_SWEATSHIRT_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000023';
const PROD_JEAN_BLUE_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000024';
const PROD_JEAN_BLACK_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000025';
const PROD_CHINO_PANTS_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000026';
const PROD_SKIRT_A_LINE_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000027';
const PROD_SKIRT_PENCIL_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000028';
const PROD_DRESS_CASUAL_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000029';
const PROD_DRESS_OFFICE_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000030';
const PROD_TRENCH_COAT_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000031';
const PROD_DENIM_JACKET_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000032';
const PROD_CARDIGAN_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000033';
const PROD_BEANIE_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000034';
const PROD_BACKPACK_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000035';
const PROD_SPORTS_TANK_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000036';
const PROD_YOGA_PANTS_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000037';

// IDs cho tính năng mới
const VOUCHER_PERCENT_ID = 'b0eebc99-9c0b-4ef8-bb6d-000000000051';
const VOUCHER_FIXED_ID = 'c0eebc99-9c0b-4ef8-bb6d-000000000052';
const VOUCHER_SHIPPING_ID = 'd0eebc99-9c0b-4ef8-bb6d-000000000053';

const PAYMENT_METHOD_ALICE_CARD = 'a1eebc99-9c0b-4ef8-bb6d-000000000071';
const PAYMENT_METHOD_ALICE_BANK = 'a2eebc99-9c0b-4ef8-bb6d-000000000072';

const SAVED_DESIGN_ALICE_1 = 'b1eebc99-9c0b-4ef8-bb6d-000000000081';
const SAVED_DESIGN_BOB_1 = 'b2eebc99-9c0b-4ef8-bb6d-000000000082';

const FAVORITE_ALICE_1 = 'c1eebc99-9c0b-4ef8-bb6d-000000000091';
const FAVORITE_BOB_1 = 'c2eebc99-9c0b-4ef8-bb6d-000000000092';

const ADDRESS_ALICE_HOME = 'e0eebc99-9c0b-4ef8-bb6d-000000000061';
const ADDRESS_ALICE_WORK = 'f0eebc99-9c0b-4ef8-bb6d-000000000062';
const ADDRESS_BOB_HOME = 'e0eebc99-9c0b-4ef8-bb6d-000000000063';
const ADDRESS_CHARLIE_HOME = 'e0eebc99-9c0b-4ef8-bb6d-000000000064';

// Order IDs
const ORDER_1_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000031';
const ORDER_2_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000032';
const ORDER_3_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000033';
const ORDER_4_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000034';

const ORDER_ITEM_1_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000041';
const ORDER_ITEM_2_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000042';
const ORDER_ITEM_3_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000043';
const ORDER_ITEM_4_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000044';
const ORDER_ITEM_5_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000045';
const ORDER_ITEM_6_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000046';
const ORDER_ITEM_7_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000047';
const ORDER_ITEM_8_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000048';
const ORDER_ITEM_9_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000049';
const ORDER_ITEM_10_ID = 'a0eebc99-9c0b-4ef8-bb6d-000000000050';

export async function seedDatabaseEnhanced(dataSource: DataSource) {
  console.log('🌱 Starting MERGED database seeding...');

  try {
    // 1. DELETE ALL DATA
    console.log('🗑️ Cleaning up old data...');
    const entities = [
      'user_vouchers',
      'vouchers',
      'saved_designs',
      'favorites',
      'payments',
      'payment_methods',
      'asset_disposals',
      'assets',
      'stock_movements',
      'stocks',
      'sku_variants',
      'shipment_items',
      'shipments',
      'order_items',
      'orders',
      'cart_items',
      'carts',
      'reviews',
      'designs',
      'products',
      'categories',
      'packagings',
      'return_reasons',
      'employees',
      'sizes',
      'materials',
      'print_methods',
      'color_options',
      'addresses',
      'users',
    ];

    for (const entity of entities) {
      try {
        await dataSource.query(`DELETE FROM ${entity}`);
      } catch {
        // Ignore if table doesn't exist yet
      }
    }

    // 2. CREATE USERS
    const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
    const hashedPasswordAlice = await bcrypt.hash('user1pass', 10);
    const hashedPasswordBob = await bcrypt.hash('user2pass', 10);
    const hashedPasswordCharlie = await bcrypt.hash('user3pass', 10);

    const users = [
      {
        UserID: USER_ADMIN_ID,
        full_name: 'Admin User',
        email: 'admin@example.com',
        password_hash: hashedPasswordAdmin,
        role: UserRole.ADMIN,
        phone: '0123456789',
        image: 'https://placehold.co/150x150/7F7F7F/FFFFFF&text=Admin',
        is_active: true,
      },
      {
        UserID: USER_ALICE_ID,
        full_name: 'Alice Wonderland',
        email: 'alice@example.com',
        password_hash: hashedPasswordAlice,
        role: UserRole.USER,
        phone: '0987654321',
        image: 'https://placehold.co/150x150/FFC0CB/000000&text=Alice',
        is_active: true,
      },
      {
        UserID: USER_BOB_ID,
        full_name: 'Bob The Builder',
        email: 'bob@example.com',
        password_hash: hashedPasswordBob,
        role: UserRole.USER,
        phone: '0912345678',
        image: 'https://placehold.co/150x150/ADD8E6/000000&text=Bob',
        is_active: true,
      },
      {
        UserID: USER_CHARLIE_ID,
        full_name: 'Charlie Brown',
        email: 'charlie@example.com',
        password_hash: hashedPasswordCharlie,
        role: UserRole.USER,
        phone: '0923456789',
        image: 'https://placehold.co/150x150/FFFF00/000000&text=Charlie',
        is_active: true,
      },
    ];
    await dataSource.getRepository(User).save(users);

    // 3. CREATE CATEGORIES (Dùng danh sách đầy đủ 6 categories để khớp với sản phẩm)
    const categories = [
      {
        id: CAT_SHIRTS_ID,
        name: 'Áo sơ mi & Áo thun',
        description: 'Áo sơ mi, áo thun nam nữ đa dạng kiểu dáng.',
        image:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
        isActive: true,
      },
      {
        id: CAT_JEANS_ID,
        name: 'Quần Jeans & Kaki',
        description: 'Quần jeans, quần kaki thời trang, bền đẹp.',
        image:
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
        isActive: true,
      },
      {
        id: CAT_DRESSES_ID,
        name: 'Váy Đầm & Chân váy',
        description: 'Váy đầm dự tiệc, dạo phố, công sở thanh lịch.',
        image:
          'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80',
        isActive: true,
      },
      {
        id: CAT_JACKETS_ID,
        name: 'Áo Khoác',
        description: 'Áo khoác giữ ấm, chống nắng và thời trang.',
        image:
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
        isActive: true,
      },
      {
        id: CAT_ACCESSORIES_ID,
        name: 'Phụ kiện Thời trang',
        description: 'Mũ, túi, thắt lưng, trang sức.',
        image:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
        isActive: true,
      },
      {
        id: CAT_SPORTSWEAR_ID,
        name: 'Đồ Thể Thao',
        description: 'Quần áo và phụ kiện thể thao.',
        image:
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
        isActive: true,
      },
    ];
    await dataSource.getRepository(Category).save(categories);

    // 4. ATTRIBUTES (Sizes, Materials, Colors, PrintMethods)
    const sizes = [
      { SizeCode: 'S', chest_len: 48, length_len: 68 },
      { SizeCode: 'M', chest_len: 52, length_len: 70 },
      { SizeCode: 'L', chest_len: 56, length_len: 72 },
      { SizeCode: 'XL', chest_len: 60, length_len: 74 },
    ];
    await dataSource.getRepository(Size).save(sizes);

    const materials = [
      {
        name: 'Organic Cotton',
        composition: '100% Cotton',
        gsm: 180,
        stretchable: false,
        care: 'Cold wash',
      },
      {
        name: 'Recycled Polyester',
        composition: '100% Recycled Polyester',
        gsm: 160,
        stretchable: true,
        care: 'Machine wash cold',
      },
    ];
    await dataSource.getRepository(Material).save(materials);

    const printMethods = [
      {
        name: 'DTG',
        description: 'Direct to Garment',
        notes: 'Best for small runs',
      },
      {
        name: 'Screen',
        description: 'Screen Printing',
        notes: 'Best for bulk',
      },
    ];
    await dataSource.getRepository(PrintMethod).save(printMethods);

    const colorOptions = [
      { ColorCode: 'BLACK', name: 'Black', hex: '#000000', is_active: true },
      { ColorCode: 'WHITE', name: 'White', hex: '#FFFFFF', is_active: true },
      { ColorCode: 'RED', name: 'Red', hex: '#FF0000', is_active: true },
      { ColorCode: 'BLUE', name: 'Blue', hex: '#0000FF', is_active: true },
      { ColorCode: 'GREEN', name: 'Green', hex: '#00AA00', is_active: true },
    ];
    await dataSource.getRepository(ColorOption).save(colorOptions);

    // 5. PRODUCTS (Dùng danh sách 16 sản phẩm để không bị lỗi Orders)
    const products = [
      {
        id: PROD_SHIRT_1_ID,
        title: 'Áo Sơ Mi Lụa Cao Cấp Trắng',
        name: 'Áo Sơ Mi Lụa Trắng',
        description: 'Chất liệu lụa mềm mại, thoáng mát.',
        price: 750000,
        stock: 50,
        categoryId: CAT_SHIRTS_ID,
        image:
          'https://cdn.kkfashion.vn/18179-home_default/ao-so-mi-nu-cong-so-basic-tay-dai-asm11-22.jpg',
        images: [
          'https://cdn.kkfashion.vn/18179-home_default/ao-so-mi-nu-cong-so-basic-tay-dai-asm11-22.jpg',
        ],
        averageRating: 4.5,
        numReviews: 8,
        isNew: false,
        isFeatured: true,
        isActive: true,
        quantity: 50,
      },
      {
        id: PROD_FASHION_SHIRT_2_ID,
        title: 'Áo Sơ Mi Kẻ Caro Năng Động Xanh',
        name: 'Áo Sơ Mi Kẻ Caro Xanh',
        description: 'Họa tiết kẻ caro trẻ trung.',
        price: 480000,
        stock: 60,
        categoryId: CAT_SHIRTS_ID,
        image:
          'https://salt.tikicdn.com/cache/w1200/ts/product/b0/39/86/7595f7ce0f4c89388adbd6c6e11897d6.jpg',
        images: [],
        averageRating: 4.2,
        numReviews: 5,
        isNew: true,
        isFeatured: false,
        isActive: true,
        quantity: 60,
      },
      // ... Các sản phẩm còn lại từ file cũ
      {
        id: PROD_TSHIRT_1_ID,
        title: 'Áo Thun Cotton Trơn Basic Unisex Đen',
        name: 'Áo Thun Cotton Đen',
        description: 'Áo thun cotton 100%, màu đen basic.',
        price: 200000,
        stock: 100,
        categoryId: CAT_SHIRTS_ID,
        image:
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
        isActive: true,
        quantity: 100,
      },
      {
        id: PROD_LINEN_SHIRT_ID,
        title: 'Áo Sơ Mi Linen Tay Ngắn Trắng',
        name: 'Áo Sơ Mi Linen Trắng',
        description: 'Chất liệu linen thoáng mát, tay ngắn.',
        price: 520000,
        stock: 40,
        categoryId: CAT_SHIRTS_ID,
        image:
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
        isActive: true,
        quantity: 40,
      },
      {
        id: PROD_GRAPHIC_TSHIRT_ID,
        title: 'Áo Thun Cotton In Họa Tiết Cool',
        name: 'Áo Thun Họa Tiết Cool',
        description: 'Áo thun cotton, in họa tiết độc đáo.',
        price: 220000,
        stock: 80,
        categoryId: CAT_SHIRTS_ID,
        image:
          'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80',
        isActive: true,
        quantity: 80,
      },
      {
        id: PROD_FASHION_JEAN_1_ID,
        title: 'Quần Jeans Nữ Skinny Co Giãn Xanh Đậm',
        name: 'Quần Jeans Nữ Skinny',
        description: 'Form skinny tôn dáng.',
        price: 650000,
        stock: 45,
        categoryId: CAT_JEANS_ID,
        image:
          'https://th.bing.com/th/id/OIP.vamjwH5nDcOFIMFuM55TSAHaLG?rs=1&pid=ImgDetMain',
        isActive: true,
        quantity: 45,
      },
      {
        id: PROD_FASHION_JEAN_2_ID,
        title: 'Quần Jeans Nam Slim Fit Cổ Điển Đen',
        name: 'Quần Jeans Nam Slim Fit',
        description: 'Kiểu dáng slim fit hiện đại.',
        price: 720000,
        stock: 30,
        categoryId: CAT_JEANS_ID,
        image:
          'https://th.bing.com/th/id/OIP.Uo-e-md1Bt2IXxic8EG5rwHaJ4?rs=1&pid=ImgDetMain',
        isActive: true,
        quantity: 30,
      },
      {
        id: PROD_JEAN_RELAXED_ID,
        title: 'Quần Jeans Nam Relaxed Fit Xanh Nhạt',
        name: 'Quần Jeans Nam Relaxed',
        description: 'Form relaxed thoải mái, màu xanh nhạt.',
        price: 680000,
        stock: 35,
        categoryId: CAT_JEANS_ID,
        image:
          'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=80',
        isActive: true,
        quantity: 35,
      },
      {
        id: PROD_KAKI_SHORTS_ID,
        title: 'Quần Short Kaki Nam Beige',
        name: 'Quần Short Kaki Beige',
        description: 'Quần short kaki nam màu beige.',
        price: 350000,
        stock: 70,
        categoryId: CAT_JEANS_ID,
        image:
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
        isActive: true,
        quantity: 70,
      },
      {
        id: PROD_FASHION_DRESS_1_ID,
        title: 'Váy Hoa Nhí Vintage Mùa Hè Vàng',
        name: 'Váy Hoa Nhí Vàng',
        description: 'Họa tiết hoa nhí dễ thương.',
        price: 850000,
        stock: 25,
        categoryId: CAT_DRESSES_ID,
        image:
          'https://th.bing.com/th/id/OIP.hpyj1oQnc7ACCrwv-BV90AHaJ4?rs=1&pid=ImgDetMain',
        isActive: true,
        quantity: 25,
      },
      {
        id: PROD_FASHION_DRESS_2_ID,
        title: 'Đầm Dạ Hội Đuôi Cá Sang Trọng Đỏ',
        name: 'Đầm Dạ Hội Đỏ',
        description: 'Thiết kế đuôi cá quyến rũ.',
        price: 2200000,
        stock: 10,
        categoryId: CAT_DRESSES_ID,
        image:
          'https://product.hstatic.net/1000318527/product/141279554_2759566720950868_4151769136115659930_o_7f872a3e6d624b05a5ea7652f97d415f_master.jpg',
        isActive: true,
        quantity: 10,
      },
      {
        id: PROD_FASHION_JACKET_1_ID,
        title: 'Áo Khoác Bomber Unisex Phong Cách Rêu',
        name: 'Áo Khoác Bomber Rêu',
        description: 'Áo khoác bomber cá tính.',
        price: 950000,
        stock: 33,
        categoryId: CAT_JACKETS_ID,
        image:
          'https://th.bing.com/th/id/OIP.C1eJqC7tsgCJVjcoFthyGgHaHa?rs=1&pid=ImgDetMain',
        isActive: true,
        quantity: 33,
      },
      {
        id: PROD_FASHION_JACKET_2_ID,
        title: 'Áo Khoác Dạ Nữ Dáng Dài Hàn Quốc Be',
        name: 'Áo Khoác Dạ Nữ Be',
        description: 'Giữ ấm hiệu quả, phong cách thanh lịch.',
        price: 1800000,
        stock: 18,
        categoryId: CAT_JACKETS_ID,
        image:
          'https://th.bing.com/th/id/R.546f23b70e6b5183a6b8671c24f9361f?rik=bE%2bRQxytFnDcDw&pid=ImgRaw&r=0',
        isActive: true,
        quantity: 18,
      },
      {
        id: PROD_FASHION_HAT_1_ID,
        title: 'Mũ Lưỡi Trai Thêu Chữ Basic Đen',
        name: 'Mũ Lưỡi Trai Đen',
        description: 'Phụ kiện không thể thiếu.',
        price: 250000,
        stock: 70,
        categoryId: CAT_ACCESSORIES_ID,
        image: 'https://cf.shopee.vn/file/afb91fe401164e195dbaee2ffcdf5e0d',
        isActive: true,
        quantity: 70,
      },
      {
        id: PROD_FASHION_BAG_1_ID,
        title: 'Túi Tote Vải Canvas In Hình Cute',
        name: 'Túi Tote Canvas Cute',
        description: 'Túi xách tiện lợi, thân thiện môi trường.',
        price: 320000,
        stock: 40,
        categoryId: CAT_ACCESSORIES_ID,
        image:
          'https://th.bing.com/th/id/OIP.P72vSe3bdaqhYGiHwKd9JAHaHa?rs=1&pid=ImgDetMain',
        isActive: true,
        quantity: 40,
      },
      {
        id: PROD_SPORT_SHIRT_ID,
        title: 'Áo Thun Thể Thao Nam Dri-Fit',
        name: 'Áo Thun Thể Thao Nam',
        description: 'Chất liệu Dri-Fit thoáng khí.',
        price: 450000,
        stock: 55,
        categoryId: CAT_SPORTSWEAR_ID,
        image:
          'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800&q=80',
        isActive: true,
        quantity: 55,
      },
      {
        id: PROD_SPORT_SHORTS_ID,
        title: 'Quần Short Thể Thao Nữ 2 Lớp',
        name: 'Quần Short Thể Thao Nữ',
        description: 'Thiết kế 2 lớp năng động.',
        price: 380000,
        stock: 65,
        categoryId: CAT_SPORTSWEAR_ID,
        image:
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
        isActive: true,
        quantity: 65,
      },
      // Additional blank products (no SKU variants - can be customized)
      {
        id: PROD_TSHIRT_WHITE_ID,
        title: 'Áo Thun Cotton Trơn Basic Unisex Trắng',
        name: 'Áo Thun Cotton Trắng',
        description: 'Áo thun cotton 100%, màu trắng basic, có thể tùy chỉnh.',
        price: 200000,
        stock: 120,
        categoryId: CAT_SHIRTS_ID,
        image:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
        isActive: true,
        quantity: 120,
        averageRating: 4.6,
        numReviews: 12,
        isNew: true,
        isFeatured: false,
      },
      {
        id: PROD_TSHIRT_GRAY_ID,
        title: 'Áo Thun Cotton Trơn Basic Unisex Xám',
        name: 'Áo Thun Cotton Xám',
        description: 'Áo thun cotton 100%, màu xám basic, có thể tùy chỉnh.',
        price: 200000,
        stock: 110,
        categoryId: CAT_SHIRTS_ID,
        image:
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
        isActive: true,
        quantity: 110,
        averageRating: 4.4,
        numReviews: 8,
        isNew: false,
        isFeatured: false,
      },
      {
        id: PROD_TSHIRT_NAVY_ID,
        title: 'Áo Thun Cotton Trơn Basic Unisex Xanh Navy',
        name: 'Áo Thun Cotton Navy',
        description: 'Áo thun cotton 100%, màu xanh navy, có thể tùy chỉnh.',
        price: 200000,
        stock: 95,
        categoryId: CAT_SHIRTS_ID,
        image:
          'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=800&q=80',
        isActive: true,
        quantity: 95,
        averageRating: 4.5,
        numReviews: 10,
        isNew: true,
        isFeatured: true,
      },
      {
        id: PROD_POLO_SHIRT_ID,
        title: 'Áo Polo Cotton Pique Cổ Bẻ',
        name: 'Áo Polo Cotton',
        description: 'Áo polo cotton pique, cổ bẻ, có thể in logo.',
        price: 350000,
        stock: 80,
        categoryId: CAT_SHIRTS_ID,
        image:
          'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=800&q=80',
        isActive: true,
        quantity: 80,
        averageRating: 4.7,
        numReviews: 15,
        isNew: false,
        isFeatured: true,
      },
      {
        id: PROD_HOODIE_ID,
        title: 'Áo Hoodie Nỉ Có Mũ Unisex',
        name: 'Áo Hoodie Nỉ',
        description: 'Áo hoodie nỉ ấm áp, có mũ, có thể in thiết kế.',
        price: 550000,
        stock: 60,
        categoryId: CAT_JACKETS_ID,
        image:
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
        isActive: true,
        quantity: 60,
        averageRating: 4.8,
        numReviews: 20,
        isNew: true,
        isFeatured: true,
      },
      {
        id: PROD_SWEATSHIRT_ID,
        title: 'Áo Sweatshirt Nỉ Tay Dài',
        name: 'Áo Sweatshirt Nỉ',
        description: 'Áo sweatshirt nỉ mềm mại, có thể tùy chỉnh.',
        price: 450000,
        stock: 70,
        categoryId: CAT_JACKETS_ID,
        image:
          'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
        isActive: true,
        quantity: 70,
        averageRating: 4.6,
        numReviews: 14,
        isNew: false,
        isFeatured: false,
      },
      {
        id: PROD_JEAN_BLUE_ID,
        title: 'Quần Jeans Nam Regular Fit Xanh',
        name: 'Quần Jeans Regular Xanh',
        description: 'Quần jeans regular fit, màu xanh cổ điển, có thể tùy chỉnh.',
        price: 680000,
        stock: 50,
        categoryId: CAT_JEANS_ID,
        image:
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
        isActive: true,
        quantity: 50,
        averageRating: 4.5,
        numReviews: 11,
        isNew: false,
        isFeatured: false,
      },
      {
        id: PROD_JEAN_BLACK_ID,
        title: 'Quần Jeans Nam Slim Fit Đen',
        name: 'Quần Jeans Slim Đen',
        description: 'Quần jeans slim fit, màu đen, có thể tùy chỉnh.',
        price: 720000,
        stock: 45,
        categoryId: CAT_JEANS_ID,
        image:
          'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=80',
        isActive: true,
        quantity: 45,
        averageRating: 4.7,
        numReviews: 13,
        isNew: true,
        isFeatured: true,
      },
      {
        id: PROD_CHINO_PANTS_ID,
        title: 'Quần Chino Kaki Nam',
        name: 'Quần Chino Kaki',
        description: 'Quần chino kaki lịch sự, có thể tùy chỉnh.',
        price: 480000,
        stock: 55,
        categoryId: CAT_JEANS_ID,
        image:
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
        isActive: true,
        quantity: 55,
        averageRating: 4.4,
        numReviews: 9,
        isNew: false,
        isFeatured: false,
      },
      {
        id: PROD_SKIRT_A_LINE_ID,
        title: 'Chân Váy A-Line Cổ Điển',
        name: 'Chân Váy A-Line',
        description: 'Chân váy A-line thanh lịch, có thể tùy chỉnh.',
        price: 420000,
        stock: 40,
        categoryId: CAT_DRESSES_ID,
        image:
          'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=800&q=80',
        isActive: true,
        quantity: 40,
        averageRating: 4.6,
        numReviews: 7,
        isNew: true,
        isFeatured: false,
      },
      {
        id: PROD_SKIRT_PENCIL_ID,
        title: 'Chân Váy Pencil Công Sở',
        name: 'Chân Váy Pencil',
        description: 'Chân váy pencil chuyên nghiệp, có thể tùy chỉnh.',
        price: 450000,
        stock: 35,
        categoryId: CAT_DRESSES_ID,
        image:
          'https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=800&q=80',
        isActive: true,
        quantity: 35,
        averageRating: 4.5,
        numReviews: 6,
        isNew: false,
        isFeatured: false,
      },
      {
        id: PROD_DRESS_CASUAL_ID,
        title: 'Váy Đầm Casual Mùa Hè',
        name: 'Váy Đầm Casual',
        description: 'Váy đầm casual thoải mái, có thể tùy chỉnh.',
        price: 580000,
        stock: 30,
        categoryId: CAT_DRESSES_ID,
        image:
          'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
        isActive: true,
        quantity: 30,
        averageRating: 4.7,
        numReviews: 12,
        isNew: true,
        isFeatured: true,
      },
      {
        id: PROD_DRESS_OFFICE_ID,
        title: 'Váy Đầm Công Sở Thanh Lịch',
        name: 'Váy Đầm Công Sở',
        description: 'Váy đầm công sở lịch sự, có thể tùy chỉnh.',
        price: 680000,
        stock: 25,
        categoryId: CAT_DRESSES_ID,
        image:
          'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&q=80',
        isActive: true,
        quantity: 25,
        averageRating: 4.8,
        numReviews: 10,
        isNew: false,
        isFeatured: true,
      },
      {
        id: PROD_TRENCH_COAT_ID,
        title: 'Áo Khoác Trench Coat Cổ Điển',
        name: 'Áo Khoác Trench Coat',
        description: 'Áo khoác trench coat thanh lịch, có thể tùy chỉnh.',
        price: 1200000,
        stock: 20,
        categoryId: CAT_JACKETS_ID,
        image:
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
        isActive: true,
        quantity: 20,
        averageRating: 4.9,
        numReviews: 8,
        isNew: true,
        isFeatured: true,
      },
      {
        id: PROD_DENIM_JACKET_ID,
        title: 'Áo Khoác Denim Cổ Điển',
        name: 'Áo Khoác Denim',
        description: 'Áo khoác denim cá tính, có thể tùy chỉnh.',
        price: 750000,
        stock: 40,
        categoryId: CAT_JACKETS_ID,
        image:
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
        isActive: true,
        quantity: 40,
        averageRating: 4.6,
        numReviews: 15,
        isNew: false,
        isFeatured: true,
      },
      {
        id: PROD_CARDIGAN_ID,
        title: 'Áo Cardigan Len Mềm Mại',
        name: 'Áo Cardigan Len',
        description: 'Áo cardigan len ấm áp, có thể tùy chỉnh.',
        price: 650000,
        stock: 35,
        categoryId: CAT_JACKETS_ID,
        image:
          'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=800&q=80',
        isActive: true,
        quantity: 35,
        averageRating: 4.5,
        numReviews: 9,
        isNew: false,
        isFeatured: false,
      },
      {
        id: PROD_BEANIE_ID,
        title: 'Mũ Beanie Len Ấm Áp',
        name: 'Mũ Beanie Len',
        description: 'Mũ beanie len giữ ấm, có thể thêu logo.',
        price: 180000,
        stock: 90,
        categoryId: CAT_ACCESSORIES_ID,
        image:
          'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80',
        isActive: true,
        quantity: 90,
        averageRating: 4.4,
        numReviews: 11,
        isNew: true,
        isFeatured: false,
      },
      {
        id: PROD_BACKPACK_ID,
        title: 'Ba Lô Canvas Thời Trang',
        name: 'Ba Lô Canvas',
        description: 'Ba lô canvas bền đẹp, có thể in thiết kế.',
        price: 380000,
        stock: 50,
        categoryId: CAT_ACCESSORIES_ID,
        image:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
        isActive: true,
        quantity: 50,
        averageRating: 4.7,
        numReviews: 16,
        isNew: false,
        isFeatured: true,
      },
      {
        id: PROD_SPORTS_TANK_ID,
        title: 'Áo Tank Top Thể Thao',
        name: 'Áo Tank Top',
        description: 'Áo tank top thể thao thoáng mát, có thể in logo.',
        price: 280000,
        stock: 75,
        categoryId: CAT_SPORTSWEAR_ID,
        image:
          'https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=800&q=80',
        isActive: true,
        quantity: 75,
        averageRating: 4.5,
        numReviews: 10,
        isNew: true,
        isFeatured: false,
      },
      {
        id: PROD_YOGA_PANTS_ID,
        title: 'Quần Yoga Co Giãn',
        name: 'Quần Yoga',
        description: 'Quần yoga co giãn thoải mái, có thể tùy chỉnh.',
        price: 420000,
        stock: 60,
        categoryId: CAT_SPORTSWEAR_ID,
        image:
          'https://images.unsplash.com/photo-1610847499832-918a1c3c6811?w=800&q=80',
        isActive: true,
        quantity: 60,
        averageRating: 4.6,
        numReviews: 13,
        isNew: false,
        isFeatured: true,
      },
    ];
    // BLANK = phôi áo, khách có thể tự chọn/upload thiết kế trước khi đặt hàng.
    // READY_MADE = áo đã in thiết kế, không cho phép custom thêm.
    const BLANK_PRODUCT_IDS = new Set<string>([
      PROD_TSHIRT_1_ID,
      PROD_LINEN_SHIRT_ID,
      PROD_TSHIRT_WHITE_ID,
      PROD_TSHIRT_GRAY_ID,
      PROD_TSHIRT_NAVY_ID,
      PROD_POLO_SHIRT_ID,
      PROD_HOODIE_ID,
      PROD_SWEATSHIRT_ID,
      PROD_BEANIE_ID,
      PROD_SPORTS_TANK_ID,
    ]);

    await dataSource.getRepository(Product).save(
      products.map((p) => ({
        ...p,
        productType: BLANK_PRODUCT_IDS.has(p.id)
          ? ProductType.BLANK
          : ProductType.READY_MADE,
      })),
    );

    // 6. ADDRESSES (Dùng từ Enhanced, có thêm cho Charlie)
    const addresses = [
      {
        addr_id: ADDRESS_ALICE_HOME,
        userId: USER_ALICE_ID,
        label: 'Nhà riêng',
        line1: '123 Nguyễn Huệ',
        line2: 'Phường Bến Nghé',
        state: 'TP. Hồ Chí Minh',
        zip: '700000',
        country: 'Việt Nam',
        is_default: true,
      },
      {
        addr_id: ADDRESS_ALICE_WORK,
        userId: USER_ALICE_ID,
        label: 'Công ty',
        line1: '456 Trần Hưng Đạo',
        line2: 'Phường Phạm Ngũ Lão',
        state: 'TP. Hồ Chí Minh',
        zip: '700000',
        country: 'Việt Nam',
        is_default: false,
      },
      {
        addr_id: ADDRESS_BOB_HOME,
        userId: USER_BOB_ID,
        label: 'Nhà',
        line1: '789 Điện Biên Phủ',
        line2: 'Phường 25',
        state: 'TP. Hồ Chí Minh',
        zip: '700000',
        country: 'Việt Nam',
        is_default: true,
      },
      {
        addr_id: ADDRESS_CHARLIE_HOME,
        userId: USER_CHARLIE_ID,
        label: 'Nhà',
        line1: '789 Comic Strip',
        line2: '',
        state: 'Đà Nẵng',
        zip: '550000',
        country: 'Việt Nam',
        is_default: true,
      },
    ];
    await dataSource.getRepository(Address).save(addresses);

    // ============================================
    // PHẦN MỚI: VOUCHERS, DESIGNS, CART (Từ Enhanced)
    // ============================================

    // 7. VOUCHERS
    const vouchers = [
      {
        id: VOUCHER_PERCENT_ID,
        code: 'SAVE20',
        type: VoucherType.PERCENTAGE,
        value: 20,
        minOrderAmount: 500000,
        maxUses: 100,
        usedCount: 15,
        maxUsesPerUser: 3,
        validFrom: new Date('2025-12-01'),
        validUntil: new Date('2025-12-31'),
        status: VoucherStatus.ACTIVE,
        description: 'Giảm 20% cho đơn hàng từ 500k',
      },
      {
        id: VOUCHER_FIXED_ID,
        code: 'FIXED100',
        type: VoucherType.FIXED_AMOUNT,
        value: 100000,
        minOrderAmount: 1000000,
        maxUses: 50,
        usedCount: 8,
        maxUsesPerUser: 1,
        validFrom: new Date('2025-12-15'),
        validUntil: new Date('2025-12-25'),
        status: VoucherStatus.ACTIVE,
        description: 'Giảm 100k cho đơn hàng từ 1 triệu',
      },
      {
        id: VOUCHER_SHIPPING_ID,
        code: 'FREESHIP',
        type: VoucherType.FREE_SHIPPING,
        value: 50000,
        minOrderAmount: 250000,
        maxUses: 200,
        usedCount: 45,
        maxUsesPerUser: 5,
        validFrom: new Date('2025-12-01'),
        validUntil: new Date('2026-01-31'),
        status: VoucherStatus.ACTIVE,
        description: 'Miễn phí vận chuyển cho đơn từ 250k',
      },
    ];
    await dataSource.getRepository(Voucher).save(vouchers);

    // 8. USER VOUCHERS
    const userVouchers = [
      {
        userId: USER_ALICE_ID,
        voucherId: VOUCHER_PERCENT_ID,
        isUsed: true,
        usedAt: new Date('2025-12-15'),
        usedInOrder: 'order-123',
      },
      { userId: USER_ALICE_ID, voucherId: VOUCHER_SHIPPING_ID, isUsed: false },
      { userId: USER_BOB_ID, voucherId: VOUCHER_FIXED_ID, isUsed: false },
    ];
    await dataSource.getRepository(UserVoucher).save(userVouchers);

    // 9. PAYMENT METHODS
    const pm = [
      // User-specific payment methods
      {
        MethodID: PAYMENT_METHOD_ALICE_CARD,
        userId: USER_ALICE_ID,
        method: PaymentMethodType.CREDIT_CARD,
        card_holder_name: 'Visa',
        card_no: '****-****-****-1234',
        is_default: true,
        status: PaymentMethodStatus.ACTIVE,
      },
      {
        MethodID: PAYMENT_METHOD_ALICE_BANK,
        userId: USER_ALICE_ID,
        method: PaymentMethodType.BANK_TRANSFER,
        card_holder_name: 'Vietcombank',
        card_no: 'ABC123456789',
        is_default: false,
        status: PaymentMethodStatus.ACTIVE,
      },
      // Payment gateway methods (shared, no userId)
      {
        MethodID: '00000000-0000-0000-0000-000000000001',
        userId: undefined,
        MethodName: 'vnpay',
        method: PaymentMethodType.CREDIT_CARD,
        status: PaymentMethodStatus.ACTIVE,
      },
      {
        MethodID: '00000000-0000-0000-0000-000000000002',
        userId: undefined,
        MethodName: 'momo',
        method: PaymentMethodType.CREDIT_CARD,
        status: PaymentMethodStatus.ACTIVE,
      },
      {
        MethodID: '00000000-0000-0000-0000-000000000003',
        userId: undefined,
        MethodName: 'cod',
        method: PaymentMethodType.CASH_ON_DELIVERY,
        status: PaymentMethodStatus.ACTIVE,
      },
    ];
    await dataSource.getRepository(PaymentMethod).save(pm);

    // 10. SAVED DESIGNS
    // 10. SAVED DESIGNS
    const savedDesigns = [
      {
        id: SAVED_DESIGN_ALICE_1,
        userId: USER_ALICE_ID,
        productId: PROD_SHIRT_1_ID,
        name: 'Custom Design - My Logo',
        canvasData: {
          elements: [
            {
              id: 'text-1',
              type: 'text' as const, // Quan trọng: ép kiểu as const để khớp type
              content: 'My Custom Text',
              x: 100,
              y: 100,
              width: 200, // Mới thêm
              height: 50, // Mới thêm
              rotation: 0, // Mới thêm
              fontSize: 24,
              fontFamily: 'Arial', // Mới thêm
              color: '#FF0000',
              textAlign: 'center', // Mới thêm
            },
          ],
          selectedColor: '#000000',
          selectedSize: 'L',
          quantity: 1,
        },
        colorCode: 'BLACK',
        sizeCode: 'L',
        quantity: 1,
        calculatedPrice: 850000,
        previewUrl:
          'https://placehold.co/300x300/000000/FFFFFF&text=Design+Preview',
      },
      {
        id: SAVED_DESIGN_BOB_1,
        userId: USER_BOB_ID,
        productId: PROD_FASHION_SHIRT_2_ID,
        name: "Bob's Awesome Design",
        canvasData: {
          elements: [
            {
              id: 'text-2',
              type: 'text' as const,
              content: 'Bob Rules',
              x: 50,
              y: 150,
              width: 300, // Mới thêm
              height: 80, // Mới thêm
              rotation: 0, // Mới thêm
              fontSize: 48,
              fontFamily: 'Arial Black', // Mới thêm
              color: '#0000FF',
              textAlign: 'center', // Mới thêm
            },
          ],
          selectedColor: '#FFFFFF',
          selectedSize: 'M',
          quantity: 2,
        },
        colorCode: 'WHITE',
        sizeCode: 'M',
        quantity: 2,
        calculatedPrice: 1080000,
        previewUrl:
          'https://placehold.co/300x300/FFFFFF/000000&text=Bob+Design',
      },
    ];
    await dataSource.getRepository(SavedDesign).save(savedDesigns);

    // 11. FAVORITES
    const favorites = [
      {
        id: FAVORITE_ALICE_1,
        userId: USER_ALICE_ID,
        productId: PROD_FASHION_SHIRT_2_ID,
      },
      { id: FAVORITE_BOB_1, userId: USER_BOB_ID, productId: PROD_SHIRT_1_ID },
    ];
    await dataSource.getRepository(Favorite).save(favorites);

    // 12. CARTS (Dùng logic của Enhanced - có sẵn item)
    const carts = [
      {
        userId: USER_ALICE_ID,
        totalAmount: 1200000,
        itemCount: 1,
        isActive: true,
      },
      {
        userId: USER_BOB_ID,
        totalAmount: 480000,
        itemCount: 1,
        isActive: true,
      },
      { userId: USER_CHARLIE_ID, totalAmount: 0, itemCount: 0, isActive: true },
    ];
    const savedCarts = await dataSource.getRepository(Cart).save(carts);

    if (savedCarts && savedCarts.length > 0) {
      const cartItems = [
        {
          cartId: savedCarts[0].id,
          productId: PROD_SHIRT_1_ID,
          qty: 1,
          sizeCode: 'L',
          colorCode: 'BLACK',
          customDesignData: {
            elements: [
              {
                id: 'cart-elem-1', // Mới thêm
                type: 'text' as const,
                content: 'CUSTOM',
                x: 50, // Mới thêm
                y: 50, // Mới thêm
                width: 100, // Mới thêm
                height: 30, // Mới thêm
                rotation: 0, // Mới thêm
                fontSize: 20, // Mới thêm
                fontFamily: 'Arial', // Mới thêm
                color: '#FFFFFF', // Mới thêm
              },
            ],
            color: '#000000',
            size: 'L',
          },
          unit_price_snapshot: 750000,
        },
        {
          cartId: savedCarts[1].id,
          productId: PROD_FASHION_SHIRT_2_ID,
          qty: 1,
          sizeCode: 'M',
          colorCode: 'WHITE',
          customDesignData: undefined,
          unit_price_snapshot: 480000,
        },
      ];
      await dataSource.getRepository(CartItem).save(cartItems);
    }

    // ============================================
    // PHẦN CŨ: ORDERS, STOCK, SHIPMENTS
    // ============================================

    // 13. DESIGNS (Ready-made products - sản phẩm đã thiết kế sẵn)
    // Designs cần có categoryId để filter theo danh mục như Products
    const designs = [
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000101',
        title: 'Thiên nhiên xanh',
        description:
          'Design lá cây xanh tươi - Áo thun đã in sẵn họa tiết thiên nhiên',
        design_tag: 'nature',
        preview_url: 'https://placehold.co/400x400/4CAF50/FFFFFF?text=Nature',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 234,
        downloads: 45,
        price: 350000, // Giá sản phẩm ready-made với design này
        categoryId: CAT_SHIRTS_ID, // Áo sơ mi & Áo thun
        stock: 50, // Số lượng tồn kho
        quantity: 50, // Số lượng có sẵn
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000102',
        title: 'Tối giản',
        description:
          'Hình khối hình học sạch sẽ - Áo thun thiết kế tối giản hiện đại',
        design_tag: 'minimalist',
        preview_url:
          'https://placehold.co/400x400/E8E8E8/333333?text=Minimalist',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 156,
        downloads: 32,
        price: 320000,
        categoryId: CAT_SHIRTS_ID, // Áo sơ mi & Áo thun
        stock: 45,
        quantity: 45,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000103',
        title: 'Hoa lơi',
        description:
          'Thiết kế hoa lơi xinh đẹp - Áo thun nữ với họa tiết hoa dễ thương',
        design_tag: 'botanical',
        preview_url:
          'https://placehold.co/400x400/FF69B4/FFFFFF?text=Botanical',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 198,
        downloads: 38,
        price: 380000,
        categoryId: CAT_DRESSES_ID, // Váy Đầm & Chân váy
        stock: 30,
        quantity: 30,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000104',
        title: 'Họa tiết Vintage',
        description: 'Thiết kế hoài cổ đẹp mắt - Áo thun phong cách vintage',
        design_tag: 'vintage',
        preview_url: 'https://placehold.co/400x400/D2691E/FFFFFF?text=Vintage',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 287,
        downloads: 52,
        price: 400000,
        categoryId: CAT_SHIRTS_ID, // Áo sơ mi & Áo thun
        stock: 60,
        quantity: 60,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000105',
        title: 'Hình tròn',
        description: 'Các hình tròn màu sắc rực rỡ - Áo thun thiết kế hình học',
        design_tag: 'geometric',
        preview_url:
          'https://placehold.co/400x400/00CED1/FFFFFF?text=Geometric',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 145,
        downloads: 28,
        price: 330000,
        categoryId: CAT_ACCESSORIES_ID, // Phụ kiện Thời trang
        stock: 25,
        quantity: 25,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000106',
        title: 'Vật tư bươm bướm',
        description:
          'Bươm bướm bay nhẹ nhàng - Áo thun với họa tiết bươm bướm xinh xắn',
        design_tag: 'nature',
        preview_url:
          'https://placehold.co/400x400/FFD700/333333?text=Butterfly',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 312,
        downloads: 67,
        price: 360000,
        categoryId: CAT_SHIRTS_ID, // Áo sơ mi & Áo thun
        stock: 40,
        quantity: 40,
      },
      // Additional designs
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000107',
        title: 'Họa tiết Hoa Hướng Dương',
        description: 'Hoa hướng dương tươi sáng - Thiết kế năng động',
        design_tag: 'botanical',
        preview_url: 'https://placehold.co/400x400/FFD700/000000?text=Sunflower',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 189,
        downloads: 41,
        price: 340000,
        categoryId: CAT_SHIRTS_ID,
        stock: 35,
        quantity: 35,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000108',
        title: 'Logo Typography',
        description: 'Typography hiện đại - Thiết kế chữ độc đáo',
        design_tag: 'minimalist',
        preview_url: 'https://placehold.co/400x400/000000/FFFFFF?text=Typography',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 267,
        downloads: 58,
        price: 310000,
        categoryId: CAT_SHIRTS_ID,
        stock: 50,
        quantity: 50,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000109',
        title: 'Họa tiết Động Vật',
        description: 'Các con vật dễ thương - Thiết kế ngộ nghĩnh',
        design_tag: 'nature',
        preview_url: 'https://placehold.co/400x400/FF6347/FFFFFF?text=Animals',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 223,
        downloads: 49,
        price: 370000,
        categoryId: CAT_SHIRTS_ID,
        stock: 42,
        quantity: 42,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000110',
        title: 'Họa tiết Retro',
        description: 'Phong cách retro những năm 80 - Thiết kế hoài cổ',
        design_tag: 'vintage',
        preview_url: 'https://placehold.co/400x400/FF1493/FFFFFF?text=Retro',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 301,
        downloads: 63,
        price: 390000,
        categoryId: CAT_SHIRTS_ID,
        stock: 38,
        quantity: 38,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000111',
        title: 'Họa tiết Mandala',
        description: 'Mandala tâm linh - Thiết kế tinh tế',
        design_tag: 'geometric',
        preview_url: 'https://placehold.co/400x400/8A2BE2/FFFFFF?text=Mandala',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 178,
        downloads: 34,
        price: 360000,
        categoryId: CAT_ACCESSORIES_ID,
        stock: 28,
        quantity: 28,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000112',
        title: 'Họa tiết Biển Cả',
        description: 'Sóng biển và san hô - Thiết kế mùa hè',
        design_tag: 'nature',
        preview_url: 'https://placehold.co/400x400/00CED1/FFFFFF?text=Ocean',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 245,
        downloads: 51,
        price: 350000,
        categoryId: CAT_SHIRTS_ID,
        stock: 44,
        quantity: 44,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000113',
        title: 'Họa tiết Thành Phố',
        description: 'Skyline thành phố - Thiết kế đô thị',
        design_tag: 'geometric',
        preview_url: 'https://placehold.co/400x400/708090/FFFFFF?text=City',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 156,
        downloads: 29,
        price: 330000,
        categoryId: CAT_SHIRTS_ID,
        stock: 33,
        quantity: 33,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000114',
        title: 'Họa tiết Cây Xanh',
        description: 'Rừng xanh mát - Thiết kế thiên nhiên',
        design_tag: 'nature',
        preview_url: 'https://placehold.co/400x400/228B22/FFFFFF?text=Forest',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 212,
        downloads: 46,
        price: 340000,
        categoryId: CAT_SHIRTS_ID,
        stock: 39,
        quantity: 39,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000115',
        title: 'Họa tiết Tối Giản Đen Trắng',
        description: 'Thiết kế tối giản đen trắng - Phong cách hiện đại',
        design_tag: 'minimalist',
        preview_url: 'https://placehold.co/400x400/000000/FFFFFF?text=Minimal',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 289,
        downloads: 61,
        price: 320000,
        categoryId: CAT_SHIRTS_ID,
        stock: 52,
        quantity: 52,
      },
      {
        DESIGN_ID: 'a0eebc99-9c0b-4ef8-bb6d-000000000116',
        title: 'Họa tiết Hoa Hồng',
        description: 'Hoa hồng lãng mạn - Thiết kế nữ tính',
        design_tag: 'botanical',
        preview_url: 'https://placehold.co/400x400/FF69B4/FFFFFF?text=Rose',
        license_type: LicenseType.STANDARD,
        status: DesignStatus.APPROVED,
        likes: 198,
        downloads: 37,
        price: 380000,
        categoryId: CAT_DRESSES_ID,
        stock: 31,
        quantity: 31,
      },
    ];
    await dataSource.getRepository(Design).save(designs);

    // 14. CREATE SKU VARIANTS FIRST (before Orders!)
    // Seed SKU & Stocks - Map products to SKUs for use in order items
    const productsForSku = await dataSource.getRepository(Product).find({
      where: [
        { id: PROD_SHIRT_1_ID },
        { id: PROD_TSHIRT_1_ID },
        { id: PROD_FASHION_JEAN_1_ID },
        { id: PROD_FASHION_JACKET_1_ID },
        { id: PROD_FASHION_DRESS_2_ID },
        { id: PROD_FASHION_HAT_1_ID },
        { id: PROD_SPORT_SHORTS_ID },
        { id: PROD_FASHION_SHIRT_2_ID },
      ],
    });
    const productToSkuMap = new Map<string, string>(); // productId => skuId
    const savedStocks: Stock[] = [];
    for (const product of productsForSku) {
      const sku = await dataSource.getRepository(SkuVariant).save({
        productId: product.id,
        SizeCode: 'M',
        ColorCode: 'BLACK',
        price: product.price,
        weight_grams: 250,
        base_cost: product.price * 0.6,
        sku_name: `${product.name}-M-BLACK`,
        avai_status: 'available',
        currency: 'VND',
      });
      productToSkuMap.set(product.id, sku.SkuID);
      const stock = await dataSource.getRepository(Stock).save({
        skuId: sku.SkuID,
        qty_inbound: product.quantity || 50,
        qty_outbound: 0,
        qty_on_hand: product.quantity || 50,
        qty_reserved: 0,
      });
      savedStocks.push(stock);
    }

    // Seed full size × color SKU grid for BLANK products so the customizer →
    // checkout flow can resolve any combo the user picks. READY_MADE products
    // above only get a single (M, BLACK) SKU because their design is fixed.
    const blankProducts = await dataSource.getRepository(Product).find({
      where: Array.from(BLANK_PRODUCT_IDS).map((id) => ({ id })),
    });
    const BLANK_SIZES = ['S', 'M', 'L', 'XL'];
    const BLANK_COLORS = ['BLACK', 'WHITE', 'RED', 'BLUE', 'GREEN'];
    for (const product of blankProducts) {
      const perVariantStock = Math.max(
        5,
        Math.floor((product.quantity || 50) / (BLANK_SIZES.length * BLANK_COLORS.length)),
      );
      // Skip combos that already have a SKU (PROD_TSHIRT_1_ID is in both
      // BLANK_PRODUCT_IDS and productsForSku above, which seeded an M-BLACK SKU).
      const existingForProduct = await dataSource
        .getRepository(SkuVariant)
        .find({ where: { productId: product.id } });
      const existingKeys = new Set(
        existingForProduct.map((s) => `${s.SizeCode}-${s.ColorCode}`),
      );
      for (const sizeCode of BLANK_SIZES) {
        for (const colorCode of BLANK_COLORS) {
          if (existingKeys.has(`${sizeCode}-${colorCode}`)) continue;
          const sku = await dataSource.getRepository(SkuVariant).save({
            productId: product.id,
            SizeCode: sizeCode,
            ColorCode: colorCode,
            price: product.price,
            weight_grams: 250,
            base_cost: Number(product.price) * 0.6,
            sku_name: `${product.name}-${sizeCode}-${colorCode}`,
            avai_status: 'available',
            currency: 'VND',
          });
          const stock = await dataSource.getRepository(Stock).save({
            skuId: sku.SkuID,
            qty_inbound: perVariantStock,
            qty_outbound: 0,
            qty_on_hand: perVariantStock,
            qty_reserved: 0,
          });
          savedStocks.push(stock);
        }
      }
    }

    // 15. ORDERS
    const order1Date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const order2Date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const order3Date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const order4Date = new Date();

    const initialOrders = [
      {
        id: ORDER_1_ID,
        userId: USER_ALICE_ID,
        Status: OrderStatus.DELIVERED,
        Order_date: order1Date,
        Subtotal: 1400000,
        Total: 1400000,
        shippingAddress: '123 Wonderland Ave, TP. HCM',
        paymentMethod: 'COD',
        paymentStatus: PaymentStatus.COMPLETED,
        createdAt: order1Date,
      },
      {
        id: ORDER_2_ID,
        userId: USER_BOB_ID,
        Status: OrderStatus.PROCESSING,
        Order_date: order2Date,
        Subtotal: 1650000,
        Total: 1650000,
        shippingAddress: '456 Construction Rd, Hà Nội',
        paymentMethod: 'CreditCard',
        paymentStatus: PaymentStatus.COMPLETED,
        trackingNumber: 'GHN123XYZ',
        createdAt: order2Date,
      },
      {
        id: ORDER_3_ID,
        userId: USER_CHARLIE_ID,
        Status: OrderStatus.PENDING,
        Order_date: order3Date,
        Subtotal: 1230000,
        Total: 1230000,
        shippingAddress: '789 Comic Strip, Đà Nẵng',
        paymentMethod: 'BankTransfer',
        paymentStatus: PaymentStatus.PENDING,
        createdAt: order3Date,
      },
      {
        id: ORDER_4_ID,
        userId: USER_ALICE_ID,
        Status: OrderStatus.SHIPPED,
        Order_date: order4Date,
        Subtotal: 600000,
        Total: 600000,
        shippingAddress: '123 Wonderland Ave, TP. HCM',
        paymentMethod: 'COD',
        paymentStatus: PaymentStatus.PENDING,
        trackingNumber: 'VTPOST456ABC',
        createdAt: order4Date,
      },
    ];
    await dataSource.getRepository(Order).save(initialOrders);

    // 15. ORDER ITEMS (with skuId populated from map created above!)
    const orderItems = [
      {
        id: ORDER_ITEM_1_ID,
        orderId: ORDER_1_ID,
        productId: PROD_SHIRT_1_ID,
        skuId: productToSkuMap.get(PROD_SHIRT_1_ID),
        qty: 1,
        unit_price: 750000,
      },
      {
        id: ORDER_ITEM_2_ID,
        orderId: ORDER_1_ID,
        productId: PROD_FASHION_JEAN_1_ID,
        skuId: productToSkuMap.get(PROD_FASHION_JEAN_1_ID),
        qty: 1,
        unit_price: 650000,
      },
      {
        id: ORDER_ITEM_3_ID,
        orderId: ORDER_2_ID,
        productId: PROD_FASHION_JACKET_1_ID,
        skuId: productToSkuMap.get(PROD_FASHION_JACKET_1_ID),
        qty: 1,
        unit_price: 950000,
      },
      {
        id: ORDER_ITEM_4_ID,
        orderId: ORDER_2_ID,
        productId: PROD_TSHIRT_1_ID,
        skuId: productToSkuMap.get(PROD_TSHIRT_1_ID),
        qty: 2,
        unit_price: 200000,
      },
      {
        id: ORDER_ITEM_9_ID,
        orderId: ORDER_2_ID,
        productId: PROD_FASHION_HAT_1_ID,
        skuId: productToSkuMap.get(PROD_FASHION_HAT_1_ID),
        qty: 1,
        unit_price: 250000,
      },
      {
        id: ORDER_ITEM_5_ID,
        orderId: ORDER_3_ID,
        productId: PROD_TSHIRT_1_ID,
        skuId: productToSkuMap.get(PROD_TSHIRT_1_ID),
        qty: 1,
        unit_price: 200000,
      },
      {
        id: ORDER_ITEM_6_ID,
        orderId: ORDER_3_ID,
        productId: PROD_FASHION_HAT_1_ID,
        skuId: productToSkuMap.get(PROD_FASHION_HAT_1_ID),
        qty: 1,
        unit_price: 250000,
      },
      {
        id: ORDER_ITEM_7_ID,
        orderId: ORDER_3_ID,
        productId: PROD_SPORT_SHORTS_ID,
        skuId: productToSkuMap.get(PROD_SPORT_SHORTS_ID),
        qty: 1,
        unit_price: 380000,
      },
      {
        id: ORDER_ITEM_10_ID,
        orderId: ORDER_3_ID,
        productId: PROD_FASHION_SHIRT_2_ID,
        skuId: productToSkuMap.get(PROD_FASHION_SHIRT_2_ID),
        qty: 1,
        unit_price: 480000,
      },
      {
        id: ORDER_ITEM_8_ID,
        orderId: ORDER_4_ID,
        productId: PROD_TSHIRT_1_ID,
        skuId: productToSkuMap.get(PROD_TSHIRT_1_ID),
        qty: 3,
        unit_price: 200000,
      },
    ];
    await dataSource.getRepository(OrderItem).save(orderItems);

    // 16. PACKAGING & RETURN REASONS & EMPLOYEES & ASSETS
    const packagingList = [
      { name: 'Small Box', max_weight: 500, cost: 0.5 },
      { name: 'Medium Box', max_weight: 2000, cost: 1.2 },
      { name: 'Poly Mailer', max_weight: 1000, cost: 0.3 },
    ];
    await dataSource.getRepository(Packaging).save(packagingList);

    await dataSource.getRepository(ReturnReason).save([
      { Reason_code: 'DAMAGED', description: 'Product arrived damaged' },
      { Reason_code: 'WRONG_ITEM', description: 'Received wrong item' },
    ]);

    await dataSource.getRepository(Employee).save([
      {
        userId: USER_ADMIN_ID,
        taxID: 'TAX-ADM-001',
        full_name: 'Jane Supervisor',
        role: EmployeeRole.MANAGER,
        shift: 'morning',
        salary: 1200,
        join_date: new Date('2023-01-01'),
      },
      {
        userId: USER_BOB_ID,
        taxID: 'TAX-STF-002',
        full_name: 'John Picker',
        role: EmployeeRole.STAFF,
        shift: 'evening',
        salary: 800,
        join_date: new Date('2023-03-01'),
      },
    ]);

    const assets = await dataSource.getRepository(Asset).save([
      {
        name: 'Sample Design File',
        url: 'https://example.com/designs/sample.png',
        mimeType: 'image/png',
        sizeBytes: 102400,
        uploadedBy: USER_ADMIN_ID,
      },
      {
        name: 'Product Photo',
        url: 'https://example.com/assets/photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 204800,
        uploadedBy: USER_ADMIN_ID,
      },
    ]);
    await dataSource.getRepository(AssetDisposal).save([
      {
        assetId: assets[0].id,
        reason: 'Outdated',
        disposedBy: USER_ADMIN_ID,
      },
    ]);

    // 17. STOCK & SHIPMENTS (Logic phức tạp nhất)
    // Seed Shipments
    const pkgSmall = (await dataSource.getRepository(Packaging).find())[0]
      ?.PKG_ID;
    const ordersForShipments = await dataSource
      .getRepository(Order)
      .find({ order: { createdAt: 'ASC' } });

    for (let i = 0; i < ordersForShipments.length; i++) {
      const order = ordersForShipments[i];
      const addressId =
        order.userId === USER_ALICE_ID
          ? ADDRESS_ALICE_HOME
          : order.userId === USER_BOB_ID
            ? ADDRESS_BOB_HOME
            : ADDRESS_CHARLIE_HOME;
      const status =
        order.Status === OrderStatus.DELIVERED
          ? ShipmentStatus.DELIVERED
          : order.Status === OrderStatus.SHIPPED
            ? ShipmentStatus.IN_TRANSIT
            : ShipmentStatus.PENDING;

      const shipment = await dataSource.getRepository(Shipment).save({
        orderId: order.id,
        addressId: addressId,
        packagingId: pkgSmall,
        ship_date: new Date(),
        status: status,
        Shipping_fee: 30000,
        carrier: 'VNPost',
        service_level: 'Standard',
        tracking_number:
          order.trackingNumber || `TRACK${order.id.slice(0, 8).toUpperCase()}`,
      });

      const oItems = await dataSource
        .getRepository(OrderItem)
        .find({ where: { orderId: order.id } });
      for (const oi of oItems) {
        await dataSource.getRepository(ShipmentItem).save({
          shipmentId: shipment.Ship_ID,
          orderItemId: oi.id,
          quantity: oi.qty,
        });
      }

      // Add tracking events for shipments
      if (status !== ShipmentStatus.PENDING) {
        const trackEvents: Partial<TrackEvent>[] = [];
        const baseTime = shipment.ship_date || new Date();

        trackEvents.push({
          shipmentId: shipment.Ship_ID,
          status_text: 'Package received at warehouse',
          even_time: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000),
          location: 'Ho Chi Minh City Warehouse',
        });

        if (
          status === ShipmentStatus.IN_TRANSIT ||
          status === ShipmentStatus.DELIVERED
        ) {
          trackEvents.push({
            shipmentId: shipment.Ship_ID,
            status_text: 'In transit',
            even_time: new Date(baseTime.getTime() - 1 * 60 * 60 * 1000),
            location: 'Ho Chi Minh City Distribution Center',
          });
        }

        if (status === ShipmentStatus.DELIVERED) {
          trackEvents.push({
            shipmentId: shipment.Ship_ID,
            status_text: 'Out for delivery',
            even_time: new Date(baseTime.getTime() - 30 * 60 * 1000),
            location: 'Local Delivery Station',
          });
          trackEvents.push({
            shipmentId: shipment.Ship_ID,
            status_text: 'Delivered',
            even_time: baseTime,
            location: order.shippingAddress || 'Customer Address',
          });
        }

        await dataSource.getRepository(TrackEvent).save(trackEvents);
      }
    }

    // Seed Stock Movements
    if (savedStocks.length > 0) {
      await dataSource.getRepository(StockMovement).save([
        {
          stockId: savedStocks[0].StockID,
          type: StockMovementType.INBOUND,
          quantity: 50,
          referenceType: 'purchase',
          referenceId: 'PO-001',
          note: 'Initial',
        },
        {
          stockId: savedStocks[0].StockID,
          type: StockMovementType.OUTBOUND,
          quantity: 5,
          referenceType: 'order',
          referenceId: ORDER_1_ID,
          note: 'Order fulfillment',
        },
      ]);
    }

    // ============================================
    // 18. REWARD POINTS (For testing loyalty tier system)
    // ============================================
    const rewardPoints = [
      // Alice - Gold tier (1500+ points)
      {
        userId: USER_ALICE_ID,
        orderId: ORDER_1_ID,
        type: PointType.EARNED,
        source: PointSource.PURCHASE,
        points: 1400, // 1% of order total (1400000 * 0.01)
        description: 'Points earned from order',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      {
        userId: USER_ALICE_ID,
        orderId: ORDER_4_ID,
        type: PointType.EARNED,
        source: PointSource.PURCHASE,
        points: 600, // 1% of order total (600000 * 0.01)
        description: 'Points earned from order',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        userId: USER_ALICE_ID,
        type: PointType.EARNED,
        source: PointSource.ECO_PRODUCT_BONUS,
        points: 200,
        description: 'Eco-friendly product bonus',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      // Total: 2200 points = Gold tier

      // Bob - Silver tier (500-1499 points)
      {
        userId: USER_BOB_ID,
        orderId: ORDER_2_ID,
        type: PointType.EARNED,
        source: PointSource.PURCHASE,
        points: 1650, // 1% of order total (1650000 * 0.01)
        description: 'Points earned from order',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        userId: USER_BOB_ID,
        type: PointType.REDEEMED,
        source: PointSource.VOUCHER_REDEMPTION,
        points: -500, // Redeemed for voucher
        description: 'Redeemed for voucher',
        expiresAt: undefined,
      },
      // Total: 1150 points = Silver tier

      // Charlie - Bronze tier (0-499 points)
      {
        userId: USER_CHARLIE_ID,
        orderId: ORDER_3_ID,
        type: PointType.EARNED,
        source: PointSource.PURCHASE,
        points: 1230, // 1% of order total (1230000 * 0.01)
        description: 'Points earned from order',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        userId: USER_CHARLIE_ID,
        type: PointType.REDEEMED,
        source: PointSource.VOUCHER_REDEMPTION,
        points: -800, // Redeemed for voucher
        description: 'Redeemed for voucher',
        expiresAt: undefined,
      },
      // Total: 430 points = Bronze tier

      // Admin - Diamond tier (5000+ points) for testing
      {
        userId: USER_ADMIN_ID,
        type: PointType.EARNED,
        source: PointSource.ADMIN_ADJUSTMENT,
        points: 5500,
        description: 'Admin test points',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ];
    await dataSource.getRepository(RewardPoint).save(rewardPoints);

    // ============================================
    // 19. REWARD CATALOG (For testing rewards redemption)
    // ============================================
    const rewardCatalog = [
      {
        name: 'Voucher 50k',
        type: RewardType.VOUCHER,
        pointsRequired: 500,
        description: 'Voucher giảm giá 50,000 VND',
        discountValue: 50000,
        minOrderAmount: 200000,
        imageUrl: 'https://placehold.co/200x200/FFD700/000000?text=Voucher+50k',
        isActive: true,
        redemptionCount: 0,
      },
      {
        name: 'Voucher 100k',
        type: RewardType.VOUCHER,
        pointsRequired: 1000,
        description: 'Voucher giảm giá 100,000 VND',
        discountValue: 100000,
        minOrderAmount: 500000,
        imageUrl:
          'https://placehold.co/200x200/FFD700/000000?text=Voucher+100k',
        isActive: true,
        redemptionCount: 0,
      },
      {
        name: 'Free Shipping',
        type: RewardType.FREE_SHIPPING,
        pointsRequired: 300,
        description: 'Miễn phí vận chuyển',
        discountValue: 50000,
        minOrderAmount: 0,
        imageUrl: 'https://placehold.co/200x200/87CEEB/000000?text=Free+Ship',
        isActive: true,
        redemptionCount: 0,
      },
      {
        name: 'Discount 10%',
        type: RewardType.DISCOUNT,
        pointsRequired: 800,
        description: 'Giảm giá 10% cho đơn hàng',
        discountValue: 10,
        minOrderAmount: 300000,
        imageUrl: 'https://placehold.co/200x200/90EE90/000000?text=10%25+Off',
        isActive: true,
        redemptionCount: 0,
      },
      {
        name: 'Free Product - T-Shirt',
        type: RewardType.FREE_PRODUCT,
        pointsRequired: 1500,
        description: 'Tặng áo thun miễn phí',
        discountValue: 200000,
        minOrderAmount: 0,
        imageUrl:
          'https://placehold.co/200x200/FF69B4/FFFFFF?text=Free+T-Shirt',
        isActive: true,
        redemptionCount: 0,
      },
    ];
    await dataSource.getRepository(RewardCatalog).save(rewardCatalog);

    console.log('✅ MERGED Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding merged database:', error);
    throw error;
  }
}
