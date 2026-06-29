# AgroNet on AWS Academy

This deployment is designed for a final-year demonstration and uses:

- Amazon EC2 for the two Docker application containers.
- Amazon RDS for a private MySQL database.
- Amazon ECR for immutable frontend and backend images.
- Amazon CloudWatch for host metrics and Docker logs.
- Cloudinary for public equipment and profile images.

## 1. Load temporary Lab credentials

Start the Learner Lab, open **AWS Details**, choose **Show** next to AWS CLI, and copy the generated credentials into:

```text
C:\Users\YOUR_USER\.aws\credentials
```

Use the profile name `default`. These credentials expire when the lab session expires and must also be refreshed in GitHub before an AWS deployment workflow is run.

Verify locally:

```powershell
python -m awscli sts get-caller-identity
```

## 2. Create an EC2 key pair

In the EC2 console, create an RSA `.pem` key pair and store it safely. It is required by CloudFormation and GitHub Actions. Never add it to the repository.

## 3. Provision the stack

In CloudFormation:

1. Create a stack with new resources.
2. Upload `infra/aws/agronet-stack.yml`.
3. Choose the EC2 key pair.
4. Set `SSHLocation` to your public IP followed by `/32`.
5. Enter a strong RDS password.
6. Keep `LabInstanceProfile` if that profile exists in the lab account; otherwise leave the parameter blank.
7. Create the stack and wait for `CREATE_COMPLETE`.

The outputs provide the public application IP, private RDS endpoint, EC2 instance ID, ECR repositories, and CloudWatch log group.

## 4. Install the production environment on EC2

Copy `infra/aws/environment.example` to a local temporary file named `.env.aws`, replace every placeholder, then upload it:

```powershell
scp -i PATH_TO_KEY.pem .env.aws ubuntu@EC2_PUBLIC_IP:/tmp/.env.aws
ssh -i PATH_TO_KEY.pem ubuntu@EC2_PUBLIC_IP "sudo mv /tmp/.env.aws /opt/agronet/.env.aws && sudo chown ubuntu:ubuntu /opt/agronet/.env.aws && chmod 600 /opt/agronet/.env.aws"
```

Set `APP_DOMAIN` to the production hostname. The `APP_URL`, Google callback, and Facebook callback must use its HTTPS URL. Copy the existing local Cloudinary URL into this file. Do not expose RDS publicly.

Generate a production Laravel key locally without revealing it:

```powershell
docker compose --env-file .env.docker exec -T backend php artisan key:generate --show
```

## 5. Configure GitHub's `production` environment

Add these repository environment secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`
- `AWS_REGION`
- `AWS_EC2_HOST`
- `AWS_EC2_USER` (`ubuntu`)
- `AWS_EC2_SSH_KEY` (the complete PEM contents)

AWS Academy credentials are temporary. Refresh the first three secrets after starting a new lab session.

## 6. Publish and deploy

Open GitHub Actions and manually run **Publish and Deploy to AWS**. The workflow:

1. Builds both images.
2. Pushes commit-specific and `latest` tags to ECR.
3. Transfers the production Compose definition over SSH.
4. Pulls the exact immutable image revision.
5. Runs Laravel migrations.
6. Verifies container and HTTP health.

## Presentation talking points

- RDS is isolated in private subnets and accepts MySQL only from the EC2 security group.
- ECR scans images on push and retains only five revisions.
- CloudWatch keeps seven days of container logs and system metrics.
- Cloudinary separates public media from compute, making EC2 replacement safe.
- Caddy provisions and renews the public TLS certificate automatically, while HTTP redirects to HTTPS.
- GitHub Actions provides repeatable CI/CD with a health-checked deployment.

Delete the CloudFormation stack after the presentation if the lab credits no longer need to preserve the environment. RDS deletion creates a final snapshot by policy.
