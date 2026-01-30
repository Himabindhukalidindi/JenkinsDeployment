import { test } from '../fixtures/azure-api.fixture';
import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('GET API Automation Tests with Hooks', () => {
    let customerId: string;

    test.beforeEach(async ({ api }) => {
        // Create a customer to be used in the test
        const payloadPath = path.join(__dirname, '../tests/fixtures/customer_payload.json');
        const customerData = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'));

        const imagePath = path.join(__dirname, '../tests/fixtures/test_image.png');
        const imageBuffer = fs.readFileSync(imagePath);

        const multipartData = {
            ...customerData,
            photo: {
                name: 'test_image.png',
                mimeType: 'image/png',
                buffer: imageBuffer
            }
        };

        console.log("Setup: Creating customer...");
        const response = await api.postMultipart<any>('/api/v1/customers', multipartData);
        expect(response.status).toBe('success');
        customerId = response.data.customerId;
        console.log(`Setup: Created customer with ID: ${customerId}`);
    });

    test('GET /api/v1/customers - should retrieve created customer', async ({ api }) => {
        // Perform the GET request
        const response = await api.get<any>(`/api/v1/customers?customerId=${customerId}&include=accounts`);

        console.log("GET Response:", JSON.stringify(response, null, 2));

        // Assert only the specific response structure as requested
        expect(response).toMatchObject({
            status: 'success',
            data: {
                customerId: customerId
            }
        });
    });

    test.afterEach(async ({ api }) => {
        if (customerId) {
            console.log(`Teardown: Deleting customer ${customerId}...`);
            const response = await api.delete<any>(`/api/v1/customers/${customerId}?reason=request`);
            console.log("DELETE Response:", response);
            expect(response.status).toBe('success'); // Assuming success status for delete
        }
    });
});
