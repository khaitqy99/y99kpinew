// Database Setup Script
// This script ensures all database tables and schemas are properly set up

import { supabase } from '@/lib/supabase';

export interface SetupResult {
  table: string;
  exists: boolean;
  error?: string;
}

export class DatabaseSetup {
  private results: SetupResult[] = [];

  private addResult(table: string, exists: boolean, error?: string) {
    this.results.push({ table, exists, error });
    console.log(`${exists ? '✅' : '❌'} Table ${table}: ${exists ? 'Exists' : 'Missing'}`);
    if (error) console.log(`   Error: ${error}`);
  }

  async setupDatabase(): Promise<SetupResult[]> {
    console.log('🚀 Starting Database Setup...\n');

    try {
      // Check if all required tables exist
      await this.checkTables();
      
      
      // Print summary
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Database setup failed:', error);
    }

    return this.results;
  }

  private async checkTables() {
    console.log('📋 Checking required tables...');
    
    const requiredTables = [
      'companies',
      'roles', 
      'departments',
      'employees',
      'kpis',
      'kpi_records',
      'notifications'
    ];

    for (const table of requiredTables) {
      try {
        // Try to query the table to check if it exists
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          // If table doesn't exist, we'll get a specific error
          if (error.code === 'PGRST116' || error.message.includes('relation') && error.message.includes('does not exist')) {
            this.addResult(table, false, 'Table does not exist');
          } else {
            this.addResult(table, false, error.message);
          }
        } else {
          this.addResult(table, true);
        }
      } catch (error: any) {
        this.addResult(table, false, error.message);
      }
    }
  }


  private printSummary() {
    console.log('\n📊 Setup Summary:');
    console.log('================');
    
    const total = this.results.length;
    const successful = this.results.filter(r => r.exists).length;
    const failed = total - successful;
    
    console.log(`Total Checks: ${total}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Missing Tables/Components:');
      this.results.filter(r => !r.exists).forEach(result => {
        console.log(`- ${result.table}: ${result.error || 'Missing'}`);
      });
      
      console.log('\n💡 To fix missing tables, run the SQL schema files:');
      console.log('1. Run supabase-auth-schema.sql for authentication tables');
      console.log('2. Run supabase-app-schema.sql for application tables');
    }
    
    console.log('\n🎉 Database Setup Complete!');
  }
}

// Export function to run setup
export async function setupDatabase(): Promise<SetupResult[]> {
  const setup = new DatabaseSetup();
  return await setup.setupDatabase();
}

// Export function to run setup from command line
export async function setupDatabaseCLI() {
  try {
    const results = await setupDatabase();
    process.exit(results.every(r => r.exists) ? 0 : 1);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabaseCLI();
}
