import bcrypt from 'bcryptjs';
import User from '../models/User';
import sequelize from '../config/db';
import { Op } from 'sequelize';

const seedUsers = async () => {
  try {
    // Wait for database connection and sync
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');

    // Create users
    const users = [
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password',
        role: 'sales' as const
      },
      {
        username: 'operator',
        email: 'operator@example.com',
        password: 'password',
        role: 'operator' as const
      },
      {
        username: 'factory',
        email: 'factory@example.com',
        password: 'password',
        role: 'factory' as const
      },
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'password',
        role: 'admin' as const
      }
    ];

    for (const userData of users) {
      // Check if user exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: userData.email },
            { username: userData.username }
          ]
        }
      });

      if (!existingUser) {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user
        await User.create({
          ...userData,
          password: hashedPassword
        });

        console.log(`Created user: ${userData.username}`);
      } else {
        console.log(`User already exists: ${userData.username}`);
      }
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers(); 