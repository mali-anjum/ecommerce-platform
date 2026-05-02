import { prisma } from "../../lib/prisma";

export class CartService {
  static async getOrCreateCart(userId: string) {
    return await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                price: true,
                name: true,
                images: true,
                stock: true,
                isFeatured: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  static async validateCartItems(cartItems: any[]) {
    const issues = [];
    
    for (const item of cartItems) {
      if (!item.product) {
        issues.push({ itemId: item.id, issue: 'PRODUCT_NOT_FOUND' });
        continue;  // stop below code, and move to the next iteration
      }
      
      if (item.quantity > item.product.stock) {
        issues.push({ 
          itemId: item.id, 
          issue: 'INSUFFICIENT_STOCK',
          available: item.product.stock,
          requested: item.quantity
        });
      }
      
      if (item.product.stock === 0) {
        issues.push({ itemId: item.id, issue: 'OUT_OF_STOCK' });
      }
    }
    
    return issues;
  }
}
