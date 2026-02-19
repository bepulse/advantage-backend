
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
const AUTH_TOKEN = 'eyJraWQiOiJVeGhpOHJnWll2Ymh0MVZNVkY4QWFaUnNiZnY4a3ZrU0ZxZ3BHOU5NR1NvPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI0NGE4NzRhOC0wMDYxLTcwZjAtOGJjNi0yZDZhYzFjZmM5YmQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfTXRmOWs4TU0wIiwiY29nbml0bzp1c2VybmFtZSI6IjQ0YTg3NGE4LTAwNjEtNzBmMC04YmM2LTJkNmFjMWNmYzliZCIsIm9yaWdpbl9qdGkiOiI4NmYxMDZkNC1iNDNmLTQ0ZDUtYWJmNy0yOWZhNWQ3MGVkMzYiLCJhdWQiOiI0OHRrOWpub3F0NW9zN2NybmNvazd2Z2Z2aSIsImV2ZW50X2lkIjoiMmFmMWQxYjAtNzRlOC00YzBmLWExZWQtZWNkOTI0Yjc3NTI2IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NzE0MzQzMTIsImV4cCI6MTc3MTUxMjEzMCwiaWF0IjoxNzcxNTA4NTMwLCJqdGkiOiIxNGQyMzhjMy1jZWVkLTRmYzEtOGMyMC03YjY2MGI4NTFkOWMiLCJlbWFpbCI6ImRldnB1cG9AZ21haWwuY29tIn0.DjW34wDkBalnU4Zef4tAc_R10K7SsQb-B9iPFAFNKFbhet-DOqCxz900Dw5-9JXSPMCvdCMEIYl5-ePPpE6yYb-ffyzW0y6KHbByK2fA8fEC180qwJCaLc3bSdFOlHZGLkoODCfBM4Em_Bs50YxYpEi5wJqO3vp9wwGTZ3mCb0GlGdtd-rG1jpmTDGPGFvzHxf1I2yJx83HJqa0SNMCNdA_-HuJkCFZTxl5JF6UF6GgP3J3lyA6RJkqtGx-IFgBzVhB7optwS9QkA8ltkMxOJ0wyKLBOR3ZCjaeObYew8K7kY-yaAwZKj3IVxh1KEfT1lajhtPn2O77cp8s6epu2KQ';

const BACKUP_FILE = 'deleted_contracts_backup.txt';

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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
                console.log(`[DRY-RUN] Would CALL API for Customer ID ${customer.id}`);
                console.log(`[DRY-RUN] API Payload:`, {
                    customerId: customer.id,
                    documentType: "contract",
                    returnUrl: RETURN_URL
                });
            } else {
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

                await sleep(3000);
            }
        }

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
