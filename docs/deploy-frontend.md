# AgriPlanAI — Frontend AWS Deployment Plan (Amplify)

## Architecture Overview

```
Internet
   │
   ▼
AWS Amplify Hosting
  ├── CDN (CloudFront-backed, built-in)
  ├── HTTPS (built-in, no ACM setup needed)
  ├── Custom Domain (optional, managed by Amplify)
  └── CI/CD (GitHub → auto-build → deploy)
       │
       ▼
  Build: pnpm build (Vite)
  Output: dist/ → Amplify CDN
```

**Services used (all in allowed_services.txt):**
- AWS Amplify — hosting, CDN, CI/CD, HTTPS
- Amazon S3 — Amplify uses S3 internally (managed)
- Amazon CloudFront — Amplify uses CloudFront internally (managed)
- AWS IAM — service roles (base service, always allowed)

> Amplify replaces manual S3 + CloudFront + Route 53 + ACM setup.
> Everything is managed by Amplify — no NAT Gateway, no manual certificate requests.

---

## Step 1 — Create Amplify App (CLI)

```bash
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_DEFAULT_REGION="us-east-1"

# Create the Amplify app
APP_ID=$(aws amplify create-app \
    --name agriplanai-frontend \
    --platform WEB \
    --environment-variables "VITE_API_URL=https://YOUR-APPRUNNER-URL.us-east-1.awsapprunner.com" \
    --build-spec '
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm --dir frontend install --frozen-lockfile
    build:
      commands:
        - pnpm --dir frontend build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - "**/*"
  cache:
    paths:
      - frontend/node_modules/**/*
' \
    --query 'app.appId' --output text)

echo "APP_ID=$APP_ID"
```

---

## Step 2 — Connect GitHub Repository

```bash
# Create a branch in Amplify connected to your GitHub main branch
aws amplify create-branch \
    --app-id $APP_ID \
    --branch-name main \
    --environment-variables "VITE_API_URL=https://YOUR-APPRUNNER-URL.us-east-1.awsapprunner.com" \
    --enable-auto-build

# The Amplify console will prompt for GitHub OAuth on first connection.
# Alternatively, connect via the AWS Console:
# Amplify → New App → Host Web App → GitHub → select repo → configure build
```

> **Easiest setup:** Use the AWS Console for initial GitHub connection (handles OAuth).
> After connecting, all subsequent deploys happen automatically on push to `main`.

---

## Step 3 — Manual Deploy (without GitHub)

If you want to deploy the built `dist/` directly without GitHub:

```bash
# Build locally first
cd frontend/
VITE_API_URL=https://YOUR-APPRUNNER-URL.us-east-1.awsapprunner.com pnpm build

# Package and deploy
cd dist/
zip -r ../frontend-dist.zip .
cd ..

# Start a manual deployment
DEPLOYMENT_JOB=$(aws amplify create-deployment \
    --app-id $APP_ID \
    --branch-name main \
    --query '{jobId:jobSummary.jobId,uploadUrl:zipUploadUrl}' \
    --output json)

UPLOAD_URL=$(echo $DEPLOYMENT_JOB | jq -r '.uploadUrl')
JOB_ID=$(echo $DEPLOYMENT_JOB | jq -r '.jobId')

# Upload the zip
curl -T frontend-dist.zip "$UPLOAD_URL"

# Start the deployment
aws amplify start-deployment \
    --app-id $APP_ID \
    --branch-name main \
    --job-id $JOB_ID

echo "Deployment started. Job ID: $JOB_ID"
```

---

## Step 4 — Custom Domain (Optional)

```bash
# Add custom domain (Amplify handles ACM certificate automatically)
aws amplify create-domain-association \
    --app-id $APP_ID \
    --domain-name agriplanai.com \
    --sub-domain-settings '[
        {"prefix":"", "branchName":"main"},
        {"prefix":"www", "branchName":"main"}
    ]'

# Amplify will provide CNAME records to add to your DNS provider
aws amplify get-domain-association \
    --app-id $APP_ID \
    --domain-name agriplanai.com \
    --query 'domainAssociation.{status:domainAssociationStatus,certificateVerification:certificateVerificationDNSRecord}'
```

---

