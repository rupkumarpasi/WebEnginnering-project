import fs from 'fs';

async function uploadAvatarDirect(userId, filePath, accessToken) {
  const auth = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  // 1. Ask our API for a presigned URL
  const fileBuffer = fs.readFileSync(filePath);
  const fileSize = fileBuffer.length;
  // Note: Adjust your backend endpoint URL / port as needed (e.g., http://localhost:3000)
  const presignRes = await fetch(`http://localhost:3000/api/v1/users/${userId}/avatar/presign`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ contentType: 'image/jpeg', size: fileSize }),
  });
  
  if (!presignRes.ok) {
    throw new Error(`Failed to get presigned URL: ${presignRes.status}`);
  }
  
  const presign = await presignRes.json();
  console.log('Presigned URL received successfully.');

  // 2. Upload the file straight to S3/MinIO using the exact signed headers and binary body
  const put = await fetch(presign.data.url, { 
    method: 'PUT', 
    headers: { 
      'Content-Type': 'image/jpeg',
      'Content-Length': fileSize.toString()
    }, 
    body: fileBuffer 
  });
  
  if (!put.ok) {
    const errorText = await put.text();
    throw new Error(`S3 upload failed (${put.status}): ${errorText}`);
  }
  console.log('File uploaded successfully directly to MinIO!');

  // 3. Tell our API to process and finalize it
  const completeRes = await fetch(`http://localhost:3000/api/v1/users/${userId}/avatar/complete`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ key: presign.data.key }),
  });

  if (!completeRes.ok) {
    throw new Error(`Failed to finalize upload: ${completeRes.status}`);
  }

  return completeRes.json();
}

// Execute the test upload function
uploadAvatarDirect(
  '3563c76e-0587-4b0c-8631-8fbefeb0e3c0', // Replace with a valid test user ID
  './rup.jpeg',                        // Path to your local test image
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3OTM0MzE1NDQsImV4cCI6MTc5MzQzMjQ0NCwiYXVkIjoidXNlcnMtYXBpIiwiaXNzIjoidXNlcnMtYXBpIiwic3ViIjoiMzU2M2M3NmUtMDU4Ny00YjBjLTg2MzEtOGZiZWZlYjBlM2MwIn0.1z3y4Dr0op34_jqelVpWd1zoXNK-JfsxQHaMzdkfuRI'             // Replace with a valid bearer token if auth is required
)
  .then(result => console.log('Final API response:', result))
  .catch(err => console.error('Upload workflow error:', err));