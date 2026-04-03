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

# TODO

- buy domain?
- set up SMTP and sendgrid?
- file storage / S3?
