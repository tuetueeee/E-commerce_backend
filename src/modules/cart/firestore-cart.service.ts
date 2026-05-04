import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseConfig } from '../../config/firebase.config';

export interface FirestoreCartProductSnapshot {
  id: string;
  name: string;
  title: string;
  price: number;
  image?: string;
  stock: number;
}

export interface FirestoreCartItemData {
  id?: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  colorCode?: string | null;
  sizeCode?: string | null;
  designId?: string | null;
  customDesignData?: any;
  product: FirestoreCartProductSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

export interface FirestoreCartData {
  id: string;
  userId: string;
  totalAmount: number;
  itemCount: number;
  isActive: boolean;
  appliedVoucher?: any;
  createdAt: Date;
  updatedAt: Date;
  items: FirestoreCartItemData[];
}

type FirestoreItemInput = Omit<
  FirestoreCartItemData,
  'id' | 'subtotal' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class FirestoreCartService {
  private readonly db;
  private readonly collectionName = 'carts';

  constructor(private readonly firebaseConfig: FirebaseConfig) {
    this.db = firebaseConfig.getFirestore();
  }

  private getCartDoc(userId: string) {
    return this.db.collection(this.collectionName).doc(userId);
  }

  private getItemsCollection(userId: string) {
    return this.getCartDoc(userId).collection('items');
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

  private normalizeNullableString(value?: string | null): string | null {
    return value ?? null;
  }

  private isSameSimpleItem(
    existingItem: any,
    newItem: FirestoreItemInput,
  ): boolean {
    if (existingItem.productId !== newItem.productId) {
      return false;
    }

    if (
      this.normalizeNullableString(existingItem.colorCode) !==
      this.normalizeNullableString(newItem.colorCode)
    ) {
      return false;
    }

    if (
      this.normalizeNullableString(existingItem.sizeCode) !==
      this.normalizeNullableString(newItem.sizeCode)
    ) {
      return false;
    }

    if (
      this.normalizeNullableString(existingItem.designId) !==
      this.normalizeNullableString(newItem.designId)
    ) {
      return false;
    }

    if (existingItem.customDesignData || newItem.customDesignData) {
      return false;
    }

    return true;
  }

  async createCartIfNotExists(userId: string): Promise<void> {
    const cartRef = this.getCartDoc(userId);
    const cartSnapshot = await cartRef.get();

    if (!cartSnapshot.exists) {
      const now = new Date();
      await cartRef.set({
        userId,
        totalAmount: 0,
        itemCount: 0,
        isActive: true,
        appliedVoucher: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async getItem(
    userId: string,
    itemId: string,
  ): Promise<FirestoreCartItemData | null> {
    await this.createCartIfNotExists(userId);

    const itemSnapshot = await this.getItemsCollection(userId).doc(itemId).get();

    if (!itemSnapshot.exists) {
      return null;
    }

    const data = itemSnapshot.data() || {};

    return {
      id: itemSnapshot.id,
      productId: data.productId,
      quantity: Number(data.quantity || 0),
      price: Number(data.price || 0),
      subtotal: Number(data.subtotal || 0),
      colorCode: data.colorCode ?? null,
      sizeCode: data.sizeCode ?? null,
      designId: data.designId ?? null,
      customDesignData: data.customDesignData || null,
      product: data.product,
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
    };
  }

  async getFullCart(userId: string): Promise<FirestoreCartData> {
    await this.createCartIfNotExists(userId);

    const cartRef = this.getCartDoc(userId);
    const [cartSnapshot, itemsSnapshot] = await Promise.all([
      cartRef.get(),
      this.getItemsCollection(userId).get(),
    ]);

    const cartData = cartSnapshot.data() || {};

    const items: FirestoreCartItemData[] = itemsSnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        productId: data.productId,
        quantity: Number(data.quantity || 0),
        price: Number(data.price || 0),
        subtotal: Number(data.subtotal || 0),
        colorCode: data.colorCode ?? null,
        sizeCode: data.sizeCode ?? null,
        designId: data.designId ?? null,
        customDesignData: data.customDesignData || null,
        product: data.product,
        createdAt: this.toDate(data.createdAt),
        updatedAt: this.toDate(data.updatedAt),
      };
    });

    return {
      id: userId,
      userId,
      totalAmount: Number(cartData.totalAmount || 0),
      itemCount: Number(cartData.itemCount || 0),
      isActive: cartData.isActive !== false,
      appliedVoucher: cartData.appliedVoucher || null,
      createdAt: this.toDate(cartData.createdAt),
      updatedAt: this.toDate(cartData.updatedAt),
      items,
    };
  }

  async addOrMergeItem(userId: string, itemData: FirestoreItemInput): Promise<string> {
    await this.createCartIfNotExists(userId);

    const itemsCollection = this.getItemsCollection(userId);
    const itemsSnapshot = await itemsCollection.get();

    const matchingDoc = itemsSnapshot.docs.find((doc) =>
      this.isSameSimpleItem(doc.data(), itemData),
    );

    if (matchingDoc) {
      const existingData = matchingDoc.data();
      const currentQuantity = Number(existingData.quantity || 0);
      const newQuantity = currentQuantity + Number(itemData.quantity || 0);
      const price = Number(existingData.price || itemData.price || 0);

      await matchingDoc.ref.update({
        quantity: newQuantity,
        price,
        subtotal: newQuantity * price,
        product: itemData.product,
        updatedAt: new Date(),
      });

      await this.recalculateCart(userId);
      return matchingDoc.id;
    }

    const newDoc = itemsCollection.doc();
    const price = Number(itemData.price || 0);
    const quantity = Number(itemData.quantity || 1);

    await newDoc.set({
      ...itemData,
      quantity,
      price,
      subtotal: quantity * price,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.recalculateCart(userId);
    return newDoc.id;
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<void> {
    await this.createCartIfNotExists(userId);

    const itemRef = this.getItemsCollection(userId).doc(itemId);
    const itemSnapshot = await itemRef.get();

    if (!itemSnapshot.exists) {
      throw new NotFoundException('Cart item not found');
    }

    const itemData = itemSnapshot.data() || {};
    const price = Number(itemData.price || 0);

    await itemRef.update({
      quantity,
      subtotal: quantity * price,
      updatedAt: new Date(),
    });

    await this.recalculateCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    await this.createCartIfNotExists(userId);

    const itemRef = this.getItemsCollection(userId).doc(itemId);
    const itemSnapshot = await itemRef.get();

    if (!itemSnapshot.exists) {
      throw new NotFoundException('Cart item not found');
    }

    await itemRef.delete();
    await this.recalculateCart(userId);
  }

  async clearAllItems(userId: string): Promise<void> {
    await this.createCartIfNotExists(userId);

    const itemsSnapshot = await this.getItemsCollection(userId).get();
    const batch = this.db.batch();

    itemsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    if (!itemsSnapshot.empty) {
      await batch.commit();
    }

    await this.getCartDoc(userId).set(
      {
        totalAmount: 0,
        itemCount: 0,
        appliedVoucher: null,
        updatedAt: new Date(),
      },
      { merge: true },
    );
  }

  async updateAppliedVoucher(userId: string, appliedVoucher: any): Promise<void> {
    await this.createCartIfNotExists(userId);

    await this.getCartDoc(userId).set(
      {
        appliedVoucher: appliedVoucher || null,
        updatedAt: new Date(),
      },
      { merge: true },
    );
  }

  async recalculateCart(userId: string): Promise<void> {
    await this.createCartIfNotExists(userId);

    const itemsSnapshot = await this.getItemsCollection(userId).get();

    let itemCount = 0;
    let totalAmount = 0;

    itemsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const quantity = Number(data.quantity || 0);
      const subtotal = Number(
        data.subtotal || Number(data.price || 0) * quantity,
      );

      itemCount += quantity;
      totalAmount += subtotal;
    });

    await this.getCartDoc(userId).set(
      {
        itemCount,
        totalAmount,
        updatedAt: new Date(),
      },
      { merge: true },
    );
  }
}
