**Author:** Matt Stockinger
**Date:** 4.2026

A log of setup steps I took to get Trinket deployed for my classroom.

- forked and cloned repo
- copied local.yaml
- submitted PR for make-admin.js fix
- created login for matthew.stockinger@isd742.org. Made admin. Password in manager.
- updated local.yaml to add html and console trinkets.
- default settings changed so that python will run in browser.
    - app: embed: skulpt: local: true
    - app: embed: skulpt: min: true
- created new logo images and updated branding settings
- commented out all occurrences of 'sign up' buttons and the /signup endpoint
    - I only want to allow students to log in with google, and join courses with a join link.
    - NO public signups allowed.
- Set up Google OAuth
    - used cloud console mstockin@apps.isd742.org login.
    - Instructions at [https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid?authuser=1](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid?authuser=1)
    - Uncommented local.yaml settings and copied in client ID and secret **git ignored**
    - Updated plugins: session: cookieOptions: password in local.yaml. Stored in password manager.
- Got google login working on https://trinket-647187954071.us-central1.run.app/login.  Updated production.yaml and default.yaml with auth section and url.  Updated deploy command to use new url seen here.  Updated gcloud console APIs section with this URL and callback URL.

## TODO

- cookieOptions secret is set in local.yaml.  Do I need this in production.yaml?
- after google signon, redirect is to /signup and I'm getting a 404.
    - update: 2nd attempt seemed to rectify this issue.  sign-in successfull.
- hook up custom domain. **In progress by Matt 8.14.2026. Waiting on DNS to update for domain ownership verification.**
    - config yaml changes needed?
    - app: siteUrl = 'https://trinket742.org'
    - app: url: hostname = 'trinket742.org'
- admin rights don't seem to be working with google signin to https://trinket-647187954071.us-central1.run.app
- set up SMTP and sendgrid?
- file storage / S3?
- remove email + password logins. Google Oauth only. Before doing this, ensure that Matt and Joe have full admin rights when logging in through Google Oauth.

## Student testing TODO

- When a student logs in, does it look like the teacher view? Can they create new courses?
- Ensure that a student can join a course.
