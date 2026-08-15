# Devops Info

This info will point you in the right direction to manage this fork/deployment of trinket-oss.

## Logins and 3rd Party Stuff

**Host = Google Cloud**

- console.cloud.google.com. Log in with google, matthew.stockinger@isd742.org
- search for 'cloud run'
- project id is trinket742
- container is built locally using docker or docker-compose, then pushed to the google cloud artifact registry. From the cloud console, you can search for artifact registry and see this. The push itself happens via gcloud CLI.

**MongoDB Atlas**

- Matt logs into the mongodb console through school google sign-on.
- DB username and password is currently stored in Matts'

**domain trinket742.org**

- registrar is namesilo.com. Login is matt's personal account.

## How to run locally

1. ensure Docker daemon is running. On Windows, this means starting the Docker Desktop application.
2. from project root, `docker-compose up`.
3. view at localhost:3000

## How To Deploy

Copied conversation with Claude. Before doing everything, read all the way through. Some changes at the bottom.

1. Set up MongoDB Atlas (free tier) _(Already done by Matt. Don't redo, just make sure you can log in and see the preexisting cluster0.)_
    1. Go to https://cloud.mongodb.com → Create a free M0 cluster.
    2. Create a database user (username + password)
    3. Under Network Access, add 0.0.0.0/0 to allow Cloud Run (or use a VPC connector for stricter security)
    4. Get your connection string: Connect → Drivers → copy the mongodb+srv://... URI
    5. Replace <password> in the URI and set the database name to trinket: mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/trinket
2. Set up Google Cloud _(Do all of these steps unless otherwise noted.)_
    1. Install gcloud CLI if needed: https://cloud.google.com/sdk/docs/install
    2. Then authenticate:

        `gcloud auth login`

        `gcloud config set project YOUR_PROJECT_ID` _(YOUR_PROJECT_ID is **trinket742**)_

    3. Enable required APIs

        `gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com`

    4. Authenticate Docker to Artifact Registry (one-time)

        `gcloud auth configure-docker us-central1-docker.pkg.dev`

    5. _(Don't do: Matt did already.)_ Create Artifact Registry repo

        `gcloud artifacts repositories create trinket --repository-format=docker --location=us-central1`

3. Build and push the image

    _(There are two ways to build the container image. One, using Google Cloud Build service. This is not preferred. The other is to build it locally using docker, followed by a push to the Google Artifact Registry. This is preferred.)_

    _(To build using Google Build Service)_, From the project root:

    `gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest`

    For local build:

    `docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/trinket742/trinket/app:latest .`

    Then push to the google artifact registry repo

    `docker push us-central1-docker.pkg.dev/trinket742/trinket/app:latest`

    **Do not run `docker tag trinket/app:latest us-central1-docker.pkg.dev/...` first.** (Google's docs say to do this.) The
    `docker build` above already applied the registry tag.

4. Deploy to Google Cloud Run

    use google secret manager to store secrets if needed. _(Matt already did this. You can see the stored secrets in the GCloud console. Go to secret manager.)_

    To store a new secret: `echo 'whatever_secret' | gcloud secrets create SECRET_NAME --data-file=-`

    Deploying. _(You should be able to copy and paste this directly. Service testing URL from most recent deploy, on 8.14.2026 = https://trinket-647187954071.us-central1.run.app)_

    `gcloud run deploy trinket --image us-central1-docker.pkg.dev/trinket742/trinket/app:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NODE_ENV=production","GOOGLE_CALLBACK_URL=https://trinket-647187954071.us-central1.run.app/auth/google/callback" --set-secrets "MONGO_URI=MONGO_URI:latest","SESSION_SECRET=SESSION_SECRET:latest","GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest","GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest" --min-instances 0 --max-instances 2`

    _(The commands below are the originals that Matt tried. Copied here for documentation. Don't use. Correct syntax is above.)_

    `gcloud run deploy trinket --image us-central1-docker.pkg.dev/trinket742/trinket/app:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NODE_ENV=production" --set-secrets "MONGO_URI=MONGO_URI:latest" --set-secrets "SESSION_SECRET=SESSION_SECRET:latest" --set-secrets "GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest" --set-secrets "GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest" --set-env-vars "GOOGLE_CALLBACK_URL=https://trinket-xxxxxxxxxxxx-uc.a.run.app/auth/google/callback" --min-instances 0 --max-instances 2`
    `gcloud run deploy trinket --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/trinket/app:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "NODE_ENV=production" --set-secrets "MONGO_URI=MONGO_URI:latest" --set-env-vars "SESSION_SECRET=your-session-password-min-32-chars-here" --set-env-vars "GOOGLE_CLIENT_ID=647187954071-u36mqcud4t7h43d7ke7s00nrgccdrdrg.apps.googleusercontent.com" --set-env-vars "GOOGLE_CLIENT_SECRET=your-oauth-secret-from-password-manager" --set-env-vars "GOOGLE_CALLBACK_URL=https://trinket-xxxxxxxxxxxx-uc.a.run.app/auth/google/callback" --min-instances 0 --max-instances 2`

5. Update Google OAuth callback URL _(Already done by Matt)_

    After getting your Cloud Run URL, go to Google Cloud Console → APIs & Services → Credentials (https://console.cloud.google.com/apis/credentials), edit your OAuth 2.0 Client ID, and add: _https://YOUR-CLOUD-RUN-URL/auth/google/callback_ to Authorized redirect URIs

    Need changes to default.yaml, local.yaml, and production.yaml. See GETTING_STARTED.md for instructions. Also update url and hostname sections.

6. Custom domain (optional, after deployment works)

    The method below is one of two methods supported by Google. See https://docs.cloud.google.com/run/docs/mapping-custom-domains. Method 1 = **global external application load balancer.** More complex, but better supported and more flexible. Method 2 = **Cloud Run domain mapping.** In preview. Matt decision = method 2, 8.14.2026.

    Cloud run domain mapping how-to here:
    1. Verify ownership of the domain.

        `gcloud domains list-user-verified`

        If trinket742.org isn't in there:

        `gcloud domains verify trinket742.org`

    2. map the service to a custom domain.

        Claude gave this command, but I think it might need editing. See docs linked above.

        `gcloud run domain-mappings create --service trinket --domain trinket742.org --region us-central1`

    3. Add DNS records at registrar.
