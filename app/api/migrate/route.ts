import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SuperCategory, SubCategory } from "@/models/Category";
import { Product } from "@/models/Product";
import { Customer, Supplier } from "@/models/People";
import { Sale } from "@/models/Sale";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { InventoryItem, StockTransaction, TransactionBatch } from "@/models/Inventory";
import { Counter } from "@/models/Counter";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await dbConnect();

    // Mapping old IDs to new MongoDB ObjectIds to maintain relationships
    const idMap: Record<string, any> = {};

    if (data.superCategories) {
      for (const cat of data.superCategories) {
        const newCat = await SuperCategory.create({
          name: cat.name,
          nameMr: cat.nameMr,
          icon: cat.icon,
          image: cat.image,
        });
        idMap[cat.id] = newCat._id;
      }
    }

    if (data.subCategories) {
      for (const sub of data.subCategories) {
        const newSub = await SubCategory.create({
          name: sub.name,
          nameMr: sub.nameMr,
          icon: sub.icon,
          image: sub.image,
          superCategoryId: idMap[sub.superCategoryId],
        });
        idMap[sub.id] = newSub._id;
      }
    }

    if (data.products) {
      for (const prod of data.products) {
        const newProd = await Product.create({
          name: prod.name,
          nameMr: prod.nameMr,
          price: prod.price,
          stock: prod.stock,
          unit: prod.unit,
          image: prod.image,
          subCategoryId: idMap[prod.subCategoryId],
          hamaliValue: prod.hamaliValue,
        });
        idMap[prod.id] = newProd._id;
      }
    }

    if (data.customers) {
      for (const cust of data.customers) {
        const newCust = await Customer.create({
          name: cust.name,
          email: cust.email,
          phone: cust.phone,
          address: cust.address,
        });
        idMap[cust.id] = newCust._id;
      }
    }

    if (data.suppliers) {
      for (const supp of data.suppliers) {
        const newSupp = await Supplier.create({
          name: supp.name,
          email: supp.email,
          phone: supp.phone,
          address: supp.address,
        });
        idMap[supp.id] = newSupp._id;
      }
    }

    // Sales and Purchase Orders might need more complex mapping for items
    if (data.sales) {
      for (const sale of data.sales) {
        const items = sale.items.map((item: any) => ({
          productId: idMap[item.productId] || item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          unit: item.unit,
          subCategoryId: idMap[item.subCategoryId],
          subCategoryName: item.subCategoryName,
          superCategoryId: idMap[item.superCategoryId],
          superCategoryName: item.superCategoryName,
        }));

        await Sale.create({
          ...sale,
          id: undefined, // remove old id
          items,
          customerId: idMap[sale.customerId],
        });
      }
    }

    if (data.purchaseOrders) {
      for (const po of data.purchaseOrders) {
        const items = po.items.map((item: any) => ({
          productId: idMap[item.id] || item.id, // PurchaseOrderItem uses 'id' instead of 'productId' in some places
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        }));

        await PurchaseOrder.create({
          ...po,
          id: undefined,
          items,
          supplierId: idMap[po.supplierId],
        });
      }
    }

    if (data.inventory_items) {
      for (const item of data.inventory_items) {
        await InventoryItem.create({
          ...item,
          id: undefined,
          productId: idMap[item.productId],
        });
      }
    }

    if (data.stock_transactions) {
      for (const t of data.stock_transactions) {
        await StockTransaction.create({
          ...t,
          id: undefined,
          productId: idMap[t.productId],
          batchId: idMap[t.batchId],
        });
      }
    }

    if (data.transaction_batches) {
      for (const b of data.transaction_batches) {
        const items = b.items.map((item: any) => ({
          productId: idMap[item.productId],
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
        }));

        const newBatch = await TransactionBatch.create({
          ...b,
          id: undefined,
          items,
        });
        idMap[b.id] = newBatch._id;
      }
    }

    if (data.estimateCounter) {
      await Counter.findOneAndUpdate(
        { name: "estimateCounter" },
        { seq: data.estimateCounter },
        { upsert: true }
      );
    }

    if (data.poCounter) {
      await Counter.findOneAndUpdate(
        { name: "poCounter" },
        { seq: data.poCounter },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
