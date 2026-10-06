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
- Got google login working on https://trinket-647187954071.us-central1.run.app/login. Updated production.yaml and default.yaml with auth section and url. Updated deploy command to use new url seen here. Updated gcloud console APIs section with this URL and callback URL.
- removed cookieOptions secret and google auth from production.yaml because these values are passed in via the deploy command, environment vars, and gcloud secrets.
- hooked up custom domain. See DEVOPS_OVERVIEW.md for steps taken.
- made matthew.stockinger@isd742.org admin on trinket742.org. Steps to do this are in GETTING_STARTED.md.
- decision: no email needed because all logins with be Google OAuth.
    - side note: could probably set up smtp settings to send through matthew.stockinger@isd742.org in the future if needed.
- file storage.  Implemented with Google Cloud Storage.  See DEVOPS_OVERVIEW.md for steps taken.
- removed email + password login from the frontend.  Google OAuth only.  8.27.2026
    - kept a copy of the old login page at lib/views/login-original.html.  It is not routed, so it never renders.
- fixed a bug that broke the *first* Google sign-in for every new user.  8.27.2026
- fixed 10.6.2026: students can create new courses.

## TODO

- possible bug: students don't appear to be able to make new submissions to quizzes that have already been submitted?  See Zuheid quiz retake.  Possible crossing streams between quiz and retake quiz?  quiz retake 1, student work is perfect, but won't allow submit.  Says 'error saving' top right.  Zuheid sc995333 SChmwdy742

    - Logged into my account on trinket742.org.  Through admin user search, logged in as a student.  Viewed an assignment as a student and did some work, but the "submit code" button is inactive.  Got "Error Saving" message in upper right corner div with id="draftMessage". 
    - Got same issue when logging in directly on a student chromebook (i.e. without going through admin screens to log in as student).
    - tried a new submission for a different student and got same issue.
    - tried to reproduce the issue with app running locally.  Same "Error Saving".  However, it allowed me to submit the assignment, and it allowed me to update my submission.  Updating didn't add a submission #2.  Instead, it replaced my submission #1.
    - try: student chromebook, go to retake quiz 1.  See if previous submission exists.  Screenshot everything about it: user, date submitted, the code.  Try updating submission and note results.  Then go to quiz 2.9 and do the same.  Finally, repeat all this with a different student's chromebook.  Compare to what admin sees when logging in as student.
        - I suspect that admin view is actually showing my submission--not the student's.  
        - I would want admin to be able to genuinely log in as student.

- move My Courses above recent trinkets on dashboard.
- change quiz submission behavior.  Students shouldn't be able to edit after submitting.
    - make a separate type of assignment?
    - make teacher unsubmit?
    - number of attempts?
    - ... figure out easiest v1.  Iterate later.
- See student code before they submit.
- See full student edit history timestamps.

## Maintenance TODO

- upgrade to aws-sdk v3. One thing I noticed but didn't touch: aws-sdk v2 is end-of-support (it prints a deprecation warning on load). Not urgent, and migrating to v3 would touch all 8 call sites — but worth knowing it's on the clock.
- Watch production build output for other errors and deprecation notices.
