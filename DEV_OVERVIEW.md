# Devops Info

This info will point you in the right direction to manage this fork/deployment of trinket-oss.

## Logins and 3rd Party Stuff

**Host = Google Cloud**

- console.cloud.google.com.  Log in with google, matthew.stockinger@isd742.org
- search for 'cloud run'
- project id is trinket742
- container is built locally using docker or docker-compose, then pushed to the google cloud artifact registry.  From the cloud console, you can search for artifact registry and see this.  The push itself happens via gcloud CLI.

**MongoDB Atlas**

- Matt logs in through school google sign-on.

**domain trinket742.org**

- registrar is namesilo.com.  Login is matt's personal account.

## How to run locally



## How To Deploy

Copied conversation with Claude

```text
us-central1-docker.pkg.dev/trinket742/trinket742-repo/trinket742-image-5-7-2026

endpoint url = https://trinket742-image-5-7-2026-647187954071.us-central1.run.app


 Deployment Steps                                                                                                                                                    
                                                                                                                                                                      
  1. Set up MongoDB Atlas (free tier)                                                                                                                                 
                                                                                                                                                                      
  1. Go to https://cloud.mongodb.com → Create a free M0 cluster                                                                                                       
  2. Create a database user (username + password)
  3. Under Network Access, add 0.0.0.0/0 to allow Cloud Run (or use a VPC connector for stricter security)
  4. Get your connection string: Connect → Drivers → copy the mongodb+srv://... URI
  5. Replace <password> in the URI and set the database name to trinket:
  mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/trinket

  2. Set up Google Cloud

  # Install gcloud CLI if needed: https://cloud.google.com/sdk/docs/install
  # Then authenticate:
  gcloud auth login
  gcloud config set project YOUR_PROJECT_ID

  # Enable required APIs
  gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

  # Create Artifact Registry repo
  gcloud artifacts repositories create trinket --repository-format=docker --location=us-central1

  3. Build and push the image

  # From the project root:
  gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest

alternate: docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest .

Then push to repo.

  4. Deploy to Cloud Run

use secret manager to store secrets.
echo 'whatever_secret' | gcloud secrets create SECRET_NAME --data-file=-

deploy.  Replace --set-env-vars with --set-secrets.
  gcloud run deploy trinket `
    --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --set-env-vars "NODE_ENV=production" `
    --set-secrets "MONGO_URI=MONGO_URI:latest" `
    --set-env-vars "SESSION_SECRET=your-session-password-min-32-chars-here" `
    --set-env-vars "GOOGLE_CLIENT_ID=647187954071-u36mqcud4t7h43d7ke7s00nrgccdrdrg.apps.googleusercontent.com" `
    --set-env-vars "GOOGLE_CLIENT_SECRET=your-oauth-secret-from-password-manager" `
    --set-env-vars "GOOGLE_CALLBACK_URL=https://trinket-xxxxxxxxxxxx-uc.a.run.app/auth/google/callback" `
    --min-instances 0 `
    --max-instances 2

  5. Update Google OAuth callback URL

  After getting your Cloud Run URL, go to Google Cloud Console → APIs & Services → Credentials (https://console.cloud.google.com/apis/credentials), edit your OAuth
  2.0 Client ID, and add:
  - https://YOUR-CLOUD-RUN-URL/auth/google/callback to Authorized redirect URIs

  6. Custom domain (optional, after deployment works)

  gcloud run domain-mappings create --service trinket --domain trinket742.org --region us-central1

  ---
  Secrets tip: For better security, use --set-secrets instead of --set-env-vars for sensitive values (MONGO_URI, SESSION_SECRET, GOOGLE_CLIENT_SECRET). Store them in
  Google Secret Manager first:
  echo "your-value" | gcloud secrets create SESSION_SECRET --data-file=-
  # Then in deploy: --set-secrets "SESSION_SECRET=SESSION_SECRET:latest"


----

❯ Your workflow appears to have gcloud do the container build.  Why not use `docker-compose build app` locally, then push the image and deploy?                       
                                                                                                                                                           
● Either works — good call if you already have Docker running locally. The tradeoffs:                                                                                 
                                                                                                                                                                      
  - gcloud builds: builds on Google's servers (no local Docker needed), but you pay for build minutes and upload the whole source                                     
  - Local build + push: faster iteration, free, but requires authenticating Docker to Artifact Registry
                                                                                                                                                                      
  Since you already have Docker running, local build is simpler. Here's the workflow:

  1. Authenticate Docker to Artifact Registry (one-time)
  gcloud auth configure-docker us-central1-docker.pkg.dev

  2. Build locally (add --platform since Cloud Run runs Linux/amd64)
  docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest .

  Or via docker-compose (but you lose the --platform flag easily):
  docker-compose build app
  docker tag trinket/app:latest us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest

  3. Push
  docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest

  4. Deploy (same gcloud run deploy command as before)

  The --platform linux/amd64 matters if you're on a Windows machine with an x86 CPU — it ensures the image is built for Linux. Without it, on some setups the image
  can end up with Windows-specific layers that won't run on Cloud Run.

✻ Baked for 14s
```