import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

export async function getBlockchainStats(request, reply) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  try {
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    // Get last 5 blocks
    const blocks = [];
    for (let i = 0; i < 5; i++) {
        if (blockNumber - i < 0) break;
        const block = await provider.getBlock(blockNumber - i);
        blocks.push({
            number: block.number,
            hash: block.hash,
            timestamp: block.timestamp,
            transactions: block.transactions.length
        });
    }

    return {
      blockNumber,
      chainId: network.chainId.toString(),
      blocks
    };
  } catch (error) {
    console.error('Blockchain stats failed:', error.message);
    return reply.status(500).send({ error: error.message });
  }
}