## Step 5 — SPA Routing Fix (React Router)

Add a rewrite rule so deep links (e.g. `/form`, `/result`) serve `index.html`:

```bash
aws amplify update-app \
    --app-id $APP_ID \
    --custom-rules '[
        {
            "source": "</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>",
            "target": "/index.html",
            "status": "200"
        }
    ]'
```

This is equivalent to the CloudFront custom error pages (403/404 → index.html) in the old plan.

---

## Step 6 — Verify Deployment

```bash
# Check deployment status
aws amplify list-jobs \
    --app-id $APP_ID \
    --branch-name main \
    --query 'jobSummaries[0].{status:status,endTime:endTime}' \
    --output table

# Get the Amplify URL
aws amplify get-branch \
    --app-id $APP_ID \
    --branch-name main \
    --query 'branch.{url:displayName,domain:thumbnailUrl}' \
    --output table

# Default URL format: https://main.APP_ID.amplifyapp.com
echo "Frontend URL: https://main.${APP_ID}.amplifyapp.com"
```

---

## Step 7 — GitHub Actions CI/CD (Alternative to Amplify auto-build)

> **Note:** The current `.github/workflows/deploy-frontend.yml` in the repo deploys to S3+CloudFront (old architecture). It needs to be updated to use Amplify (the zip-upload approach below). Until that is done, use Amplify's built-in GitHub CI instead.

> **TypeScript build note:** `pnpm build` runs `tsc -b && vite build`. TypeScript type errors will fail the build. Run `pnpm --dir frontend build` locally to verify before pushing.

If you prefer GitHub Actions over Amplify's built-in CI:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install and Build
        run: pnpm --dir frontend install --frozen-lockfile && pnpm --dir frontend build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to Amplify
        run: |
          cd frontend/dist && zip -r ../../dist.zip . && cd ../..
          RESULT=$(aws amplify create-deployment \
            --app-id ${{ secrets.AMPLIFY_APP_ID }} \
            --branch-name main \
            --query '{jobId:jobSummary.jobId,uploadUrl:zipUploadUrl}' --output json)
          curl -T dist.zip "$(echo $RESULT | jq -r '.uploadUrl')"
          aws amplify start-deployment \
            --app-id ${{ secrets.AMPLIFY_APP_ID }} \
            --branch-name main \
            --job-id "$(echo $RESULT | jq -r '.jobId')"
```

### Required GitHub Secrets

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `AMPLIFY_APP_ID` | `d1dcun4k8kc9hc` |
| `VITE_API_URL` | `https://rppd9c8vep.us-east-1.awsapprunner.com` |

> The current `.github/workflows/deploy-frontend.yml` uses `CLOUDFRONT_DISTRIBUTION_ID` — the workflow needs to be updated to match this Amplify approach.

---

## Cost Estimate (Monthly)

| Service | Config | Est. Cost |
|---|---|---|
| Amplify Hosting | Build minutes + bandwidth | ~$0–5 |
| (CDN, HTTPS, S3 all managed by Amplify) | | included |
| **Total** | | **~$0–5/mo** |

> First 1000 build minutes/month are free. 15 GB bandwidth free.
> For a typical low-traffic app, the frontend costs essentially nothing.

---

## Deployment Checklist

- [ ] App Runner backend deployed and URL confirmed: `https://rppd9c8vep.us-east-1.awsapprunner.com`
- [ ] Amplify app created (App ID: `d1dcun4k8kc9hc`)
- [ ] Build spec configured (pnpm, `frontend/dist` as artifact)
- [ ] `VITE_API_URL` set to `https://rppd9c8vep.us-east-1.awsapprunner.com`
- [ ] Branch created and connected to GitHub (`main`)
- [ ] SPA rewrite rule added (React Router deep links work)
- [ ] First deployment succeeded
- [ ] Frontend URL accessible: `https://main.d1dcun4k8kc9hc.amplifyapp.com`
- [ ] Custom domain configured (optional)
- [ ] `.github/workflows/deploy-frontend.yml` updated to use Amplify (not S3+CloudFront)
- [ ] TypeScript build verified locally: `pnpm --dir frontend build`
- [ ] Smoke test: Submit form → see recommendations
