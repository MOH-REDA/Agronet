# AgroNet deployment

## Local Docker

Requirements: Docker Desktop with Docker Compose.

```powershell
npm run docker:up
```

The first run creates `.env.docker` with random local secrets, builds all images, runs migrations, and starts AgroNet at `http://localhost:8080`.

Useful commands:

```powershell
npm run docker:logs
npm run docker:seed
npm run docker:down
npm run docker:reset
```

`docker:reset` deletes the local Docker database and uploaded files. It is intentionally destructive.
`docker:seed` adds the project's demo users and equipment and must not be run in production.

### Smart Equipment Advisor

The advisor works in deterministic database-match mode without an AI key. To enable AI ranking and explanations, create an OpenRouter key and add these values to `.env.docker`:

```dotenv
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openrouter/free
```

Then recreate the backend container:

```powershell
docker compose --env-file .env.docker up -d --build --force-recreate backend
```

Keep the key server-side and never expose it through a `VITE_` environment variable.

### Google and Facebook sign-in

Social sign-in is implemented with Laravel Socialite. The buttons remain disabled until a provider is configured.

1. Create an OAuth application in Google Cloud and/or Meta for Developers.
2. Add these exact local callback URLs to the provider application:
   - Google: `http://localhost:8080/api/auth/google/callback`
   - Facebook: `http://localhost:8080/api/auth/facebook/callback`
3. Add the matching client ID, secret, and callback URL to `.env.docker`:

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost:8080/api/auth/facebook/callback
```

4. Recreate the backend container. For production, replace `localhost` with the public HTTPS domain in both the provider console and `.env.docker`.

Provider secrets are backend-only values. Never prefix them with `VITE_` or commit them.

## Container layout

- `frontend`: production React build served by Nginx; proxies `/api` and `/storage`.
- `backend`: Laravel 12 on PHP 8.3 and Apache.
- `db`: MySQL 8.4 with a persistent Docker volume.
- `mysql_data`: persistent database data.
- `equipment_uploads`: persistent uploaded equipment images.

Only the frontend port is published. MySQL and Laravel stay on Docker's private network.

## Recommended AWS path

For the final-year project, begin with one EC2 instance. This is inexpensive to understand, demonstrates real cloud deployment, and runs the same Compose stack used locally.

1. Create an Ubuntu EC2 instance in the AWS Region closest to the expected users.
2. Allow inbound `80` and `443`; restrict `22` to your own IP.
3. Attach an Elastic IP so the address remains stable.
4. Install Docker Engine and the Compose plugin.
5. Clone the repository and create `.env.docker` from the example.
6. Set `APP_URL` to the public HTTPS URL and replace every generated secret.
7. Run `docker compose --env-file .env.docker up --build -d`.
8. Put HTTPS in front of port `8080` using an Application Load Balancer with ACM, or a host-level Caddy/Nginx reverse proxy.
9. Configure an AWS Budget and billing alerts before leaving resources running.

Do not commit `.env.docker`, AWS keys, database passwords, or the Laravel application key.

## Stronger portfolio architecture

After the EC2 deployment works, upgrade one boundary at a time:

- **Amazon ECR:** store versioned frontend and backend container images.
- **Amazon RDS for MySQL:** move the database out of the EC2 instance and enable backups.
- **Amazon S3:** store equipment images outside disposable containers.
- **Amazon CloudWatch:** centralize application and container logs.
- **Route 53 + ACM:** domain name and managed TLS certificate.
- **GitHub Actions:** test, build, push to ECR, and deploy on merges to the production branch.

For RDS, change `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in `.env.docker`, then remove or disable the Compose `db` service. Keep the RDS instance private and allow port `3306` only from the application's security group.

Moving uploads to S3 requires changing the equipment upload code to use Laravel's configured filesystem disk. Do that before running multiple backend instances; a Docker volume belongs to one host and is not shared storage.

## Production checklist

- Set `APP_ENV=production` and `APP_DEBUG=false`.
- Use HTTPS and a real `APP_URL`.
- Use unique production secrets and least-privilege IAM roles.
- Back up the database and test restoration.
- Run `php artisan migrate --force` during controlled deployments.
- Do not seed demo accounts in production.
- Verify CORS, upload limits, email delivery, and payment-provider callbacks against the production domain.
