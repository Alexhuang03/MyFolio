import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Label from '../models/Label.js';
import SubLabel from '../models/SubLabel.js';
import Product from '../models/Product.js';

dotenv.config();

export const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Purging existing demo data...');
    await Book.deleteMany({});
    await Label.deleteMany({});
    await SubLabel.deleteMany({});
    await Product.deleteMany({});

    console.log('[Seed] Ensuring demo user exists...');
    let demoUser = await User.findOne({ email: 'demo@myfolio.com' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Utilisateur Démo',
        email: 'demo@myfolio.com',
        passwordHash: 'password123',
        termsAcceptedAt: new Date(),
      });
    }

    console.log('[Seed] Creating demo Book: Le Menu Gourmand...');
    const book = await Book.create({
      title: 'Le Menu Gourmand',
      description: 'Carte des spécialités culinaires internationales et créations fusion.',
      coverImage: 'cover-culinary.svg',
      colorTheme: '#f97316', // Orange chaleureux
      userId: demoUser._id,
    });

    console.log('[Seed] Creating Labels (Pays)...');
    const labelFrance = await Label.create({ name: 'France', color: '#3b82f6', bookId: book._id });
    const labelJapon = await Label.create({ name: 'Japon', color: '#ef4444', bookId: book._id });
    const labelUSA = await Label.create({ name: 'USA', color: '#8b5cf6', bookId: book._id });
    const labelItalie = await Label.create({ name: 'Italie', color: '#10b981', bookId: book._id });

    console.log('[Seed] Creating SubLabels (Types de plat)...');
    const subEntree = await SubLabel.create({ name: 'Entrée', color: '#f59e0b', bookId: book._id });
    const subPlat = await SubLabel.create({ name: 'Plat', color: '#ec4899', bookId: book._id });
    const subDessert = await SubLabel.create({ name: 'Dessert', color: '#06b6d4', bookId: book._id });

    console.log('[Seed] Creating Products with multi-tags & orphans...');
    const productsData = [
      // France
      {
        name: "Soupe à l'oignon gratinée",
        description: "Bouillon mijoté au vin blanc avec croûtons croustillants et emmental fondu doré.",
        price: 9.5,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelFrance._id],
        subLabelIds: [subEntree._id],
      },
      {
        name: 'Bœuf Bourguignon traditionnel',
        description: 'Bœuf mijoté 4 heures au vin rouge avec petits lardons, champignons et carottes.',
        price: 19.0,
        image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelFrance._id],
        subLabelIds: [subPlat._id],
      },
      {
        name: 'Tarte Tatin tiède',
        description: 'Pommes caramélisées au beurre salé servies avec une boule de glace vanille Bourbon.',
        price: 8.0,
        image: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelFrance._id],
        subLabelIds: [subDessert._id],
      },
      {
        name: 'Eau Minérale Pétillante 75cl',
        description: 'Eau minérale naturelle gazéifiée des sources françaises.',
        price: 4.5,
        image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelFrance._id],
        subLabelIds: [], // Orphelin de sous-label -> Doit aller dans "Général"
      },

      // Japon
      {
        name: 'Gyozas grillés au porc et chou',
        description: 'Raviolis japonais faits main, croustillants en dessous et moelleux au-dessus.',
        price: 8.5,
        image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelJapon._id],
        subLabelIds: [subEntree._id],
      },
      {
        name: 'Ramen Tonkotsu crémeux',
        description: 'Nouilles fraîches dans un bouillon riche d’os mijotés 12h, tranche de chashu et œuf mariné ajitsuke.',
        price: 16.5,
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelJapon._id],
        subLabelIds: [subPlat._id],
      },
      {
        name: 'Mochi Glacé au Thé Vert Matcha',
        description: 'Pâte de riz gluante et cœur de crème glacée artisanale au thé matcha de Kyoto.',
        price: 6.5,
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelJapon._id],
        subLabelIds: [subDessert._id],
      },

      // USA
      {
        name: 'Buffalo Chicken Wings',
        description: 'Ailes de poulet croustillantes enrobées de sauce piquante épicée et sauce ranch.',
        price: 10.0,
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelUSA._id],
        subLabelIds: [subEntree._id],
      },
      {
        name: 'Smash Bacon Cheeseburger',
        description: 'Double steak haché croustillant, cheddar affiné, bacon fumé et oignons caramélisés.',
        price: 15.5,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelUSA._id],
        subLabelIds: [subPlat._id],
      },
      {
        name: 'New York Cheesecake coulis framboise',
        description: 'Authentique gâteau au fromage frais sur lit de spéculoos croustillants.',
        price: 7.5,
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelUSA._id],
        subLabelIds: [subDessert._id],
      },
      {
        name: 'Soda Artisanal Cola & Vanille',
        description: 'Soda pétillant brassé aux épices naturelles et gousse de vanille.',
        price: 4.0,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelUSA._id],
        subLabelIds: [], // Orphelin -> Général
      },

      // Italie
      {
        name: 'Bruschetta Tomates Confites & Burrata',
        description: 'Pain de campagne grillé à l’ail frotté, tomates cerises confites et cœur de burrata crémeuse.',
        price: 9.0,
        image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelItalie._id],
        subLabelIds: [subEntree._id],
      },
      {
        name: 'Risotto Carnaroli aux Cèpes',
        description: 'Riz crémeux cuit au bouillon de volaille, cèpes poêlés et parmesan Reggiano 24 mois.',
        price: 17.0,
        image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelItalie._id],
        subLabelIds: [subPlat._id],
      },
      {
        name: 'Tiramisu traditionnel au Mascarpone',
        description: 'Biscuits cuillère imbibés d’espresso fort, crème onctueuse au mascarpone et cacao noir.',
        price: 7.5,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelItalie._id],
        subLabelIds: [subDessert._id],
      },

      // Multi-Tagging Exemple Spécifique (Sushi Burrito tagué Japon ET USA)
      {
        name: 'Sushi Burrito Fusion Saumon & Avocat',
        description: 'Grand rouleau maki façon burrito garni de saumon frais, avocat, chou rouge et sauce spicy mayo.',
        price: 14.0,
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80',
        bookId: book._id,
        labelIds: [labelJapon._id, labelUSA._id], // Multi-tagging !
        subLabelIds: [subPlat._id],
      },
    ];

    await Product.insertMany(productsData);

    console.log(`[Seed] Seed finished successfully! Demo book created with ID: ${book._id}`);
    if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
      await closeDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  seedData();
}
