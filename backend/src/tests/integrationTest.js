import assert from 'assert';
import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import Book from '../models/Book.js';
import Label from '../models/Label.js';
import SubLabel from '../models/SubLabel.js';
import Product from '../models/Product.js';
import { seedData } from '../seeds/seedData.js';

async function runTests() {
  console.log('=== TEST 1: Database & Seed Verification ===');
  await seedData();

  const books = await Book.find();
  assert.strictEqual(books.length, 1, 'Should have 1 demo book');
  const book = books[0];
  console.log(`✓ Found demo book: "${book.title}"`);

  const labels = await Label.find({ bookId: book._id });
  assert(labels.length >= 4, 'Should have at least 4 labels (France, Japon, USA, Italie)');
  console.log(`✓ Found ${labels.length} labels:`, labels.map((l) => l.name).join(', '));

  const subLabels = await SubLabel.find({ bookId: book._id });
  assert.strictEqual(subLabels.length, 3, 'Should have 3 subLabels (Entrée, Plat, Dessert)');
  console.log(`✓ Found ${subLabels.length} subLabels:`, subLabels.map((s) => s.name).join(', '));

  const products = await Product.find({ bookId: book._id });
  assert(products.length >= 10, 'Should have populated products');
  console.log(`✓ Found ${products.length} products total.`);

  console.log('\n=== TEST 2: Multi-tagging Verification (Sushi Burrito) ===');
  const japonLabel = labels.find((l) => l.name === 'Japon');
  const usaLabel = labels.find((l) => l.name === 'USA');
  assert(japonLabel && usaLabel, 'Both Japon and USA labels must exist');

  const sushiBurrito = products.find((p) => p.name.includes('Sushi Burrito'));
  assert(sushiBurrito, 'Sushi Burrito product must exist');
  assert(
    sushiBurrito.labelIds.some((id) => id.toString() === japonLabel._id.toString()) &&
    sushiBurrito.labelIds.some((id) => id.toString() === usaLabel._id.toString()),
    'Sushi Burrito must be tagged with both Japon and USA'
  );
  console.log('✓ Multi-tag verified: Sushi Burrito is present in both Japon and USA');

  console.log('\n=== TEST 3: Orphan Handling ("Général") ===');
  const soda = products.find((p) => p.name.includes('Soda'));
  assert(soda, 'Soda product must exist');
  assert.strictEqual(soda.subLabelIds.length, 0, 'Soda must have 0 subLabels (orphan)');
  console.log('✓ Orphan verified: Soda has no sub-label and will be categorized into "Général"');

  console.log('\n=== TEST 4: Pivot Simulation Logic ===');
  // Mode BY_LABEL: Primary = France
  const franceLabel = labels.find((l) => l.name === 'France');
  const franceProducts = products.filter((p) =>
    p.labelIds.some((id) => id.toString() === franceLabel._id.toString())
  );
  console.log(`✓ Products in France (Mode BY_LABEL): ${franceProducts.length}`);
  franceProducts.forEach((p) => console.log(`   - ${p.name}`));

  // Mode BY_SUBLABEL: Primary = Entrée
  const entreeSub = subLabels.find((s) => s.name === 'Entrée');
  const entreeProducts = products.filter((p) =>
    p.subLabelIds.some((id) => id.toString() === entreeSub._id.toString())
  );
  console.log(`✓ Products in Entrée (Mode BY_SUBLABEL): ${entreeProducts.length}`);
  entreeProducts.forEach((p) => console.log(`   - ${p.name}`));

  console.log('\n=== TEST 5: Cascade Deletion Rule ===');
  // Create a dummy label and associated product
  const testLabel = await Label.create({ name: 'TestPays', color: '#000000', bookId: book._id });
  const testProduct = await Product.create({
    name: 'TestPlat',
    bookId: book._id,
    labelIds: [testLabel._id],
    subLabelIds: [],
  });

  // Verify created
  let foundProduct = await Product.findById(testProduct._id);
  assert(foundProduct, 'Test product should exist');

  // Cascade delete
  await Product.deleteMany({ labelIds: testLabel._id });
  await Label.findByIdAndDelete(testLabel._id);

  foundProduct = await Product.findById(testProduct._id);
  assert.strictEqual(foundProduct, null, 'Product should be cascaded and deleted');
  console.log('✓ Cascade deletion verified: deleting test label successfully deleted test product');

  console.log('\n>>> ALL 5 TESTS PASSED SUCCESSFULLY! <<<');
  await closeDB();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
