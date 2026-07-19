import { db } from './config/db.js';

async function seed() {
  const stores = await db('stores').select('*');
  
  if (stores.length === 0) {
    console.log('No stores found. Please create an account/store first.');
    process.exit(1);
  }

  for (const store of stores) {
    const store_id = store.id;
    console.log(`Seeding data for store ${store.nameEn}...`);

    // Add Suppliers
    const suppliers = [
      { id: `sup-${Date.now()}-1`, name: 'Almarai Company', phone: '0500000001', email: 'sales@almarai.com', vatNumber: '300000000000001', balance: 0, store_id },
      { id: `sup-${Date.now()}-2`, name: 'Nada Dairy', phone: '0500000002', email: 'sales@nada.com', vatNumber: '300000000000002', balance: 500.50, store_id },
      { id: `sup-${Date.now()}-3`, name: 'Nadec', phone: '0500000003', email: 'contact@nadec.com', vatNumber: '300000000000003', balance: 0, store_id },
      { id: `sup-${Date.now()}-4`, name: 'Sadafco (Saudia)', phone: '0500000004', email: 'info@sadafco.com', vatNumber: '300000000000004', balance: 1200.00, store_id },
      { id: `sup-${Date.now()}-5`, name: 'PepsiCo Arabia', phone: '0500000005', email: 'orders@pepsico.com', vatNumber: '300000000000005', balance: 0, store_id },
      { id: `sup-${Date.now()}-6`, name: 'Coca-Cola Bottling', phone: '0500000006', email: 'sales@cocacola.sa', vatNumber: '300000000000006', balance: 350.25, store_id },
      { id: `sup-${Date.now()}-7`, name: 'Al Safi Danone', phone: '0500000007', email: 'supply@alsafi.com', vatNumber: '300000000000007', balance: 0, store_id },
      { id: `sup-${Date.now()}-8`, name: 'Halwani Bros', phone: '0500000008', email: 'orders@halwani.com', vatNumber: '300000000000008', balance: 800.00, store_id }
    ];

    for (const sup of suppliers) {
      const exists = await db('suppliers').where({ name: sup.name, store_id }).first();
      if (!exists) await db('suppliers').insert(sup);
    }

    // Add Products
    const products = [
      { id: `prod-${Date.now()}-1`, barcode: '6281000000011', nameAr: 'حليب المراعي طازج 1 لتر', nameEn: 'Almarai Fresh Milk 1L', category: 'Dairy', costPrice: 4.5, sellingPrice: 6.0, quantity: 50, unit: 'pcs', lowStockThreshold: 10, expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(), isPerishable: true, store_id },
      { id: `prod-${Date.now()}-2`, barcode: '6281000000028', nameAr: 'زبادي المراعي 170 جم', nameEn: 'Almarai Yoghurt 170g', category: 'Dairy', costPrice: 1.0, sellingPrice: 1.5, quantity: 100, unit: 'pcs', lowStockThreshold: 20, expiryDate: new Date(Date.now() + 14 * 86400000).toISOString(), isPerishable: true, store_id },
      { id: `prod-${Date.now()}-3`, barcode: '6281000000035', nameAr: 'بيبسي دايت علب 330 مل', nameEn: 'Diet Pepsi Can 330ml', category: 'Beverages', costPrice: 2.0, sellingPrice: 3.0, quantity: 120, unit: 'pcs', lowStockThreshold: 24, expiryDate: null, isPerishable: false, store_id },
      { id: `prod-${Date.now()}-4`, barcode: '6281000000042', nameAr: 'كوكاكولا زيرو 330 مل', nameEn: 'Coca Cola Zero 330ml', category: 'Beverages', costPrice: 2.0, sellingPrice: 3.0, quantity: 90, unit: 'pcs', lowStockThreshold: 24, expiryDate: null, isPerishable: false, store_id },
      { id: `prod-${Date.now()}-5`, barcode: '6281000000059', nameAr: 'عصير ندى برتقال طازج 1.5 لتر', nameEn: 'Nada Fresh Orange Juice 1.5L', category: 'Juices', costPrice: 8.0, sellingPrice: 11.0, quantity: 30, unit: 'pcs', lowStockThreshold: 5, expiryDate: new Date(Date.now() + 10 * 86400000).toISOString(), isPerishable: true, store_id },
      { id: `prod-${Date.now()}-6`, barcode: '6281000000066', nameAr: 'مياه نوفا 330 مل كرتون 40', nameEn: 'Nova Water 330ml Box 40', category: 'Beverages', costPrice: 12.0, sellingPrice: 18.0, quantity: 20, unit: 'carton', lowStockThreshold: 5, expiryDate: null, isPerishable: false, store_id },
      { id: `prod-${Date.now()}-7`, barcode: '6281000000073', nameAr: 'خبز لوزين شرائح أبيض', nameEn: 'Lusine Sliced White Bread', category: 'Bakery', costPrice: 3.5, sellingPrice: 5.0, quantity: 40, unit: 'pcs', lowStockThreshold: 10, expiryDate: new Date(Date.now() + 5 * 86400000).toISOString(), isPerishable: true, store_id },
      { id: `prod-${Date.now()}-8`, barcode: '6281000000080', nameAr: 'شيبس ليز ملح 50 جم', nameEn: 'Lays Salt Chips 50g', category: 'Snacks', costPrice: 1.5, sellingPrice: 2.5, quantity: 150, unit: 'pcs', lowStockThreshold: 30, expiryDate: null, isPerishable: false, store_id },
      { id: `prod-${Date.now()}-9`, barcode: '6281000000097', nameAr: 'جبنة كرافت شيدر 100 جم', nameEn: 'Kraft Cheddar Cheese 100g', category: 'Dairy', costPrice: 4.0, sellingPrice: 6.0, quantity: 80, unit: 'pcs', lowStockThreshold: 15, expiryDate: null, isPerishable: false, store_id },
      { id: `prod-${Date.now()}-10`, barcode: '6281000000103', nameAr: 'حلاوة طحينية حلواني 500 جم', nameEn: 'Halwani Halawa 500g', category: 'Pantry', costPrice: 15.0, sellingPrice: 22.0, quantity: 25, unit: 'pcs', lowStockThreshold: 5, expiryDate: null, isPerishable: false, store_id }
    ];

    for (const prod of products) {
      const exists = await db('products').where({ barcode: prod.barcode, store_id }).first();
      if (!exists) await db('products').insert(prod);
    }
  }

  console.log('Seeding completed successfully!');
  await db.destroy();
  process.exit(0);
}

seed().catch(async err => {
  console.error('Seeding error:', err);
  await db.destroy();
  process.exit(1);
});
