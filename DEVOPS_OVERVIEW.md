# Devops Info

This info will point you in the right direction to manage this fork/deployment of trinket-oss.

## Logins and 3rd Party Stuff

**Host = Google Cloud**

- console.cloud.google.com.  Log in with google, matthew.stockinger@isd742.org
- search for 'cloud run'
- project id is trinket742
- container is built locally using docker or docker-compose, then pushed to the google cloud artifact registry.  From the cloud console, you can search for artifact registry and see this.  The push itself happens via gcloud CLI.

**MongoDB Atlas**

- Matt logs into the mongodb console through school google sign-on.
- DB username and password is currently stored in Matts'

**domain trinket742.org**

- registrar is namesilo.com.  Login is matt's personal account.

## How to run locally

1. ensure Docker daemon is running.  On Windows, this means starting the Docker Desktop application.
2. from project root, `docker-compose up`.
3. view at localhost:3000

## How To Deploy

Copied conversation with Claude.  Before doing everything, read all the way through.  Some changes at the bottom.

1. Set up MongoDB Atlas (free tier)  *(Already done by Matt.  Don't redo, just make sure you can log in and see the preexisting cluster0.)*
    1. Go to https://cloud.mongodb.com → Create a free M0 cluster.     
    2. Create a database user (username + password)
    3. Under Network Access, add 0.0.0.0/0 to allow Cloud Run (or use a VPC connector for stricter security)
    4. Get your connection string: Connect → Drivers → copy the mongodb+srv://... URI
    5. Replace <password> in the URI and set the database name to trinket: mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/trinket
2. Set up Google Cloud  *(Do all of these steps unless otherwise noted.)*
    1. Install gcloud CLI if needed: https://cloud.google.com/sdk/docs/install
    2. Then authenticate:

        `gcloud auth login`
    
        `gcloud config set project YOUR_PROJECT_ID` *(YOUR_PROJECT_ID is **trinket742**)*

    3. Enable required APIs
  
        `gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com`

    4. *(Don't do: Matt did already.)* Create Artifact Registry repo
  
        `gcloud artifacts repositories create trinket --repository-format=docker --location=us-central1`

3. Build and push the image

    *(There are two ways to build the container image.  One, using Google Cloud Build service.  This is not preferred.  The other is to build it locally using docker, followed by a push to the Google Artifact Registry.  This is preferred.)*

    *(To build using Google Build Service)*, From the project root:
  
    `gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest`

    For local build: 
    
    `docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest .`

    You can see images you've built locally using the `docker images` command.  You should see **trinket/app:latest**.

    Then push to google artifact registry repo.  Two commands:

    1. `docker tag trinket/app:latest us-central1-docker.pkg.dev/trinket742/trinket/app:latest`
    2. `docker push us-central1-docker.pkg.dev/trinket742/trinket/app:latest`

4. Deploy to Google Cloud Run

    use google secret manager to store secrets if needed.  *(Matt already did this.  You can see the stored secrets in the GCloud console.  Go to secret manager.)*  
    
    To store a new secret: `echo 'whatever_secret' | gcloud secrets create SECRET_NAME --data-file=-`

    Deploying.  *(You should be able to copy and paste this directly.)*
  
    `gcloud run deploy trinket --image us-central1-docker.pkg.dev/trinket742/trinket/app:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NODE_ENV=production" --set-secrets "MONGO_URI=MONGO_URI:latest" --set-secrets "SESSION_SECRET=SESSION_SECRET:latest" --set-secrets "GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest" --set-secrets "GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest" --set-env-vars "GOOGLE_CALLBACK_URL=https://trinket-xxxxxxxxxxxx-uc.a.run.app/auth/google/callback" --min-instances 0 --max-instances 2`

    *(The command below is the original that Matt used.  Copied here for documentation.  Don't use.)*

    `gcloud run deploy trinket --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NODE_ENV=production" --set-secrets "MONGO_URI=MONGO_URI:latest" --set-env-vars "SESSION_SECRET=your-session-password-min-32-chars-here" --set-env-vars "GOOGLE_CLIENT_ID=647187954071-u36mqcud4t7h43d7ke7s00nrgccdrdrg.apps.googleusercontent.com" --set-env-vars "GOOGLE_CLIENT_SECRET=your-oauth-secret-from-password-manager" --set-env-vars "GOOGLE_CALLBACK_URL=https://trinket-xxxxxxxxxxxx-uc.a.run.app/auth/google/callback" --min-instances 0 --max-instances 2`

5. Update Google OAuth callback URL

    After getting your Cloud Run URL, go to Google Cloud Console → APIs & Services → Credentials (https://console.cloud.google.com/apis/credentials), edit your OAuth 2.0 Client ID, and add: *https://YOUR-CLOUD-RUN-URL/auth/google/callback* to Authorized redirect URIs

6. Custom domain (optional, after deployment works)

    `gcloud run domain-mappings create --service trinket --domain trinket742.org --region us-central1`

---

Secrets tip: For better security, use --set-secrets instead of --set-env-vars for sensitive values (MONGO_URI, SESSION_SECRET, GOOGLE_CLIENT_SECRET). Store them in Google Secret Manager first: `echo "your-value" | gcloud secrets create SESSION_SECRET --data-file=-`

Then in deploy: `--set-secrets "SESSION_SECRET=SESSION_SECRET:latest"`

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
<<begin Matt comment>>
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/trinket742/trinket742-repo/trinket742-image-5-7-2026 .
<<end Matt comment>>

Or via docker-compose (but you lose the --platform flag easily):
docker-compose build app
docker tag trinket/app:latest us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest

3. Push
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest

4. Deploy (same gcloud run deploy command as before)

The --platform linux/amd64 matters if you're on a Windows machine with an x86 CPU — it ensures the image is built for Linux. Without it, on some setups the image
can end up with Windows-specific layers that won't run on Cloud Run.
