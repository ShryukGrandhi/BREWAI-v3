import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';
import { Ingredient } from '../models/Ingredient';
import { InventoryCount } from '../models/InventoryCount';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/brewai';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      MenuItem.deleteMany({}),
      Ingredient.deleteMany({}),
      InventoryCount.deleteMany({}),
    ]);

    // Create restaurant
    console.log('Creating restaurant...');
    const restaurant = await Restaurant.create({
      name: 'Urban Kitchen',
      slug: 'urban-kitchen',
      address: {
        street: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
      },
      phone: '(415) 555-0123',
      email: 'contact@urbankitchen.com',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      settings: {
        autoApprovalThreshold: 200,
        lowStockAlertPercentage: 20,
        defaultProfitMargin: 65,
      },
      subscription: {
        plan: 'pro',
        status: 'active',
        aiActionsLimit: 1000,
        aiActionsUsed: 847,
      },
      status: 'active',
    });

    // Create users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    const owner = await User.create({
      email: 'owner@urbankitchen.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'owner',
      restaurants: [restaurant._id],
      currentRestaurant: restaurant._id,
      status: 'active',
      emailVerified: true,
    });

    const manager = await User.create({
      email: 'manager@urbankitchen.com',
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'manager',
      restaurants: [restaurant._id],
      currentRestaurant: restaurant._id,
      status: 'active',
      emailVerified: true,
    });

    const staff = await User.create({
      email: 'staff@urbankitchen.com',
      passwordHash: hashedPassword,
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'staff',
      restaurants: [restaurant._id],
      currentRestaurant: restaurant._id,
      status: 'active',
      emailVerified: true,
    });

    // Update restaurant with team members
    await Restaurant.findByIdAndUpdate(restaurant._id, {
      owner: owner._id,
      teamMembers: [
        { user: owner._id, role: 'owner', permissions: ['all'], joinedAt: new Date() },
        { user: manager._id, role: 'manager', permissions: ['manage_menu', 'manage_inventory', 'view_analytics', 'manage_team'], joinedAt: new Date() },
        { user: staff._id, role: 'staff', permissions: ['view_menu', 'update_inventory'], joinedAt: new Date() },
      ],
    });

    // Create ingredients
    console.log('Creating ingredients...');
    const ingredients = await Ingredient.insertMany([
      {
        restaurant: restaurant._id,
        name: 'Chicken Breast',
        category: 'Protein',
        unit: 'lbs',
        costPerUnit: 4.99,
        parLevel: 50,
        reorderPoint: 20,
        currentStock: 15,
        supplier: { name: 'Sysco', contactEmail: 'orders@sysco.com' },
        status: 'active',
      },
      {
        restaurant: restaurant._id,
        name: 'Atlantic Salmon',
        category: 'Protein',
        unit: 'lbs',
        costPerUnit: 12.99,
        parLevel: 40,
        reorderPoint: 15,
        currentStock: 25,
        supplier: { name: 'US Foods', contactEmail: 'orders@usfoods.com' },
        status: 'active',
      },
      {
        restaurant: restaurant._id,
        name: 'Romaine Lettuce',
        category: 'Produce',
        unit: 'heads',
        costPerUnit: 2.49,
        parLevel: 30,
        reorderPoint: 10,
        currentStock: 8,
        supplier: { name: 'FreshFarms', contactEmail: 'orders@freshfarms.com' },
        status: 'active',
      },
      {
        restaurant: restaurant._id,
        name: 'Heavy Cream',
        category: 'Dairy',
        unit: 'quarts',
        costPerUnit: 5.99,
        parLevel: 20,
        reorderPoint: 8,
        currentStock: 12,
        supplier: { name: 'Sysco', contactEmail: 'orders@sysco.com' },
        status: 'active',
      },
      {
        restaurant: restaurant._id,
        name: 'Arborio Rice',
        category: 'Pantry',
        unit: 'lbs',
        costPerUnit: 3.99,
        parLevel: 15,
        reorderPoint: 5,
        currentStock: 2,
        supplier: { name: 'Sysco', contactEmail: 'orders@sysco.com' },
        status: 'active',
      },
      {
        restaurant: restaurant._id,
        name: 'Olive Oil',
        category: 'Pantry',
        unit: 'gallons',
        costPerUnit: 24.99,
        parLevel: 10,
        reorderPoint: 3,
        currentStock: 4,
        supplier: { name: 'Restaurant Depot', contactEmail: 'orders@restaurantdepot.com' },
        status: 'active',
      },
    ]);

    // Create menu items
    console.log('Creating menu items...');
    await MenuItem.insertMany([
      {
        restaurant: restaurant._id,
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon grilled to perfection, served with seasonal vegetables',
        category: 'Mains',
        price: 28.99,
        cost: 12.50,
        ingredients: [
          { ingredient: ingredients[1]._id, quantity: 0.5, unit: 'lbs' },
        ],
        status: 'active',
        popularity: 'high',
        tags: ['gluten-free', 'healthy'],
      },
      {
        restaurant: restaurant._id,
        name: 'Caesar Salad',
        description: 'Crisp romaine lettuce with house-made Caesar dressing, croutons, and parmesan',
        category: 'Appetizers',
        price: 12.99,
        cost: 3.20,
        ingredients: [
          { ingredient: ingredients[2]._id, quantity: 1, unit: 'heads' },
        ],
        status: 'active',
        popularity: 'high',
        tags: ['vegetarian'],
      },
      {
        restaurant: restaurant._id,
        name: 'Ribeye Steak',
        description: '12oz prime ribeye, aged 28 days, served with garlic butter',
        category: 'Mains',
        price: 42.99,
        cost: 22.00,
        ingredients: [],
        status: 'active',
        popularity: 'medium',
        alerts: [{ type: 'margin', message: 'Low margin - consider price increase' }],
      },
      {
        restaurant: restaurant._id,
        name: 'Mushroom Risotto',
        description: 'Creamy arborio rice with wild mushrooms and truffle oil',
        category: 'Mains',
        price: 24.99,
        cost: 8.50,
        ingredients: [
          { ingredient: ingredients[4]._id, quantity: 0.25, unit: 'lbs' },
          { ingredient: ingredients[3]._id, quantity: 0.5, unit: 'quarts' },
        ],
        status: 'inactive',
        popularity: 'low',
        tags: ['vegetarian'],
      },
      {
        restaurant: restaurant._id,
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
        category: 'Desserts',
        price: 9.99,
        cost: 2.80,
        ingredients: [],
        status: 'active',
        popularity: 'high',
      },
      {
        restaurant: restaurant._id,
        name: 'Craft Cocktails',
        description: 'Selection of signature cocktails crafted by our mixologist',
        category: 'Drinks',
        price: 14.99,
        cost: 4.00,
        ingredients: [],
        status: 'active',
        popularity: 'high',
      },
    ]);

    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================');
    console.log('\nTest accounts created:');
    console.log('  Owner:   owner@urbankitchen.com / Password123!');
    console.log('  Manager: manager@urbankitchen.com / Password123!');
    console.log('  Staff:   staff@urbankitchen.com / Password123!');
    console.log('========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
