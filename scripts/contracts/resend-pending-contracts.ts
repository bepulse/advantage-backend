
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

// API Configuration
const API_URL = 'https://api.anarosabeneficios.com/contract/create-and-sign';
const RETURN_URL = 'https://www.anarosabeneficios.com/contract-success';
const AUTH_TOKEN = 'eyJraWQiOiJVeGhpOHJnWll2Ymh0MVZNVkY4QWFaUnNiZnY4a3ZrU0ZxZ3BHOU5NR1NvPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI0NGE4NzRhOC0wMDYxLTcwZjAtOGJjNi0yZDZhYzFjZmM5YmQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfTXRmOWs4TU0wIiwiY29nbml0bzp1c2VybmFtZSI6IjQ0YTg3NGE4LTAwNjEtNzBmMC04YmM2LTJkNmFjMWNmYzliZCIsIm9yaWdpbl9qdGkiOiI4MTk1ODdjZi1mMjE0LTQ2M2MtYWJhNy1kNTExYmU4Yzc4OWQiLCJhdWQiOiI0OHRrOWpub3F0NW9zN2NybmNvazd2Z2Z2aSIsImV2ZW50X2lkIjoiOTQ4MmE1ZTQtZjM4NC00MGRjLTk4Y2YtZTc0ODJhNmZiNjc5IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NzA3NDQzNTEsImV4cCI6MTc3MDc0Nzk1MSwiaWF0IjoxNzcwNzQ0MzUxLCJqdGkiOiI1YTg4OGEzZi1mNzRmLTRkMmItODRhZS03NjA2ZTU3YmQ5ODkiLCJlbWFpbCI6ImRldnB1cG9AZ21haWwuY29tIn0.v-QX4aDrjgThlduczy0gcNO5Wqnqd5Zr7A7zwL_F6Y6txvGo40tRcuF3HpyXi_fX0pJzvpTMqfTN-gcYCdU3QumuqAYnNKmTOnoVvgEPfdRIKICI9FfIB0nE8WNHAIbqe8g-cmlUWTjT0aZSHpNe_1M5uiQ27r7Xfww_pCM2CKDyKoab61Jaym2AmFkWNs3kwrmbQH002Y_g3GkcCJsCT9GTJQRba84SWxGsZP7DeH2HsAR6cCNVzFXsjCCbbasPnpSyHxbsYXdHYbInRu3ynSHY3_qVb466HNit_suCOObOuktyxmtNGc2jVLxFGZMMipbla_qeuPQUqmbOzcnHvw';

const BACKUP_FILE = 'deleted_contracts_backup.txt';

async function main() {
    const args = process.argv.slice(2);
    const isDryRun = !args.includes('--confirm');

    try {
        if (isDryRun) {
            console.log('=== DRY RUN MODE ===');
            console.log('Use --confirm to execute changes (delete contracts and call API).');
            console.log('This will simulate the process without making any changes.');
        } else {
            console.log('=== PRODUCTION MODE - DELETING CONTRACTS AND CALLING API ===');
        }

        console.log('Fetching contracts that are NOT completed...');
        const contracts = await prisma.contract.findMany({
            where: {
                status: {
                    not: 'completed'
                }
            },
            include: {
                customer: true
            }
        });

        console.log(`Found ${contracts.length} contracts to process.`);

        if (contracts.length === 0) {
            console.log('No contracts to process.');
            return;
        }

        // Backup preparation
        let backupContent = `Backup created at ${new Date().toISOString()}\n`;
        backupContent += `Total contracts found: ${contracts.length}\n`;
        backupContent += '--------------------------------------------------\n';

        for (const contract of contracts) {
            if (!contract.customer) {
                console.warn(`Contract ${contract.id} has no customer. Skipping.`);
                continue;
            }

            const customer = contract.customer;
            
            // Prepare backup data for this entry
            const entryData = JSON.stringify(contract, null, 2);
            backupContent += `Contract ID: ${contract.id}\nCustomer: ${customer.name} (${customer.email})\nData: ${entryData}\n`;
            backupContent += '--------------------------------------------------\n';

            console.log(`Processing customer: ${customer.name} (${customer.email}) - Contract ID: ${contract.id}`);

            if (isDryRun) {
                console.log(`[DRY-RUN] Would DELETE contract ${contract.id}`);
                console.log(`[DRY-RUN] Would CALL API for Customer ID ${customer.id}`);
                console.log(`[DRY-RUN] API Payload:`, {
                    customerId: customer.id,
                    documentType: "contract",
                    returnUrl: RETURN_URL
                });
            } else {
                // 1. Delete the contract from database
                try {
                    await prisma.contract.delete({
                        where: { id: contract.id }
                    });
                    console.log(`✅ Deleted contract ${contract.id} from database.`);
                } catch (delErr) {
                    console.error(`❌ Failed to delete contract ${contract.id}:`, delErr);
                    continue; // Skip API call if delete fails? Or try anyway? Let's skip to be safe.
                }

                // 2. Call the external API
                try {
                    const response = await axios.post(
                        API_URL,
                        {
                            customerId: customer.id,
                            documentType: "contract",
                            returnUrl: RETURN_URL
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${AUTH_TOKEN}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    console.log(`✅ API Call Success for customer ${customer.id}. Status: ${response.status}`);
                } catch (apiErr: any) {
                    console.error(`❌ API Call Failed for customer ${customer.id}:`);
                    if (apiErr.response) {
                        console.error(`   Status: ${apiErr.response.status}`);
                        console.error(`   Data:`, apiErr.response.data);
                    } else {
                        console.error(`   Error:`, apiErr.message);
                    }
                }
            }
        }

        // Write backup file if not dry run (or maybe even in dry run just to show?)
        // The user asked to "log all records that were deleted".
        if (!isDryRun) {
            fs.writeFileSync(BACKUP_FILE, backupContent);
            console.log(`\nBackup saved to ${BACKUP_FILE}`);
        } else {
            console.log(`\n[DRY-RUN] Would save backup to ${BACKUP_FILE}`);
        }

    } catch (error) {
        console.error('Script failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
