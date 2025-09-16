import { NextResponse } from 'next/server';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const execAsync = promisify(exec);

export const runtime = 'nodejs';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    
    // Get the correct path to the contracts directory
    // From apps/interface, go up to project root, then to packages/contracts
    const projectRoot = path.resolve(process.cwd(), '../..');
    const contractsDir = path.join(projectRoot, 'packages', 'contracts');
    const deployParamsPath = path.join(contractsDir, 'deploy-params.json');
    
    // Ensure the contracts directory exists
    if (!fs.existsSync(contractsDir)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Contracts directory not found',
        log: `Directory not found: ${contractsDir}`
      }, { status: 500 });
    }
    
    // Write deploy parameters
    fs.writeFileSync(deployParamsPath, JSON.stringify(body, null, 2));
    
    // Run deployment script
    const network = process.env.DEPLOY_NETWORK || 'hyperevmTestnet'
    const command = `pnpm hardhat run scripts/deploy-hyper721a.ts --network ${network}`
    
    console.log(`Running command: ${command}`)
    console.log(`Working directory: ${contractsDir}`)
    
    let stdout, stderr;
    try {
      const result = await execAsync(command, { 
        cwd: contractsDir,
        timeout: 60000, // 60 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError: any) {
      // Even if exec fails, we might still get useful output
      stdout = execError.stdout || '';
      stderr = execError.stderr || '';
      console.error('Exec error:', execError.message);
    }
    
    const out = stdout + stderr;
    
    // Parse deployment result
    const addressMatch = out.match(/Hyper721A deployed:\s*(0x[a-fA-F0-9]{40})/);
    const txHashMatch = out.match(/Transaction hash:\s*(0x[a-fA-F0-9]{64})/);
    
    return NextResponse.json({ 
      ok: !!addressMatch, 
      address: addressMatch?.[1] || null,
      txHash: txHashMatch?.[1] || null,
      log: out 
    });
    
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      log: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 });
  }
};
