import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadTenantConfig } from '../utils/config-loader.js';
const __filename = fileURLToPath(import.meta.url);
export async function deploy(environment, options) {
    const validEnvironments = ['on-prem', 'cloud', 'docker'];
    if (!validEnvironments.includes(environment)) {
        console.error(chalk.red(`Invalid environment: ${environment}`));
        console.error(chalk.dim(`Valid options: ${validEnvironments.join(', ')}`));
        process.exit(1);
    }
    const projectDir = process.cwd();
    const configPath = options.config || path.join(projectDir, 'tenant.config.yaml');
    if (!(await fs.pathExists(configPath))) {
        console.error(chalk.red('tenant.config.yaml not found'));
        console.error(chalk.dim('Run "create-institute-app init" first'));
        process.exit(1);
    }
    const config = await loadTenantConfig(configPath);
    console.log(chalk.bold(`\nDeploying ${config.name} to ${environment}...\n`));
    try {
        switch (environment) {
            case 'on-prem':
                await deployOnPrem(projectDir, config);
                break;
            case 'cloud':
                await deployCloud(projectDir, config);
                break;
            case 'docker':
                await deployDocker(projectDir, config);
                break;
        }
        console.log(chalk.green('\n✓ Deployment completed successfully!'));
    }
    catch (error) {
        console.error(chalk.red('\n✗ Deployment failed:'), error);
        process.exit(1);
    }
}
async function deployOnPrem(projectDir, config) {
    console.log(chalk.cyan('On-premise deployment mode'));
    console.log(chalk.dim('This will build Docker images and generate deployment bundle.\n'));
    // Build the application
    console.log(chalk.bold('1. Building application...'));
    await execa('npm', ['run', 'build'], { cwd: projectDir, stdio: 'inherit' });
    // Build Docker images
    console.log(chalk.bold('\n2. Building Docker images...'));
    await execa('docker', ['compose', 'build'], { cwd: projectDir, stdio: 'inherit' });
    // Generate deployment bundle
    console.log(chalk.bold('\n3. Generating deployment bundle...'));
    const bundleDir = path.join(projectDir, 'deployment-bundle');
    await fs.ensureDir(bundleDir);
    // Save Docker images as tar files
    await execa('docker', ['save', '-o', path.join(bundleDir, 'api.tar'), 'lci-platform-api:latest'], { stdio: 'inherit' });
    await execa('docker', ['save', '-o', path.join(bundleDir, 'web.tar'), 'lci-platform-web:latest'], { stdio: 'inherit' });
    await execa('docker', ['save', '-o', path.join(bundleDir, 'worker.tar'), 'lci-platform-worker:latest'], { stdio: 'inherit' });
    await execa('docker', ['save', '-o', path.join(bundleDir, 'proxy.tar'), 'lci-platform-proxy:latest'], { stdio: 'inherit' });
    // Copy docker-compose and config files
    await fs.copy(path.join(projectDir, 'infra/docker/docker-compose.yml'), path.join(bundleDir, 'docker-compose.yml'));
    await fs.copy(path.join(projectDir, 'tenant.config.yaml'), path.join(bundleDir, 'tenant.config.yaml'));
    await fs.copy(path.join(projectDir, '.env.example'), path.join(bundleDir, '.env.template'));
    // Create installation script
    const installScript = `#!/bin/bash
# LCI Platform On-Premise Installation Script
# Generated for ${config.name} (${config.slug})

set -e

echo "Loading Docker images..."
docker load -i api.tar
docker load -i web.tar
docker load -i worker.tar
docker load -i proxy.tar

echo "Copying configuration..."
cp .env.template .env
echo "Please edit .env with your database credentials, Paystack keys, etc."
echo "Then run: docker compose up -d"
`;
    await fs.writeFile(path.join(bundleDir, 'install.sh'), installScript);
    await fs.chmod(path.join(bundleDir, 'install.sh'), 0o755);
    console.log(chalk.green(`\n✓ Deployment bundle created at ${bundleDir}`));
    console.log(chalk.dim('Transfer this directory to the target server and run ./install.sh'));
}
async function deployCloud(projectDir, config) {
    console.log(chalk.cyan('Cloud deployment mode (Abdac-hosted)'));
    console.log(chalk.dim('This will trigger the Abdac Consult deployment pipeline.\n'));
    // Check for required environment variables
    const requiredEnv = ['DEPLOYMENT_API_URL', 'DEPLOYMENT_API_KEY'];
    for (const env of requiredEnv) {
        if (!process.env[env]) {
            console.error(chalk.red(`Missing required environment variable: ${env}`));
            console.error(chalk.dim('Set this to your Abdac Consult deployment API endpoint'));
            process.exit(1);
        }
    }
    // Package the application
    console.log(chalk.bold('1. Packaging application...'));
    await execa('npm', ['run', 'build'], { cwd: projectDir, stdio: 'inherit' });
    // Create deployment package
    const deployPackage = {
        tenant: config,
        timestamp: new Date().toISOString(),
        version: '1.0.0', // Would come from package.json
    };
    // Trigger deployment via API
    console.log(chalk.bold('\n2. Triggering cloud deployment...'));
    const response = await fetch(`${process.env.DEPLOYMENT_API_URL}/deploy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEPLOYMENT_API_KEY}`,
        },
        body: JSON.stringify(deployPackage),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Deployment API error: ${response.status} - ${error}`);
    }
    const result = await response.json();
    console.log(chalk.green(`\n✓ Deployment initiated! Deployment ID: ${result.deploymentId}`));
    console.log(chalk.dim(`Track progress at: ${process.env.DEPLOYMENT_API_URL}/deployments/${result.deploymentId}`));
}
async function deployDocker(projectDir, config) {
    console.log(chalk.cyan('Local Docker deployment (development)'));
    // Check for .env file
    const envPath = path.join(projectDir, '.env');
    if (!(await fs.pathExists(envPath))) {
        console.log(chalk.yellow('No .env file found. Copying from .env.example...'));
        await fs.copy(path.join(projectDir, '.env.example'), envPath);
        console.log(chalk.dim('Please edit .env with your configuration before continuing.'));
    }
    console.log(chalk.bold('\n1. Starting services...'));
    await execa('docker', ['compose', 'up', '-d'], { cwd: projectDir, stdio: 'inherit' });
    console.log(chalk.bold('\n2. Running database migrations...'));
    await execa('docker', ['compose', 'exec', '-T', 'api', 'npm', 'run', 'prisma:migrate'], { cwd: projectDir, stdio: 'inherit' });
    console.log(chalk.bold('\n3. Seeding initial data...'));
    await execa('docker', ['compose', 'exec', '-T', 'api', 'npm', 'run', 'prisma:seed'], { cwd: projectDir, stdio: 'inherit' });
    console.log(chalk.green('\n✓ Local deployment ready!'));
    console.log(chalk.dim('Access the application at https://localhost (or your configured domain)'));
}
//# sourceMappingURL=deploy.js.map