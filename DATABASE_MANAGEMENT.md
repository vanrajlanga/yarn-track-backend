# Database Management Guide

## Automatic Database Synchronization

This project uses Sequelize ORM to manage the database schema. When you make changes to your model definitions, you can automatically apply those changes to your database using the command:

```bash
npm run sync-db
```

## What this does

The `sync-db` command will:

1. Check your model definitions
2. Create tables that don't exist yet
3. Alter existing tables to match your updated model definitions
4. Preserve the data in your tables

## Additional Commands

-   `npm run sync-db` - Updates the database schema to match your models
-   `npm run seed` - Populates the database with seed data
-   `npm run reset-db` - Combines both commands: syncs the schema and then seeds the data

## Best Practices

-   Always backup your database before syncing in production
-   Test model changes in development before applying them to production
-   For complex migrations with data transformations, consider creating custom migration scripts

## Workflow for Model Changes

When you make changes to your models:

1. Update the model files in `src/models/`
2. Run `npm run sync-db` to apply the changes to your database
3. Test your application to ensure everything works correctly

## Notes

-   The `alter: true` option is used, which is safe for development but should be used with caution in production
-   The server no longer automatically synchronizes the database schema on startup for safety reasons
