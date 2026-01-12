// Simple script to verify contract address format
// Run with: node contracts/verify-address.js

const address = '0xf93a8b671889d1e8eebf4737f45f88fef81989d6b';

console.log('Contract Address Verification:');
console.log('Address:', address);
console.log('Length:', address.length);
console.log('Starts with 0x:', address.startsWith('0x'));
console.log('Valid hex characters:', /^[0-9a-fA-F]+$/.test(address.slice(2)));

if (address.length === 42 && address.startsWith('0x') && /^[0-9a-fA-F]+$/.test(address.slice(2))) {
  console.log('✅ Address format appears valid');
} else {
  console.log('❌ Address format is invalid');
}

// Check against common issues
if (address.includes(' ')) {
  console.log('❌ Address contains spaces');
}

if (address.length !== 42) {
  console.log(`❌ Address length is ${address.length}, should be 42`);
}

// Instructions for user
console.log('\nTo verify your deployed contract:');
console.log('1. Go to https://sepolia.mantlescan.xyz/');
console.log('2. Search for your address:', address);
console.log('3. If it shows as a contract, the address is correct');
console.log('4. If it doesn\'t exist, you need to redeploy or get the correct address');

// Environment variable suggestion
console.log('\nIf the address is correct but validation fails, you can set:');
console.log(`NEXT_PUBLIC_AD_REGISTRY_ADDRESS=${address}`);